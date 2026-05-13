import { fileURLToPath } from "node:url";
import { buildDir, buildSite } from "./build-site.mjs";
import { configurePublicLaunch } from "./configure-public-launch.mjs";

function usage() {
  return [
    "usage: npm run prepare:public -- --url https://your-domain.example --support support@example.com",
    "",
    "Options:",
    "  --url <https-url>       Final public app URL.",
    "  --support <text>        Public support route to show on support/privacy pages.",
    "  --output <path>         Build output directory. Defaults to _site.",
    "  --dry-run              Build output, validate metadata, and print planned changes without writing metadata."
  ].join("\n");
}

function parseArgs(argv) {
  const parsed = {
    dryRun: false,
    outputDir: buildDir,
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
    if (arg === "--output") {
      parsed.outputDir = argv[index + 1] || "";
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}\n\n${usage()}`);
  }

  parsed.url ||= process.env.AGENTMASH_PUBLIC_URL || process.env.PUBLIC_URL || "";
  parsed.support ||= process.env.AGENTMASH_SUPPORT_ROUTE || process.env.SUPPORT_ROUTE || "";

  if (!parsed.url) {
    throw new Error(`Missing --url.\n\n${usage()}`);
  }
  if (!parsed.support) {
    throw new Error(`Missing --support.\n\n${usage()}`);
  }
  if (!parsed.outputDir) {
    throw new Error(`Missing --output value.\n\n${usage()}`);
  }

  return parsed;
}

export async function preparePublicBuild({ dryRun = false, outputDir = buildDir, support = "", url, silent = false }) {
  await buildSite({ outputDir, silent });
  const result = await configurePublicLaunch({
    dryRun,
    root: outputDir,
    support,
    url
  });

  return {
    ...result,
    outputDir
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const result = await preparePublicBuild(args);

  console.log(`${args.dryRun ? "Checked" : "Prepared"} public build at ${result.outputDir}`);
  console.log(`Public URL: ${result.publicUrl.toString()}`);
  console.log(`Support route: ${result.support}`);
  console.log(`Files ${args.dryRun ? "that would change" : "changed"}: ${result.changedFiles.length ? result.changedFiles.join(", ") : "none"}`);
  console.log("No public deployment, account signup, outreach, or paid action was performed.");
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isMain) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
