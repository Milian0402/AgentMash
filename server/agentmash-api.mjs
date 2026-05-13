import { createServer } from "node:http";
import { createHash } from "node:crypto";
import { mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import {
  AGENTMASH_INTAKE_SCHEMA,
  AGENTMASH_REVIEW_QUEUE_SCHEMA,
  dataUrlByteLength,
  dataUrlMediaType,
  intakeLimits,
  normalizeIntakeArtifact,
  payloadArtifacts,
  safeImageData,
  validateIntakePayload
} from "../intake.js";

const DEFAULT_PORT = 5179;
const STORE_FILE = "store.json";
const IMAGE_DIR = "images";
const MAX_BODY_BYTES = 15_000_000;
const DEV_TOKEN = "agentmash-local-dev-token";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8"
};

export function createAgentMashServer(options = {}) {
  const rootDir = resolve(options.staticDir || process.env.AGENTMASH_STATIC_DIR || ".");
  const dataDir = resolve(options.dataDir || process.env.AGENTMASH_API_DATA_DIR || ".agentmash-api");
  const token = options.token ?? process.env.AGENTMASH_API_TOKEN ?? DEV_TOKEN;
  const requireAuth = options.requireAuth ?? true;

  return createServer(async (request, response) => {
    try {
      await routeRequest({ request, response, rootDir, dataDir, token, requireAuth });
    } catch (error) {
      const statusCode = Number.isFinite(error?.statusCode) ? error.statusCode : 500;
      json(response, statusCode, {
        schema: "agentmash.error.v1",
        error: statusCode === 500 ? "internal_error" : "bad_request",
        message: error instanceof Error ? error.message : "Unexpected server error."
      });
    }
  });
}

async function routeRequest(context) {
  const { request, response } = context;
  const url = new URL(request.url || "/", "http://agentmash.local");

  if (url.pathname.startsWith("/v1/")) {
    await routeApi({ ...context, url });
    return;
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    json(response, 405, { schema: "agentmash.error.v1", error: "method_not_allowed" });
    return;
  }

  await serveStatic({ ...context, url });
}

async function routeApi(context) {
  const { request, response, url } = context;

  if (request.method === "OPTIONS") {
    send(response, 204, "");
    return;
  }

  if (url.pathname === "/v1/health" && request.method === "GET") {
    json(response, 200, {
      schema: "agentmash.health.v1",
      status: "ok",
      generatedAt: new Date().toISOString(),
      limits: intakeLimits()
    });
    return;
  }

  if (!isAuthorized(request, context)) {
    json(response, 401, {
      schema: "agentmash.error.v1",
      error: "unauthorized",
      message: "Missing or invalid bearer token."
    });
    return;
  }

  if (url.pathname === "/v1/intake" && request.method === "POST") {
    await handleIntake(context);
    return;
  }

  if (url.pathname === "/v1/review-queue" && request.method === "GET") {
    await handleReviewQueue(context);
    return;
  }

  if (url.pathname === "/v1/feedback" && request.method === "POST") {
    await handleFeedbackWrite(context);
    return;
  }

  const feedbackMatch = url.pathname.match(/^\/v1\/feedback\/([^/]+)$/);
  if (feedbackMatch && request.method === "GET") {
    await handleFeedbackRead(context, decodeURIComponent(feedbackMatch[1]));
    return;
  }

  const artifactMatch = url.pathname.match(/^\/v1\/artifacts\/([^/]+)$/);
  if (artifactMatch && request.method === "DELETE") {
    await handleArtifactDelete(context, decodeURIComponent(artifactMatch[1]));
    return;
  }

  json(response, 404, {
    schema: "agentmash.error.v1",
    error: "not_found",
    message: "No AgentMash API route matched this request."
  });
}

async function handleIntake({ request, response, dataDir }) {
  const payload = await readJsonBody(request);
  const validationErrors = validateIntakePayload(payload);
  if (validationErrors.length) {
    json(response, 400, validationError(validationErrors));
    return;
  }

  const store = await readStore(dataDir);
  const now = new Date().toISOString();
  const accepted = [];
  const rejected = [];
  const storedArtifacts = [];
  const seenIds = new Set(store.artifacts.map((artifact) => artifact.id));

  for (const rawArtifact of payloadArtifacts(payload)) {
    const item = normalizeIntakeArtifact(rawArtifact, payload, { now });
    if (seenIds.has(item.id)) {
      rejected.push({
        artifactId: item.id,
        path: "artifacts.id",
        message: "artifactId already exists"
      });
      continue;
    }

    let image = null;
    if (item.imageData) {
      image = await storeImageData(dataDir, item.imageKey, item.imageData, now);
    }

    storedArtifacts.push({
      ...item,
      imageData: "",
      image,
      status: "queued_for_review",
      submittedAt: now,
      updatedAt: now
    });
    seenIds.add(item.id);
    accepted.push({
      artifactId: item.id,
      status: "queued_for_review"
    });
  }

  store.artifacts.push(...storedArtifacts);
  store.updatedAt = now;
  await writeStore(dataDir, store);

  const status = accepted.length && rejected.length
    ? "partially_accepted"
    : accepted.length ? "accepted" : "rejected";
  json(response, accepted.length ? 202 : 400, {
    schema: "agentmash.intake-ack.v1",
    status,
    runId: payload.source?.runId || storedArtifacts[0]?.agent?.runId || "",
    accepted,
    rejected,
    limits: intakeLimits()
  });
}

async function handleReviewQueue({ response, dataDir, url }) {
  const limit = clampInteger(url.searchParams.get("limit"), 1, 500, 100);
  const includeImageData = url.searchParams.get("includeImageData") !== "false";
  const store = await readStore(dataDir);
  const queued = store.artifacts
    .filter((artifact) => !artifact.deletedAt)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
  const artifacts = await Promise.all(queued.map((artifact) => publicArtifact(dataDir, artifact, { includeImageData })));

  json(response, 200, {
    schema: AGENTMASH_REVIEW_QUEUE_SCHEMA,
    generatedAt: new Date().toISOString(),
    count: artifacts.length,
    artifacts,
    limits: intakeLimits()
  });
}

async function handleFeedbackWrite({ request, response, dataDir }) {
  const bundle = await readJsonBody(request);
  if (!bundle || bundle.schema !== "agentmash.feedback-bundle.v1") {
    json(response, 400, validationError(["schema must be agentmash.feedback-bundle.v1"]));
    return;
  }

  const now = new Date().toISOString();
  const store = await readStore(dataDir);
  const runIds = feedbackRunIds(bundle);
  const entry = {
    id: `feedback-${createHash("sha256").update(`${now}:${JSON.stringify(runIds)}`).digest("hex").slice(0, 12)}`,
    storedAt: now,
    runIds,
    bundle
  };
  store.feedbackBundles.push(entry);
  markReviewedArtifacts(store, bundle, now);
  store.updatedAt = now;
  await writeStore(dataDir, store);

  json(response, 202, {
    schema: "agentmash.feedback-ack.v1",
    status: "stored",
    storedAt: now,
    runIds,
    packetCount: Array.isArray(bundle.packets) ? bundle.packets.length : 0,
    evalRowCount: Array.isArray(bundle.evalRows) ? bundle.evalRows.length : 0,
    pairwiseRowCount: Array.isArray(bundle.pairwiseRows) ? bundle.pairwiseRows.length : 0
  });
}

async function handleFeedbackRead({ response, dataDir }, runId) {
  const store = await readStore(dataDir);
  const packets = [];
  const evalRows = [];
  const pairwiseRows = [];

  for (const entry of store.feedbackBundles) {
    const bundle = entry.bundle || {};
    packets.push(...(bundle.packets || []).filter((packet) => packet.request?.runId === runId));
    evalRows.push(...(bundle.evalRows || []).filter((row) => row.artifact?.runId === runId));
    pairwiseRows.push(...(bundle.pairwiseRows || []).filter((row) => {
      return row.comparison?.left?.runId === runId || row.comparison?.right?.runId === runId;
    }));
  }

  const artifacts = store.artifacts.filter((artifact) => artifact.agent?.runId === runId && !artifact.deletedAt);
  if (!artifacts.length && !packets.length && !evalRows.length && !pairwiseRows.length) {
    json(response, 404, emptyFeedbackBundle(runId, "not_found", artifacts));
    return;
  }

  const reviewedIds = new Set([
    ...packets.map((packet) => packet.request?.artifactId),
    ...evalRows.map((row) => row.artifact?.artifactId),
    ...pairwiseRows.flatMap((row) => [
      row.comparison?.left?.artifactId,
      row.comparison?.right?.artifactId,
      row.comparison?.winner?.artifactId,
      row.comparison?.loser?.artifactId
    ])
  ].filter(Boolean));

  json(response, 200, {
    schema: "agentmash.feedback-bundle.v1",
    runId,
    status: packets.length || evalRows.length || pairwiseRows.length ? "ready" : "pending",
    generatedAt: new Date().toISOString(),
    summary: {
      artifactCount: artifacts.length,
      reviewedArtifacts: reviewedIds.size,
      pendingArtifacts: Math.max(0, artifacts.length - reviewedIds.size),
      packetCount: packets.length,
      evalRowCount: evalRows.length,
      pairwiseRowCount: pairwiseRows.length,
      runIds: [runId],
      reviewers: [...new Set(packets.map((packet) => packet.humanJudgement?.reviewer).filter(Boolean))].sort()
    },
    packets,
    evalRows,
    pairwiseRows
  });
}

async function handleArtifactDelete({ response, dataDir }, artifactId) {
  const store = await readStore(dataDir);
  const artifact = store.artifacts.find((candidate) => candidate.id === artifactId && !candidate.deletedAt);
  if (!artifact) {
    json(response, 404, {
      schema: "agentmash.error.v1",
      error: "not_found",
      message: "Artifact was not found or is already deleted."
    });
    return;
  }

  const now = new Date().toISOString();
  artifact.deletedAt = now;
  artifact.status = "deleted";
  artifact.updatedAt = now;
  if (artifact.imageKey) {
    await rm(imagePath(dataDir, artifact.imageKey), { force: true });
  }
  store.updatedAt = now;
  await writeStore(dataDir, store);

  json(response, 200, {
    schema: "agentmash.deletion-ack.v1",
    status: "deleted",
    artifactId,
    deletedAt: now
  });
}

async function publicArtifact(dataDir, artifact, { includeImageData }) {
  const imageData = includeImageData && artifact.imageKey ? await readImageData(dataDir, artifact.imageKey) : "";
  return {
    id: artifact.id,
    type: artifact.type,
    title: artifact.title,
    prompt: artifact.prompt,
    body: artifact.body,
    question: artifact.question,
    agent: artifact.agent,
    reviewContext: artifact.reviewContext,
    variant: artifact.variant,
    imageKey: artifact.imageKey,
    imageData,
    createdAt: artifact.createdAt
  };
}

async function storeImageData(dataDir, imageKey, dataUrl, now) {
  const safeKey = safePathSegment(imageKey);
  const cleanDataUrl = safeImageData(dataUrl);
  const image = {
    key: safeKey,
    mediaType: dataUrlMediaType(cleanDataUrl),
    bytes: dataUrlByteLength(cleanDataUrl),
    dataUrl: cleanDataUrl,
    createdAt: now
  };
  await mkdir(join(dataDir, IMAGE_DIR), { recursive: true });
  await writeFile(imagePath(dataDir, safeKey), JSON.stringify(image, null, 2));
  return {
    key: safeKey,
    mediaType: image.mediaType,
    bytes: image.bytes
  };
}

async function readImageData(dataDir, imageKey) {
  try {
    const image = JSON.parse(await readFile(imagePath(dataDir, imageKey), "utf8"));
    return safeImageData(image.dataUrl) || "";
  } catch {
    return "";
  }
}

function markReviewedArtifacts(store, bundle, now) {
  const reviewedIds = new Set([
    ...(bundle.packets || []).map((packet) => packet.request?.artifactId),
    ...(bundle.evalRows || []).map((row) => row.artifact?.artifactId),
    ...(bundle.pairwiseRows || []).flatMap((row) => [
      row.comparison?.left?.artifactId,
      row.comparison?.right?.artifactId,
      row.comparison?.winner?.artifactId,
      row.comparison?.loser?.artifactId
    ])
  ].filter(Boolean));

  store.artifacts.forEach((artifact) => {
    if (reviewedIds.has(artifact.id) && !artifact.deletedAt) {
      artifact.status = "reviewed";
      artifact.updatedAt = now;
    }
  });
}

function feedbackRunIds(bundle) {
  const runIds = new Set([
    bundle.runId,
    ...(bundle.summary?.runIds || []),
    ...(bundle.packets || []).map((packet) => packet.request?.runId),
    ...(bundle.evalRows || []).map((row) => row.artifact?.runId),
    ...(bundle.pairwiseRows || []).flatMap((row) => [
      row.comparison?.left?.runId,
      row.comparison?.right?.runId
    ])
  ].filter(Boolean));
  return [...runIds].sort();
}

function emptyFeedbackBundle(runId, status, artifacts) {
  return {
    schema: "agentmash.feedback-bundle.v1",
    runId,
    status,
    generatedAt: new Date().toISOString(),
    summary: {
      artifactCount: artifacts.length,
      reviewedArtifacts: 0,
      pendingArtifacts: artifacts.length,
      packetCount: 0,
      evalRowCount: 0,
      pairwiseRowCount: 0,
      runIds: artifacts.length ? [runId] : [],
      reviewers: []
    },
    packets: [],
    evalRows: [],
    pairwiseRows: []
  };
}

async function readJsonBody(request) {
  const chunks = [];
  let length = 0;
  for await (const chunk of request) {
    length += chunk.length;
    if (length > MAX_BODY_BYTES) {
      const error = new Error("Request body exceeded configured limit.");
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
  } catch {
    const error = new Error("Request body must be valid JSON.");
    error.statusCode = 400;
    throw error;
  }
}

async function readStore(dataDir) {
  try {
    const store = JSON.parse(await readFile(join(dataDir, STORE_FILE), "utf8"));
    return normalizeStore(store);
  } catch {
    const now = new Date().toISOString();
    return {
      schema: "agentmash.api-store.v1",
      createdAt: now,
      updatedAt: now,
      artifacts: [],
      feedbackBundles: []
    };
  }
}

async function writeStore(dataDir, store) {
  await mkdir(dataDir, { recursive: true });
  const path = join(dataDir, STORE_FILE);
  const tempPath = `${path}.tmp`;
  await writeFile(tempPath, JSON.stringify(normalizeStore(store), null, 2));
  await rename(tempPath, path);
}

function normalizeStore(store) {
  return {
    schema: "agentmash.api-store.v1",
    createdAt: typeof store.createdAt === "string" ? store.createdAt : new Date().toISOString(),
    updatedAt: typeof store.updatedAt === "string" ? store.updatedAt : new Date().toISOString(),
    artifacts: Array.isArray(store.artifacts) ? store.artifacts : [],
    feedbackBundles: Array.isArray(store.feedbackBundles) ? store.feedbackBundles : []
  };
}

async function serveStatic({ request, response, rootDir, url }) {
  const pathname = decodeURIComponent(url.pathname);
  const relativePath = pathname === "/" ? "index.html" : pathname.slice(1);
  const filePath = resolve(rootDir, normalize(relativePath));
  if (!filePath.startsWith(`${rootDir}${sep}`) && filePath !== rootDir) {
    send(response, 403, "Forbidden", { "Content-Type": "text/plain; charset=utf-8" });
    return;
  }

  try {
    const stats = await stat(filePath);
    const finalPath = stats.isDirectory() ? join(filePath, "index.html") : filePath;
    const body = request.method === "HEAD" ? "" : await readFile(finalPath);
    send(response, 200, body, {
      "Content-Type": mimeTypes[extname(finalPath)] || "application/octet-stream"
    });
  } catch {
    try {
      const body = request.method === "HEAD" ? "" : await readFile(join(rootDir, "404.html"));
      send(response, 404, body, { "Content-Type": mimeTypes[".html"] });
    } catch {
      send(response, 404, "Not found", { "Content-Type": "text/plain; charset=utf-8" });
    }
  }
}

function isAuthorized(request, { token, requireAuth }) {
  if (!requireAuth) {
    return true;
  }
  const header = request.headers.authorization || "";
  return header === `Bearer ${token}`;
}

function json(response, statusCode, body) {
  send(response, statusCode, `${JSON.stringify(body, null, 2)}\n`, {
    "Content-Type": "application/json; charset=utf-8"
  });
}

function send(response, statusCode, body, headers = {}) {
  response.writeHead(statusCode, {
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Content-Security-Policy": "default-src 'self'; img-src 'self' data: blob:; script-src 'self'; style-src 'self'; manifest-src 'self'; worker-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
    "Cache-Control": "no-cache",
    ...headers
  });
  response.end(body);
}

function validationError(errors) {
  return {
    schema: "agentmash.validation-error.v1",
    error: "validation_error",
    message: "Payload failed validation.",
    issues: errors.map((message) => ({ message }))
  };
}

function imagePath(dataDir, imageKey) {
  return join(dataDir, IMAGE_DIR, `${safePathSegment(imageKey)}.json`);
}

function safePathSegment(value) {
  const clean = String(value || "").replace(/[^a-zA-Z0-9_-]/g, "");
  return clean || "image";
}

function clampInteger(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, Math.floor(number)));
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isMain) {
  const port = Number(process.env.AGENTMASH_API_PORT || DEFAULT_PORT);
  if (process.env.NODE_ENV === "production" && !process.env.AGENTMASH_API_TOKEN) {
    console.error("AGENTMASH_API_TOKEN is required when NODE_ENV=production.");
    process.exit(1);
  }
  const server = createAgentMashServer();
  server.listen(port, () => {
    const token = process.env.AGENTMASH_API_TOKEN || DEV_TOKEN;
    console.log(`AgentMash API listening on http://127.0.0.1:${port}`);
    if (!process.env.AGENTMASH_API_TOKEN) {
      console.log(`Local dev bearer token: ${token}`);
    }
  });
}
