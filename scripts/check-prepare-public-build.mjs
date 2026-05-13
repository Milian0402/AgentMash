import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { preparePublicBuild } from "./prepare-public-build.mjs";

let failures = 0;

function check(condition, message) {
  if (condition) {
    console.log(`ok - ${message}`);
    return;
  }
  failures += 1;
  console.error(`fail - ${message}`);
}

function hasSameMembers(actual, expected) {
  return actual.length === expected.length && expected.every((entry) => actual.includes(entry));
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

const tempRoot = await mkdtemp(join(tmpdir(), "agentmash-public-build-"));
const outputDir = join(tempRoot, "_site");
const expectedChangedFiles = [
  "index.html",
  "manifest.webmanifest",
  "support.html",
  "privacy.html",
  "robots.txt",
  "sitemap.xml"
];

const result = await preparePublicBuild({
  outputDir,
  silent: true,
  support: "support@example.com",
  url: "https://agentmash.example/app/"
});

check(result.outputDir === outputDir, "prepare public reports configured build directory");
check(result.publicUrl.toString() === "https://agentmash.example/app/", "prepare public normalizes final public URL");
check(hasSameMembers(result.changedFiles, expectedChangedFiles), "prepare public stamps final metadata into build output");

const sourceManifest = await readJson("manifest.webmanifest");
const builtManifest = await readJson(join(outputDir, "manifest.webmanifest"));
const builtIndex = await readFile(join(outputDir, "index.html"), "utf8");
const robots = await readFile(join(outputDir, "robots.txt"), "utf8");
const sitemap = await readFile(join(outputDir, "sitemap.xml"), "utf8");

check(sourceManifest.id === "./" && sourceManifest.start_url === "./index.html", "prepare public leaves source manifest untouched");
check(builtManifest.id === "/app/" && builtManifest.start_url === "/app/" && builtManifest.scope === "/app/", "prepare public stamps stable PWA identity into build manifest");
check(builtIndex.includes('content="https://agentmash.example/app/assets/icons/app-icon-1024.png"'), "prepare public stamps public preview image in build");
check(robots.includes("Sitemap: https://agentmash.example/app/sitemap.xml"), "prepare public stamps robots sitemap in build");
check(sitemap.includes("<loc>https://agentmash.example/app/privacy.html</loc>"), "prepare public writes public sitemap in build");

if (failures) {
  console.error(`prepare public check failed: ${failures} issue${failures === 1 ? "" : "s"}`);
  process.exit(1);
}

console.log("prepare public check passed");
