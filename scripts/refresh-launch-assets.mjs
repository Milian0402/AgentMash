import { createServer } from "node:http";
import { copyFile, mkdir, readFile, stat } from "node:fs/promises";
import { dirname, extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8"
};

const captures = [
  {
    label: "public mobile screenshot",
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
    targets: ["assets/screenshots/mobile-review.png", "store/screenshots/mobile-review.png"]
  },
  {
    label: "public desktop screenshot",
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
    targets: ["assets/screenshots/desktop-review.png", "store/screenshots/desktop-review.png"]
  },
  {
    label: "iPhone 6.9 startup and draft store image",
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: 3,
    isMobile: true,
    targets: [
      "assets/startup/apple-iphone-6-9-human-review.png",
      "store/submission/apple-iphone-6-9-human-review.png"
    ]
  },
  {
    label: "iPhone 6.5 startup and draft store image",
    viewport: { width: 414, height: 896 },
    deviceScaleFactor: 3,
    isMobile: true,
    targets: [
      "assets/startup/apple-iphone-6-5-human-review.png",
      "store/submission/apple-iphone-6-5-human-review.png"
    ]
  },
  {
    label: "Google phone draft store image",
    viewport: { width: 360, height: 640 },
    deviceScaleFactor: 3,
    isMobile: true,
    targets: ["store/submission/google-phone-human-review.png"]
  },
  {
    label: "Google Play feature graphic",
    viewport: { width: 1024, height: 500 },
    deviceScaleFactor: 1,
    targets: ["store/submission/google-play-feature-graphic.png"]
  }
];

function contentType(filePath) {
  return mimeTypes[extname(filePath)] || "application/octet-stream";
}

function resolveRequestPath(requestUrl = "/") {
  const url = new URL(requestUrl, "http://127.0.0.1");
  const pathname = decodeURIComponent(url.pathname);
  const relativePath = pathname === "/" ? "index.html" : pathname.slice(1);
  const filePath = resolve(repoRoot, relativePath);
  if (filePath !== repoRoot && !filePath.startsWith(`${repoRoot}${sep}`)) {
    return "";
  }
  return filePath;
}

function startServer() {
  const server = createServer(async (request, response) => {
    const filePath = resolveRequestPath(request.url);
    if (!filePath) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    try {
      const fileStat = await stat(filePath);
      if (!fileStat.isFile()) {
        response.writeHead(404);
        response.end("Not found");
        return;
      }

      const body = await readFile(filePath);
      response.writeHead(200, {
        "Content-Length": body.byteLength,
        "Content-Type": contentType(filePath)
      });
      if (request.method === "HEAD") {
        response.end();
        return;
      }
      response.end(body);
    } catch {
      response.writeHead(404);
      response.end("Not found");
    }
  });

  return new Promise((resolveServer, rejectServer) => {
    server.once("error", rejectServer);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolveServer({ server, origin: `http://127.0.0.1:${address.port}/` });
    });
  });
}

async function waitForApp(page, origin) {
  await page.goto(origin, { waitUntil: "networkidle" });
  await page.locator("#swipeCard").waitFor({ state: "visible", timeout: 10000 });
  await page.evaluate(() => (document.fonts ? document.fonts.ready : Promise.resolve()));
  await page.waitForTimeout(150);
}

async function captureAsset(browser, origin, capture) {
  const context = await browser.newContext({
    colorScheme: "light",
    deviceScaleFactor: capture.deviceScaleFactor,
    hasTouch: Boolean(capture.isMobile),
    isMobile: Boolean(capture.isMobile),
    viewport: capture.viewport
  });
  const page = await context.newPage();
  await waitForApp(page, origin);

  const [primaryTarget, ...copyTargets] = capture.targets;
  await mkdir(dirname(resolve(repoRoot, primaryTarget)), { recursive: true });
  await page.screenshot({
    animations: "disabled",
    fullPage: false,
    path: resolve(repoRoot, primaryTarget),
    scale: "device"
  });
  await context.close();

  for (const target of copyTargets) {
    await mkdir(dirname(resolve(repoRoot, target)), { recursive: true });
    await copyFile(resolve(repoRoot, primaryTarget), resolve(repoRoot, target));
  }

  const renderedWidth = capture.viewport.width * capture.deviceScaleFactor;
  const renderedHeight = capture.viewport.height * capture.deviceScaleFactor;
  console.log(`captured ${capture.label}: ${renderedWidth}x${renderedHeight}`);
}

const { server, origin } = await startServer();
const browser = await chromium.launch({ channel: "chrome" });

try {
  for (const capture of captures) {
    await captureAsset(browser, origin, capture);
  }
} finally {
  await browser.close();
  await new Promise((resolveClose) => server.close(resolveClose));
}
