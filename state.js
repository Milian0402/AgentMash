export const APP_VERSION = 5;
export const STORAGE_KEY = "agentmash.private-profile.v5";
export const OLD_STORAGE_KEY = "nice-or-not.private-profile.v1";
export const IMAGE_DB_NAME = "agentmash.image-store";
export const IMAGE_DB_VERSION = 1;
export const IMAGE_STORE_NAME = "images";
export const LOCAL_STORAGE_FULL_MESSAGE = "Local storage full. Export your profile, remove large artifacts, or clear browser storage before adding more.";
export const PREVIOUS_STORAGE_KEYS = [
  "nice-or-not.private-profile.v4",
  "nice-or-not.private-profile.v3",
  "nice-or-not.private-profile.v2",
  OLD_STORAGE_KEY
];

export const artifactTypes = ["website", "logo", "copy", "product"];
export const artifactVariants = ["original", "thumbnail", "first-line", "tagline", "mark-only", "cutout"];
export const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
export const MAX_IMAGE_BYTES = 2_500_000;
export const LOCAL_STORAGE_APPROX_LIMIT = 5 * 1024 * 1024;
export const quickTags = [
  "clear",
  "coherent",
  "fresh",
  "trustworthy",
  "generic",
  "uncanny",
  "confusing",
  "off-brand"
];

export const scoreDimensions = [
  {
    key: "gut",
    label: "First gut call",
    weight: 0.35,
    low: "No",
    high: "Yes"
  },
  {
    key: "sense",
    label: "Instant sense",
    weight: 0.25,
    low: "Huh",
    high: "Obvious"
  },
  {
    key: "craft",
    label: "Looks made well",
    weight: 0.22,
    low: "Cheap",
    high: "Polished"
  },
  {
    key: "useful",
    label: "Worth another look",
    weight: 0.18,
    low: "Skip",
    high: "Inspect"
  }
];

export const typeRubrics = {
  website: [
    "Can a lazy viewer tell what it is within two seconds?",
    "Does it feel trustworthy before reading details?",
    "Does the visual hierarchy pull the eye to the right place?",
    "Would you keep looking without being paid to?"
  ],
  logo: [
    "Does the mark create an immediate association?",
    "Does it look intentional before you analyze it?",
    "Would it survive a tiny glance in a tab, feed, or app icon?",
    "Does anything feel off instantly?"
  ],
  copy: [
    "Does the first line sound human on first read?",
    "Do you understand the point without rereading?",
    "Does it avoid obvious AI texture?",
    "Would you continue or bounce?"
  ],
  product: [
    "Does it look physically plausible immediately?",
    "Do materials and shadows avoid breaking trust?",
    "Does it make the product desirable at a glance?",
    "Would a buyer pause or scroll past?"
  ]
};

export const sampleItems = [
  {
    id: "site-landing-001",
    type: "website",
    title: "OpsPilot landing page",
    prompt: "Website screenshot candidate for an AI operations tool. Judge whether the promise feels useful, premium, and clear.",
    body: "Resolve messy approvals before work stalls.",
    question: "Is this website nice?",
    agent: {
      requesterType: "agent",
      requesterName: "site-agent",
      runId: "launch-site-001",
      goal: "Learn whether a generated landing page earns human trust quickly.",
      returnMode: "json",
      returnTarget: "ops-site-feedback"
    },
    createdAt: "2026-05-07T00:00:00.000Z"
  },
  {
    id: "logo-bakery-001",
    type: "logo",
    title: "Northstar Pantry mark",
    prompt: "Generated brand mark for a pantry delivery service that needs to feel useful, warm, and recognizable in a tiny app icon.",
    body: "A folded route marker with a shelf silhouette.",
    question: "Does this logo make sense?",
    agent: {
      requesterType: "lab",
      requesterName: "brand-eval-lab",
      runId: "launch-logo-001",
      goal: "Test whether logo candidates make semantic and visual sense.",
      returnMode: "json",
      returnTarget: "pantry-logo-feedback"
    },
    createdAt: "2026-05-07T00:00:00.000Z"
  },
  {
    id: "copy-launch-001",
    type: "copy",
    title: "Notes app launch post",
    prompt: "Generated launch copy for an AI notes app. Check whether it sounds believable, specific, and worth another glance.",
    body: "Stop reopening five tabs to remember what you meant. Drop the note, ask the thread, and get back the draft you were circling.",
    question: "Is this copy nice?",
    agent: {
      requesterType: "agent",
      requesterName: "copy-agent",
      runId: "launch-copy-001",
      goal: "Compare generated copy against human specificity and believability.",
      returnMode: "json",
      returnTarget: "notes-copy-feedback"
    },
    createdAt: "2026-05-07T00:00:00.000Z"
  },
  {
    id: "product-render-001",
    type: "product",
    title: "Counter tray render",
    prompt: "Generated product image for a modular kitchen tray. Decide whether the object looks plausible and desirable enough to test.",
    body: "Matte counter tray with removable dividers, rounded corners, and a translucent lid.",
    question: "Does this product image make sense?",
    agent: {
      requesterType: "lab",
      requesterName: "product-image-lab",
      runId: "launch-product-001",
      goal: "Catch visual trust breaks before product image candidates are reused.",
      returnMode: "json",
      returnTarget: "tray-render-feedback"
    },
    createdAt: "2026-05-07T00:00:00.000Z"
  }
];

export const defaultScores = {
  gut: 6,
  sense: 6,
  craft: 6,
  useful: 6
};

export const defaultState = {
  version: APP_VERSION,
  reviewer: "Private reviewer",
  filter: "all",
  dashboard: "human",
  reviewMode: "swipe",
  endlessMode: false,
  loopCursor: 0,
  pairwise: {
    leftItemId: null,
    rightItemId: null
  },
  items: sampleItems,
  reviews: [],
  pairwiseComparisons: [],
  currentItemId: sampleItems[0].id,
  activeTags: [],
  draftScores: defaultScores,
  lastPacketItemId: null,
  installedAt: new Date().toISOString()
};

let imageDbPromise = null;
let storageStatusHandler = () => {};

export let state = loadState();

export function configureStorageStatus(handler) {
  storageStatusHandler = typeof handler === "function" ? handler : () => {};
}

export function replaceState(nextState) {
  state = nextState;
}

export function loadState() {
  let stored = "";
  try {
    stored = [STORAGE_KEY, ...PREVIOUS_STORAGE_KEYS]
      .map((key) => window.localStorage.getItem(key))
      .find(Boolean);
  } catch {
    stored = "";
  }

  if (!stored) {
    return cloneDefaultState();
  }

  try {
    return normalizeState(JSON.parse(stored));
  } catch {
    return cloneDefaultState();
  }
}

export function normalizeState(candidate) {
  const candidateItems = Array.isArray(candidate.items)
    ? candidate.items.map(normalizeItem)
    : sampleItems;
  const useLaunchSamples = shouldReplaceLegacySamples(candidate, candidateItems);
  const items = useLaunchSamples ? sampleItems : candidateItems;
  const itemIds = new Set(items.map((item) => item.id));
  const reviews = useLaunchSamples
    ? []
    : (
        Array.isArray(candidate.reviews)
          ? candidate.reviews.filter((review) => itemIds.has(review.itemId)).map(normalizeReview)
          : []
      );
  const pairwiseComparisons = useLaunchSamples
    ? []
    : normalizeComparisons(candidate.pairwiseComparisons || candidate.comparisons, itemIds);
  const filter = ["all", ...artifactTypes].includes(candidate.filter) ? candidate.filter : "all";
  const currentItemId = itemIds.has(candidate.currentItemId) ? candidate.currentItemId : items[0]?.id || null;

  return {
    version: APP_VERSION,
    reviewer: cleanText(candidate.reviewer) || defaultState.reviewer,
    filter,
    dashboard: ["human", "agent"].includes(candidate.dashboard) ? candidate.dashboard : "human",
    reviewMode: normalizeReviewMode(candidate.reviewMode),
    endlessMode: Boolean(candidate.endlessMode),
    loopCursor: Number.isFinite(Number(candidate.loopCursor)) ? Math.max(0, Math.floor(Number(candidate.loopCursor))) : 0,
    pairwise: normalizePairwise(candidate.pairwise, itemIds),
    items,
    reviews,
    pairwiseComparisons,
    currentItemId,
    activeTags: normalizeTags(candidate.activeTags),
    draftScores: normalizeScores(candidate.draftScores || { sense: candidate.senseScore }),
    lastPacketItemId: cleanText(candidate.lastPacketItemId),
    installedAt: cleanText(candidate.installedAt) || new Date().toISOString()
  };
}

export function shouldReplaceLegacySamples(candidate, items) {
  const legacySampleIds = ["site-landing-001", "logo-bakery-001", "copy-launch-001", "product-render-001"];
  const hasOnlyLegacySamples = items.length === legacySampleIds.length
    && legacySampleIds.every((id) => items.some((item) => item.id === id && !item.imageData));
  const hasReviews = Array.isArray(candidate.reviews) && candidate.reviews.length > 0;
  return Number(candidate.version) < APP_VERSION && hasOnlyLegacySamples && !hasReviews;
}

export function normalizeItem(item) {
  const type = artifactTypes.includes(item.type) ? item.type : "website";
  const imageData = safeImageData(item.imageData);
  return {
    id: cleanText(item.id) || createId(),
    type,
    title: cleanText(item.title) || "Untitled artifact",
    prompt: cleanText(item.prompt),
    body: cleanText(item.body || item.copy || item.description),
    question: cleanText(item.question) || defaultQuestion(type),
    agent: normalizeAgent(item.agent),
    variant: normalizeVariant(item.variant),
    loopSourceItemId: cleanText(item.loopSourceItemId),
    imageKey: cleanText(item.imageKey) || (imageData ? createShortId("image") : ""),
    imageData,
    createdAt: cleanText(item.createdAt) || new Date().toISOString()
  };
}

export function safeImageData(value) {
  if (typeof value !== "string") {
    return "";
  }
  return ALLOWED_IMAGE_TYPES.some((type) => value.startsWith(`data:${type};base64,`)) ? value : "";
}

export function normalizeReview(review) {
  const scores = normalizeScores(review.scores || { sense: review.senseScore });
  const verdict = review.verdict === "nice" ? "nice" : "pass";
  const score = Number.isFinite(Number(review.score)) ? Number(review.score) : calculateScore(scores);

  return {
    id: cleanText(review.id) || createId(),
    itemId: cleanText(review.itemId),
    reviewer: cleanText(review.reviewer) || defaultState.reviewer,
    verdict,
    scores,
    score,
    grade: cleanText(review.grade) || gradeFor(score, verdict),
    recommendation: cleanText(review.recommendation) || recommendationFor({ verdict, score, grade }),
    tags: normalizeTags(review.tags),
    note: cleanText(review.note),
    createdAt: cleanText(review.createdAt) || new Date().toISOString()
  };
}

export function normalizeAgent(agent = {}) {
  const requesterType = ["agent", "lab", "team"].includes(agent.requesterType)
    ? agent.requesterType
    : "agent";
  return {
    requesterType,
    requesterName: cleanText(agent.requesterName || agent.name) || "unnamed-agent",
    runId: cleanText(agent.runId || agent.jobId) || createShortId("run"),
    goal: cleanText(agent.goal),
    returnMode: ["json", "dataset"].includes(agent.returnMode)
      ? agent.returnMode
      : "json",
    returnTarget: cleanText(agent.returnTarget),
    submittedAt: cleanText(agent.submittedAt) || new Date().toISOString()
  };
}

export function normalizeScores(candidate = {}) {
  return scoreDimensions.reduce((scores, dimension) => {
    const value = Number(candidate[dimension.key]);
    scores[dimension.key] = Number.isFinite(value)
      ? Math.max(0, Math.min(10, Math.round(value)))
      : defaultScores[dimension.key];
    return scores;
  }, {});
}

export function normalizeTags(tags) {
  return Array.isArray(tags) ? tags.filter((tag) => quickTags.includes(tag)) : [];
}

export function normalizeVariant(variant) {
  return artifactVariants.includes(variant) ? variant : "original";
}

export function normalizeReviewMode(mode) {
  return mode === "pairwise" ? "pairwise" : "swipe";
}

export function normalizePairwise(pairwise = {}, itemIds = new Set()) {
  const leftItemId = cleanText(pairwise.leftItemId);
  const rightItemId = cleanText(pairwise.rightItemId);
  return {
    leftItemId: itemIds.has(leftItemId) ? leftItemId : null,
    rightItemId: itemIds.has(rightItemId) && rightItemId !== leftItemId ? rightItemId : null
  };
}

export function normalizeComparisons(comparisons, itemIds) {
  if (!Array.isArray(comparisons)) {
    return [];
  }
  return comparisons
    .map((comparison) => normalizeComparison(comparison, itemIds))
    .filter(Boolean);
}

export function normalizeComparison(comparison, itemIds) {
  const leftItemId = cleanText(comparison.leftItemId);
  const rightItemId = cleanText(comparison.rightItemId);
  const winnerItemId = cleanText(comparison.winnerItemId);
  const loserItemId = cleanText(comparison.loserItemId);
  const validPair = itemIds.has(leftItemId) && itemIds.has(rightItemId) && leftItemId !== rightItemId;
  const validChoice = [leftItemId, rightItemId].includes(winnerItemId)
    && [leftItemId, rightItemId].includes(loserItemId)
    && winnerItemId !== loserItemId;

  if (!validPair || !validChoice) {
    return null;
  }

  return {
    id: cleanText(comparison.id) || createId(),
    leftItemId,
    rightItemId,
    winnerItemId,
    loserItemId,
    reviewer: cleanText(comparison.reviewer) || defaultState.reviewer,
    scoreDelta: 1,
    reasonTags: normalizeTags(comparison.reasonTags),
    note: cleanText(comparison.note),
    createdAt: cleanText(comparison.createdAt) || new Date().toISOString()
  };
}

export function saveState() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stateForLocalStorage()));
    storageStatusHandler("");
    return true;
  } catch {
    storageStatusHandler(LOCAL_STORAGE_FULL_MESSAGE);
    return false;
  }
}

export function stateForLocalStorage() {
  return {
    ...state,
    items: state.items.map((item) => ({
      ...item,
      imageData: ""
    }))
  };
}

export function localStorageProfileBytes() {
  return new Blob([JSON.stringify(stateForLocalStorage())]).size;
}

export function openImageDb() {
  if (!("indexedDB" in window)) {
    return Promise.reject(new Error("IndexedDB unavailable"));
  }

  if (imageDbPromise) {
    return imageDbPromise;
  }

  imageDbPromise = new Promise((resolve, reject) => {
    const request = window.indexedDB.open(IMAGE_DB_NAME, IMAGE_DB_VERSION);

    request.addEventListener("upgradeneeded", () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IMAGE_STORE_NAME)) {
        db.createObjectStore(IMAGE_STORE_NAME, { keyPath: "key" });
      }
    });

    request.addEventListener("success", () => resolve(request.result));
    request.addEventListener("error", () => reject(request.error || new Error("Image store failed to open")));
  });

  return imageDbPromise;
}

export async function writeImageData(key, data) {
  const db = await openImageDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(IMAGE_STORE_NAME, "readwrite");
    transaction.addEventListener("complete", resolve);
    transaction.addEventListener("error", () => reject(transaction.error || new Error("Image store write failed")));
    transaction.addEventListener("abort", () => reject(transaction.error || new Error("Image store write aborted")));

    transaction.objectStore(IMAGE_STORE_NAME).put({
      key,
      data,
      updatedAt: new Date().toISOString()
    });
  });
}

export async function readImageData(key) {
  const db = await openImageDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(IMAGE_STORE_NAME, "readonly");
    const request = transaction.objectStore(IMAGE_STORE_NAME).get(key);

    request.addEventListener("success", () => resolve(safeImageData(request.result?.data)));
    request.addEventListener("error", () => reject(request.error || new Error("Image store read failed")));
    transaction.addEventListener("abort", () => reject(transaction.error || new Error("Image store read aborted")));
  });
}

export async function estimateImageStoreBytes() {
  const db = await openImageDb();
  return new Promise((resolve, reject) => {
    let totalBytes = 0;
    const transaction = db.transaction(IMAGE_STORE_NAME, "readonly");
    const request = transaction.objectStore(IMAGE_STORE_NAME).openCursor();

    request.addEventListener("success", () => {
      const cursor = request.result;
      if (!cursor) {
        return;
      }
      totalBytes += new Blob([safeImageData(cursor.value?.data)]).size;
      cursor.continue();
    });
    request.addEventListener("error", () => reject(request.error || new Error("Image store estimate failed")));
    transaction.addEventListener("complete", () => resolve(totalBytes));
    transaction.addEventListener("abort", () => reject(transaction.error || new Error("Image store estimate aborted")));
  });
}

export async function clearImageStore() {
  const db = await openImageDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(IMAGE_STORE_NAME, "readwrite");
    transaction.addEventListener("complete", resolve);
    transaction.addEventListener("error", () => reject(transaction.error || new Error("Image store clear failed")));
    transaction.addEventListener("abort", () => reject(transaction.error || new Error("Image store clear aborted")));
    transaction.objectStore(IMAGE_STORE_NAME).clear();
  });
}

export async function persistInlineImages() {
  let movedImages = false;

  for (const item of state.items) {
    if (!item.imageData) {
      continue;
    }
    item.imageKey = item.imageKey || createShortId("image");
    await writeImageData(item.imageKey, item.imageData);
    movedImages = true;
  }

  return movedImages;
}

export async function hydrateStateImages() {
  await Promise.all(
    state.items.map(async (item) => {
      if (!item.imageKey || item.imageData) {
        return;
      }
      item.imageData = await readImageData(item.imageKey);
    })
  );
}

export function filteredItems() {
  return state.items.filter((item) => state.filter === "all" || item.type === state.filter);
}

export function reviewedItemIds() {
  return new Set(state.reviews.map((review) => review.itemId));
}

export function pendingItems() {
  const reviewed = reviewedItemIds();
  return filteredItems().filter((item) => !reviewed.has(item.id));
}

export function getActiveItem() {
  const pending = pendingItems();
  if (!pending.length) {
    return null;
  }
  return pending.find((item) => item.id === state.currentItemId) || pending[0];
}

export function setCurrentToNext() {
  const pending = pendingItems();
  state.currentItemId = pending.length ? pending[0].id : null;
}

export function loopSourceItems() {
  const sources = filteredItems().filter((item) => !item.loopSourceItemId);
  return sources.length ? sources : filteredItems();
}

export function ensureEndlessItem() {
  if (!state.endlessMode || pendingItems().length) {
    return null;
  }

  const sources = loopSourceItems();
  if (!sources.length) {
    return null;
  }

  const source = sources[state.loopCursor % sources.length];
  const createdAt = new Date().toISOString();
  const item = {
    ...source,
    id: createId(),
    variant: variantForRemix(source),
    loopSourceItemId: source.loopSourceItemId || source.id,
    agent: {
      ...source.agent,
      runId: createShortId("loop"),
      submittedAt: createdAt
    },
    createdAt
  };

  state.items = [item, ...state.items];
  state.currentItemId = item.id;
  state.loopCursor = (state.loopCursor + 1) % sources.length;
  return item;
}

export function getPairwiseItems() {
  const items = filteredItems();
  if (items.length < 2) {
    return null;
  }

  const left = items.find((item) => item.id === state.pairwise.leftItemId);
  const right = items.find((item) => item.id === state.pairwise.rightItemId);
  if (left && right && left.id !== right.id) {
    return { left, right, total: items.length };
  }

  return { left: items[0], right: items[1], total: items.length };
}

export function setNextPairwise(currentPair = null) {
  const items = filteredItems();
  if (items.length < 2) {
    state.pairwise = { leftItemId: null, rightItemId: null };
    return;
  }

  const anchorId = currentPair?.right.id || state.pairwise.rightItemId || items[0].id;
  const leftIndex = Math.max(0, items.findIndex((item) => item.id === anchorId));
  const rightIndex = (leftIndex + 1) % items.length;
  state.pairwise = {
    leftItemId: items[leftIndex].id,
    rightItemId: items[rightIndex].id
  };
}

export function variantForRemix(item) {
  if (normalizeVariant(item.variant) !== "original") {
    return "original";
  }
  const variantsByType = {
    website: "tagline",
    logo: "mark-only",
    copy: "first-line",
    product: "cutout"
  };
  return variantsByType[item.type] || "thumbnail";
}

export function recommendationFor(review) {
  if (review.verdict === "nice" && review.score >= 78) {
    return "Use as a keeper, add it to the agent's positive examples, and preserve the prompt pattern.";
  }
  if (review.verdict === "nice") {
    return "Keep iterating from this direction, but ask the agent for one more sharper variant.";
  }
  if (review.score >= 68) {
    return "Do not ship yet, but mine this for useful traits and ask for a constrained retry.";
  }
  if (review.score >= 45) {
    return "Send back a repair task focused on the weakest rubric dimensions.";
  }
  return "Reject this output and steer the agent toward a different concept.";
}

export function calculateScore(scores) {
  const weighted = scoreDimensions.reduce((sum, dimension) => {
    return sum + scores[dimension.key] * dimension.weight;
  }, 0);
  return Math.round(weighted * 10);
}

export function gradeFor(score, verdict) {
  if (verdict === "nice" && score >= 78) {
    return "Keeper";
  }
  if (verdict === "nice" && score >= 60) {
    return "Promising";
  }
  if (score >= 68) {
    return "Interesting";
  }
  if (score >= 45) {
    return "Needs work";
  }
  return "Reject";
}

export function defaultScoresForNext(verdict, scores) {
  if (verdict === "nice") {
    return normalizeScores({
      gut: Math.max(6, scores.gut),
      sense: Math.max(6, scores.sense),
      craft: Math.max(6, scores.craft),
      useful: Math.max(6, scores.useful)
    });
  }
  return { ...defaultScores };
}

export function defaultQuestion(type) {
  const questions = {
    website: "Is this website nice?",
    logo: "Does this logo make sense?",
    copy: "Is this copy nice?",
    product: "Does this product image make sense?"
  };
  return questions[type] || "Is this nice?";
}

export function typeLabel(type) {
  const labels = {
    website: "Website",
    logo: "Logo",
    copy: "Copy",
    product: "Product image"
  };
  return labels[type] || "Artifact";
}

export function agentLine(agent) {
  return `${agent.requesterName} / ${agent.runId}`;
}

export function shortTitle(value, maxLength) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;
}

export function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function roundTo(value, places) {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createShortId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 7)}`;
}

export function cloneDefaultState() {
  return JSON.parse(JSON.stringify(defaultState));
}
