import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { cp, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, extname, join, normalize, sep } from "node:path";
import { configurePublicLaunch } from "./configure-public-launch.mjs";
import { publicBuildEntries } from "./build-site.mjs";

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8"
};

const securityHeaders = {
  "Content-Security-Policy": "default-src 'self'; img-src 'self' data: blob:; script-src 'self'; style-src 'self'; manifest-src 'self'; worker-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Permissions-Policy": "camera=(), microphone=(), payment=(), geolocation=()",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY"
};

function responseHeaders(path) {
  return {
    ...securityHeaders,
    "Cache-Control": path === "/sw.js" || path === "/manifest.webmanifest" ? "no-cache" : "public, max-age=60",
    "Content-Type": mimeTypes[extname(path)] || "application/octet-stream"
  };
}

function safePath(root, requestUrl) {
  const { pathname } = new URL(requestUrl, "http://127.0.0.1");
  const decoded = decodeURIComponent(pathname);
  const relativePath = decoded === "/" ? "index.html" : decoded.replace(/^\/+/, "");
  const candidate = normalize(join(root, relativePath));
  if (candidate !== root && !candidate.startsWith(`${root}${sep}`)) {
    return "";
  }
  return candidate;
}

function serve(root) {
  const server = createServer(async (req, res) => {
    const fullPath = safePath(root, req.url || "/");
    if (!fullPath) {
      res.writeHead(403, responseHeaders("/403.html"));
      res.end("Forbidden");
      return;
    }

    try {
      const body = await readFile(fullPath);
      const servedPath = `/${basename(fullPath)}` === "/index.html" ? "/" : new URL(req.url || "/", "http://127.0.0.1").pathname;
      res.writeHead(200, responseHeaders(servedPath));
      res.end(body);
    } catch {
      res.writeHead(404, responseHeaders("/404.html"));
      res.end("Not found");
    }
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

function runVerifier(url) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["scripts/verify-public-url.mjs", url], {
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"]
    });
    let output = "";
    child.stdout.on("data", (chunk) => {
      output += chunk;
    });
    child.stderr.on("data", (chunk) => {
      output += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        console.log(output.trim());
        resolve();
        return;
      }
      reject(new Error(output.trim() || `public URL verifier exited with ${code}`));
    });
  });
}

async function main() {
  const root = await mkdtemp(join(tmpdir(), "agentmash-public-verifier-"));
  let server;

  try {
    await Promise.all(publicBuildEntries.map((entry) => cp(entry, join(root, entry), { recursive: true })));

    server = await serve(root);
    const address = server.address();
    const publicUrl = `http://127.0.0.1:${address.port}/`;

    await configurePublicLaunch({
      root,
      support: "support@example.com",
      url: publicUrl
    });

    await runVerifier(publicUrl);
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await rm(root, { force: true, recursive: true });
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
