export const AGENTMASH_INTAKE_SCHEMA = "agentmash.intake.v1";
export const AGENTMASH_REVIEW_QUEUE_SCHEMA = "agentmash.review-queue.v1";
export const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
export const MAX_IMAGE_BYTES = 2_500_000;
export const MAX_ARTIFACTS_PER_REQUEST = 50;

export const artifactTypes = ["website", "logo", "copy", "product"];
export const artifactVariants = ["original", "thumbnail", "first-line", "tagline", "mark-only", "cutout"];
export const reviewFocusOptions = ["first_impression", "trust", "clarity", "memorability", "conversion", "visual_quality"];
export const audienceOptions = ["general", "buyers", "developers", "executives", "researchers", "internal"];
export const decisionStageOptions = ["concept", "variant", "prelaunch", "regression"];
export const priorityOptions = ["normal", "high", "urgent"];
export const returnModes = ["json", "dataset"];

export function intakeLimits() {
  return {
    maxArtifactsPerRequest: MAX_ARTIFACTS_PER_REQUEST,
    maxImageBytes: MAX_IMAGE_BYTES,
    allowedImageTypes: ALLOWED_IMAGE_TYPES
  };
}

export function payloadArtifacts(payload) {
  if (Array.isArray(payload?.artifacts)) {
    return payload.artifacts;
  }
  return [];
}

export function validateIntakePayload(payload, {
  maxArtifactsPerRequest = MAX_ARTIFACTS_PER_REQUEST,
  maxImageBytes = MAX_IMAGE_BYTES
} = {}) {
  const errors = [];
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return ["payload must be an agentmash.intake.v1 object"];
  }

  if (payload.schema !== AGENTMASH_INTAKE_SCHEMA) {
    errors.push("schema must be agentmash.intake.v1");
  }

  const artifacts = payloadArtifacts(payload);
  if (!artifacts.length) {
    errors.push("artifacts must include at least one artifact");
  }
  if (artifacts.length > maxArtifactsPerRequest) {
    errors.push(`artifacts must include ${maxArtifactsPerRequest} or fewer artifacts`);
  }

  validateSource(payload.source, errors, "source");
  validateReviewContextInput(payload.reviewContext, errors, "reviewContext");

  artifacts.forEach((artifact, index) => {
    const path = `artifacts[${index}]`;
    if (!artifact || typeof artifact !== "object" || Array.isArray(artifact)) {
      errors.push(`${path} must be an object`);
      return;
    }

    if (!artifactTypes.includes(artifact.type)) {
      errors.push(`${path}.type must be website, logo, copy, or product`);
    }
    if (!isNonEmptyString(artifact.title)) {
      errors.push(`${path}.title is required`);
    }

    validateSource(artifact.agent, errors, `${path}.agent`);
    validateReviewContextInput(artifact.reviewContext || artifact.context, errors, `${path}.reviewContext`);
    validateImageDataUrl(artifact.imageData, errors, `${path}.imageData`, { maxImageBytes });
    validateImageDataUrl(artifact.image?.dataUrl, errors, `${path}.image.dataUrl`, { maxImageBytes });
  });

  return errors;
}

export function validateSource(source, errors, path) {
  if (source === undefined) {
    return;
  }
  if (!source || typeof source !== "object" || Array.isArray(source)) {
    errors.push(`${path} must be an object`);
    return;
  }
  if (source.requesterType !== undefined && !["agent", "lab", "team"].includes(source.requesterType)) {
    errors.push(`${path}.requesterType must be agent, lab, or team`);
  }
  if (source.returnMode !== undefined && !returnModes.includes(source.returnMode)) {
    errors.push(`${path}.returnMode must be json or dataset`);
  }
}

export function validateReviewContextInput(context, errors, path) {
  if (context === undefined) {
    return;
  }
  if (!context || typeof context !== "object" || Array.isArray(context)) {
    errors.push(`${path} must be an object`);
    return;
  }
  if (context.focus !== undefined && !reviewFocusOptions.includes(context.focus)) {
    errors.push(`${path}.focus is not supported`);
  }
  if (context.audience !== undefined && !audienceOptions.includes(context.audience)) {
    errors.push(`${path}.audience is not supported`);
  }
  if (context.stage !== undefined && !decisionStageOptions.includes(context.stage)) {
    errors.push(`${path}.stage is not supported`);
  }
  if (context.priority !== undefined && !priorityOptions.includes(context.priority)) {
    errors.push(`${path}.priority is not supported`);
  }
}

export function validateImageDataUrl(value, errors, path, { maxImageBytes = MAX_IMAGE_BYTES } = {}) {
  if (value === undefined || value === "") {
    return;
  }
  if (typeof value !== "string" || !safeImageData(value)) {
    errors.push(`${path} must be a PNG, JPG, or WebP data URL`);
    return;
  }
  const byteLength = dataUrlByteLength(value);
  if (!Number.isFinite(byteLength) || byteLength > maxImageBytes) {
    errors.push(`${path} must be ${maxImageBytes} bytes or smaller`);
  }
}

export function normalizeIntakeArtifact(rawArtifact, payload = {}, { now = new Date().toISOString() } = {}) {
  const payloadSource = payload.source || payload.agent || {};
  const artifactAgent = rawArtifact.agent || {};
  const type = artifactTypes.includes(rawArtifact.type) ? rawArtifact.type : "website";
  const imageData = safeImageData(rawArtifact.imageData || rawArtifact.image?.dataUrl || "");
  return {
    id: cleanText(rawArtifact.id) || createShortId("artifact"),
    type,
    title: cleanText(rawArtifact.title) || "Untitled artifact",
    prompt: cleanText(rawArtifact.prompt),
    body: cleanText(rawArtifact.body || rawArtifact.copy || rawArtifact.description),
    question: cleanText(rawArtifact.question) || defaultQuestion(type),
    agent: normalizeAgent({
      ...payloadSource,
      ...artifactAgent,
      requesterType: artifactAgent.requesterType || payloadSource.requesterType || "agent",
      requesterName: artifactAgent.requesterName || artifactAgent.name || payloadSource.requesterName || payloadSource.name,
      runId: artifactAgent.runId || rawArtifact.runId || payloadSource.runId || payload.runId,
      goal: artifactAgent.goal || rawArtifact.goal || payloadSource.goal || payload.goal,
      returnMode: artifactAgent.returnMode || payload.returnMode || payloadSource.returnMode || "json",
      returnTarget: artifactAgent.returnTarget || payload.returnTarget || payloadSource.returnTarget,
      submittedAt: artifactAgent.submittedAt || rawArtifact.submittedAt || payloadSource.submittedAt || now
    }),
    reviewContext: normalizeReviewContext({
      ...(payload.reviewContext || payload.context || {}),
      ...(rawArtifact.reviewContext || rawArtifact.context || {})
    }),
    variant: artifactVariants.includes(rawArtifact.variant) ? rawArtifact.variant : "original",
    loopSourceItemId: cleanText(rawArtifact.loopSourceItemId),
    imageKey: cleanText(rawArtifact.imageKey) || (imageData ? createShortId("image") : ""),
    imageData,
    createdAt: cleanText(rawArtifact.createdAt) || now
  };
}

export function normalizeAgent(agent = {}) {
  const requesterType = ["agent", "lab", "team"].includes(agent.requesterType)
    ? agent.requesterType
    : "agent";
  return {
    requesterType,
    requesterName: cleanText(agent.requesterName || agent.name) || "unnamed-agent",
    runId: cleanText(agent.runId || agent.jobId) || createShortId("run"),
    goal: cleanText(agent.goal),
    returnMode: returnModes.includes(agent.returnMode) ? agent.returnMode : "json",
    returnTarget: cleanText(agent.returnTarget),
    submittedAt: cleanText(agent.submittedAt) || new Date().toISOString()
  };
}

export function normalizeReviewContext(context = {}) {
  return {
    focus: reviewFocusOptions.includes(context.focus) ? context.focus : "first_impression",
    audience: audienceOptions.includes(context.audience) ? context.audience : "general",
    stage: decisionStageOptions.includes(context.stage) ? context.stage : "concept",
    priority: priorityOptions.includes(context.priority) ? context.priority : "normal",
    notes: cleanText(context.notes || context.description)
  };
}

export function safeImageData(value) {
  if (typeof value !== "string") {
    return "";
  }
  const match = value.match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match || !ALLOWED_IMAGE_TYPES.includes(match[1])) {
    return "";
  }
  return value;
}

export function dataUrlMediaType(value) {
  return safeImageData(value).match(/^data:([^;]+);base64,/)?.[1] || "";
}

export function dataUrlByteLength(value) {
  const payload = safeImageData(value).split(",")[1] || "";
  if (!payload) {
    return 0;
  }
  const padding = payload.endsWith("==") ? 2 : payload.endsWith("=") ? 1 : 0;
  return Math.floor(payload.length * 3 / 4) - padding;
}

export function defaultQuestion(type) {
  const questions = {
    website: "Is this website nice?",
    logo: "Does this logo make sense?",
    copy: "Is this copy nice?",
    product: "Does this product image make sense?"
  };
  return questions[type] || questions.website;
}

export function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function createShortId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 7)}`;
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}
