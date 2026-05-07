import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

const storageKey = "agentmash.private-profile.v5";
const appUrl = process.env.AGENTMASH_E2E_URL || "http://127.0.0.1:5177/";
const tinyPngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=";

async function resetApp(page) {
  await page.goto(appUrl);
  await page.evaluate((key) => {
    localStorage.removeItem(key);
  }, storageKey);
  await clearStoredImages(page);
  await page.reload();
}

async function reviewCount(page) {
  return page.evaluate((key) => {
    const profile = JSON.parse(localStorage.getItem(key));
    return profile.reviews.length;
  }, storageKey);
}

async function itemCount(page) {
  return page.evaluate((key) => {
    const profile = JSON.parse(localStorage.getItem(key));
    return profile.items.length;
  }, storageKey);
}

async function storedImageForKey(page, imageKey) {
  return page.evaluate(async (key) => {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open("agentmash.image-store", 1);
      request.addEventListener("success", () => resolve(request.result));
      request.addEventListener("error", () => reject(request.error));
    });

    return new Promise((resolve, reject) => {
      const transaction = db.transaction("images", "readonly");
      const request = transaction.objectStore("images").get(key);
      request.addEventListener("success", () => resolve(request.result?.data || ""));
      request.addEventListener("error", () => reject(request.error));
    });
  }, imageKey);
}

async function clearStoredImages(page) {
  await page.evaluate(async () => {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open("agentmash.image-store", 1);
      request.addEventListener("upgradeneeded", () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("images")) {
          db.createObjectStore("images", { keyPath: "key" });
        }
      });
      request.addEventListener("success", () => resolve(request.result));
      request.addEventListener("error", () => reject(request.error));
    });

    await new Promise((resolve, reject) => {
      const transaction = db.transaction("images", "readwrite");
      transaction.addEventListener("complete", resolve);
      transaction.addEventListener("error", () => reject(transaction.error));
      transaction.objectStore("images").clear();
    });
  });
}

async function imageStoreKeys(page) {
  return page.evaluate(async () => {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open("agentmash.image-store", 1);
      request.addEventListener("success", () => resolve(request.result));
      request.addEventListener("error", () => reject(request.error));
    });

    return new Promise((resolve, reject) => {
      const transaction = db.transaction("images", "readonly");
      const request = transaction.objectStore("images").getAllKeys();
      request.addEventListener("success", () => resolve(request.result));
      request.addEventListener("error", () => reject(request.error));
    });
  });
}

async function addTinyImageArtifact(page, title) {
  await page.getByRole("button", { name: "Add artifact" }).click();
  await page.locator("#artifactTitle").fill(title);
  await page.setInputFiles("#artifactImage", {
    name: "tiny.png",
    mimeType: "image/png",
    buffer: Buffer.from(tinyPngBase64, "base64")
  });
  await expect(page.locator("#imageStatus")).toContainText("ready for local review");
  await page.getByRole("button", { name: "Add to review deck" }).click();
  await expect(page.locator("#artifactTitleLabel")).toContainText(title);
}

async function seedStressProfile(page) {
  await page.goto(appUrl);
  await page.evaluate((key) => {
    const types = ["website", "logo", "copy", "product"];
    const installedAt = "2026-05-07T00:00:00.000Z";
    const items = Array.from({ length: 500 }, (_, index) => {
      const type = types[index % types.length];
      return {
        id: `stress-item-${index}`,
        type,
        title: `Stress artifact ${index + 1}`,
        prompt: `Stress prompt ${index + 1} for fast local review.`,
        body: `Can this ${type} survive a first-glance review under load?`,
        question: `Is this ${type} nice?`,
        agent: {
          requesterType: "agent",
          requesterName: `stress-agent-${index % 8}`,
          runId: `stress-run-${index}`,
          goal: "Stress local review storage and render paths.",
          returnMode: "json",
          returnTarget: "local-stress",
          submittedAt: installedAt
        },
        variant: "original",
        loopSourceItemId: "",
        imageKey: "",
        imageData: "",
        createdAt: installedAt
      };
    });
    const reviews = items.slice(0, 250).map((item, index) => {
      const verdict = index % 3 === 0 ? "nice" : "pass";
      const score = verdict === "nice" ? 76 : 42;
      return {
        id: `stress-review-${index}`,
        itemId: item.id,
        reviewer: "Stress reviewer",
        verdict,
        scores: { gut: verdict === "nice" ? 8 : 3, sense: 6, craft: 6, useful: 6 },
        score,
        grade: verdict === "nice" ? "Promising" : "Reject",
        recommendation: verdict === "nice" ? "Keep iterating from this direction." : "Reject this output and retry.",
        tags: verdict === "nice" ? ["clear"] : ["generic"],
        note: "",
        createdAt: installedAt
      };
    });

    localStorage.setItem(
      key,
      JSON.stringify({
        version: 5,
        reviewer: "Stress reviewer",
        filter: "all",
        dashboard: "human",
        reviewMode: "swipe",
        endlessMode: false,
        loopCursor: 0,
        pairwise: { leftItemId: null, rightItemId: null },
        items,
        reviews,
        pairwiseComparisons: [],
        currentItemId: items[250].id,
        activeTags: [],
        draftScores: { gut: 6, sense: 6, craft: 6, useful: 6 },
        lastPacketItemId: reviews.at(-1).itemId,
        installedAt
      })
    );
  }, storageKey);
  await page.reload();
}

test("Nice, Undo, and Nope produce a v2 feedback packet", async ({ page }) => {
  await resetApp(page);

  await expect(page).toHaveTitle("AgentMash");
  await expect(page.locator("#streakCounter")).toHaveText("0 in a row, 0 today, 0-day streak");
  await expect(page.locator("#localStorageUsage")).toContainText("of ~5.0 MB");
  await expect(page.locator("#imageStorageUsage")).toContainText("IndexedDB");
  await page.getByRole("button", { name: "Add artifact" }).click();
  await expect(page.locator("#agentReturnMode option")).toHaveCount(2);
  await expect(page.locator("#agentReturnMode")).not.toContainText("Webhook");
  await expect(page.locator("#agentReturnMode")).not.toContainText("Polling");
  await page.getByRole("button", { name: "Human review", exact: true }).click();
  await expect(page.locator("#detailSheet")).toBeHidden();
  await page.getByRole("button", { name: "Details" }).click();
  await expect(page.locator("#detailSheet")).toBeVisible();
  await expect(page.locator("#detailSheet")).toContainText("OpsPilot landing page");
  await page.getByRole("button", { name: "Close" }).click();
  await expect(page.locator("#detailSheet")).toBeHidden();
  await expect(page.locator("#stageProgress")).toHaveText("1 / 4");
  await expect(page.locator("#signalPanel")).toBeHidden();
  await page.getByRole("button", { name: "Refine" }).click();
  await expect(page.locator("#signalPanel")).toBeVisible();
  await expect(page.locator("#tagRow")).toBeVisible();
  await expect(page.getByLabel("Decision note")).toBeVisible();
  await expect(page.locator("#scoreControls")).toBeHidden();
  await expect(page.locator("#advancedScoresButton")).toHaveAttribute("aria-expanded", "false");
  await page.getByRole("button", { name: "Scores" }).click();
  await expect(page.locator("#scoreControls")).toBeVisible();
  await expect(page.locator("#advancedScoresButton")).toHaveAttribute("aria-expanded", "true");
  await page.getByLabel("Decision note").fill("Looks generic on first glance.");
  await page.getByRole("button", { name: /Nice/ }).click();
  await expect.poll(() => reviewCount(page)).toBe(1);
  await expect(page.locator("#streakCounter")).toHaveText("1 in a row, 1 today, 1-day streak");
  await expect(page.locator("#signalPanel")).toBeHidden();

  await page.getByRole("button", { name: "Undo" }).click();
  await expect.poll(() => reviewCount(page)).toBe(0);
  await expect(page.locator("#stageProgress")).toHaveText("1 / 4");
  await expect(page.locator("#streakCounter")).toHaveText("0 in a row, 0 today, 0-day streak");
  let profile = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), storageKey);
  expect(profile.filter).toBe("all");
  expect(profile.currentItemId).toBe("site-landing-001");

  await page.getByRole("button", { name: /Nope/ }).click();
  await expect.poll(() => reviewCount(page)).toBe(1);
  await expect(page.locator("#streakCounter")).toHaveText("1 in a row, 1 today, 1-day streak");
  await expect(page.locator("#profileInsights")).toContainText("Website: 0% nice rate across 1.");

  await page.getByRole("button", { name: "Export workspace" }).click();
  await expect(page.locator("#packetStatus")).toHaveText("Ready");

  const packet = await page.locator("#packetPreview").evaluate((node) => JSON.parse(node.textContent));

  expect(packet.schema).toBe("agentmash.feedback.v2");
  expect(packet.status).toBe("ready");
  expect(packet.signalStrengthFormula.name).toBe("score_extremity_plus_annotation");
  expect(packet.humanJudgement.verdict).toBe("rejected");
  expect(packet.humanJudgement).toHaveProperty("signalStrength");
  expect(packet.humanJudgement).not.toHaveProperty("confidence");
  expect(packet.humanSignal).toHaveProperty("signalStrength");
  expect(packet.humanSignal.verdict).toBe("rejected");
  expect(packet.agentUse).toHaveProperty("signalStrength");
  expect(packet.evalRow.schema).toBe("agentmash.eval-row.v2");
  expect(packet.evalRow.humanSignal).toHaveProperty("signalStrength");
  expect(packet.evalRow.agentUse).toHaveProperty("signalStrength");
  expect(packet.return.deliveryStatus).toBe("local_ready");
});

test("Rapid decisions are locked and mobile filter labels stay readable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await resetApp(page);

  const clippedFilters = await page.locator("#filterTabs .segment").evaluateAll((buttons) => {
    return buttons
      .filter((button) => button.scrollWidth > button.clientWidth + 1)
      .map((button) => button.textContent.trim());
  });
  expect(clippedFilters).toEqual([]);

  const lockState = await page.locator("#acceptButton").evaluate((button) => {
    const click = new MouseEvent("click", { bubbles: true, cancelable: true });
    button.dispatchEvent(click);
    button.dispatchEvent(click);
    return {
      transition: document.body.dataset.decisionTransition,
      acceptDisabled: button.disabled,
      reviewCount: JSON.parse(localStorage.getItem("agentmash.private-profile.v5")).reviews.length
    };
  });

  expect(lockState).toEqual({
    transition: "true",
    acceptDisabled: true,
    reviewCount: 1
  });
  await expect(page.locator("#stageProgress")).toHaveText("2 / 4");
  await expect(page.locator("#acceptButton")).toBeEnabled();
  await expect.poll(() => reviewCount(page)).toBe(1);
});

test("Export workspace empty state reads correctly with zero items and reviews", async ({ page }) => {
  await page.goto(appUrl);
  await page.evaluate((key) => {
    localStorage.setItem(
      key,
      JSON.stringify({
        version: 5,
        reviewer: "Private reviewer",
        filter: "all",
        dashboard: "agent",
        items: [],
        reviews: [],
        currentItemId: null,
        activeTags: [],
        draftScores: { gut: 6, sense: 6, craft: 6, useful: 6 },
        lastPacketItemId: null,
        installedAt: "2026-05-07T00:00:00.000Z"
      })
    );
  }, storageKey);
  await page.reload();

  await expect(page.locator("#agentTotalRequests")).toHaveText("0 artifacts");
  await expect(page.locator("#agentReadyPackets")).toHaveText("0");
  await expect(page.locator("#agentPendingRequests")).toHaveText("0");
  await expect(page.locator("#agentAvgConfidence")).toHaveText("None");
  await expect(page.locator("#agentRequestList")).toContainText("No exportable artifacts yet.");
  await expect(page.locator("#datasetStatus")).toHaveText("0 rows");
  await expect(page.locator("#packetStatus")).toHaveText("Empty");

  const packet = await page.locator("#packetPreview").evaluate((node) => JSON.parse(node.textContent));
  expect(packet).toMatchObject({
    schema: "agentmash.feedback.v2",
    status: "empty",
    message: "No active artifact."
  });
});

test("Deck completion shows keepers instead of dead air", async ({ page }) => {
  await resetApp(page);

  await page.getByRole("button", { name: /Nice/ }).click();
  await expect.poll(() => reviewCount(page)).toBe(1);

  for (const count of [2, 3, 4]) {
    await page.getByRole("button", { name: /Nope/ }).click();
    await expect.poll(() => reviewCount(page)).toBe(count);
  }

  await expect(page.locator("#emptyState")).toBeVisible();
  await expect(page.locator("#emptyTitle")).toHaveText("Keepers");
  await expect(page.locator("#keeperList")).toContainText("OpsPilot landing page");
  await expect(page.getByRole("button", { name: "Remix 4 cards" })).toBeVisible();
});

test("Remix deck starts another local session without overwriting exports", async ({ page }) => {
  await resetApp(page);

  for (const count of [1, 2, 3, 4]) {
    await page.getByRole("button", { name: /Nice/ }).click();
    await expect.poll(() => reviewCount(page)).toBe(count);
  }

  await page.getByRole("button", { name: "Remix 4 cards" }).click();
  await expect(page.locator("#swipeCard")).toBeVisible();

  let profile = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), storageKey);
  expect(profile.items).toHaveLength(8);
  expect(profile.reviews).toHaveLength(4);
  expect(profile.items.slice(0, 4).map((item) => item.variant)).toEqual([
    "tagline",
    "mark-only",
    "first-line",
    "cutout"
  ]);

  await page.getByRole("button", { name: /Nope/ }).click();
  await expect.poll(() => reviewCount(page)).toBe(5);

  profile = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), storageKey);
  const reviewedItemIds = profile.reviews.map((review) => review.itemId);
  expect(new Set(reviewedItemIds).size).toBe(reviewedItemIds.length);

  await page.getByRole("button", { name: "Export workspace" }).click();
  await expect(page.locator("#datasetStatus")).toHaveText("5 rows");

  const packet = await page.locator("#packetPreview").evaluate((node) => JSON.parse(node.textContent));
  expect(packet.request.variant).toBe("tagline");
  expect(packet.evalRow.artifact.variant).toBe("tagline");
});

test("Pairwise mode stores comparison rows without creating swipe reviews", async ({ page }) => {
  await resetApp(page);

  await page.getByRole("button", { name: "Pairwise" }).click();
  await expect(page.locator("#pairwiseStage")).toBeVisible();
  await page.getByRole("button", { name: "Pick left" }).click();
  await expect.poll(() => reviewCount(page)).toBe(0);

  let profile = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), storageKey);
  expect(profile.pairwiseComparisons).toHaveLength(1);
  expect(profile.pairwiseComparisons[0]).toMatchObject({
    leftItemId: "site-landing-001",
    rightItemId: "logo-bakery-001",
    winnerItemId: "site-landing-001",
    loserItemId: "logo-bakery-001",
    scoreDelta: 1
  });

  await page.getByRole("button", { name: "Export workspace" }).click();
  await expect(page.locator("#datasetStatus")).toHaveText("1 rows");
  let rows = await page.locator("#datasetPreview").evaluate((node) => node.textContent.trim().split("\n").map(JSON.parse));
  expect(rows[0].schema).toBe("agentmash.pairwise-row.v1");
  expect(rows[0].comparison.preferenceLabel).toBe("left_preferred");

  await page.getByRole("button", { name: "Human review", exact: true }).click();
  await page.getByRole("button", { name: "Swipe" }).click();
  await page.getByRole("button", { name: /Nice/ }).click();
  await expect.poll(() => reviewCount(page)).toBe(1);

  profile = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), storageKey);
  expect(profile.pairwiseComparisons).toHaveLength(1);
  await page.getByRole("button", { name: "Export workspace" }).click();
  await expect(page.locator("#datasetStatus")).toHaveText("2 rows");

  rows = await page.locator("#datasetPreview").evaluate((node) => node.textContent.trim().split("\n").map(JSON.parse));
  expect(rows.map((row) => row.schema)).toEqual(["agentmash.eval-row.v2", "agentmash.pairwise-row.v1"]);

  const packet = await page.locator("#packetPreview").evaluate((node) => JSON.parse(node.textContent));
  expect(packet.schema).toBe("agentmash.feedback.v2");
  expect(packet.evalRow.schema).toBe("agentmash.eval-row.v2");
  expect(packet.humanJudgement.verdict).toBe("accepted");
  expect(packet.humanSignal.verdict).toBe("accepted");
  expect(packet.pairwiseComparisons).toHaveLength(1);
  expect(packet.humanSignal.pairwisePreference).toHaveLength(1);
});

test("Endless mode auto-loops one local variant at a time", async ({ page }) => {
  await resetApp(page);

  await page.getByRole("button", { name: "Endless off" }).click();
  await expect(page.getByRole("button", { name: "Endless on" })).toBeVisible();

  for (const count of [1, 2, 3, 4]) {
    await page.getByRole("button", { name: /Nice/ }).click();
    await expect.poll(() => reviewCount(page)).toBe(count);
  }

  await expect(page.locator("#swipeCard")).toBeVisible();
  await expect(page.locator("#emptyState")).toBeHidden();

  await expect.poll(() => itemCount(page)).toBe(5);
  let profile = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), storageKey);
  expect(profile.items).toHaveLength(5);
  expect(profile.items[0]).toMatchObject({
    loopSourceItemId: "site-landing-001",
    variant: "tagline"
  });
  expect(profile.items[0].agent.runId).toMatch(/^loop-/);

  await page.getByRole("button", { name: /Nice/ }).click();
  await expect.poll(() => reviewCount(page)).toBe(5);

  await expect.poll(() => itemCount(page)).toBe(6);
  profile = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), storageKey);
  expect(profile.items).toHaveLength(6);
  expect(profile.items[0].loopSourceItemId).toBe("logo-bakery-001");

  await page.getByRole("button", { name: "Export workspace" }).click();
  await expect(page.locator("#datasetStatus")).toHaveText("5 rows");

  const packet = await page.locator("#packetPreview").evaluate((node) => JSON.parse(node.textContent));
  expect(packet.request.runId).toMatch(/^loop-/);
  expect(packet.request.variant).toBe("tagline");
});

test("Install prompt is visible from the human review screen", async ({ page }) => {
  await resetApp(page);

  await expect(page.getByRole("button", { name: "Human review" })).toBeVisible();
  await expect(page.locator("#installButton")).toBeHidden();
  await page.evaluate(() => {
    const event = new Event("beforeinstallprompt", { cancelable: true });
    event.prompt = () => {
      window.__agentmashInstallPrompted = true;
      return Promise.resolve();
    };
    event.userChoice = Promise.resolve({ outcome: "accepted", platform: "web" });
    window.dispatchEvent(event);
  });
  await expect(page.locator("#installButton")).toBeVisible();
  await expect(page.locator("#importButton")).toBeHidden();
  await expect(page.locator("#exportButton")).toBeHidden();
  await expect(page.locator("#resetButton")).toBeHidden();

  await page.getByRole("button", { name: "Install" }).click();
  await expect.poll(() => page.evaluate(() => window.__agentmashInstallPrompted)).toBe(true);
  await expect(page.locator("#installButton")).toBeHidden();
});

test("Uploaded images are stored in IndexedDB instead of localStorage", async ({ page }) => {
  await resetApp(page);

  await addTinyImageArtifact(page, "Tiny upload smoke");

  const storedProfile = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), storageKey);
  const uploadedItem = storedProfile.items[0];
  expect(uploadedItem.title).toBe("Tiny upload smoke");
  expect(uploadedItem.imageKey).toMatch(/^image-/);
  expect(uploadedItem.imageData).toBe("");

  const storedImage = await storedImageForKey(page, uploadedItem.imageKey);

  expect(storedImage).toContain("data:image/png;base64,");
  await expect(page.locator("#imageStorageUsage")).toContainText("IndexedDB");
});

test("Changing a pending upload stores only the submitted image", async ({ page }) => {
  await resetApp(page);

  await page.getByRole("button", { name: "Add artifact" }).click();
  await page.locator("#artifactTitle").fill("Replacement upload smoke");
  await page.locator("#agentReturnMode").selectOption("dataset");
  await page.setInputFiles("#artifactImage", {
    name: "first.png",
    mimeType: "image/png",
    buffer: Buffer.from(tinyPngBase64, "base64")
  });
  await expect(page.locator("#imageStatus")).toContainText("first.png ready for local review");
  await expect.poll(async () => (await imageStoreKeys(page)).length).toBe(0);

  await page.setInputFiles("#artifactImage", {
    name: "second.png",
    mimeType: "image/png",
    buffer: Buffer.from(tinyPngBase64, "base64")
  });
  await expect(page.locator("#imageStatus")).toContainText("second.png ready for local review");
  await expect.poll(async () => (await imageStoreKeys(page)).length).toBe(0);

  await page.getByRole("button", { name: "Add to review deck" }).click();
  await expect.poll(async () => (await imageStoreKeys(page)).length).toBe(1);
  const [storedKey] = await imageStoreKeys(page);
  const storedProfile = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), storageKey);

  expect(storedProfile.items[0]).toMatchObject({
    title: "Replacement upload smoke",
    agent: expect.objectContaining({
      returnMode: "dataset"
    }),
    imageKey: storedKey,
    imageData: ""
  });

  await page.getByRole("button", { name: "Export workspace" }).click();
  const packet = await page.locator("#packetPreview").evaluate((node) => JSON.parse(node.textContent));
  expect(packet.expectedReturn.format).toBe("application/x-ndjson");
});

test("Profile export and import roundtrip restores uploaded images", async ({ page }) => {
  await resetApp(page);
  await addTinyImageArtifact(page, "Roundtrip upload smoke");

  await page.getByRole("button", { name: "Export workspace" }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#exportButton").click();
  const download = await downloadPromise;
  const exportedPath = await download.path();
  const exported = JSON.parse(await readFile(exportedPath, "utf8"));
  const exportedItem = exported.profile.items[0];
  expect(exportedItem.title).toBe("Roundtrip upload smoke");
  expect(exportedItem.imageKey).toMatch(/^image-/);
  expect(exportedItem.imageData).toContain("data:image/png;base64,");

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Reset profile" }).click();
  await expect(page.locator("#artifactTitleLabel")).toContainText("OpsPilot landing page");
  await expect.poll(() => storedImageForKey(page, exportedItem.imageKey)).toBe("");

  await page.setInputFiles("#importFile", {
    name: "agentmash-profile.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(exported))
  });

  await expect(page.locator("#artifactTitleLabel")).toContainText("Roundtrip upload smoke");
  const importedProfile = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), storageKey);
  const importedItem = importedProfile.items[0];
  expect(importedItem.imageKey).toBe(exportedItem.imageKey);
  expect(importedItem.imageData).toBe("");

  const restoredImage = await storedImageForKey(page, importedItem.imageKey);
  expect(restoredImage).toBe(exportedItem.imageData);
});

test("Service worker keeps the app shell available offline", async ({ page, context }) => {
  await resetApp(page);
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
    const cacheName = (await caches.keys()).find((key) => key.startsWith("agentmash-v"));
    const cache = await caches.open(cacheName);
    const cached = await cache.keys();
    return cached.map((request) => request.url);
  });

  await context.setOffline(true);
  await page.reload();
  await expect(page).toHaveTitle("AgentMash");
  await expect(page.getByRole("button", { name: "Human review" })).toBeVisible();
  await expect(page.locator("#swipeCard")).toBeVisible();
  await context.setOffline(false);
});

test("Stress profile handles 500 items, 250 reviews, and 100 more swipes", async ({ page }) => {
  test.setTimeout(60_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await seedStressProfile(page);

  await expect(page.locator("#stageProgress")).toHaveText("251 / 500");
  await expect(page.locator("#reviewedCount")).toHaveText("250");
  await expect(page.locator("#queueCount")).toHaveText("250");
  await expect(page.locator("#storageStatus")).toBeHidden();

  for (let index = 0; index < 100; index += 1) {
    await page.keyboard.press(index % 2 === 0 ? "ArrowRight" : "ArrowLeft");
    await expect.poll(() => reviewCount(page), { timeout: 1_500 }).toBe(251 + index);
    await expect(page.locator("#acceptButton")).toBeEnabled();
  }

  await expect.poll(() => reviewCount(page), { timeout: 10_000 }).toBe(350);
  await expect(page.locator("#storageStatus")).toBeHidden();
  await expect(page.locator("#reviewedCount")).toHaveText("350");
  await expect(page.locator("#queueCount")).toHaveText("150");

  const profile = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), storageKey);
  expect(profile.items).toHaveLength(500);
  expect(profile.reviews).toHaveLength(350);
  expect(new Set(profile.reviews.map((review) => review.itemId)).size).toBe(350);
  expect(profile.currentItemId).toBe("stress-item-350");

  await page.getByRole("button", { name: "Export workspace" }).click();
  await expect(page.locator("#datasetStatus")).toHaveText("350 rows");
  await expect(page.locator("#packetStatus")).toHaveText("Ready");
});
