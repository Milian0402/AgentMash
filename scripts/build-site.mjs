import { cp, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const buildDir = "_site";

export const publicBuildEntries = [
  "index.html",
  "styles.css",
  "app.js",
  "manifest.webmanifest",
  "sw.js",
  "privacy.html",
  "support.html",
  "terms.html",
  "publishing.html",
  "404.html",
  "robots.txt",
  "_headers",
  ".nojekyll",
  "assets"
];

export const blockedBuildEntries = [
  ".git",
  ".github",
  ".playwright-cli",
  "scripts",
  "store",
  "PUBLISHING.md",
  "README.md",
  "package.json",
  "netlify.toml",
  "vercel.json"
];

export async function buildSite({ silent = false } = {}) {
  await rm(buildDir, { recursive: true, force: true });
  await mkdir(buildDir, { recursive: true });

  for (const entry of publicBuildEntries) {
    await cp(entry, join(buildDir, entry), { recursive: true });
  }

  if (!silent) {
    console.log(`Built ${buildDir} with ${publicBuildEntries.length} public entries.`);
  }
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isMain) {
  await buildSite();
}
