import { access, readFile } from "node:fs/promises";
import { buildDir, blockedBuildEntries, buildSite, publicBuildEntries } from "./build-site.mjs";

const requiredFiles = [
  ".github/workflows/pages.yml",
  "index.html",
  "styles.css",
  "app.js",
  "sw.js",
  "manifest.webmanifest",
  "support.html",
  "privacy.html",
  "terms.html",
  "publishing.html",
  "404.html",
  "README.md",
  "PUBLISHING.md",
  "scripts/build-site.mjs",
  "store/completion-audit.md",
  "store/public-launch-audit.md",
  "store/public-launch-plan.md",
  "store/release-checklist.md",
  "store/research-and-cost-guide.md",
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
const manifest = JSON.parse(await read("manifest.webmanifest"));
const vercel = JSON.parse(await read("vercel.json"));
const index = await read("index.html");
const support = await read("support.html");
const app = await read("app.js");
const serviceWorker = await read("sw.js");
const headers = await read("_headers");
const netlify = await read("netlify.toml");
const pagesWorkflow = await read(".github/workflows/pages.yml");
const readme = await read("README.md");
const completionAudit = await read("store/completion-audit.md");
const audit = await read("store/public-launch-audit.md");
const listing = await read("store/app-store-listing.md");

check(packageJson.name === "agentmash", "package name is agentmash");
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
check(index.includes('accept="image/png,image/jpeg,image/webp"') && !index.includes("image/svg+xml"), "user uploads exclude SVG");
check(hasAll(index, ["support.html", "privacy.html", "terms.html", "publishing.html"]), "footer links key pages");
check(app.includes("humanAddButton") && app.includes("openAddArtifactPanel"), "human add-artifact entry exists");
check(app.includes('state.dashboard = "human";'), "added artifacts return to human deck");
check(app.includes("window.confirm") && app.includes("Reset this local AgentMash profile"), "reset requires confirmation");
check(app.includes("confirmProfileImport") && app.includes("Import this AgentMash profile"), "profile import requires confirmation when local data exists");
check(app.includes("async function copyText") && app.includes("Copy unavailable"), "copy actions handle clipboard failure");
check(
  hasAll(app, ["ALLOWED_IMAGE_TYPES", "MAX_IMAGE_BYTES", "safeImageData", "Choose a PNG, JPG, or WebP image"]),
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
check(packageJson.scripts?.build === "node scripts/build-site.mjs", "package has local public build script");
check(packageJson.scripts?.["serve:build"] === "python3 -m http.server 5178 --directory _site", "package has build preview script");
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
check(listing.includes("Human taste for AI work"), "store subtitle fits App Store limit");
check(!listing.includes("Human taste signals for AI work"), "old over-limit store subtitle is absent");

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
check(!/[^\x00-\x7F]/.test(combinedText), "text files are ASCII");
check(!/Nice or Not|is-it-nice/.test(combinedText), "old product/repo names are absent");
check(!/\b(dating|tinder|hinge|mate|mates)\b/i.test(launchSurfaceText), "no relationship-app wording");
check(!/mailto:|tel:|XMLHttpRequest|sendBeacon|WebSocket|stripe|paypal|posthog|sentry/i.test(launchSurfaceText), "no contact, payment, analytics, or socket hooks");

for (const file of textFiles.filter((file) => file !== "sw.js")) {
  const content = await read(file);
  check(!/\bfetch\s*\(/.test(content), `${file} does not fetch`);
}

for (const page of htmlPages) {
  const content = await read(page);
  check(content.includes('<meta name="viewport"'), `${page} has viewport metadata`);
  check(content.includes('href="styles.css"'), `${page} loads shared styles`);
}

if (failures) {
  console.error(`launch check failed: ${failures} issue${failures === 1 ? "" : "s"}`);
  process.exit(1);
}

console.log("launch check passed");
