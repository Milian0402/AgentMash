import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const pageNames = {
  index: "index.html",
  privacy: "privacy.html",
  support: "support.html"
};

function usage() {
  return [
    "usage: npm run configure:public -- --url https://your-domain.example --support support@example.com",
    "",
    "Options:",
    "  --url <https-url>       Final public app URL.",
    "  --support <text>        Public support route to show on support/privacy pages.",
    "  --root <path>           Directory containing index/support/privacy HTML files.",
    "  --dry-run              Validate and print planned changes without writing files."
  ].join("\n");
}

function parseArgs(argv) {
  const parsed = {
    dryRun: false,
    root: ".",
    support: "",
    url: ""
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--dry-run") {
      parsed.dryRun = true;
      continue;
    }
    if (arg === "--url") {
      parsed.url = argv[index + 1] || "";
      index += 1;
      continue;
    }
    if (arg === "--support") {
      parsed.support = argv[index + 1] || "";
      index += 1;
      continue;
    }
    if (arg === "--root") {
      parsed.root = argv[index + 1] || "";
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}\n\n${usage()}`);
  }

  return parsed;
}

function normalizePublicUrl(value) {
  if (!value) {
    throw new Error(`Missing --url.\n\n${usage()}`);
  }

  const url = new URL(value);
  const isLocalHost = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  if (url.protocol !== "https:" && !(url.protocol === "http:" && isLocalHost)) {
    throw new Error("Final public URL must use https, except for local verification on localhost.");
  }
  url.pathname = url.pathname.replace(/\/?$/, "/");
  url.search = "";
  url.hash = "";
  return url;
}

function normalizeSupport(value) {
  const support = value.trim();
  if (!support) {
    throw new Error(`Missing --support.\n\n${usage()}`);
  }
  if (/YOUR[-_\s]?SUPPORT[-_\s]?ROUTE/i.test(support)) {
    throw new Error("Replace YOUR-SUPPORT-ROUTE with a real public support route before configuring launch metadata.");
  }
  return support;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function upsertAfter(source, matcher, after, tag) {
  if (matcher.test(source)) {
    return source.replace(matcher, tag);
  }
  if (!source.includes(after)) {
    throw new Error(`Could not find insertion point: ${after}`);
  }
  return source.replace(after, `${after}\n    ${tag}`);
}

function configureIndex(source, publicUrl) {
  const homeUrl = publicUrl.toString();
  const imageUrl = new URL("assets/icons/app-icon-1024.png", publicUrl).toString();
  let next = source;

  next = upsertAfter(
    next,
    /<link rel="canonical" href="[^"]*" \/>/,
    "<title>AgentMash</title>",
    `<link rel="canonical" href="${homeUrl}" />`
  );
  next = upsertAfter(
    next,
    /<meta property="og:url" content="[^"]*" \/>/,
    '<meta property="og:type" content="website" />',
    `<meta property="og:url" content="${homeUrl}" />`
  );
  next = upsertAfter(
    next,
    /<meta property="og:image" content="[^"]*" \/>/,
    '<meta property="og:type" content="website" />',
    `<meta property="og:image" content="${imageUrl}" />`
  );
  next = upsertAfter(
    next,
    /<meta name="twitter:url" content="[^"]*" \/>/,
    '<meta name="twitter:card" content="summary" />',
    `<meta name="twitter:url" content="${homeUrl}" />`
  );
  next = upsertAfter(
    next,
    /<meta name="twitter:image" content="[^"]*" \/>/,
    '<meta name="twitter:card" content="summary" />',
    `<meta name="twitter:image" content="${imageUrl}" />`
  );

  return next;
}

function supportBlock(contact) {
  const safeContact = escapeHtml(contact);
  return [
    "      <h2>Public Contact</h2>",
    `      <p data-public-support-contact>Public support route: ${safeContact}.</p>`
  ].join("\n");
}

function configureSupport(source, contact) {
  if (!contact) {
    return source;
  }

  const block = supportBlock(contact);
  const blockMatcher = /\n      <h2>Public Contact<\/h2>\n      <p data-public-support-contact>.*?<\/p>/s;
  if (blockMatcher.test(source)) {
    return source.replace(blockMatcher, `\n${block}`);
  }
  return source.replace("      <h2>What To Include</h2>", `${block}\n\n      <h2>What To Include</h2>`);
}

function configurePrivacy(source, contact) {
  if (!contact) {
    return source;
  }

  const safeContact = escapeHtml(contact);
  const contactLine = `      <p data-public-support-contact>Public support route: ${safeContact}.</p>`;
  const lineMatcher = /\n      <p data-public-support-contact>.*?<\/p>/s;
  if (lineMatcher.test(source)) {
    return source.replace(lineMatcher, `\n${contactLine}`);
  }
  return source.replace(
    "      <p>Support details live on the <a href=\"support.html\">support page</a>. AgentMash does not send diagnostics automatically.</p>",
    [
      "      <p>Support details live on the <a href=\"support.html\">support page</a>. AgentMash does not send diagnostics automatically.</p>",
      contactLine
    ].join("\n")
  );
}

export async function configurePublicLaunch({ dryRun = false, root = ".", support = "", url }) {
  const publicUrl = normalizePublicUrl(url);
  const trimmedSupport = normalizeSupport(support);

  const files = {
    [pageNames.index]: configureIndex(await readFile(join(root, pageNames.index), "utf8"), publicUrl),
    [pageNames.support]: configureSupport(await readFile(join(root, pageNames.support), "utf8"), trimmedSupport),
    [pageNames.privacy]: configurePrivacy(await readFile(join(root, pageNames.privacy), "utf8"), trimmedSupport)
  };

  const changedFiles = [];
  for (const [path, next] of Object.entries(files)) {
    const fullPath = join(root, path);
    const current = await readFile(fullPath, "utf8");
    if (current !== next) {
      changedFiles.push(path);
      if (!dryRun) {
        await writeFile(fullPath, next);
      }
    }
  }

  return {
    changedFiles,
    publicUrl,
    support: trimmedSupport
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const result = await configurePublicLaunch(args);

  console.log(`${args.dryRun ? "Checked" : "Configured"} public launch metadata for ${result.publicUrl.toString()}`);
  if (result.support) {
    console.log(`Support route: ${result.support}`);
  }
  console.log(`Files ${args.dryRun ? "that would change" : "changed"}: ${result.changedFiles.length ? result.changedFiles.join(", ") : "none"}`);
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isMain) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
