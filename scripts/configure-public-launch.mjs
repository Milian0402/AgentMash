import { readFile, writeFile } from "node:fs/promises";

const indexPath = "index.html";
const supportPath = "support.html";
const privacyPath = "privacy.html";

function usage() {
  return [
    "usage: npm run configure:public -- --url https://your-domain.example --support support@example.com",
    "",
    "Options:",
    "  --url <https-url>       Final public app URL.",
    "  --support <text>        Public support route to show on support/privacy pages.",
    "  --dry-run              Validate and print planned changes without writing files."
  ].join("\n");
}

function parseArgs(argv) {
  const parsed = {
    dryRun: false,
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
    throw new Error(`Unknown argument: ${arg}\n\n${usage()}`);
  }

  return parsed;
}

function normalizePublicUrl(value) {
  if (!value) {
    throw new Error(`Missing --url.\n\n${usage()}`);
  }

  const url = new URL(value);
  if (url.protocol !== "https:") {
    throw new Error("Final public URL must use https.");
  }
  url.pathname = url.pathname.replace(/\/?$/, "/");
  url.search = "";
  url.hash = "";
  return url;
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

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const publicUrl = normalizePublicUrl(args.url);
  const support = args.support.trim();

  const files = {
    [indexPath]: configureIndex(await readFile(indexPath, "utf8"), publicUrl),
    [supportPath]: configureSupport(await readFile(supportPath, "utf8"), support),
    [privacyPath]: configurePrivacy(await readFile(privacyPath, "utf8"), support)
  };

  const changedFiles = [];
  for (const [path, next] of Object.entries(files)) {
    const current = await readFile(path, "utf8");
    if (current !== next) {
      changedFiles.push(path);
      if (!args.dryRun) {
        await writeFile(path, next);
      }
    }
  }

  console.log(`${args.dryRun ? "Checked" : "Configured"} public launch metadata for ${publicUrl.toString()}`);
  if (support) {
    console.log(`Support route: ${support}`);
  }
  console.log(`Files ${args.dryRun ? "that would change" : "changed"}: ${changedFiles.length ? changedFiles.join(", ") : "none"}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
