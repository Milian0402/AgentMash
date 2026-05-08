import { createServer } from "node:http";
import { copyFile, mkdir, readFile, stat, writeFile } from "node:fs/promises";
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

const submissionAssetManifestPath = "store/submission/asset-manifest.json";

function submissionAssetManifest(refreshedAt) {
  return {
    schema: "agentmash.submission-assets.v1",
    refreshedAt,
    generatedBy: "npm run refresh:assets",
    source: "local PWA Human review screen",
    draftOnly: true,
    nativeRecaptureRequired: true,
    notes: [
      "No public deployment, paid account, app-store submission, or outreach is performed by this command.",
      "Use these files for private planning and listing drafts.",
      "Recapture screenshots from final native iOS and Android builds before store submission."
    ],
    assets: [
      {
        path: "store/app-icon-1024.png",
        width: 1024,
        height: 1024,
        format: "png",
        platform: ["Apple App Store", "Google Play"],
        use: "source store icon"
      },
      {
        path: "store/submission/apple-iphone-6-9-human-review.png",
        width: 1290,
        height: 2796,
        format: "png",
        platform: ["Apple App Store"],
        use: "draft iPhone 6.9 screenshot",
        source: "assets/startup/apple-iphone-6-9-human-review.png"
      },
      {
        path: "store/submission/apple-iphone-6-5-human-review.png",
        width: 1242,
        height: 2688,
        format: "png",
        platform: ["Apple App Store"],
        use: "draft iPhone 6.5 screenshot",
        source: "assets/startup/apple-iphone-6-5-human-review.png"
      },
      {
        path: "store/submission/google-phone-human-review.png",
        width: 1080,
        height: 1920,
        format: "png",
        platform: ["Google Play"],
        use: "draft phone screenshot",
        source: "assets/screenshots/mobile-review.png"
      },
      {
        path: "store/submission/google-play-feature-graphic.png",
        width: 1024,
        height: 500,
        format: "png",
        platform: ["Google Play"],
        use: "draft feature graphic",
        source: "assets/screenshots/desktop-review.png"
      }
    ]
  };
}

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

async function writeSubmissionAssetManifest() {
  const refreshedAt = new Date().toISOString().slice(0, 10);
  const manifest = submissionAssetManifest(refreshedAt);
  await writeFile(resolve(repoRoot, submissionAssetManifestPath), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`wrote ${submissionAssetManifestPath}`);
}

const { server, origin } = await startServer();
const browser = await chromium.launch({ channel: "chrome" });

try {
  for (const capture of captures) {
    await captureAsset(browser, origin, capture);
  }
  await writeSubmissionAssetManifest();
} finally {
  await browser.close();
  await new Promise((resolveClose) => server.close(resolveClose));
}
