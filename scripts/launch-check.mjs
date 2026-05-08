import { access, readFile } from "node:fs/promises";
import { buildDir, blockedBuildEntries, buildSite, optionalPublicBuildEntries, publicBuildEntries } from "./build-site.mjs";

const requiredFiles = [
  ".github/workflows/pages.yml",
  "index.html",
  "styles.css",
  "app.js",
  "state.js",
  "packet.js",
  "render.js",
  "gestures.js",
  "sw.js",
  "manifest.webmanifest",
  "support.html",
  "privacy.html",
  "terms.html",
  "publishing.html",
  "404.html",
  "README.md",
  "CHANGELOG.md",
  "PUBLISHING.md",
  "package-lock.json",
  "playwright.config.mjs",
  "tests/review-flow.spec.mjs",
  "scripts/build-site.mjs",
  "scripts/refresh-launch-assets.mjs",
  "scripts/verify-public-url.mjs",
  "scripts/configure-public-launch.mjs",
  "scripts/check-configure-public.mjs",
  "scripts/check-public-url-verifier.mjs",
  "schemas/feedback.v2.json",
  "schemas/intake.v1.json",
  "schemas/api.v1.openapi.json",
  "schemas/mcp-tools.v1.json",
  "schemas/examples/intake.v1.json",
  "schemas/examples/intake-ack.v1.json",
  "schemas/examples/feedback-bundle.v1.json",
  "store/completion-audit.md",
  "store/public-launch-audit.md",
  "store/public-launch-plan.md",
  "store/release-checklist.md",
  "store/research-and-cost-guide.md",
  "store/native-wrapper-handoff.md",
  "store/agent-customer-model.md",
  "store/backend-api-mcp-handoff.md",
  "store/app-store-listing.md",
  "store/app-store-submission.md",
  "store/privacy-data-safety-draft.md",
  "store/submission/README.md",
  "store/submission/asset-manifest.json",
  "_headers",
  "netlify.toml",
  "vercel.json",
  "store/app-icon-1024.png",
  "assets/app-icon.svg",
  "assets/icons/app-icon-192.png",
  "assets/icons/app-icon-512.png",
  "assets/icons/app-icon-1024.png",
  "assets/icons/apple-touch-icon.png",
  "assets/startup/apple-iphone-6-9-human-review.png",
  "assets/startup/apple-iphone-6-5-human-review.png",
  "assets/screenshots/mobile-review.png",
  "assets/screenshots/desktop-review.png",
  "store/screenshots/mobile-review.png",
  "store/screenshots/desktop-review.png",
  "store/submission/apple-iphone-6-9-human-review.png",
  "store/submission/apple-iphone-6-5-human-review.png",
  "store/submission/google-phone-human-review.png",
  "store/submission/google-play-feature-graphic.png"
];

const textFiles = requiredFiles.filter((file) => !file.endsWith(".png"));
const htmlPages = [
  "index.html",
  "support.html",
  "privacy.html",
  "terms.html",
  "404.html"
];
const appShellFiles = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./state.js",
  "./packet.js",
  "./render.js",
  "./gestures.js",
  "./manifest.webmanifest",
  "./schemas/feedback.v2.json",
  "./schemas/intake.v1.json",
  "./schemas/api.v1.openapi.json",
  "./schemas/mcp-tools.v1.json",
  "./schemas/examples/intake.v1.json",
  "./schemas/examples/intake-ack.v1.json",
  "./schemas/examples/feedback-bundle.v1.json",
  "./assets/app-icon.svg",
  "./assets/icons/app-icon-192.png",
  "./assets/icons/app-icon-512.png",
  "./assets/icons/app-icon-1024.png",
  "./assets/icons/apple-touch-icon.png",
  "./assets/startup/apple-iphone-6-9-human-review.png",
  "./assets/startup/apple-iphone-6-5-human-review.png",
  "./assets/screenshots/mobile-review.png",
  "./assets/screenshots/desktop-review.png",
  "./privacy.html",
  "./support.html",
  "./terms.html",
  "./404.html"
];
const securityHeaders = [
  "X-Frame-Options",
  "X-Content-Type-Options",
  "Referrer-Policy",
  "Permissions-Policy",
  "Cross-Origin-Opener-Policy",
  "Content-Security-Policy"
];
const submissionPngSizes = {
  "assets/icons/app-icon-192.png": "192x192",
  "assets/icons/app-icon-512.png": "512x512",
  "assets/icons/app-icon-1024.png": "1024x1024",
  "assets/icons/apple-touch-icon.png": "180x180",
  "store/app-icon-1024.png": "1024x1024",
  "assets/screenshots/mobile-review.png": "390x844",
  "assets/screenshots/desktop-review.png": "1440x1000",
  "store/screenshots/mobile-review.png": "390x844",
  "store/screenshots/desktop-review.png": "1440x1000",
  "assets/startup/apple-iphone-6-9-human-review.png": "1290x2796",
  "assets/startup/apple-iphone-6-5-human-review.png": "1242x2688",
  "store/submission/apple-iphone-6-9-human-review.png": "1290x2796",
  "store/submission/apple-iphone-6-5-human-review.png": "1242x2688",
  "store/submission/google-phone-human-review.png": "1080x1920",
  "store/submission/google-play-feature-graphic.png": "1024x500"
};

let failures = 0;

function check(condition, message) {
  if (condition) {
    console.log(`ok - ${message}`);
    return;
  }
  failures += 1;
  console.error(`fail - ${message}`);
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function read(path) {
  return readFile(path, "utf8");
}

async function pngSize(path) {
  const buffer = await readFile(path);
  if (buffer.toString("ascii", 1, 4) !== "PNG") {
    return "";
  }
  return `${buffer.readUInt32BE(16)}x${buffer.readUInt32BE(20)}`;
}

function hasAll(haystack, needles) {
  return needles.every((needle) => haystack.includes(needle));
}

for (const file of requiredFiles) {
  check(await exists(file), `${file} exists`);
}

const packageJson = JSON.parse(await read("package.json"));
const packageLock = JSON.parse(await read("package-lock.json"));
const manifest = JSON.parse(await read("manifest.webmanifest"));
const vercel = JSON.parse(await read("vercel.json"));
const feedbackSchema = JSON.parse(await read("schemas/feedback.v2.json"));
const intakeSchema = JSON.parse(await read("schemas/intake.v1.json"));
const apiContract = JSON.parse(await read("schemas/api.v1.openapi.json"));
const mcpContract = JSON.parse(await read("schemas/mcp-tools.v1.json"));
const intakeExample = JSON.parse(await read("schemas/examples/intake.v1.json"));
const intakeAckExample = JSON.parse(await read("schemas/examples/intake-ack.v1.json"));
const feedbackBundleExample = JSON.parse(await read("schemas/examples/feedback-bundle.v1.json"));
const htmlPageSources = Object.fromEntries(await Promise.all(htmlPages.map(async (page) => [page, await read(page)])));
const index = htmlPageSources["index.html"];
const support = htmlPageSources["support.html"];
const privacy = htmlPageSources["privacy.html"];
const terms = htmlPageSources["terms.html"];
const app = await read("app.js");
const stateModule = await read("state.js");
const packetModule = await read("packet.js");
const renderModule = await read("render.js");
const gesturesModule = await read("gestures.js");
const appSurface = [app, stateModule, packetModule, renderModule, gesturesModule].join("\n");
const styles = await read("styles.css");
const serviceWorker = await read("sw.js");
const headers = await read("_headers");
const netlify = await read("netlify.toml");
const pagesWorkflow = await read(".github/workflows/pages.yml");
const playwrightConfig = await read("playwright.config.mjs");
const testSpec = await read("tests/review-flow.spec.mjs");
const refreshAssetsScript = await read("scripts/refresh-launch-assets.mjs");
const verifyPublicScript = await read("scripts/verify-public-url.mjs");
const configurePublicScript = await read("scripts/configure-public-launch.mjs");
const configurePublicCheck = await read("scripts/check-configure-public.mjs");
const publicVerifierCheck = await read("scripts/check-public-url-verifier.mjs");
const publishingNotes = await read("publishing.html");
const publishingRunbook = await read("PUBLISHING.md");
const readme = await read("README.md");
const changelog = await read("CHANGELOG.md");
const completionAudit = await read("store/completion-audit.md");
const audit = await read("store/public-launch-audit.md");
const listing = await read("store/app-store-listing.md");
const appStoreSubmission = await read("store/app-store-submission.md");
const submissionReadme = await read("store/submission/README.md");
const submissionAssetManifest = JSON.parse(await read("store/submission/asset-manifest.json"));
const researchGuide = await read("store/research-and-cost-guide.md");
const releaseChecklist = await read("store/release-checklist.md");
const privacyDataSafetyDraft = await read("store/privacy-data-safety-draft.md");
const nativeHandoff = await read("store/native-wrapper-handoff.md");
const backendHandoff = await read("store/backend-api-mcp-handoff.md");

check(packageJson.name === "agentmash", "package name is agentmash");
check(packageJson.type === "module", "package uses native ES modules");
check(packageLock.packages?.[""]?.type === packageJson.type, "package lock matches module type");
check(packageJson.repository?.url === "https://github.com/Milian0402/AgentMash.git", "package repo points to AgentMash");
check(packageJson.description.includes("structured feedback packets"), "package description uses feedback-packet wording");
check(manifest.name === "AgentMash" && manifest.short_name === "AgentMash", "manifest uses AgentMash");
check(manifest.id === "./", "manifest has a stable app id");
check(manifest.description.includes("structured feedback packets"), "manifest description uses feedback-packet wording");
check(manifest.lang === "en-US" && manifest.dir === "ltr", "manifest declares language and text direction");
check(manifest.display === "standalone" && manifest.orientation === "portrait", "manifest is app-like");
check(manifest.icons.every((icon) => requiredFiles.includes(icon.src)), "manifest icons are tracked");
check(Array.isArray(manifest.screenshots) && manifest.screenshots.length >= 2, "manifest includes screenshots");
check(manifest.screenshots.every((shot) => requiredFiles.includes(shot.src)), "manifest screenshots are tracked");
check(manifest.screenshots.every((shot) => shot.src.startsWith("assets/screenshots/")), "manifest screenshots are public assets");
check(
  hasAll(
    JSON.stringify(manifest.screenshots),
    ["390x844", "1440x1000", "form_factor", "Human review swipe deck", "AgentMash review workspace"]
  ),
  "manifest screenshot metadata is complete"
);
check(index.includes("<title>AgentMash</title>") && index.includes("<h1>AgentMash</h1>"), "index brands AgentMash");
check(
  hasAll(index, ["structured feedback packets", "structured local feedback packets"]) &&
    !/agent-ready feedback/i.test(index),
  "public preview metadata uses local feedback-packet wording"
);
check(
  [index, support, privacy, terms].every((source) => source.includes(`v${packageJson.version}`)),
  "public app and legal pages expose package version"
);
check(
  privacy.includes("Effective May 8, 2026") && terms.includes("Effective May 7, 2026"),
  "privacy and terms expose effective date"
);
check(
  hasAll(privacy, ["localStorage", "IndexedDB", "Deletion and retention", "Reset profile", "browser storage", "uninstall the app"]) &&
    hasAll(privacyDataSafetyDraft, ["localStorage", "IndexedDB", "Reset profile clears both"]),
  "privacy and data safety docs explain local storage and deletion"
);
check(index.includes('rel="apple-touch-icon"') && index.includes("assets/icons/apple-touch-icon.png"), "index links Apple touch icon");
check(
  hasAll(index, [
    'rel="apple-touch-startup-image"',
    "assets/startup/apple-iphone-6-9-human-review.png",
    "assets/startup/apple-iphone-6-5-human-review.png"
  ]),
  "index links iOS startup images"
);
check(index.includes('name="mobile-web-app-capable"'), "index includes mobile web app install metadata");
check(index.includes("Reset profile") && !index.includes("Reset demo"), "reset action uses profile wording");
check(
  hasAll(support, ["Back Up Your Profile", "Storage", "Local storage full", "Import And Export", "Delete Local Data", "does not send diagnostics automatically"]),
  "support page covers backup, storage, import/export, deletion, and diagnostics"
);
check(index.includes('name="color-scheme" content="light dark"') && styles.includes("@media (prefers-color-scheme: dark)") && styles.includes("color-scheme: dark"), "app follows OS light and dark color scheme");
check(index.includes('accept="image/png,image/jpeg,image/webp"') && !index.includes("image/svg+xml"), "user uploads exclude SVG");
check(hasAll(index, ["support.html", "privacy.html", "terms.html"]) && !index.includes("publishing.html"), "footer links only user-facing public pages");
check(index.includes("Export workspace") && index.includes("Local export workspace"), "agent-facing surface is framed as local export workspace");
check(!/Agent lab|Request Queue|Waiting on humans|Returned Signals|Retry queue|No agent requests/i.test(index), "export workspace avoids inbound-traffic wording");
check(index.includes("Export metadata") && index.includes("Export format"), "add artifact form uses local export wording");
check(!/Webhook when online|Polling endpoint|Return target|Add Artifact Request|Requester details/i.test(index), "public intake avoids unavailable network-return wording");
check(index.includes('type="module" src="app.js"'), "index loads native ES module entry");
check(
  hasAll(packageJson.scripts?.check || "", ["node --check state.js", "node --check packet.js", "node --check render.js", "node --check gestures.js"]),
  "package check syntax-checks app modules"
);
check(
  hasAll(playwrightConfig, ["webServer", "npm run serve", "http://127.0.0.1:5177/"]),
  "Playwright serves native modules over local HTTP"
);
check(
  index.includes("refineButton") && index.includes("commentButton") && index.includes("closeRefineButton") && index.includes('id="signalPanel" hidden'),
  "rubric and note panel is hidden behind Refine and the Comment shortcut by default, with an explicit Done control"
);
check(
  hasAll(index, [
    'id="reviewModeTabs" role="group"',
    'id="filterTabs" role="group"'
  ]) && renderModule.includes('button.setAttribute("aria-pressed", active ? "true" : "false")'),
  "segmented controls use pressed-button semantics"
);
check(
  styles.includes(":focus-visible") && styles.includes("outline: 3px solid var(--blue)") && testSpec.includes("decisionFocusRing"),
  "keyboard focus rings are visible and covered"
);
check(hasAll(styles, [".first-look-stage .signal-panel", "position: fixed", "bottom-sheet-rise"]), "Refine panel opens as a bottom sheet");
check(index.includes("detailsButton") && index.includes('id="detailSheet" hidden'), "card details are hidden behind a details sheet by default");
check(index.includes('id="streakCounter"') && renderModule.includes("renderMomentum") && styles.includes("streak-pop"), "human review includes visible momentum counter");
check(index.includes("profileInsights") && renderModule.includes("renderProfileInsights") && renderModule.includes("tagInsightRows"), "human review includes profile insights");
check(index.includes("keeperList") && index.includes("Keepers"), "deck completion has keepers summary");
check(
  hasAll(renderModule, ["site-proof-row", "approval-list", "site-chart", "Start cleanup", "View handoff"]) &&
    !renderModule.includes('class="site-line"'),
  "default website preview uses realistic review content instead of wireframe bars"
);
check(
  hasAll(renderModule, ["logo-brand-card", "logo-context-row", "copy-post-header", "copy-reaction-row", "product-surface", "product-caption"]),
  "starter logo, copy, and product previews use realistic review-card details"
);
check(
  hasAll(styles, [
    "@media (max-width: 760px)",
    ".pairwise-stage",
    "grid-template-columns: repeat(2, minmax(0, 1fr))",
    ".pair-preview .site-visual",
    ".pair-preview .copy-reaction-row",
    ".pair-preview .logo-context-row",
    ".pair-preview .product-scene"
  ]),
  "mobile pairwise mode keeps both choices visible in a compact comparison layout"
);
check(
  hasAll(styles, [
    ".decision-icon::before",
    ".decision-icon::after",
    ".decision-button.reject .decision-icon::before",
    ".decision-button.accept .decision-icon::before",
    ".decision-button.comment .decision-icon::after"
  ]),
  "decision rail uses CSS-drawn icons instead of raw text glyphs"
);
check(index.includes("emptyRemixButton") && app.includes("remixCurrentDeck"), "deck completion can start a local remix session");
check(
  appSurface.includes("variantForRemix")
    && hasAll(appSurface, ["tagline", "mark-only", "first-line", "cutout"])
    && hasAll(styles, ["is-tagline", "is-mark-only", "is-first-line", "is-cutout"]),
  "remix sessions create type-specific glance variants"
);
check(index.includes("endlessToggle") && appSurface.includes("ensureEndlessItem") && appSurface.includes("loopSourceItemId"), "endless mode auto-loops one local card at a time");
check(app.includes("beforeinstallprompt") && app.includes("appinstalled") && styles.includes(":has(#installButton:not([hidden]))"), "PWA install prompt is visible from human review");
check(index.includes("reviewModeTabs") && index.includes("pairwiseStage") && app.includes("choosePairwise"), "human review includes local pairwise mode");
check(appSurface.includes("agentmash.pairwise-row.v1") && appSurface.includes("pairwiseComparisons"), "pairwise comparisons export as structured rows");
check(app.includes("humanAddButton") && app.includes("openAddArtifactPanel"), "human add-artifact entry exists");
check(app.includes('state.dashboard = "human";'), "added artifacts return to human deck");
check(app.includes("window.confirm") && app.includes("Reset this local AgentMash profile"), "reset requires confirmation");
check(appSurface.includes("clearImageStore") && app.includes("await clearImageStore()"), "reset and import clear IndexedDB image store");
check(app.includes("confirmProfileImport") && app.includes("Import this AgentMash profile"), "profile import requires confirmation when local data exists");
check(app.includes("async function copyText") && app.includes("Copy unavailable"), "copy actions handle clipboard failure");
check(appSurface.includes("indexedDB") && appSurface.includes("stateForLocalStorage") && appSurface.includes('imageData: ""'), "uploaded image data is kept out of localStorage");
check(app.includes("await writeImageData(imageKey, pendingImageData)") && app.includes("imageSelectionToken"), "pending images are written to IndexedDB only on submit");
check(index.includes('id="imageStatus" class="help-text" role="status" aria-live="polite"'), "image upload status is announced accessibly");
check(index.includes("storageHealthStatus") && renderModule.includes("estimateImageStoreBytes") && renderModule.includes("localStorageProfileBytes"), "human dashboard shows storage health");
check(appSurface.includes("Local storage full") && appSurface.includes("setStorageStatus"), "localStorage quota failure surfaces in the UI");
check(appSurface.includes("signalStrengthFormula") && appSurface.includes("agentmash.feedback.v2"), "feedback packets use schema v2 with signal strength formula");
check(
  hasAll(index, ["agentDropButton", "agentDropFile", "reviewFocus", "reviewAudience", "decisionStage", "reviewPriority", "reviewContextNotes"]),
  "agent drop import and review context controls exist"
);
check(
  hasAll(appSurface, ["importAgentDrop", "validateAgentDropPayload", "payloadArtifacts", "normalizeAgentDropItem", "reviewContext"]) &&
    !/\b(fetch|XMLHttpRequest|sendBeacon|WebSocket)\b/i.test(appSurface),
  "agent drop import stays local and normalizes backend-ready payloads"
);
check(hasAll(testSpec, ["Agent drop rejected:", "bad-agent-drop.json", "artifacts[0].type"]), "Playwright covers invalid agent-drop rejection");
check(hasAll(packetModule, ["reviewContext", "validateReviewContext"]), "feedback packets carry backend-ready review context");
check(
  packetModule.includes("validateFeedbackPacket")
    && packetModule.includes("validateExportRows")
    && index.includes("packetContractStatus")
    && index.includes("datasetContractStatus"),
  "Export workspace validates packet and JSONL contract locally"
);
check(
  packetModule.includes("exportVerdictFor")
    && packetModule.includes("accepted")
    && packetModule.includes("rejected")
    && JSON.stringify(feedbackSchema).includes("application/x-ndjson"),
  "export packets use unambiguous verdicts and dataset return format"
);
check(!/webhook|polling/i.test([appSurface, JSON.stringify(feedbackSchema)].join("\n")), "runtime packet contract is local-export only");
check(
  feedbackSchema.title === "AgentMash Feedback Packet v2"
    && feedbackSchema.properties?.schema?.const === "agentmash.feedback.v2"
    && JSON.stringify(feedbackSchema).includes("signalStrength"),
  "feedback packet JSON Schema documents v2 output"
);
check(
  intakeSchema.title === "AgentMash Agent Intake v1"
    && intakeSchema.properties?.schema?.const === "agentmash.intake.v1"
    && JSON.stringify(intakeSchema).includes("reviewContext")
    && JSON.stringify(intakeSchema).includes("artifacts"),
  "agent intake JSON Schema documents local drop contract"
);
check(
  apiContract.openapi === "3.1.0"
    && apiContract["x-agentmash-status"] === "contract-only"
    && apiContract["x-agentmash-no-live-server"] === true
    && apiContract["x-agentmash-live-server-url"] === null
    && !apiContract.servers?.length
    && hasAll(JSON.stringify(apiContract["x-agentmash-example-files"]), [
      "/schemas/examples/intake.v1.json",
      "/schemas/examples/intake-ack.v1.json",
      "/schemas/examples/feedback-bundle.v1.json"
    ])
    && Boolean(apiContract.paths?.["/v1/intake"]?.post)
    && Boolean(apiContract.paths?.["/v1/feedback/{runId}"]?.get)
    && Boolean(apiContract.paths?.["/v1/artifacts/{artifactId}"]?.delete)
    && JSON.stringify(apiContract).includes("./intake.v1.json")
    && JSON.stringify(apiContract).includes("./feedback.v2.json")
    && !JSON.stringify(apiContract).includes("api.agentmash.example"),
  "future backend OpenAPI contract is explicit and contract-only"
);
check(
  mcpContract.schema === "agentmash.mcp-tools.v1"
    && mcpContract.status === "contract-only"
    && mcpContract.protocolVersion === "2025-11-25"
    && hasAll(JSON.stringify(mcpContract.exampleFiles), [
      "./examples/intake.v1.json",
      "./examples/intake-ack.v1.json",
      "./examples/feedback-bundle.v1.json"
    ])
    && Array.isArray(mcpContract.tools)
    && hasAll(JSON.stringify(mcpContract.tools), [
      "agentmash.submit_artifacts",
      "agentmash.get_feedback_bundle",
      "agentmash.request_deletion",
      "inputSchema",
      "outputSchema"
    ]),
  "future MCP tool contract is explicit and contract-only"
);
check(
  intakeExample.schema === "agentmash.intake.v1"
    && intakeExample.source?.runId === "run-2026-05-08-001"
    && intakeExample.reviewContext?.focus === "trust"
    && Array.isArray(intakeExample.artifacts)
    && intakeExample.artifacts[0]?.id === "artifact-homepage-clean",
  "intake example gives a realistic agent-drop payload"
);
check(
  intakeAckExample.schema === "agentmash.intake-ack.v1"
    && intakeAckExample.status === "accepted"
    && intakeAckExample.accepted?.[0]?.artifactId === "artifact-homepage-clean"
    && intakeAckExample.limits?.allowedImageTypes?.includes("image/webp"),
  "intake acknowledgement example gives a realistic future response"
);
check(
  feedbackBundleExample.schema === "agentmash.feedback-bundle.v1"
    && feedbackBundleExample.status === "ready"
    && feedbackBundleExample.packets?.[0]?.schema === "agentmash.feedback.v2"
    && feedbackBundleExample.packets?.[0]?.humanSignal?.signalStrength === 0.79
    && feedbackBundleExample.evalRows?.[0]?.schema === "agentmash.eval-row.v2",
  "feedback bundle example gives a realistic future response"
);
check(!appSurface.includes("confidenceFor") && !appSurface.includes(".confidence"), "app output no longer uses confidence field");
check(!appSurface.includes("agentRetryQueue") && !appSurface.includes("Retry queue"), "retry queue metric is removed");
check(
  appSurface.includes("renderRefinePanel") && appSurface.includes("isRefineOpen = false") && appSurface.includes("openCommentSheet"),
  "decision flow returns to fast loop after refinement and comments"
);
check(appSurface.includes("advancedScoresButton") && renderModule.includes("toggleScoreControls"), "Refine keeps score sliders behind an advanced toggle");
check(appSurface.includes("renderDetailSheet") && appSurface.includes("isDetailSheetOpen = false"), "decision flow closes the details sheet after swipe");
check(app.includes("isDecisionTransitioning") && gesturesModule.includes("isDecisionLocked"), "rapid duplicate decisions are locked during swipe animation");
check(hasAll(gesturesModule, ["AudioContext", "navigator.vibrate", "nice: [8, 22, 14]", "playDecisionClick"]), "decisions use haptic and audio feedback where available");
check(
  hasAll(appSurface, ["ALLOWED_IMAGE_TYPES", "MAX_IMAGE_BYTES", "safeImageData", "Choose a PNG, JPG, or WebP image"]),
  "image uploads are type and size constrained"
);
check(serviceWorker.includes('const CACHE_NAME = "agentmash-v48"'), "service worker cache is AgentMash scoped and current");
check(hasAll(serviceWorker, appShellFiles), "service worker app shell includes launch pages and icons");
check(hasAll(headers, securityHeaders), "_headers defines security headers");
check(hasAll(netlify, securityHeaders), "netlify config defines security headers");
check(hasAll(JSON.stringify(vercel), securityHeaders), "vercel config defines security headers");
check(hasAll(headers, ["/sw.js", "/manifest.webmanifest", "Cache-Control: no-cache"]), "_headers keeps service worker and manifest update-friendly");
check(hasAll(netlify, ['for = "/sw.js"', 'for = "/manifest.webmanifest"', 'Cache-Control = "no-cache"']), "netlify keeps service worker and manifest update-friendly");
check(
  JSON.stringify(vercel).includes('"source":"/sw.js"') &&
    JSON.stringify(vercel).includes('"source":"/manifest.webmanifest"') &&
    JSON.stringify(vercel).includes('"key":"Cache-Control"') &&
    JSON.stringify(vercel).includes('"value":"no-cache"'),
  "vercel keeps service worker and manifest update-friendly"
);
check(netlify.includes('command = "npm run build"') && netlify.includes('publish = "_site"'), "netlify publishes public build output");
check(vercel.buildCommand === "npm run build" && vercel.outputDirectory === buildDir, "vercel publishes public build output");
check(headers.includes("connect-src 'self'") && headers.includes("form-action 'self'"), "CSP blocks outside connections and forms");
check(headers.includes("payment=()"), "permissions policy blocks payment permission");
check(
  Object.entries(htmlPageSources).every(([, source]) => hasAll(source, [
    'http-equiv="Content-Security-Policy"',
    "default-src 'self'",
    "connect-src 'self'",
    "form-action 'self'",
    "object-src 'none'"
  ])),
  "public HTML pages include CSP fallback metadata"
);
check(hasAll(styles, ["safe-area-inset-top", "safe-area-inset-bottom", "--safe-bottom"]), "layout accounts for iOS safe areas");
check(packageJson.scripts?.build === "node scripts/build-site.mjs", "package has local public build script");
check(packageJson.scripts?.["refresh:assets"] === "node scripts/refresh-launch-assets.mjs", "package has local launch asset refresh script");
check(packageJson.scripts?.["serve:build"] === "python3 -m http.server 5178 --directory _site", "package has build preview script");
check(packageJson.scripts?.["ready:public"] === "npm run check && npm run build", "package has public readiness script");
check(packageJson.scripts?.["verify:public"] === "node scripts/verify-public-url.mjs", "package has public URL verifier script");
check(packageJson.scripts?.["configure:public"] === "node scripts/configure-public-launch.mjs", "package has public launch metadata configurator script");
check(packageJson.scripts?.["check:verify-public"] === "node scripts/check-public-url-verifier.mjs", "package has public URL verifier smoke check");
check(
  packageJson.scripts?.["check:configure-public"] === "node scripts/check-configure-public.mjs",
  "package has public metadata write-path check"
);
check(packageJson.scripts?.check.includes("npm run test:e2e"), "package check runs Playwright e2e tests");
check(packageJson.scripts?.check.includes("node --check scripts/verify-public-url.mjs"), "package check syntax-checks public URL verifier");
check(packageJson.scripts?.check.includes("node --check scripts/configure-public-launch.mjs"), "package check syntax-checks public metadata configurator");
check(
  hasAll(packageJson.scripts?.check || "", ["node --check scripts/refresh-launch-assets.mjs"]) &&
    hasAll(refreshAssetsScript, [
      "@playwright/test",
      "deviceScaleFactor: 3",
      "assets/startup/apple-iphone-6-9-human-review.png",
      "store/submission/google-phone-human-review.png",
      "store/submission/asset-manifest.json",
      "writeSubmissionAssetManifest"
    ]),
  "launch asset refresh script captures PWA, startup, and draft store assets locally"
);
check(packageJson.scripts?.check.includes("node --check scripts/check-configure-public.mjs"), "package check syntax-checks public metadata checker");
check(packageJson.scripts?.check.includes("node --check scripts/check-public-url-verifier.mjs"), "package check syntax-checks public URL verifier smoke check");
check(packageJson.scripts?.check.includes("npm run check:configure-public"), "package check verifies public metadata configurator");
check(packageJson.scripts?.check.includes("npm run check:verify-public"), "package check smoke-tests public URL verifier locally");
check(packageJson.scripts?.["test:e2e"] === "playwright test", "package has Playwright e2e script");
check(packageJson.devDependencies?.["@playwright/test"], "Playwright is a dev dependency only");
check(
  hasAll(configurePublicScript, [
    "og:url",
    "twitter:url",
    "canonical",
    "data-public-support-contact",
    "--dry-run",
    "--root",
    "configurePublicLaunch",
    "Missing --support",
    "YOUR-SUPPORT-ROUTE",
    "sitemap.xml",
    "robots.txt"
  ]) &&
    !/\b(fetch|XMLHttpRequest|sendBeacon|WebSocket)\b/i.test(configurePublicScript),
  "public metadata configurator is local-only and covers URL/support launch fields"
);
check(
  hasAll(configurePublicCheck, [
    "mkdtemp",
    "configurePublicLaunch",
    "idempotent",
    "dry-run does not mutate files",
    "app/assets/icons/app-icon-1024.png",
    "rejects missing support route",
    "rejects placeholder support route",
    "writes public sitemap URLs",
    "stamps sitemap URL in robots"
  ]),
  "public metadata checker exercises real write, idempotency, and dry-run paths"
);
check(
  hasAll(verifyPublicScript, ["canonical URL", "Open Graph URL", "Twitter URL", "Open Graph image", "Twitter image", "data-public-support-contact", "robots file", "sitemap includes", "feedback schema", "intake schema", "API contract", "MCP tool contract", "intake example", "feedback bundle example"]),
  "public URL verifier checks final URL, preview image, support metadata, robots, sitemap, schemas, future contracts, and examples"
);
check(
  hasAll(publicVerifierCheck, ["createServer", "configurePublicLaunch", "verify-public-url.mjs", "127.0.0.1", "publicBuildEntries", "application/xml"]) &&
    !/\b(stripe|paypal|posthog|sendBeacon|WebSocket)\b/i.test(publicVerifierCheck),
  "public URL verifier smoke check serves a configured local public build"
);
check(
  hasAll(testSpec, ["Profile export and import roundtrip restores uploaded images", "readFile", "#importFile", "storedImageForKey"]),
  "Playwright covers image export import roundtrip"
);
check(hasAll(testSpec, ["application/x-ndjson", "rejected", "accepted"]), "Playwright covers normalized export packet contract");
check(hasAll(testSpec, ["Rapid decisions are locked", "decisionTransition", "clippedFilters"]), "Playwright covers transition lock and mobile filter readability");
check(hasAll(testSpec, ["Keyboard shortcuts support swipe and pairwise", "Control+Z", "Typing here should keep arrow keys in the note"]), "Playwright covers keyboard shortcut accessibility");
check(hasAll(testSpec, ["commentButton", "commentReason", "reviewNote", "advancedScoresButton", "scoreControls", "Scores"]), "Playwright covers compact comment and Refine score toggle");
check(hasAll(testSpec, ["packetContractStatus", "datasetContractStatus", "Rows valid"]), "Playwright covers export contract status");
check(
  hasAll(testSpec, ["Changing a pending upload stores only the submitted image", "imageStoreKeys", "first.png", "second.png"]),
  "Playwright covers pending upload submit-only storage"
);
check(
  hasAll(testSpec, ["Stress profile handles 500 items, 250 reviews, and 100 more swipes", "Array.from({ length: 500 }", "toBe(350)"]),
  "Playwright covers large local profile stress path"
);
check(
  hasAll(testSpec, ["Service worker keeps the app shell available offline", "context.setOffline(true)", "navigator.serviceWorker.ready"]),
  "Playwright covers offline PWA app shell"
);
check(
  hasAll(testSpec, ["Install prompt is visible from the human review screen", "__agentmashInstallPrompted", "#installButton"]),
  "Playwright covers human-screen install prompt"
);
check(pagesWorkflow.includes("npm run build"), "GitHub Pages workflow uses public build script");
check(!pagesWorkflow.includes(" store"), "GitHub Pages workflow does not copy internal store docs directly");
check(readme.includes("store/public-launch-audit.md"), "README links public launch audit");
check(readme.includes("store/completion-audit.md"), "README links completion audit");
check(readme.includes("CHANGELOG.md"), "README links private changelog");
check(
  hasAll(changelog, [
    "## 0.3.0 - 2026-05-08",
    "card-first swipe loop",
    "quick-reason dropdown",
    "agentmash.feedback.v2",
    "signalStrength",
    "agentmash-v48",
    "No public deployment was performed",
    "No domain was bought",
    "No paid service",
    "manual-only"
  ]),
  "changelog records current launch-prep build and constraints"
);
check(completionAudit.includes("Prompt-To-Artifact Checklist"), "completion audit has prompt-to-artifact checklist");
check(completionAudit.includes("Not Achieved Yet"), "completion audit keeps external blockers explicit");
check(audit.includes("Remaining Public Launch Blockers"), "launch audit lists remaining blockers");
check(audit.includes("Runtime Smoke Evidence"), "launch audit includes runtime smoke evidence");
check(readme.includes("store/app-store-submission.md"), "README links app store submission prep");
check(readme.includes("store/privacy-data-safety-draft.md"), "README links privacy and data safety draft");
check(readme.includes("store/native-wrapper-handoff.md"), "README links native wrapper handoff");
check(readme.includes("signal strength"), "README describes signal strength output");
check(
  hasAll(readme, ["local quality gate, not a final release command", "run `npm run ready:public` again", "only deploy the rebuilt `_site/` directory"]) &&
    hasAll(publishingRunbook, ["not enough by itself for a first public release", "The first release order", "deploy `_site/`", "verify:public"]),
  "launch docs distinguish local readiness from final release metadata"
);
check(!/public-beta candidate|lab-ready|should pass/i.test(readme), "README avoids beta status and ambiguous verdict wording");
check(listing.includes("Human taste for AI work"), "store subtitle fits App Store limit");
check(!listing.includes("Human taste signals for AI work"), "old over-limit store subtitle is absent");
check(
  hasAll(appStoreSubmission, ["99 USD per year", "25 USD one-time", "12 opted-in testers", "14 continuous days", "24-bit PNG feature graphic without alpha"]),
  "app store submission prep documents current account, testing, and asset blockers"
);
check(
  hasAll(submissionReadme, ["May 8, 2026", "card-dominant swipe layout", "Comment shortcut", "asset-manifest.json"]),
  "draft submission asset README matches current swipe UI refresh"
);
const submissionAssetSizes = Object.fromEntries(
  (submissionAssetManifest.assets || []).map((asset) => [asset.path, `${asset.width}x${asset.height}`])
);
check(
  submissionAssetManifest.schema === "agentmash.submission-assets.v1"
    && submissionAssetManifest.generatedBy === "npm run refresh:assets"
    && submissionAssetManifest.draftOnly === true
    && submissionAssetManifest.nativeRecaptureRequired === true
    && hasAll(JSON.stringify(submissionAssetManifest), [
      "Apple App Store",
      "Google Play",
      "draft iPhone 6.9 screenshot",
      "draft feature graphic",
      "No public deployment",
      "Recapture screenshots from final native iOS and Android builds"
    ]),
  "submission asset manifest identifies draft-only native recapture requirements"
);
check(
  [
    "store/app-icon-1024.png",
    "store/submission/apple-iphone-6-9-human-review.png",
    "store/submission/apple-iphone-6-5-human-review.png",
    "store/submission/google-phone-human-review.png",
    "store/submission/google-play-feature-graphic.png"
  ].every((path) => submissionAssetSizes[path] === submissionPngSizes[path]),
  "submission asset manifest dimensions match checked PNG dimensions"
);
check(
  hasAll(researchGuide, ["Google Play closed testing for new personal accounts", "12 opted-in testers", "14 continuous days"]),
  "cost guide flags Google Play closed-testing effort"
);
check(
  hasAll(releaseChecklist, ["new Google Play personal developer account", "12 opted-in testers", "14 continuous days"]) &&
    audit.includes("Google Play closed-testing production-access requirement"),
  "release checklist and launch audit keep Google Play production-access blocker explicit"
);
check(
  hasAll(nativeHandoff, ["Capacitor", "com.agentmash.app", "webDir", "_site", "No native wrapper was created", "Do not add analytics SDKs"]),
  "native wrapper handoff keeps store-shell setup explicit"
);
check(
  hasAll(backendHandoff, ["schemas/api.v1.openapi.json", "schemas/mcp-tools.v1.json", "contract handoff", "Needs User Action Later"]) &&
    !/\b(fetch|XMLHttpRequest|sendBeacon|WebSocket)\b/i.test(backendHandoff),
  "backend handoff documents future API and MCP without runtime networking"
);

for (const [file, size] of Object.entries(submissionPngSizes)) {
  check((await pngSize(file)) === size, `${file} is ${size}`);
}

await buildSite({ silent: true });

for (const entry of publicBuildEntries) {
  check(await exists(`${buildDir}/${entry}`), `${buildDir}/${entry} is packaged`);
}
check(optionalPublicBuildEntries.includes("sitemap.xml"), "public build can package configured sitemap");

for (const entry of blockedBuildEntries) {
  check(!(await exists(`${buildDir}/${entry}`)), `${buildDir}/${entry} is not packaged`);
}

const builtManifest = JSON.parse(await read(`${buildDir}/manifest.webmanifest`));
check(builtManifest.screenshots.every((shot) => shot.src.startsWith("assets/screenshots/")), "built manifest screenshots are public assets");
for (const shot of builtManifest.screenshots) {
  check(await exists(`${buildDir}/${shot.src}`), `${buildDir}/${shot.src} exists`);
}

const combinedText = (await Promise.all(textFiles.map(read))).join("\n");
const launchSurfaceText = (
  await Promise.all(textFiles.filter((file) => file !== "scripts/launch-check.mjs").map(read))
).join("\n");
const publicHtmlText = (await Promise.all(htmlPages.map(read))).join("\n");
check(!/[^\x00-\x7F]/.test(combinedText), "text files are ASCII");
check(!/Nice or Not|is-it-nice/.test(combinedText), "old product/repo names are absent");
check(!/\b(dating|tinder|hinge|mate|mates)\b/i.test(launchSurfaceText), "no relationship-app wording");
check(!/\b(webhook|polling)\b/i.test(publicHtmlText), "public pages avoid deferred backend channel wording");
check(!/\bbeta\b|No public support inbox|still needs to be chosen|support route listed/i.test(publicHtmlText), "public pages avoid prelaunch support placeholders");
check(!publicBuildEntries.includes("publishing.html"), "public build excludes internal publishing notes");
check(!/\bbeta\b|public-beta candidate/i.test(publishingNotes), "internal publishing notes avoid beta-candidate wording");
check(!/mailto:|tel:|XMLHttpRequest|sendBeacon|WebSocket|stripe|paypal|posthog|sentry/i.test(launchSurfaceText), "no contact, payment, analytics, or socket hooks");

for (const file of textFiles.filter((file) => file !== "sw.js")) {
  const content = await read(file);
  check(!/\bfetch\s*\(/.test(content), `${file} does not fetch`);
}

for (const page of htmlPages) {
  const content = await read(page);
  check(content.includes('<meta name="viewport"'), `${page} has viewport metadata`);
  check(content.includes('name="description"'), `${page} has description metadata`);
  check(content.includes('name="application-name" content="AgentMash"'), `${page} has app-name metadata`);
  check(content.includes('name="color-scheme" content="light dark"'), `${page} has color-scheme metadata`);
  check(
    content.includes('name="theme-color" media="(prefers-color-scheme: light)"') &&
      content.includes('name="theme-color" media="(prefers-color-scheme: dark)"'),
    `${page} has light and dark theme-color metadata`
  );
  check(content.includes('href="styles.css"'), `${page} loads shared styles`);
  check(content.includes('rel="icon"') && content.includes("assets/app-icon.svg"), `${page} links favicon`);
  check(content.includes('rel="apple-touch-icon"') && content.includes("assets/icons/apple-touch-icon.png"), `${page} links Apple touch icon`);
}

if (failures) {
  console.error(`launch check failed: ${failures} issue${failures === 1 ? "" : "s"}`);
  process.exit(1);
}

console.log("launch check passed");
