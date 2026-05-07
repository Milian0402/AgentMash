import { expect, test } from "@playwright/test";
const storageKey = "agentmash.private-profile.v5";
const appUrl = process.env.AGENTMASH_E2E_URL || "http://127.0.0.1:5177/";

async function resetApp(page) {
  await page.goto(appUrl);
  await page.evaluate((key) => {
    localStorage.removeItem(key);
  }, storageKey);
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

test("Nice, Undo, and Nope produce a v2 feedback packet", async ({ page }) => {
  await resetApp(page);

  await expect(page).toHaveTitle("AgentMash");
  await expect(page.locator("#detailSheet")).toBeHidden();
  await page.getByRole("button", { name: "Details" }).click();
  await expect(page.locator("#detailSheet")).toBeVisible();
  await expect(page.locator("#detailSheet")).toContainText("OpsPilot landing page");
  await page.getByRole("button", { name: "Close" }).click();
  await expect(page.locator("#detailSheet")).toBeHidden();
  await expect(page.locator("#signalPanel")).toBeHidden();
  await page.getByRole("button", { name: "Refine" }).click();
  await expect(page.locator("#signalPanel")).toBeVisible();
  await page.getByLabel("Decision note").fill("Looks generic on first glance.");
  await page.getByRole("button", { name: /Nice/ }).click();
  await expect.poll(() => reviewCount(page)).toBe(1);
  await expect(page.locator("#signalPanel")).toBeHidden();

  await page.getByRole("button", { name: "Undo" }).click();
  await expect.poll(() => reviewCount(page)).toBe(0);

  await page.getByRole("button", { name: /Nope/ }).click();
  await expect.poll(() => reviewCount(page)).toBe(1);

  await page.getByRole("button", { name: "Export workspace" }).click();
  await expect(page.locator("#packetStatus")).toHaveText("Ready");

  const packet = await page.locator("#packetPreview").evaluate((node) => JSON.parse(node.textContent));

  expect(packet.schema).toBe("agentmash.feedback.v2");
  expect(packet.status).toBe("ready");
  expect(packet.signalStrengthFormula.name).toBe("score_extremity_plus_annotation");
  expect(packet.humanJudgement.verdict).toBe("pass");
  expect(packet.humanJudgement).toHaveProperty("signalStrength");
  expect(packet.humanJudgement).not.toHaveProperty("confidence");
  expect(packet.humanSignal).toHaveProperty("signalStrength");
  expect(packet.agentUse).toHaveProperty("signalStrength");
  expect(packet.evalRow.schema).toBe("agentmash.eval-row.v2");
  expect(packet.evalRow.humanSignal).toHaveProperty("signalStrength");
  expect(packet.evalRow.agentUse).toHaveProperty("signalStrength");
  expect(packet.return.deliveryStatus).toBe("local_ready");
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
    "thumbnail",
    "thumbnail",
    "first-line",
    "thumbnail"
  ]);

  await page.getByRole("button", { name: /Nope/ }).click();
  await expect.poll(() => reviewCount(page)).toBe(5);

  profile = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), storageKey);
  const reviewedItemIds = profile.reviews.map((review) => review.itemId);
  expect(new Set(reviewedItemIds).size).toBe(reviewedItemIds.length);

  await page.getByRole("button", { name: "Export workspace" }).click();
  await expect(page.locator("#datasetStatus")).toHaveText("5 rows");

  const packet = await page.locator("#packetPreview").evaluate((node) => JSON.parse(node.textContent));
  expect(packet.request.variant).toBe("thumbnail");
  expect(packet.evalRow.artifact.variant).toBe("thumbnail");
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
  expect(packet.humanJudgement.verdict).toBe("nice");
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
    variant: "thumbnail"
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
  expect(packet.request.variant).toBe("thumbnail");
});

test("Uploaded images are stored in IndexedDB instead of localStorage", async ({ page }) => {
  await resetApp(page);

  await page.getByRole("button", { name: "Add artifact" }).click();
  await page.locator("#artifactTitle").fill("Tiny upload smoke");
  await page.setInputFiles("#artifactImage", {
    name: "tiny.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
      "base64"
    )
  });
  await expect(page.locator("#imageStatus")).toContainText("ready for local review");
  await page.getByRole("button", { name: "Send to human review" }).click();

  const storedProfile = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), storageKey);
  const uploadedItem = storedProfile.items[0];
  expect(uploadedItem.title).toBe("Tiny upload smoke");
  expect(uploadedItem.imageKey).toMatch(/^image-/);
  expect(uploadedItem.imageData).toBe("");

  const storedImage = await page.evaluate(async (imageKey) => {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open("agentmash.image-store", 1);
      request.addEventListener("success", () => resolve(request.result));
      request.addEventListener("error", () => reject(request.error));
    });

    return new Promise((resolve, reject) => {
      const transaction = db.transaction("images", "readonly");
      const request = transaction.objectStore("images").get(imageKey);
      request.addEventListener("success", () => resolve(request.result?.data || ""));
      request.addEventListener("error", () => reject(request.error));
    });
  }, uploadedItem.imageKey);

  expect(storedImage).toContain("data:image/png;base64,");
});
