import { expect, test } from "@playwright/test";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const storageKey = "agentmash.private-profile.v5";
const appUrl = process.env.AGENTMASH_E2E_URL || pathToFileURL(resolve("index.html")).href;

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
