import { cp, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const buildDir = "_site";

export const publicBuildEntries = [
  "index.html",
  "styles.css",
  "app.js",
  "api-client.js",
  "intake.js",
  "state.js",
  "packet.js",
  "render.js",
  "gestures.js",
  "manifest.webmanifest",
  "sw.js",
  "schemas",
  "privacy.html",
  "support.html",
  "terms.html",
  "404.html",
  "robots.txt",
  "_headers",
  ".nojekyll",
  "assets"
];

export const optionalPublicBuildEntries = ["sitemap.xml"];

export const blockedBuildEntries = [
  ".git",
  ".github",
  ".playwright-cli",
  "node_modules",
  "playwright.config.mjs",
  "scripts",
  "server",
  "store",
  "tests",
  "test-results",
  "playwright-report",
  "PUBLISHING.md",
  "publishing.html",
  "README.md",
  "CHANGELOG.md",
  "package-lock.json",
  "package.json",
  "netlify.toml",
  "vercel.json"
];

export async function buildSite({ outputDir = buildDir, silent = false } = {}) {
  await rm(outputDir, { recursive: true, force: true });
  await mkdir(outputDir, { recursive: true });
  let copiedEntries = 0;

  for (const entry of publicBuildEntries) {
    await cp(entry, join(outputDir, entry), { recursive: true });
    copiedEntries += 1;
  }

  for (const entry of optionalPublicBuildEntries) {
    try {
      await cp(entry, join(outputDir, entry), { recursive: true });
      copiedEntries += 1;
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    }
  }

  if (!silent) {
    console.log(`Built ${outputDir} with ${copiedEntries} public entries.`);
  }
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isMain) {
  await buildSite();
}
