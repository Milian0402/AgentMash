import http from "node:http";
import https from "node:https";

const input = process.argv[2];
const maxBodyBytes = 3 * 1024 * 1024;
const securityHeaders = [
  "content-security-policy",
  "cross-origin-opener-policy",
  "permissions-policy",
  "referrer-policy",
  "x-content-type-options",
  "x-frame-options"
];

let failures = 0;
let warnings = 0;

function pass(message) {
  console.log(`ok - ${message}`);
}

function fail(message) {
  failures += 1;
  console.error(`fail - ${message}`);
}

function warn(message) {
  warnings += 1;
  console.warn(`warn - ${message}`);
}

function normalizeBase(value) {
  if (!value) {
    fail("usage: npm run verify:public -- https://your-domain.example");
    process.exit(2);
  }

  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Public URL must use http or https.");
  }

  url.pathname = url.pathname.replace(/\/?$/, "/");
  url.search = "";
  url.hash = "";
  return url;
}

function isLocalHost(url) {
  return ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
}

function urlFor(base, path) {
  if (path === "/") {
    return base.toString();
  }
  return new URL(path.replace(/^\/+/, ""), base).toString();
}

function request(url, redirects = 0) {
  const target = new URL(url);
  const transport = target.protocol === "https:" ? https : http;

  return new Promise((resolve, reject) => {
    const req = transport.get(
      target,
      {
        headers: {
          "user-agent": "AgentMash-public-url-check/1.0"
        },
        timeout: 15000
      },
      (res) => {
        const location = res.headers.location;
        if (location && [301, 302, 303, 307, 308].includes(res.statusCode || 0)) {
          res.resume();
          if (redirects >= 5) {
            reject(new Error(`Too many redirects for ${url}`));
            return;
          }
          resolve(request(new URL(location, target).toString(), redirects + 1));
          return;
        }

        const chunks = [];
        let size = 0;
        res.on("data", (chunk) => {
          size += chunk.length;
          if (size > maxBodyBytes) {
            req.destroy(new Error(`Response too large for ${url}`));
            return;
          }
          chunks.push(chunk);
        });
        res.on("end", () => {
          resolve({
            body: Buffer.concat(chunks).toString("utf8"),
            headers: res.headers,
            status: res.statusCode || 0,
            url: target.toString()
          });
        });
      }
    );

    req.on("timeout", () => req.destroy(new Error(`Timed out requesting ${url}`)));
    req.on("error", reject);
  });
}

function hasNoCache(headers) {
  return /no-cache|no-store|max-age=0/i.test(String(headers["cache-control"] || ""));
}

function hasHtmlFallbackCsp(body) {
  return (
    body.includes('http-equiv="Content-Security-Policy"') &&
    body.includes("default-src 'self'") &&
    body.includes("connect-src 'self'") &&
    body.includes("form-action 'self'")
  );
}

function hasExactTag(body, tag, label) {
  if (body.includes(tag)) {
    pass(`${label} is configured`);
  } else {
    fail(`${label} is missing or does not match the public URL`);
  }
}

function hasPublicSupportContact(body, label) {
  if (body.includes("data-public-support-contact")) {
    pass(`${label} includes public support contact metadata`);
  } else {
    fail(`${label} is missing public support contact metadata; run npm run configure:public first`);
  }
}

async function checkOk(base, path, label) {
  const response = await request(urlFor(base, path));
  if (response.status === 200) {
    pass(`${label} returns 200`);
  } else {
    fail(`${label} returned ${response.status}`);
  }
  return response;
}

async function checkNotPublic(base, path) {
  const response = await request(urlFor(base, path));
  if (response.status === 404 || response.status === 403) {
    pass(`${path} is not publicly exposed`);
    return;
  }
  fail(`${path} should not be public; got ${response.status}`);
}

async function checkSchema(base, path, expectedConst, label) {
  const response = await checkOk(base, path, label);
  try {
    const parsed = JSON.parse(response.body);
    if (parsed.properties?.schema?.const === expectedConst) {
      pass(`${label} has ${expectedConst} contract metadata`);
    } else {
      fail(`${label} does not expose ${expectedConst}`);
    }
  } catch {
    fail(`${label} is not valid JSON`);
  }
}

async function checkOpenApiContract(base) {
  const response = await checkOk(base, "/schemas/api.v1.openapi.json", "API contract");
  try {
    const parsed = JSON.parse(response.body);
    if (
      parsed.openapi === "3.1.0" &&
      parsed["x-agentmash-status"] === "contract-only" &&
      parsed["x-agentmash-no-live-server"] === true &&
      parsed["x-agentmash-live-server-url"] === null &&
      !parsed.servers?.length &&
      !response.body.includes("api.agentmash.example") &&
      parsed.paths?.["/v1/intake"]?.post &&
      parsed.paths?.["/v1/feedback/{runId}"]?.get
    ) {
      pass("API contract exposes contract-only future backend routes");
    } else {
      fail("API contract metadata or routes are incomplete");
    }
  } catch {
    fail("API contract is not valid JSON");
  }
}

async function checkMcpToolContract(base) {
  const response = await checkOk(base, "/schemas/mcp-tools.v1.json", "MCP tool contract");
  try {
    const parsed = JSON.parse(response.body);
    const toolNames = Array.isArray(parsed.tools) ? parsed.tools.map((tool) => tool.name) : [];
    if (
      parsed.schema === "agentmash.mcp-tools.v1" &&
      parsed.status === "contract-only" &&
      toolNames.includes("agentmash.submit_artifacts") &&
      toolNames.includes("agentmash.get_feedback_bundle") &&
      toolNames.includes("agentmash.request_deletion")
    ) {
      pass("MCP tool contract exposes future submit, feedback, and deletion tools");
    } else {
      fail("MCP tool contract metadata or tool list is incomplete");
    }
  } catch {
    fail("MCP tool contract is not valid JSON");
  }
}

async function checkExample(base, path, expectedSchema, label) {
  const response = await checkOk(base, path, label);
  try {
    const parsed = JSON.parse(response.body);
    if (parsed.schema === expectedSchema) {
      pass(`${label} has ${expectedSchema} example metadata`);
    } else {
      fail(`${label} does not expose ${expectedSchema}`);
    }
  } catch {
    fail(`${label} is not valid JSON`);
  }
}

async function main() {
  const base = normalizeBase(input);
  if (base.protocol !== "https:" && !isLocalHost(base)) {
    fail("public URL should use HTTPS");
  } else {
    pass("public URL uses HTTPS or localhost");
  }

  const home = await checkOk(base, "/", "home page");
  if (home.body.includes("AgentMash") && home.body.includes('type="module" src="app.js"')) {
    pass("home page renders the AgentMash app shell");
  } else {
    fail("home page does not look like the AgentMash app shell");
  }

  const homeUrl = base.toString();
  const previewImageUrl = urlFor(base, "/assets/icons/app-icon-1024.png");
  hasExactTag(home.body, `<link rel="canonical" href="${homeUrl}" />`, "canonical URL");
  hasExactTag(home.body, `<meta property="og:url" content="${homeUrl}" />`, "Open Graph URL");
  hasExactTag(home.body, `<meta property="og:image" content="${previewImageUrl}" />`, "Open Graph image");
  hasExactTag(home.body, `<meta name="twitter:url" content="${homeUrl}" />`, "Twitter URL");
  hasExactTag(home.body, `<meta name="twitter:image" content="${previewImageUrl}" />`, "Twitter image");

  for (const header of securityHeaders) {
    if (home.headers[header]) {
      pass(`home page sends ${header}`);
    } else {
      warn(`home page is missing ${header}; make sure the host applies security headers or rely on CSP meta fallback only`);
    }
  }

  const publicPages = new Map();
  for (const [path, label] of [
    ["/support.html", "support page"],
    ["/privacy.html", "privacy page"],
    ["/terms.html", "terms page"],
    ["/404.html", "404 page"]
  ]) {
    const page = await checkOk(base, path, label);
    publicPages.set(path, page);
    if (hasHtmlFallbackCsp(page.body)) {
      pass(`${label} includes CSP meta fallback`);
    } else {
      fail(`${label} is missing CSP meta fallback`);
    }
  }
  hasPublicSupportContact(publicPages.get("/support.html")?.body || "", "support page");
  hasPublicSupportContact(publicPages.get("/privacy.html")?.body || "", "privacy page");

  const robots = await checkOk(base, "/robots.txt", "robots file");
  const sitemapUrl = urlFor(base, "/sitemap.xml");
  if (robots.body.includes(`Sitemap: ${sitemapUrl}`)) {
    pass("robots file links public sitemap");
  } else {
    fail("robots file is missing the public sitemap URL; run npm run configure:public first");
  }

  const sitemap = await checkOk(base, "/sitemap.xml", "sitemap");
  for (const path of ["/", "/support.html", "/privacy.html", "/terms.html"]) {
    const url = urlFor(base, path);
    if (sitemap.body.includes(`<loc>${url}</loc>`)) {
      pass(`sitemap includes ${path}`);
    } else {
      fail(`sitemap is missing ${url}`);
    }
  }
  if (sitemap.body.includes("store/") || sitemap.body.includes("package.json") || sitemap.body.includes("PUBLISHING.md")) {
    fail("sitemap should not expose internal repo paths");
  } else {
    pass("sitemap excludes internal repo paths");
  }

  const manifest = await checkOk(base, "/manifest.webmanifest", "web manifest");
  try {
    const parsed = JSON.parse(manifest.body);
    if (parsed.name === "AgentMash" && parsed.start_url && parsed.icons?.length >= 3) {
      pass("web manifest has AgentMash app metadata");
    } else {
      fail("web manifest metadata is incomplete");
    }
  } catch {
    fail("web manifest is not valid JSON");
  }
  if (hasNoCache(manifest.headers)) {
    pass("web manifest is served with update-friendly cache headers");
  } else {
    warn("web manifest is not served with no-cache headers");
  }

  const serviceWorker = await checkOk(base, "/sw.js", "service worker");
  if (serviceWorker.body.includes("agentmash-v") && serviceWorker.body.includes("APP_SHELL")) {
    pass("service worker looks like the AgentMash app shell worker");
  } else {
    fail("service worker body does not match AgentMash");
  }
  if (hasNoCache(serviceWorker.headers)) {
    pass("service worker is served with update-friendly cache headers");
  } else {
    warn("service worker is not served with no-cache headers");
  }

  await checkOk(base, "/assets/icons/apple-touch-icon.png", "Apple touch icon");
  await checkSchema(base, "/schemas/feedback.v2.json", "agentmash.feedback.v2", "feedback schema");
  await checkSchema(base, "/schemas/intake.v1.json", "agentmash.intake.v1", "intake schema");
  await checkOpenApiContract(base);
  await checkMcpToolContract(base);
  await checkExample(base, "/schemas/examples/intake.v1.json", "agentmash.intake.v1", "intake example");
  await checkExample(base, "/schemas/examples/intake-ack.v1.json", "agentmash.intake-ack.v1", "intake acknowledgement example");
  await checkExample(base, "/schemas/examples/feedback-bundle.v1.json", "agentmash.feedback-bundle.v1", "feedback bundle example");
  await checkNotPublic(base, "/store/completion-audit.md");
  await checkNotPublic(base, "/package.json");
  await checkNotPublic(base, "/PUBLISHING.md");

  if (failures) {
    console.error(`public URL check failed: ${failures} issue${failures === 1 ? "" : "s"} (${warnings} warning${warnings === 1 ? "" : "s"})`);
    process.exit(1);
  }

  console.log(`public URL check passed (${warnings} warning${warnings === 1 ? "" : "s"})`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
