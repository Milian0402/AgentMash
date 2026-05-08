import { cp, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { configurePublicLaunch } from "./configure-public-launch.mjs";

const pages = ["index.html", "support.html", "privacy.html"];
const generatedFiles = ["robots.txt", "sitemap.xml"];
const configuredFiles = [...pages, ...generatedFiles];
const publicUrl = "https://agentmash.example/app/";
const supportRoute = "support@example.com & launch <ready>";
const escapedSupport = "support@example.com &amp; launch &lt;ready&gt;";

let failures = 0;

function check(condition, message) {
  if (condition) {
    console.log(`ok - ${message}`);
    return;
  }
  failures += 1;
  console.error(`fail - ${message}`);
}

function hasAll(source, needles) {
  return needles.every((needle) => source.includes(needle));
}

function hasSameMembers(actual, expected) {
  return actual.length === expected.length && expected.every((item) => actual.includes(item));
}

async function rejectsSupport(root, support, pattern) {
  try {
    await configurePublicLaunch({
      dryRun: true,
      root,
      support,
      url: publicUrl
    });
    return false;
  } catch (error) {
    return pattern.test(error.message);
  }
}

async function readPages(root) {
  const entries = await Promise.all(pages.map(async (page) => [page, await readFile(join(root, page), "utf8")]));
  return Object.fromEntries(entries);
}

async function readLaunchFiles(root) {
  const entries = await Promise.all(configuredFiles.map(async (file) => [file, await readFile(join(root, file), "utf8")]));
  return Object.fromEntries(entries);
}

async function main() {
  const root = await mkdtemp(join(tmpdir(), "agentmash-configure-public-"));

  try {
    await Promise.all([...pages, "robots.txt"].map((page) => cp(page, join(root, page))));

    const first = await configurePublicLaunch({
      root,
      support: supportRoute,
      url: publicUrl
    });
    check(hasSameMembers(first.changedFiles, configuredFiles), "configure public writes launch metadata pages and search files");

    const configured = await readPages(root);
    check(
      hasAll(configured["index.html"], [
        '<link rel="canonical" href="https://agentmash.example/app/" />',
        '<meta property="og:url" content="https://agentmash.example/app/" />',
        '<meta property="og:image" content="https://agentmash.example/app/assets/icons/app-icon-1024.png" />',
        '<meta name="twitter:url" content="https://agentmash.example/app/" />',
        '<meta name="twitter:image" content="https://agentmash.example/app/assets/icons/app-icon-1024.png" />'
      ]),
      "configure public stamps final URL and preview image metadata"
    );
    check(
      hasAll(configured["support.html"], ["data-public-support-contact", escapedSupport]) &&
        hasAll(configured["privacy.html"], ["data-public-support-contact", escapedSupport]),
      "configure public stamps escaped support metadata"
    );
    const robots = await readFile(join(root, "robots.txt"), "utf8");
    const sitemap = await readFile(join(root, "sitemap.xml"), "utf8");
    check(robots.includes("Sitemap: https://agentmash.example/app/sitemap.xml"), "configure public stamps sitemap URL in robots");
    check(
      hasAll(sitemap, [
        "<loc>https://agentmash.example/app/</loc>",
        "<loc>https://agentmash.example/app/support.html</loc>",
        "<loc>https://agentmash.example/app/privacy.html</loc>",
        "<loc>https://agentmash.example/app/terms.html</loc>"
      ]),
      "configure public writes public sitemap URLs"
    );

    const second = await configurePublicLaunch({
      root,
      support: supportRoute,
      url: publicUrl
    });
    check(second.changedFiles.length === 0, "configure public is idempotent");

    const beforeDryRun = JSON.stringify(await readLaunchFiles(root));
    const dryRun = await configurePublicLaunch({
      dryRun: true,
      root,
      support: "changed@example.com",
      url: "https://changed.example/"
    });
    const afterDryRun = JSON.stringify(await readLaunchFiles(root));
    check(hasSameMembers(dryRun.changedFiles, configuredFiles), "configure public dry-run reports pending changes");
    check(beforeDryRun === afterDryRun, "configure public dry-run does not mutate files");
    check(await rejectsSupport(root, " ", /Missing --support/), "configure public rejects missing support route");
    check(
      await rejectsSupport(root, "YOUR-SUPPORT-ROUTE", /Replace YOUR-SUPPORT-ROUTE/),
      "configure public rejects placeholder support route"
    );
  } finally {
    await rm(root, { force: true, recursive: true });
  }

  if (failures) {
    console.error(`configure public check failed: ${failures} issue${failures === 1 ? "" : "s"}`);
    process.exit(1);
  }

  console.log("configure public check passed");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
