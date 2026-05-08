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
  await expect(page.locator("#imageStatus")).toHaveAttribute("role", "status");
  await expect(page.locator("#imageStatus")).toHaveAttribute("aria-live", "polite");
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
  await page.getByRole("button", { name: "Comment" }).click();
  await expect(page.locator("#signalPanel")).toBeVisible();
  await expect(page.locator("#commentButton")).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#reviewNote")).toBeFocused();
  await expect(page.locator("#tagRow")).toBeVisible();
  await expect(page.getByLabel("Quick reason")).toBeVisible();
  await page.locator("#commentReason").selectOption("Looks generic on first glance.");
  await expect(page.getByLabel("Decision note")).toHaveValue("Looks generic on first glance.");
  await expect(page.getByLabel("Decision note")).toBeVisible();
  await page.getByRole("button", { name: "Done" }).click();
  await expect(page.locator("#signalPanel")).toBeHidden();
  await page.getByRole("button", { name: "Comment" }).click();
  await expect(page.locator("#signalPanel")).toBeVisible();
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
  await expect(page.locator("#profileInsights")).toContainText("Websites are rejected 100% of the time across 1 decision.");

  await page.getByRole("button", { name: "Export workspace" }).click();
  await expect(page.locator("#packetStatus")).toHaveText("Ready");
  await expect(page.locator("#packetContractStatus")).toHaveText("v2 valid");
  await expect(page.locator("#datasetContractStatus")).toHaveText("Rows valid");

  const packet = await page.locator("#packetPreview").evaluate((node) => JSON.parse(node.textContent));

  expect(packet.schema).toBe("agentmash.feedback.v2");
  expect(packet.status).toBe("ready");
  expect(packet.request.submittedAt).toBe("2026-05-07T00:00:00.000Z");
  expect(packet.evalRow.artifact.submittedAt).toBe("2026-05-07T00:00:00.000Z");
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

test("Profile insights call out local preference patterns", async ({ page }) => {
  await resetApp(page);
  await page.evaluate((key) => {
    const profile = JSON.parse(localStorage.getItem(key));
    const createdAt = new Date().toISOString();
    profile.reviews = [
      {
        id: "insight-review-1",
        itemId: "site-landing-001",
        reviewer: "Pattern reviewer",
        filter: "all",
        verdict: "pass",
        scores: { gut: 3, sense: 4, craft: 4, useful: 3 },
        score: 36,
        grade: "Reject",
        recommendation: "Reject this output and retry.",
        tags: ["generic"],
        note: "",
        createdAt
      },
      {
        id: "insight-review-2",
        itemId: "logo-bakery-001",
        reviewer: "Pattern reviewer",
        filter: "all",
        verdict: "pass",
        scores: { gut: 4, sense: 4, craft: 5, useful: 3 },
        score: 42,
        grade: "Reject",
        recommendation: "Reject this output and retry.",
        tags: ["generic"],
        note: "",
        createdAt
      },
      {
        id: "insight-review-3",
        itemId: "copy-launch-001",
        reviewer: "Pattern reviewer",
        filter: "all",
        verdict: "nice",
        scores: { gut: 8, sense: 8, craft: 7, useful: 8 },
        score: 78,
        grade: "Promising",
        recommendation: "Keep iterating from this direction.",
        tags: ["clear"],
        note: "",
        createdAt
      }
    ];
    profile.currentItemId = "product-render-001";
    localStorage.setItem(key, JSON.stringify(profile));
  }, storageKey);
  await page.reload();

  await expect(page.locator("#profileInsights")).toContainText("You reject generic cues 100% of the time across 2 decisions.");
  await expect(page.locator("#profileInsights")).toContainText("Copy lines survive 100% of the time across 1 decision.");
  await expect(page.locator("#profileInsights")).toContainText("3 reviewed today, 3 total.");
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
  await expect(page.locator("#reviewModeTabs")).toHaveAttribute("role", "group");
  await expect(page.locator("#filterTabs")).toHaveAttribute("role", "group");
  await expect(page.locator('#filterTabs [data-filter="all"]')).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator('#filterTabs [data-filter="product"]')).toHaveAttribute("aria-pressed", "false");
  await page.locator("#acceptButton").focus();
  const decisionFocusRing = await page.locator("#acceptButton").evaluate((button) => {
    const style = getComputedStyle(button);
    return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth };
  });
  expect(decisionFocusRing).toEqual({ outlineStyle: "solid", outlineWidth: "3px" });

  const headerHasClearance = await page.evaluate(() => {
    const brand = document.querySelector(".brand-lockup").getBoundingClientRect();
    const switcher = document.querySelector("#dashboardSwitch").getBoundingClientRect();
    return brand.right <= switcher.left || brand.bottom <= switcher.top || switcher.bottom <= brand.top;
  });
  expect(headerHasClearance).toBe(true);
  await expect(page.locator("#humanPanel")).toBeHidden();
  await expect(page.locator(".site-footer")).toBeHidden();
  await page.getByRole("button", { name: "Deck" }).click();
  await expect(page.locator("#humanPanel")).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();
  await expect(page.locator("#humanPanel")).toBeHidden();

  await page.getByRole("button", { name: "Refine" }).click();
  await expect(page.locator("#signalPanel")).toBeVisible();
  const refineClearsActions = await page.evaluate(() => {
    const sheet = document.querySelector("#signalPanel").getBoundingClientRect();
    const actions = document.querySelector(".swipe-actions").getBoundingClientRect();
    return sheet.bottom <= actions.top - 4;
  });
  expect(refineClearsActions).toBe(true);
  await page.getByRole("button", { name: "Scores" }).click();
  const scoreSheetClearsActions = await page.evaluate(() => {
    const sheet = document.querySelector("#signalPanel").getBoundingClientRect();
    const actions = document.querySelector(".swipe-actions").getBoundingClientRect();
    return sheet.bottom <= actions.top - 4;
  });
  expect(scoreSheetClearsActions).toBe(true);
  await page.getByRole("button", { name: "Refine" }).click();
  await expect(page.locator("#signalPanel")).toBeHidden();

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

test("Short mobile review screen keeps preview labels clear", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await resetApp(page);

  await expect(page.locator("#swipeCard")).toBeVisible();
  await expect(page.locator(".first-look-stage .site-cta-row")).toBeHidden();

  const layout = await page.evaluate(() => {
    const type = document.querySelector("#artifactTypeLabel").getBoundingClientRect();
    const question = document.querySelector("#artifactQuestionLabel").getBoundingClientRect();
    const proofRows = [...document.querySelectorAll(".site-proof-row span")].map((row) => row.getBoundingClientRect());
    const actions = document.querySelector(".swipe-actions").getBoundingClientRect();
    const card = document.querySelector("#swipeCard").getBoundingClientRect();
    const separatedFrom = (target) => proofRows.every((row) => (
      row.bottom <= target.top - 4 ||
      row.top >= target.bottom + 4 ||
      row.right <= target.left - 4 ||
      row.left >= target.right + 4
    ));

    return {
      actionsBelowCard: actions.top >= card.bottom - 4,
      proofClearOfQuestion: separatedFrom(question),
      proofClearOfType: separatedFrom(type)
    };
  });

  expect(layout).toEqual({
    actionsBelowCard: true,
    proofClearOfQuestion: true,
    proofClearOfType: true
  });
});

test("Keyboard shortcuts support swipe and pairwise without hijacking text entry", async ({ page }) => {
  await resetApp(page);

  await page.getByRole("button", { name: "Refine" }).click();
  await page.getByLabel("Decision note").fill("Typing here should keep arrow keys in the note.");
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => reviewCount(page)).toBe(0);
  await expect(page.locator("#signalPanel")).toBeVisible();

  await page.getByRole("button", { name: "Refine" }).click();
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => reviewCount(page)).toBe(1);
  await expect(page.locator("#stageProgress")).toHaveText("2 / 4");

  await page.keyboard.press("Control+Z");
  await expect.poll(() => reviewCount(page)).toBe(0);
  await expect(page.locator("#stageProgress")).toHaveText("1 / 4");

  await page.keyboard.press("ArrowLeft");
  await expect.poll(() => reviewCount(page)).toBe(1);
  await expect(page.locator("#acceptButton")).toBeEnabled();
  let profile = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), storageKey);
  expect(profile.reviews[0].verdict).toBe("pass");

  await page.locator('#reviewModeTabs [data-review-mode="pairwise"]').click();
  await expect(page.locator("#pairwiseStage")).toBeVisible();
  await page.keyboard.press("ArrowRight");

  await expect.poll(async () => {
    const nextProfile = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), storageKey);
    return nextProfile.pairwiseComparisons.length;
  }).toBe(1);
  profile = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), storageKey);
  expect(profile.reviews).toHaveLength(1);
  expect(profile.pairwiseComparisons[0]).toMatchObject({
    winnerItemId: "logo-bakery-001",
    loserItemId: "site-landing-001"
  });

  await page.keyboard.press("Control+Z");
  profile = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), storageKey);
  expect(profile.reviews).toHaveLength(1);
  expect(profile.pairwiseComparisons).toHaveLength(0);
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
  await expect(page.locator("#datasetContractStatus")).toHaveText("No rows");
  await expect(page.locator("#packetStatus")).toHaveText("Empty");
  await expect(page.locator("#packetContractStatus")).toHaveText("v2 valid");

  const packet = await page.locator("#packetPreview").evaluate((node) => JSON.parse(node.textContent));
  expect(packet).toMatchObject({
    schema: "agentmash.feedback.v2",
    status: "empty",
    message: "No active artifact."
  });
});

test("Legacy imported reviews without grade or recommendation still load", async ({ page }) => {
  await page.goto(appUrl);
  await page.evaluate((key) => {
    const installedAt = "2026-05-07T00:00:00.000Z";
    localStorage.setItem(
      key,
      JSON.stringify({
        version: 5,
        reviewer: "Legacy reviewer",
        filter: "all",
        dashboard: "human",
        reviewMode: "swipe",
        endlessMode: false,
        loopCursor: 0,
        pairwise: { leftItemId: null, rightItemId: null },
        items: [
          {
            id: "legacy-import-item",
            type: "logo",
            title: "Legacy import mark",
            prompt: "Legacy profile import smoke.",
            body: "A compact local-first mark.",
            question: "Is this logo nice?",
            agent: {
              requesterType: "agent",
              requesterName: "legacy-agent",
              runId: "legacy-run-001",
              goal: "Confirm partial review import works.",
              returnMode: "json",
              returnTarget: "local",
              submittedAt: installedAt
            },
            variant: "original",
            loopSourceItemId: "",
            imageKey: "",
            imageData: "",
            createdAt: installedAt
          }
        ],
        reviews: [
          {
            id: "legacy-review-001",
            itemId: "legacy-import-item",
            reviewer: "Legacy reviewer",
            verdict: "nice",
            scores: { gut: 9, sense: 8, craft: 8, useful: 8 },
            score: 84,
            tags: ["clear"],
            note: "",
            createdAt: installedAt
          }
        ],
        pairwiseComparisons: [],
        currentItemId: "legacy-import-item",
        activeTags: [],
        draftScores: { gut: 6, sense: 6, craft: 6, useful: 6 },
        lastPacketItemId: "legacy-import-item",
        installedAt
      })
    );
  }, storageKey);
  await page.reload();

  await expect(page.locator("#reviewedCount")).toHaveText("1");
  await expect(page.locator("#queueCount")).toHaveText("0");
  await page.getByRole("button", { name: "Export workspace" }).click();
  await expect(page.locator("#packetStatus")).toHaveText("Ready");
  await expect(page.locator("#packetContractStatus")).toHaveText("v2 valid");
  const packet = await page.locator("#packetPreview").evaluate((node) => JSON.parse(node.textContent));
  expect(packet.humanJudgement.grade).toBe("Keeper");
  expect(packet.interpretation.recommendation).toBe("Use as a keeper, add it to the agent's positive examples, and preserve the prompt pattern.");
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
  await expect(page.locator("#emptyState")).toHaveClass(/has-keepers/);
  await expect(page.locator("#emptyTitle")).toHaveText("1 survived");
  await expect(page.locator("#keeperList")).toContainText("OpsPilot landing page");
  await expect(page.locator("#keeperList")).toContainText("Keeper");
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
  await page.setViewportSize({ width: 390, height: 844 });
  await resetApp(page);

  await page.getByRole("button", { name: "Deck" }).click();
  await page.getByRole("button", { name: "Pairwise" }).click();
  await expect(page.locator("#humanPanel")).toBeHidden();
  await expect(page.locator("#pairwiseStage")).toBeVisible();
  const pairwiseStageIsInView = await page.locator("#pairwiseStage").evaluate((stage) => {
    const rect = stage.getBoundingClientRect();
    return rect.top >= 0 && rect.top < window.innerHeight * 0.45;
  });
  expect(pairwiseStageIsInView).toBe(true);
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
  await page.getByRole("button", { name: "Deck" }).click();
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
  expect(packet.request.submittedAt).toEqual(expect.any(String));
  expect(packet.request.image).toMatchObject({
    imageKey: storedKey,
    hasImage: true,
    included: true,
    mediaType: "image/png"
  });
  expect(packet.request.image.dataUrl).toContain("data:image/png;base64,");
});

test("Agent drop import validates payloads and creates backend-ready review packets", async ({ page }) => {
  await resetApp(page);
  await page.getByRole("button", { name: "Add artifact" }).click();
  await expect(page.locator("#agentDropStatus")).toHaveAttribute("role", "status");
  await expect(page.locator("#agentDropStatus")).toHaveAttribute("aria-live", "polite");

  await page.setInputFiles("#agentDropFile", {
    name: "bad-agent-drop.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({
      schema: "agentmash.intake.v1",
      artifacts: [{ type: "video" }]
    }))
  });
  await expect(page.locator("#agentDropStatus")).toContainText("Agent drop rejected:");
  await expect(page.locator("#agentDropStatus")).toContainText("artifacts[0].type");
  await expect.poll(() => itemCount(page)).toBe(4);

  const dropPayload = {
    schema: "agentmash.intake.v1",
    source: {
      requesterType: "agent",
      requesterName: "future-intake-agent",
      runId: "drop-run-001",
      goal: "Check whether a generated product shot earns trust before a launch build.",
      returnMode: "dataset",
      returnTarget: "future-api-preview"
    },
    reviewContext: {
      focus: "trust",
      audience: "buyers",
      stage: "prelaunch",
      priority: "high",
      notes: "Payload-level context should survive normalization."
    },
    artifacts: [
      {
        id: "agent-drop-product-001",
        type: "product",
        title: "Agent drop bottle render",
        prompt: "Generated hero product render for a wellness drink.",
        body: "A matte green bottle on a clean surface with a short benefit line.",
        question: "Does this earn trust at first glance?",
        imageData: `data:image/png;base64,${tinyPngBase64}`,
        reviewContext: {
          focus: "visual_quality",
          notes: "Check product credibility at thumbnail size."
        }
      }
    ]
  };

  await page.setInputFiles("#agentDropFile", {
    name: "agent-drop.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(dropPayload))
  });

  await expect(page.locator("#agentDropStatus")).toContainText("Imported 1 artifacts from agent drop.");
  await expect(page.locator("#artifactTitleLabel")).toContainText("Agent drop bottle render");

  const storedProfile = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), storageKey);
  const importedItem = storedProfile.items[0];
  expect(importedItem).toMatchObject({
    id: "agent-drop-product-001",
    type: "product",
    title: "Agent drop bottle render",
    imageData: "",
    agent: {
      requesterType: "agent",
      requesterName: "future-intake-agent",
      runId: "drop-run-001",
      returnMode: "dataset",
      returnTarget: "future-api-preview"
    },
    reviewContext: {
      focus: "visual_quality",
      audience: "buyers",
      stage: "prelaunch",
      priority: "high",
      notes: "Check product credibility at thumbnail size."
    }
  });
  expect(importedItem.imageKey).toMatch(/^image-/);
  await expect.poll(() => storedImageForKey(page, importedItem.imageKey)).toContain("data:image/png;base64,");

  await page.getByRole("button", { name: /Nice/ }).click();
  await expect.poll(() => reviewCount(page)).toBe(1);
  await page.getByRole("button", { name: "Export workspace" }).click();
  await expect(page.locator("#packetStatus")).toHaveText("Ready");
  await expect(page.locator("#packetContractStatus")).toHaveText("v2 valid");
  await expect(page.locator("#datasetContractStatus")).toHaveText("Rows valid");

  const packet = await page.locator("#packetPreview").evaluate((node) => JSON.parse(node.textContent));
  expect(packet.schema).toBe("agentmash.feedback.v2");
  expect(packet.request.reviewContext).toEqual(importedItem.reviewContext);
  expect(packet.evalRow.artifact.reviewContext).toEqual(importedItem.reviewContext);
  expect(packet.agentUse.reviewContext).toEqual(importedItem.reviewContext);
  expect(packet.return.format).toBe("application/x-ndjson");
  expect(packet.request.image.dataUrl).toContain("data:image/png;base64,");
  expect(packet.evalRow.artifact.image.dataUrl).toContain("data:image/png;base64,");

  const [row] = await page.locator("#datasetPreview").evaluate((node) => node.textContent.trim().split("\n").map(JSON.parse));
  expect(row.artifact.reviewContext).toEqual(importedItem.reviewContext);
  expect(row.agentUse.reviewContext).toEqual(importedItem.reviewContext);
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
  await expect(page.locator("#datasetContractStatus")).toHaveText("Rows valid");
  await expect(page.locator("#packetStatus")).toHaveText("Ready");
  await expect(page.locator("#packetContractStatus")).toHaveText("v2 valid");
});
