import { access, readFile } from "node:fs/promises";
import { buildDir, blockedBuildEntries, buildSite, publicBuildEntries } from "./build-site.mjs";

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
  "PUBLISHING.md",
  "package-lock.json",
  "playwright.config.mjs",
  "tests/review-flow.spec.mjs",
  "scripts/build-site.mjs",
  "schemas/feedback.v2.json",
  "store/completion-audit.md",
  "store/public-launch-audit.md",
  "store/public-launch-plan.md",
  "store/release-checklist.md",
  "store/research-and-cost-guide.md",
  "store/native-wrapper-handoff.md",
  "store/agent-customer-model.md",
  "store/app-store-listing.md",
  "store/app-store-submission.md",
  "store/privacy-data-safety-draft.md",
  "store/submission/README.md",
  "_headers",
  "netlify.toml",
  "vercel.json",
  "store/app-icon-1024.png",
  "assets/app-icon.svg",
  "assets/icons/app-icon-192.png",
  "assets/icons/app-icon-512.png",
  "assets/icons/app-icon-1024.png",
  "assets/icons/apple-touch-icon.png",
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
  "publishing.html",
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
  "./assets/app-icon.svg",
  "./assets/icons/app-icon-192.png",
  "./assets/icons/app-icon-512.png",
  "./assets/icons/app-icon-1024.png",
  "./assets/icons/apple-touch-icon.png",
  "./assets/screenshots/mobile-review.png",
  "./assets/screenshots/desktop-review.png",
  "./privacy.html",
  "./support.html",
  "./terms.html",
  "./publishing.html",
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
  "assets/icons/apple-touch-icon.png": "180x180",
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
const index = await read("index.html");
const support = await read("support.html");
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
const readme = await read("README.md");
const completionAudit = await read("store/completion-audit.md");
const audit = await read("store/public-launch-audit.md");
const listing = await read("store/app-store-listing.md");
const nativeHandoff = await read("store/native-wrapper-handoff.md");

check(packageJson.name === "agentmash", "package name is agentmash");
check(packageJson.type === "module", "package uses native ES modules");
check(packageLock.packages?.[""]?.type === packageJson.type, "package lock matches module type");
check(packageJson.repository?.url === "https://github.com/Milian0402/AgentMash.git", "package repo points to AgentMash");
check(manifest.name === "AgentMash" && manifest.short_name === "AgentMash", "manifest uses AgentMash");
check(manifest.id === "./", "manifest has a stable app id");
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
check(index.includes(`v${packageJson.version}`) && support.includes(`AgentMash v${packageJson.version}`), "public pages expose package version");
check(index.includes('rel="apple-touch-icon"') && index.includes("assets/icons/apple-touch-icon.png"), "index links Apple touch icon");
check(index.includes("Reset profile") && !index.includes("Reset demo"), "reset action uses profile wording");
check(index.includes('name="color-scheme" content="light dark"') && styles.includes("@media (prefers-color-scheme: dark)") && styles.includes("color-scheme: dark"), "app follows OS light and dark color scheme");
check(index.includes('accept="image/png,image/jpeg,image/webp"') && !index.includes("image/svg+xml"), "user uploads exclude SVG");
check(hasAll(index, ["support.html", "privacy.html", "terms.html", "publishing.html"]), "footer links key pages");
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
check(index.includes("refineButton") && index.includes('id="signalPanel" hidden'), "rubric and note panel is hidden behind Refine by default");
check(hasAll(styles, [".first-look-stage .signal-panel", "position: fixed", "bottom-sheet-rise"]), "Refine panel opens as a bottom sheet");
check(index.includes("detailsButton") && index.includes('id="detailSheet" hidden'), "card details are hidden behind a details sheet by default");
check(index.includes('id="streakCounter"') && renderModule.includes("renderMomentum") && styles.includes("streak-pop"), "human review includes visible momentum counter");
check(index.includes("profileInsights") && renderModule.includes("renderProfileInsights") && renderModule.includes("tagInsightRows"), "human review includes profile insights");
check(index.includes("keeperList") && index.includes("Keepers"), "deck completion has keepers summary");
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
check(index.includes("storageHealthStatus") && renderModule.includes("estimateImageStoreBytes") && renderModule.includes("localStorageProfileBytes"), "human dashboard shows storage health");
check(appSurface.includes("Local storage full") && appSurface.includes("setStorageStatus"), "localStorage quota failure surfaces in the UI");
check(appSurface.includes("signalStrengthFormula") && appSurface.includes("agentmash.feedback.v2"), "feedback packets use schema v2 with signal strength formula");
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
check(!appSurface.includes("confidenceFor") && !appSurface.includes(".confidence"), "app output no longer uses confidence field");
check(!appSurface.includes("agentRetryQueue") && !appSurface.includes("Retry queue"), "retry queue metric is removed");
check(appSurface.includes("renderRefinePanel") && appSurface.includes("isRefineOpen = false"), "decision flow returns to fast loop after refinement");
check(appSurface.includes("advancedScoresButton") && renderModule.includes("toggleScoreControls"), "Refine keeps score sliders behind an advanced toggle");
check(appSurface.includes("renderDetailSheet") && appSurface.includes("isDetailSheetOpen = false"), "decision flow closes the details sheet after swipe");
check(app.includes("isDecisionTransitioning") && gesturesModule.includes("isDecisionLocked"), "rapid duplicate decisions are locked during swipe animation");
check(hasAll(gesturesModule, ["AudioContext", "navigator.vibrate", "nice: [8, 22, 14]", "playDecisionClick"]), "decisions use haptic and audio feedback where available");
check(
  hasAll(appSurface, ["ALLOWED_IMAGE_TYPES", "MAX_IMAGE_BYTES", "safeImageData", "Choose a PNG, JPG, or WebP image"]),
  "image uploads are type and size constrained"
);
check(serviceWorker.includes('const CACHE_NAME = "agentmash-v'), "service worker cache is AgentMash scoped");
check(hasAll(serviceWorker, appShellFiles), "service worker app shell includes launch pages and icons");
check(hasAll(headers, securityHeaders), "_headers defines security headers");
check(hasAll(netlify, securityHeaders), "netlify config defines security headers");
check(hasAll(JSON.stringify(vercel), securityHeaders), "vercel config defines security headers");
check(netlify.includes('command = "npm run build"') && netlify.includes('publish = "_site"'), "netlify publishes public build output");
check(vercel.buildCommand === "npm run build" && vercel.outputDirectory === buildDir, "vercel publishes public build output");
check(headers.includes("connect-src 'self'") && headers.includes("form-action 'self'"), "CSP blocks outside connections and forms");
check(headers.includes("payment=()"), "permissions policy blocks payment permission");
check(hasAll(styles, ["safe-area-inset-top", "safe-area-inset-bottom", "--safe-bottom"]), "layout accounts for iOS safe areas");
check(packageJson.scripts?.build === "node scripts/build-site.mjs", "package has local public build script");
check(packageJson.scripts?.["serve:build"] === "python3 -m http.server 5178 --directory _site", "package has build preview script");
check(packageJson.scripts?.check.includes("npm run test:e2e"), "package check runs Playwright e2e tests");
check(packageJson.scripts?.["test:e2e"] === "playwright test", "package has Playwright e2e script");
check(packageJson.devDependencies?.["@playwright/test"], "Playwright is a dev dependency only");
check(
  hasAll(testSpec, ["Profile export and import roundtrip restores uploaded images", "readFile", "#importFile", "storedImageForKey"]),
  "Playwright covers image export import roundtrip"
);
check(hasAll(testSpec, ["application/x-ndjson", "rejected", "accepted"]), "Playwright covers normalized export packet contract");
check(hasAll(testSpec, ["Rapid decisions are locked", "decisionTransition", "clippedFilters"]), "Playwright covers transition lock and mobile filter readability");
check(hasAll(testSpec, ["advancedScoresButton", "scoreControls", "Scores"]), "Playwright covers compact Refine score toggle");
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
check(completionAudit.includes("Prompt-To-Artifact Checklist"), "completion audit has prompt-to-artifact checklist");
check(completionAudit.includes("Not Achieved Yet"), "completion audit keeps external blockers explicit");
check(audit.includes("Remaining Public Launch Blockers"), "launch audit lists remaining blockers");
check(audit.includes("Runtime Smoke Evidence"), "launch audit includes runtime smoke evidence");
check(readme.includes("store/app-store-submission.md"), "README links app store submission prep");
check(readme.includes("store/privacy-data-safety-draft.md"), "README links privacy and data safety draft");
check(readme.includes("store/native-wrapper-handoff.md"), "README links native wrapper handoff");
check(readme.includes("signal strength"), "README describes signal strength output");
check(listing.includes("Human taste for AI work"), "store subtitle fits App Store limit");
check(!listing.includes("Human taste signals for AI work"), "old over-limit store subtitle is absent");
check(
  hasAll(nativeHandoff, ["Capacitor", "com.agentmash.app", "webDir", "_site", "No native wrapper was created", "Do not add analytics SDKs"]),
  "native wrapper handoff keeps store-shell setup explicit"
);

for (const [file, size] of Object.entries(submissionPngSizes)) {
  check((await pngSize(file)) === size, `${file} is ${size}`);
}

await buildSite({ silent: true });

for (const entry of publicBuildEntries) {
  check(await exists(`${buildDir}/${entry}`), `${buildDir}/${entry} is packaged`);
}

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
check(!/mailto:|tel:|XMLHttpRequest|sendBeacon|WebSocket|stripe|paypal|posthog|sentry/i.test(launchSurfaceText), "no contact, payment, analytics, or socket hooks");

for (const file of textFiles.filter((file) => file !== "sw.js")) {
  const content = await read(file);
  check(!/\bfetch\s*\(/.test(content), `${file} does not fetch`);
}

for (const page of htmlPages) {
  const content = await read(page);
  check(content.includes('<meta name="viewport"'), `${page} has viewport metadata`);
  check(content.includes('href="styles.css"'), `${page} loads shared styles`);
  check(content.includes('rel="icon"') && content.includes("assets/app-icon.svg"), `${page} links favicon`);
  check(content.includes('rel="apple-touch-icon"') && content.includes("assets/icons/apple-touch-icon.png"), `${page} links Apple touch icon`);
}

if (failures) {
  console.error(`launch check failed: ${failures} issue${failures === 1 ? "" : "s"}`);
  process.exit(1);
}

console.log("launch check passed");
