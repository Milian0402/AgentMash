const APP_VERSION = 5;
const STORAGE_KEY = "agentmash.private-profile.v5";
const OLD_STORAGE_KEY = "nice-or-not.private-profile.v1";
const IMAGE_DB_NAME = "agentmash.image-store";
const IMAGE_DB_VERSION = 1;
const IMAGE_STORE_NAME = "images";
const LOCAL_STORAGE_FULL_MESSAGE = "Local storage full. Export your profile, remove large artifacts, or clear browser storage before adding more.";
const PREVIOUS_STORAGE_KEYS = [
  "nice-or-not.private-profile.v4",
  "nice-or-not.private-profile.v3",
  "nice-or-not.private-profile.v2",
  OLD_STORAGE_KEY
];

const artifactTypes = ["website", "logo", "copy", "product"];
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_IMAGE_BYTES = 2_500_000;
const quickTags = [
  "clear",
  "coherent",
  "fresh",
  "trustworthy",
  "generic",
  "uncanny",
  "confusing",
  "off-brand"
];

const scoreDimensions = [
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

const typeRubrics = {
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

const sampleItems = [
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
      returnTarget: "local-demo/ops-site-feedback"
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
      returnTarget: "local-demo/pantry-logo-feedback"
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
      returnTarget: "local-demo/notes-copy-feedback"
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
      returnTarget: "local-demo/tray-render-feedback"
    },
    createdAt: "2026-05-07T00:00:00.000Z"
  }
];

const defaultScores = {
  gut: 6,
  sense: 6,
  craft: 6,
  useful: 6
};

const defaultState = {
  version: APP_VERSION,
  reviewer: "Private reviewer",
  filter: "all",
  dashboard: "human",
  items: sampleItems,
  reviews: [],
  currentItemId: sampleItems[0].id,
  activeTags: [],
  draftScores: defaultScores,
  lastPacketItemId: null,
  installedAt: new Date().toISOString()
};

let state = loadState();
let dragState = null;
let pendingImageData = "";
let pendingImageKey = "";
let deferredInstallPrompt = null;
let imageDbPromise = null;
let reviewerStatusTimer = null;
let isRefineOpen = false;
let isDetailSheetOpen = false;

const elements = {
  dashboardSwitch: document.querySelector("#dashboardSwitch"),
  humanDashboard: document.querySelector("#humanDashboard"),
  agentDashboard: document.querySelector("#agentDashboard"),
  reviewerName: document.querySelector("#reviewerName"),
  filterTabs: document.querySelector("#filterTabs"),
  humanAddButton: document.querySelector("#humanAddButton"),
  queueCount: document.querySelector("#queueCount"),
  artifactForm: document.querySelector("#artifactForm"),
  artifactType: document.querySelector("#artifactType"),
  artifactTitle: document.querySelector("#artifactTitle"),
  artifactPrompt: document.querySelector("#artifactPrompt"),
  artifactBody: document.querySelector("#artifactBody"),
  artifactImage: document.querySelector("#artifactImage"),
  imageStatus: document.querySelector("#imageStatus"),
  agentRequesterType: document.querySelector("#agentRequesterType"),
  agentRequesterName: document.querySelector("#agentRequesterName"),
  agentRunId: document.querySelector("#agentRunId"),
  agentReturnMode: document.querySelector("#agentReturnMode"),
  agentReturnTarget: document.querySelector("#agentReturnTarget"),
  agentGoal: document.querySelector("#agentGoal"),
  stageEyebrow: document.querySelector("#stageEyebrow"),
  stageTitle: document.querySelector("#stageTitle"),
  stageProgress: document.querySelector("#stageProgress"),
  swipeCard: document.querySelector("#swipeCard"),
  swipeBadge: document.querySelector("#swipeBadge"),
  cardPreview: document.querySelector("#cardPreview"),
  artifactTypeLabel: document.querySelector("#artifactTypeLabel"),
  artifactIndexLabel: document.querySelector("#artifactIndexLabel"),
  artifactTitleLabel: document.querySelector("#artifactTitleLabel"),
  artifactPromptLabel: document.querySelector("#artifactPromptLabel"),
  agentMetaLabel: document.querySelector("#agentMetaLabel"),
  artifactQuestionLabel: document.querySelector("#artifactQuestionLabel"),
  detailsButton: document.querySelector("#detailsButton"),
  detailCloseButton: document.querySelector("#detailCloseButton"),
  detailSheet: document.querySelector("#detailSheet"),
  emptyState: document.querySelector("#emptyState"),
  rejectButton: document.querySelector("#rejectButton"),
  acceptButton: document.querySelector("#acceptButton"),
  undoButton: document.querySelector("#undoButton"),
  scoreControls: document.querySelector("#scoreControls"),
  refineButton: document.querySelector("#refineButton"),
  signalPanel: document.querySelector("#signalPanel"),
  liveScore: document.querySelector("#liveScore"),
  liveGrade: document.querySelector("#liveGrade"),
  tagRow: document.querySelector("#tagRow"),
  reviewNote: document.querySelector("#reviewNote"),
  standardType: document.querySelector("#standardType"),
  rubricList: document.querySelector("#rubricList"),
  niceRate: document.querySelector("#niceRate"),
  avgScore: document.querySelector("#avgScore"),
  keeperCount: document.querySelector("#keeperCount"),
  passCount: document.querySelector("#passCount"),
  reviewedCount: document.querySelector("#reviewedCount"),
  agentTotalRequests: document.querySelector("#agentTotalRequests"),
  agentReadyPackets: document.querySelector("#agentReadyPackets"),
  agentPendingRequests: document.querySelector("#agentPendingRequests"),
  agentAvgConfidence: document.querySelector("#agentAvgConfidence"),
  agentRequestList: document.querySelector("#agentRequestList"),
  datasetStatus: document.querySelector("#datasetStatus"),
  datasetPreview: document.querySelector("#datasetPreview"),
  copyDatasetButton: document.querySelector("#copyDatasetButton"),
  downloadDatasetButton: document.querySelector("#downloadDatasetButton"),
  agentUseList: document.querySelector("#agentUseList"),
  agentSignalList: document.querySelector("#agentSignalList"),
  historyList: document.querySelector("#historyList"),
  packetStatus: document.querySelector("#packetStatus"),
  packetPreview: document.querySelector("#packetPreview"),
  copyPacketButton: document.querySelector("#copyPacketButton"),
  downloadPacketButton: document.querySelector("#downloadPacketButton"),
  storageStatus: document.querySelector("#storageStatus"),
  importButton: document.querySelector("#importButton"),
  importFile: document.querySelector("#importFile"),
  exportButton: document.querySelector("#exportButton"),
  resetButton: document.querySelector("#resetButton"),
  installButton: document.querySelector("#installButton"),
  reviewerSaveStatus: document.querySelector("#reviewerSaveStatus")
};

function loadState() {
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

function normalizeState(candidate) {
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
  const filter = ["all", ...artifactTypes].includes(candidate.filter) ? candidate.filter : "all";
  const currentItemId = itemIds.has(candidate.currentItemId) ? candidate.currentItemId : items[0]?.id || null;

  return {
    version: APP_VERSION,
    reviewer: cleanText(candidate.reviewer) || defaultState.reviewer,
    filter,
    dashboard: ["human", "agent"].includes(candidate.dashboard) ? candidate.dashboard : "human",
    items,
    reviews,
    currentItemId,
    activeTags: normalizeTags(candidate.activeTags),
    draftScores: normalizeScores(candidate.draftScores || { sense: candidate.senseScore }),
    lastPacketItemId: cleanText(candidate.lastPacketItemId),
    installedAt: cleanText(candidate.installedAt) || new Date().toISOString()
  };
}

function shouldReplaceLegacySamples(candidate, items) {
  const legacySampleIds = ["site-landing-001", "logo-bakery-001", "copy-launch-001", "product-render-001"];
  const hasOnlyLegacySamples = items.length === legacySampleIds.length
    && legacySampleIds.every((id) => items.some((item) => item.id === id && !item.imageData));
  const hasReviews = Array.isArray(candidate.reviews) && candidate.reviews.length > 0;
  return Number(candidate.version) < APP_VERSION && hasOnlyLegacySamples && !hasReviews;
}

function normalizeItem(item) {
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
    imageKey: cleanText(item.imageKey) || (imageData ? createShortId("image") : ""),
    imageData,
    createdAt: cleanText(item.createdAt) || new Date().toISOString()
  };
}

function safeImageData(value) {
  if (typeof value !== "string") {
    return "";
  }
  return ALLOWED_IMAGE_TYPES.some((type) => value.startsWith(`data:${type};base64,`)) ? value : "";
}

function normalizeReview(review) {
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

function normalizeAgent(agent = {}) {
  const requesterType = ["agent", "lab", "team"].includes(agent.requesterType)
    ? agent.requesterType
    : "agent";
  return {
    requesterType,
    requesterName: cleanText(agent.requesterName || agent.name) || "unnamed-agent",
    runId: cleanText(agent.runId || agent.jobId) || createShortId("run"),
    goal: cleanText(agent.goal),
    returnMode: ["json", "webhook", "polling", "dataset"].includes(agent.returnMode)
      ? agent.returnMode
      : "json",
    returnTarget: cleanText(agent.returnTarget),
    submittedAt: cleanText(agent.submittedAt) || new Date().toISOString()
  };
}

function normalizeScores(candidate = {}) {
  return scoreDimensions.reduce((scores, dimension) => {
    const value = Number(candidate[dimension.key]);
    scores[dimension.key] = Number.isFinite(value)
      ? Math.max(0, Math.min(10, Math.round(value)))
      : defaultScores[dimension.key];
    return scores;
  }, {});
}

function normalizeTags(tags) {
  return Array.isArray(tags) ? tags.filter((tag) => quickTags.includes(tag)) : [];
}

function saveState() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stateForLocalStorage()));
    setStorageStatus("");
    return true;
  } catch {
    setStorageStatus(LOCAL_STORAGE_FULL_MESSAGE);
    return false;
  }
}

function stateForLocalStorage() {
  return {
    ...state,
    items: state.items.map((item) => ({
      ...item,
      imageData: ""
    }))
  };
}

function setStorageStatus(message) {
  elements.storageStatus.textContent = message;
  elements.storageStatus.hidden = !message;
}

function showReviewerSaveStatus(message, isError = false) {
  window.clearTimeout(reviewerStatusTimer);
  elements.reviewerSaveStatus.textContent = message;
  elements.reviewerSaveStatus.classList.toggle("is-error", isError);
  elements.reviewerSaveStatus.hidden = false;

  reviewerStatusTimer = window.setTimeout(() => {
    elements.reviewerSaveStatus.hidden = true;
  }, isError ? 3200 : 1600);
}

function openImageDb() {
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

async function writeImageData(key, data) {
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

async function readImageData(key) {
  const db = await openImageDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(IMAGE_STORE_NAME, "readonly");
    const request = transaction.objectStore(IMAGE_STORE_NAME).get(key);

    request.addEventListener("success", () => resolve(safeImageData(request.result?.data)));
    request.addEventListener("error", () => reject(request.error || new Error("Image store read failed")));
    transaction.addEventListener("abort", () => reject(transaction.error || new Error("Image store read aborted")));
  });
}

async function persistInlineImages() {
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

async function hydrateStateImages() {
  await Promise.all(
    state.items.map(async (item) => {
      if (!item.imageKey || item.imageData) {
        return;
      }
      item.imageData = await readImageData(item.imageKey);
    })
  );
}

async function restoreStoredImages() {
  try {
    const movedImages = await persistInlineImages();
    await hydrateStateImages();
    if (movedImages) {
      saveState();
    }
    render();
  } catch {
    setStorageStatus("Some saved images could not load. Text reviews and exports still work.");
  }
}

function filteredItems() {
  return state.items.filter((item) => state.filter === "all" || item.type === state.filter);
}

function reviewedItemIds() {
  return new Set(state.reviews.map((review) => review.itemId));
}

function pendingItems() {
  const reviewed = reviewedItemIds();
  return filteredItems().filter((item) => !reviewed.has(item.id));
}

function getActiveItem() {
  const pending = pendingItems();
  if (!pending.length) {
    return null;
  }
  return pending.find((item) => item.id === state.currentItemId) || pending[0];
}

function setCurrentToNext() {
  const pending = pendingItems();
  state.currentItemId = pending.length ? pending[0].id : null;
}

function render() {
  const activeItem = getActiveItem();
  const pending = pendingItems();
  const filtered = filteredItems();
  const activeType = activeItem ? activeItem.type : state.filter === "all" ? "website" : state.filter;

  renderDashboardShell();
  elements.reviewerName.value = state.reviewer;
  elements.queueCount.textContent = `${pending.length}`;
  elements.stageEyebrow.textContent = `${typeLabel(activeType)} judgement`;
  elements.stageTitle.textContent = activeItem ? "Trust your first reaction" : "Nothing left in this view";
  elements.stageProgress.textContent = activeItem ? "Ready" : "Done";
  elements.standardType.textContent = typeLabel(activeType);

  renderTabs();
  renderRubric(activeType);
  renderScoreControls();
  renderTags();
  renderMetrics();
  renderHistory();
  renderAgentDashboard();
  renderLiveScore();
  renderRefinePanel();
  renderDetailSheet();

  elements.emptyState.hidden = Boolean(activeItem);
  elements.swipeCard.hidden = !activeItem;
  elements.rejectButton.disabled = !activeItem;
  elements.acceptButton.disabled = !activeItem;
  elements.undoButton.disabled = state.reviews.length === 0;

  if (!activeItem) {
    isDetailSheetOpen = false;
    saveState();
    renderFeedbackPacket(packetItemForRender(null));
    return;
  }

  const filteredIndex = filtered.findIndex((item) => item.id === activeItem.id) + 1;
  state.currentItemId = activeItem.id;
  elements.stageProgress.textContent = `${filteredIndex} / ${filtered.length}`;
  elements.cardPreview.innerHTML = renderPreview(activeItem);
  elements.artifactTypeLabel.textContent = typeLabel(activeItem.type);
  elements.artifactIndexLabel.textContent = `${filteredIndex} of ${filtered.length}`;
  elements.artifactTitleLabel.textContent = activeItem.title;
  elements.artifactPromptLabel.textContent = activeItem.prompt || "No source note yet.";
  elements.agentMetaLabel.textContent = agentLine(activeItem.agent);
  elements.artifactQuestionLabel.textContent = activeItem.question;
  elements.swipeCard.style.transform = "";
  elements.swipeCard.style.opacity = "1";
  elements.swipeCard.style.removeProperty("--drag-progress");
  elements.swipeBadge.textContent = "";
  elements.swipeCard.classList.remove("swipe-nice", "swipe-pass", "is-dragging");
  clearSwipeIntent();
  renderFeedbackPacket(packetItemForRender(activeItem));
  saveState();
}

function renderDashboardShell() {
  const isAgent = state.dashboard === "agent";
  document.body.dataset.dashboard = state.dashboard;
  elements.humanDashboard.hidden = isAgent;
  elements.agentDashboard.hidden = !isAgent;
  elements.dashboardSwitch.querySelectorAll("[data-dashboard]").forEach((button) => {
    const active = button.dataset.dashboard === state.dashboard;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

function renderTabs() {
  elements.filterTabs.querySelectorAll(".segment").forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === state.filter);
  });
}

function renderRubric(type) {
  elements.rubricList.replaceChildren();
  typeRubrics[type].forEach((criterion) => {
    const item = document.createElement("li");
    item.textContent = criterion;
    elements.rubricList.append(item);
  });
}

function renderScoreControls() {
  elements.scoreControls.replaceChildren();
  scoreDimensions.forEach((dimension) => {
    const wrapper = document.createElement("label");
    wrapper.className = "score-control";

    const title = document.createElement("span");
    title.className = "score-title";
    title.textContent = dimension.label;

    const helper = document.createElement("span");
    helper.className = "score-helper";
    helper.textContent = `${dimension.low} / ${dimension.high}`;

    const row = document.createElement("span");
    row.className = "range-row";

    const input = document.createElement("input");
    input.type = "range";
    input.min = "0";
    input.max = "10";
    input.value = `${state.draftScores[dimension.key]}`;
    input.dataset.score = dimension.key;

    const output = document.createElement("output");
    output.textContent = `${state.draftScores[dimension.key]}`;

    input.addEventListener("input", () => {
      state.draftScores[dimension.key] = Number(input.value);
      output.textContent = input.value;
      renderLiveScore();
      saveState();
    });

    row.append(input, output);
    wrapper.append(title, helper, row);
    elements.scoreControls.append(wrapper);
  });
}

function renderRefinePanel() {
  elements.signalPanel.hidden = !isRefineOpen;
  elements.refineButton.classList.toggle("active", isRefineOpen);
  elements.refineButton.setAttribute("aria-expanded", isRefineOpen ? "true" : "false");
}

function renderDetailSheet() {
  elements.detailSheet.hidden = !isDetailSheetOpen;
  elements.detailsButton.classList.toggle("active", isDetailSheetOpen);
  elements.detailsButton.setAttribute("aria-expanded", isDetailSheetOpen ? "true" : "false");
}

function renderTags() {
  elements.tagRow.replaceChildren();
  quickTags.forEach((tag) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tag-chip";
    button.textContent = tag;
    button.classList.toggle("active", state.activeTags.includes(tag));
    button.addEventListener("click", () => toggleTag(tag));
    elements.tagRow.append(button);
  });
}

function renderMetrics() {
  const total = state.reviews.length;
  const niceCount = state.reviews.filter((review) => review.verdict === "nice").length;
  const passCount = total - niceCount;
  const keeperCount = state.reviews.filter((review) => review.grade === "Keeper").length;
  const avgScore = total ? state.reviews.reduce((sum, review) => sum + review.score, 0) / total : 0;
  const niceRate = total ? Math.round((niceCount / total) * 100) : 0;

  elements.reviewedCount.textContent = `${total}`;
  elements.niceRate.textContent = `${niceRate}%`;
  elements.avgScore.textContent = `${Math.round(avgScore)}`;
  elements.keeperCount.textContent = `${keeperCount}`;
  elements.passCount.textContent = `${passCount}`;
}

function renderHistory() {
  elements.historyList.replaceChildren();
  const recent = [...state.reviews].reverse().slice(0, 10);

  if (!recent.length) {
    const empty = document.createElement("p");
    empty.className = "help-text";
    empty.textContent = "No decisions yet.";
    elements.historyList.append(empty);
    return;
  }

  recent.forEach((review) => {
    const item = state.items.find((candidate) => candidate.id === review.itemId);
    if (!item) {
      return;
    }

    const row = document.createElement("article");
    row.className = "history-item";

    const title = document.createElement("strong");
    title.textContent = item.title;

    const meta = document.createElement("div");
    meta.className = "history-meta";

    const verdict = document.createElement("span");
    verdict.className = `history-verdict${review.verdict === "pass" ? " pass" : ""}`;
    verdict.textContent = review.verdict === "nice" ? "Nice" : "Nope";

    const score = document.createElement("span");
    score.textContent = `${review.score} / ${review.grade}`;

    const type = document.createElement("span");
    type.textContent = typeLabel(item.type);

    meta.append(verdict, score, type);

    if (review.tags.length) {
      const tags = document.createElement("span");
      tags.textContent = review.tags.join(", ");
      meta.append(tags);
    }

    const agent = document.createElement("span");
    agent.textContent = `${item.agent.requesterName} / ${item.agent.runId}`;
    meta.append(agent);

    row.append(title, meta);
    elements.historyList.append(row);
  });
}

function renderAgentDashboard() {
  const reviewByItem = new Map(state.reviews.map((review) => [review.itemId, review]));
  const readyCount = state.reviews.length;
  const pendingCount = state.items.filter((item) => !reviewByItem.has(item.id)).length;
  const evalRows = buildEvalRows();
  const avgSignalStrength = evalRows.length
    ? Math.round(evalRows.reduce((sum, row) => sum + row.humanSignal.signalStrength, 0) / evalRows.length * 100)
    : null;

  elements.agentTotalRequests.textContent = `${state.items.length} artifacts`;
  elements.agentReadyPackets.textContent = `${readyCount}`;
  elements.agentPendingRequests.textContent = `${pendingCount}`;
  elements.agentAvgConfidence.textContent = avgSignalStrength === null ? "None" : `${avgSignalStrength}%`;
  renderDatasetPreview(evalRows);
  renderAgentUsePanel(evalRows);

  elements.agentRequestList.replaceChildren();
  const requests = [...state.items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (!requests.length) {
    const empty = document.createElement("p");
    empty.className = "help-text";
    empty.textContent = "No exportable artifacts yet.";
    elements.agentRequestList.append(empty);
  }

  requests.forEach((item) => {
    const review = reviewByItem.get(item.id);
    const row = document.createElement("article");
    row.className = `agent-request${review ? " ready" : ""}`;

    const top = document.createElement("div");
    top.className = "agent-request-top";

    const title = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = item.title;
    const meta = document.createElement("span");
    meta.textContent = `${item.agent.requesterName} / ${item.agent.runId}`;
    title.append(name, meta);

    const status = document.createElement("span");
    status.className = `count-pill${review ? " ready-pill" : ""}`;
    status.textContent = review ? "Ready" : "Unjudged";
    top.append(title, status);

    const signal = document.createElement("p");
    signal.textContent = review
      ? `${review.verdict === "nice" ? "Nice" : "Nope"} at ${review.score}. ${repairInstructionFor(item, review)}`
      : item.agent.goal || "Swipe this artifact to unlock export data.";

    if (review) {
      const chips = document.createElement("div");
      chips.className = "signal-chip-row";
      [
        `label: ${preferenceLabelFor(review)}`,
        `signal: ${Math.round(signalStrengthFor(review) * 100)}%`,
        `use: ${recommendedActionFor(review)}`
      ].forEach((value) => {
        const chip = document.createElement("span");
        chip.className = "signal-chip";
        chip.textContent = value;
        chips.append(chip);
      });
      row.append(top, signal, chips);
    } else {
      row.append(top, signal);
    }

    const footer = document.createElement("div");
    footer.className = "agent-request-footer";
    const returnTarget = document.createElement("span");
    returnTarget.textContent = `${item.agent.returnMode} -> ${item.agent.returnTarget || "local export"}`;
    const inspect = document.createElement("button");
    inspect.type = "button";
    inspect.className = "mini-button";
    inspect.textContent = review ? "View packet" : "View item";
    inspect.addEventListener("click", () => {
      state.lastPacketItemId = item.id;
      state.dashboard = "agent";
      saveState();
      render();
    });
    footer.append(returnTarget, inspect);

    row.append(footer);
    elements.agentRequestList.append(row);
  });

  renderAgentSignals(reviewByItem);
}

function renderDatasetPreview(evalRows) {
  elements.datasetStatus.textContent = `${evalRows.length} rows`;
  elements.copyDatasetButton.disabled = evalRows.length === 0;
  elements.downloadDatasetButton.disabled = evalRows.length === 0;

  if (!evalRows.length) {
    elements.datasetPreview.textContent = "No export rows yet. Swipe at least one artifact to create JSONL eval data.";
    return;
  }

  elements.datasetPreview.textContent = evalRows
    .slice(0, 3)
    .map((row) => JSON.stringify(row))
    .join("\n");
}

function renderAgentUsePanel(evalRows) {
  elements.agentUseList.replaceChildren();
  const packet = activePacket();
  const selectedUse = packet?.agentUse;
  const rows = selectedUse
    ? [
        ["Preference label", selectedUse.preferenceLabel],
        ["Signal strength", `${Math.round(selectedUse.signalStrength * 100)}%`],
        ["Recommended action", selectedUse.recommendedAction],
        ["Repair instruction", selectedUse.repairInstruction]
      ]
    : [
        ["Eval rows", `${evalRows.length}`],
        ["Training signals", evalRows.length ? signalCoverage(evalRows).join(", ") : "None yet"],
        ["Next useful action", evalRows.length ? "Export JSONL or inspect ready packets." : "Swipe an artifact."]
      ];

  rows.forEach(([label, value]) => {
    const item = document.createElement("div");
    item.className = "agent-use-item";
    const key = document.createElement("span");
    key.textContent = label;
    const text = document.createElement("strong");
    text.textContent = value || "None";
    item.append(key, text);
    elements.agentUseList.append(item);
  });
}

function buildEvalRows() {
  return state.reviews
    .map((review) => {
      const item = state.items.find((candidate) => candidate.id === review.itemId);
      return item ? buildEvalRow(item, review) : null;
    })
    .filter(Boolean);
}

function signalCoverage(evalRows) {
  return [...new Set(evalRows.flatMap((row) => row.agentUse.trainingUse))];
}

function renderAgentSignals(reviewByItem) {
  elements.agentSignalList.replaceChildren();
  const recent = [...state.reviews].reverse().slice(0, 8);

  if (!recent.length) {
    const empty = document.createElement("p");
    empty.className = "help-text";
    empty.textContent = "No review signals yet.";
    elements.agentSignalList.append(empty);
    return;
  }

  recent.forEach((review) => {
    const item = state.items.find((candidate) => candidate.id === review.itemId);
    if (!item || !reviewByItem.has(item.id)) {
      return;
    }

    const row = document.createElement("article");
    row.className = "signal-item";

    const verdict = document.createElement("strong");
    verdict.textContent = `${review.verdict === "nice" ? "Nice" : "Nope"} / ${review.score}`;

    const detail = document.createElement("p");
    detail.textContent = `${item.agent.runId}: ${review.tags.length ? review.tags.join(", ") : review.grade}`;

    row.append(verdict, detail);
    elements.agentSignalList.append(row);
  });
}

function renderFeedbackPacket(activeItem) {
  const packetItem = activeItem;
  const review = packetItem ? state.reviews.find((candidate) => candidate.itemId === packetItem.id) : null;
  const packet = packetItem && review ? buildFeedbackPacket(packetItem, review) : buildPendingPacket(packetItem);

  elements.packetStatus.textContent = packet.status === "ready"
    ? "Ready"
    : packet.status === "empty" ? "Empty" : "Pending";
  elements.packetPreview.textContent = JSON.stringify(packet, null, 2);
  elements.copyPacketButton.disabled = packet.status !== "ready";
  elements.downloadPacketButton.disabled = packet.status !== "ready";
}

function packetItemForRender(activeItem) {
  if (state.lastPacketItemId) {
    const lastPacketItem = state.items.find((item) => item.id === state.lastPacketItemId);
    if (lastPacketItem) {
      return lastPacketItem;
    }
  }
  if (activeItem) {
    return activeItem;
  }
  const latestReview = state.reviews.at(-1);
  return latestReview ? state.items.find((item) => item.id === latestReview.itemId) || null : null;
}

function renderPreview(item) {
  if (item.imageData) {
    return `
      <div class="preview-image" aria-label="${escapeHtml(typeLabel(item.type))} image preview">
        <img src="${item.imageData}" alt="${escapeHtml(item.title)}" />
      </div>
    `;
  }

  if (item.imageKey) {
    return `
      <div class="preview-image" aria-label="${escapeHtml(typeLabel(item.type))} image preview">
        <span class="help-text">Image loading from this browser.</span>
      </div>
    `;
  }

  if (item.type === "logo") {
    return `
      <div class="preview-logo" aria-label="Generated logo preview">
        <div class="logo-board">
          <div class="logo-lockup">
            <div class="logo-mark"></div>
            <div class="logo-lines">
              <i></i>
              <i></i>
            </div>
          </div>
          <span>${escapeHtml(shortTitle(item.title, 24))}</span>
          <div class="logo-samples">
            <i></i>
            <i></i>
            <i></i>
          </div>
        </div>
      </div>
    `;
  }

  if (item.type === "copy") {
    return `
      <div class="preview-copy" aria-label="Generated copy preview">
        <div class="copy-card">
          <span class="copy-kicker">Generated copy</span>
          <p class="copy-headline">${escapeHtml(shortTitle(item.title, 48))}</p>
          <p class="copy-text">${escapeHtml(item.body || item.prompt || "Paste copy to judge the voice, clarity, and action.")}</p>
        </div>
      </div>
    `;
  }

  if (item.type === "product") {
    return `
      <div class="preview-product" aria-label="Generated product image preview">
        <div class="product-scene">
          <div class="product-shadow"></div>
          <div class="product-object">
            <i class="product-lid"></i>
            <i class="product-divider one"></i>
            <i class="product-divider two"></i>
            <i class="product-handle"></i>
          </div>
          <span>${escapeHtml(shortTitle(item.body || item.title, 36))}</span>
        </div>
      </div>
    `;
  }

  return `
    <div class="preview-website" aria-label="Generated website preview">
      <div class="browser-bar">
        <span class="browser-dot"></span>
        <span class="browser-dot"></span>
        <span class="browser-dot"></span>
        <span>${escapeHtml(shortTitle(item.title, 30))}</span>
      </div>
      <div class="site-mock">
        <div class="site-copy-block">
          <span class="site-nav">Live runs / approvals / handoff</span>
          <strong>${escapeHtml(item.body || item.title)}</strong>
          <p>${escapeHtml(shortTitle(item.prompt || "Generated landing page candidate", 92))}</p>
          <div class="site-line"></div>
          <div class="site-line short"></div>
          <div class="site-line muted"></div>
          <div class="site-cta-row">
            <span class="site-cta"></span>
            <span class="site-cta secondary"></span>
          </div>
        </div>
        <div class="site-visual">
          <div class="site-metric">
            <b>82</b>
            <span>ready</span>
          </div>
          <span class="site-tile big"></span>
          <span class="site-tile"></span>
          <span class="site-tile"></span>
        </div>
      </div>
    </div>
  `;
}

function renderLiveScore() {
  const score = calculateScore(state.draftScores);
  elements.liveScore.textContent = `${score}`;
  elements.liveGrade.textContent = gradeFor(score, score >= 60 ? "nice" : "pass");
}

function toggleTag(tag) {
  if (state.activeTags.includes(tag)) {
    state.activeTags = state.activeTags.filter((candidate) => candidate !== tag);
  } else {
    state.activeTags = [...state.activeTags, tag];
  }
  saveState();
  renderTags();
}

function decide(verdict) {
  const item = getActiveItem();
  if (!item) {
    return;
  }

  const scores = normalizeScores(state.draftScores);
  const score = calculateScore(scores);
  const grade = gradeFor(score, verdict);

  state.reviews = state.reviews.filter((review) => review.itemId !== item.id);
  state.reviews.push({
    id: createId(),
    itemId: item.id,
    reviewer: state.reviewer,
    verdict,
    scores,
    score,
    grade,
    recommendation: recommendationFor({ verdict, score, grade }),
    tags: [...state.activeTags],
    note: elements.reviewNote.value.trim(),
    createdAt: new Date().toISOString()
  });

  elements.reviewNote.value = "";
  state.activeTags = [];
  state.draftScores = defaultScoresForNext(verdict, scores);
  state.lastPacketItemId = item.id;
  isRefineOpen = false;
  isDetailSheetOpen = false;
  setCurrentToNext();
  saveState();
  pulseDevice();
  animateDecision(verdict);
}

function undoLastReview() {
  const review = state.reviews.pop();
  if (!review) {
    return;
  }
  const item = state.items.find((candidate) => candidate.id === review.itemId);
  if (item) {
    state.filter = item.type;
  }
  state.currentItemId = review.itemId;
  state.lastPacketItemId = state.reviews.at(-1)?.itemId || null;
  state.draftScores = normalizeScores(review.scores);
  state.activeTags = [...review.tags];
  elements.reviewNote.value = review.note;
  saveState();
  render();
}

function animateDecision(verdict) {
  const x = verdict === "nice" ? window.innerWidth : -window.innerWidth;
  const rotation = verdict === "nice" ? 12 : -12;
  elements.swipeBadge.textContent = verdict === "nice" ? "Nice" : "Nope";
  elements.swipeCard.classList.add(verdict === "nice" ? "swipe-nice" : "swipe-pass");
  elements.swipeCard.style.transform = `translateX(${x}px) rotate(${rotation}deg)`;
  elements.swipeCard.style.opacity = "0";

  window.setTimeout(() => {
    render();
  }, 190);
}

function addArtifact(event) {
  event.preventDefault();
  const type = elements.artifactType.value;
  const title = elements.artifactTitle.value.trim();

  if (!title) {
    elements.artifactTitle.focus();
    return;
  }

  const item = {
    id: createId(),
    type,
    title,
    prompt: elements.artifactPrompt.value.trim(),
    body: elements.artifactBody.value.trim(),
    question: defaultQuestion(type),
    agent: {
      requesterType: elements.agentRequesterType.value,
      requesterName: elements.agentRequesterName.value.trim() || `${elements.agentRequesterType.value}-customer`,
      runId: elements.agentRunId.value.trim() || createShortId("run"),
      goal: elements.agentGoal.value.trim(),
      returnMode: elements.agentReturnMode.value,
      returnTarget: elements.agentReturnTarget.value.trim(),
      submittedAt: new Date().toISOString()
    },
    imageKey: pendingImageKey,
    imageData: pendingImageData,
    createdAt: new Date().toISOString()
  };

  state.items = [item, ...state.items];
  state.filter = type;
  state.currentItemId = item.id;
  state.dashboard = "human";
  pendingImageData = "";
  pendingImageKey = "";
  elements.artifactForm.reset();
  elements.imageStatus.textContent = "No image selected.";
  elements.agentRequesterType.value = "agent";
  elements.agentReturnMode.value = "json";
  saveState();
  render();
}

function openAddArtifactPanel() {
  state.dashboard = "agent";
  saveState();
  render();
  window.setTimeout(() => {
    elements.artifactTitle.focus();
  }, 0);
}

function handleImageSelection() {
  const [file] = elements.artifactImage.files;
  pendingImageData = "";
  pendingImageKey = "";

  if (!file) {
    elements.imageStatus.textContent = "No image selected.";
    return;
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    elements.imageStatus.textContent = "Choose a PNG, JPG, or WebP image.";
    elements.artifactImage.value = "";
    return;
  }

  if (file.size > MAX_IMAGE_BYTES) {
    elements.imageStatus.textContent = "Choose an image under 2.5 MB for local storage.";
    elements.artifactImage.value = "";
    return;
  }

  const reader = new FileReader();
  reader.addEventListener("load", async () => {
    const imageData = safeImageData(reader.result);
    if (!imageData) {
      elements.imageStatus.textContent = "That image format could not be stored.";
      return;
    }

    try {
      const imageKey = createShortId("image");
      await writeImageData(imageKey, imageData);
      pendingImageData = imageData;
      pendingImageKey = imageKey;
      elements.imageStatus.textContent = `${file.name} ready for local review.`;
    } catch {
      pendingImageData = "";
      pendingImageKey = "";
      elements.artifactImage.value = "";
      elements.imageStatus.textContent = "Local image storage is full or unavailable. Add a text-only artifact or use a smaller image.";
    }
  });
  reader.readAsDataURL(file);
}

async function exportProfile() {
  try {
    await hydrateStateImages();
  } catch {
    setStorageStatus("Some saved images could not be included in this export.");
  }

  const payload = {
    exportedAt: new Date().toISOString(),
    app: "AgentMash",
    version: APP_VERSION,
    profile: state
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `agentmash-profile-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function activePacket() {
  const packetItem = packetItemForRender(getActiveItem());
  const review = packetItem ? state.reviews.find((candidate) => candidate.itemId === packetItem.id) : null;
  if (!packetItem || !review) {
    return null;
  }
  return buildFeedbackPacket(packetItem, review);
}

async function copyPacket() {
  const packet = activePacket();
  if (!packet) {
    return;
  }
  const text = JSON.stringify(packet, null, 2);
  elements.packetStatus.textContent = (await copyText(text)) ? "Copied" : "Copy unavailable";
}

function downloadPacket() {
  const packet = activePacket();
  if (!packet) {
    return;
  }
  const blob = new Blob([JSON.stringify(packet, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${packet.request.runId}-agentmash-feedback.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function datasetJsonl() {
  return buildEvalRows().map((row) => JSON.stringify(row)).join("\n");
}

async function copyDataset() {
  const text = datasetJsonl();
  if (!text) {
    return;
  }
  elements.datasetStatus.textContent = (await copyText(text)) ? "Copied" : "Copy unavailable";
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the selection-based copy path below.
    }
  }

  const field = document.createElement("textarea");
  field.value = text;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.top = "-999px";
  field.style.opacity = "0";
  document.body.append(field);
  field.select();
  field.setSelectionRange(0, field.value.length);

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }

  field.remove();
  return copied;
}

function downloadDataset() {
  const text = datasetJsonl();
  if (!text) {
    return;
  }
  const blob = new Blob([`${text}\n`], { type: "application/x-ndjson" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `agentmash-eval-rows-${new Date().toISOString().slice(0, 10)}.jsonl`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function importProfile(file) {
  const reader = new FileReader();
  reader.addEventListener("load", async () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      const profile = parsed.profile || parsed;
      if (!confirmProfileImport()) {
        return;
      }
      state = normalizeState(profile);
      try {
        await persistInlineImages();
      } catch {
        state.items = state.items.map((item) => ({
          ...item,
          imageData: ""
        }));
      }
      setCurrentToNext();
      saveState();
      if (state.items.some((item) => item.imageKey && !item.imageData)) {
        setStorageStatus("Profile imported, but image storage is full or unavailable. Text, reviews, and packet data were saved without embedded images.");
      }
      render();
    } catch {
      window.alert("That file does not look like an AgentMash profile.");
    }
  });
  reader.readAsText(file);
}

function confirmProfileImport() {
  if (!hasLocalProfileData()) {
    return true;
  }

  return window.confirm(
    "Import this AgentMash profile? This replaces reviews, uploads, notes, and added artifacts in this browser. Export first if you want a backup."
  );
}

function hasLocalProfileData() {
  const sampleIds = new Set(sampleItems.map((item) => item.id));
  return (
    state.reviews.length > 0
    || state.items.some((item) => !sampleIds.has(item.id) || item.imageData)
    || state.reviewer !== defaultState.reviewer
  );
}

function resetProfile() {
  const confirmed = window.confirm(
    "Reset this local AgentMash profile? This clears reviews, uploads, notes, and added artifacts in this browser."
  );
  if (!confirmed) {
    return;
  }

  state = cloneDefaultState();
  pendingImageData = "";
  pendingImageKey = "";
  elements.reviewNote.value = "";
  elements.imageStatus.textContent = "No image selected.";
  saveState();
  render();
}

function buildPendingPacket(item) {
  if (!item) {
    return {
      schema: "agentmash.feedback.v2",
      status: "empty",
      message: "No active artifact.",
      signalStrengthFormula: signalStrengthFormula()
    };
  }
  return {
    schema: "agentmash.feedback.v2",
    status: "pending",
    signalStrengthFormula: signalStrengthFormula(),
    request: requestEnvelope(item),
    expectedReturn: returnEnvelope(item.agent),
    pendingHumanSignal: {
      capturePrinciple: "Humans make fast lazy judgements. The first swipe is the signal; later explanation only annotates it.",
      dimensions: scoreDimensions.map((dimension) => ({
        key: dimension.key,
        label: dimension.label,
        weight: dimension.weight
      })),
      categories: typeRubrics[item.type]
    }
  };
}

function buildFeedbackPacket(item, review) {
  const humanSignal = humanSignalFor(item, review);
  const agentUse = agentUseFor(item, review);
  return {
    schema: "agentmash.feedback.v2",
    status: "ready",
    packetId: `feedback-${review.id}`,
    generatedAt: new Date().toISOString(),
    signalStrengthFormula: signalStrengthFormula(),
    request: requestEnvelope(item),
    humanSignal,
    humanJudgement: {
      reviewer: review.reviewer,
      verdict: review.verdict,
      firstImpression: humanSignal.firstImpression,
      preferenceLabel: humanSignal.preferenceLabel,
      signalStrength: humanSignal.signalStrength,
      score: review.score,
      grade: review.grade,
      scores: review.scores,
      tags: review.tags,
      note: review.note,
      judgedAt: review.createdAt
    },
    interpretation: {
      recommendation: review.recommendation || recommendationFor(review),
      likelyFailureModes: failureModesFor(review),
      repairInstruction: agentUse.repairInstruction,
      criteriaUsed: typeRubrics[item.type]
    },
    agentUse,
    evalRow: buildEvalRow(item, review),
    return: {
      ...returnEnvelope(item.agent),
      deliveryStatus: "local_ready",
      onlineBehavior: returnBehaviorFor(item.agent.returnMode)
    }
  };
}

function buildEvalRow(item, review) {
  return {
    schema: "agentmash.eval-row.v2",
    rowId: `eval-${review.id}`,
    createdAt: review.createdAt,
    artifact: {
      artifactId: item.id,
      type: item.type,
      title: item.title,
      prompt: item.prompt,
      body: item.body,
      requesterName: item.agent.requesterName,
      requesterType: item.agent.requesterType,
      runId: item.agent.runId,
      goal: item.agent.goal
    },
    humanSignal: humanSignalFor(item, review),
    agentUse: agentUseFor(item, review)
  };
}

function humanSignalFor(item, review) {
  return {
    reviewer: review.reviewer,
    verdict: review.verdict,
    preferenceLabel: preferenceLabelFor(review),
    firstImpression: review.verdict === "nice" ? "accepted_on_first_glance" : "rejected_on_first_glance",
    score: review.score,
    grade: review.grade,
    signalStrength: signalStrengthFor(review),
    scoreVector: scoreVectorFor(review),
    tags: review.tags,
    failureModes: failureModesFor(review),
    rationale: review.note || defaultRationaleFor(item, review),
    judgedAt: review.createdAt
  };
}

function agentUseFor(item, review) {
  return {
    trainingUse: trainingUseFor(review),
    preferenceLabel: preferenceLabelFor(review),
    recommendedAction: recommendedActionFor(review),
    repairInstruction: repairInstructionFor(item, review),
    signalStrength: signalStrengthFor(review),
    returnTarget: item.agent.returnTarget || "local export"
  };
}

function signalStrengthFormula() {
  return {
    name: "score_extremity_plus_annotation",
    description: "Signal strength is score extremity around a neutral 60 score plus small boosts for tags and a note.",
    expression: "roundTo(0.55 + min(1, abs(score - 60) / 40) * 0.27 + min(0.1, tagCount * 0.025) + noteBoost, 2)",
    noteBoost: 0.08,
    range: [0.55, 1]
  };
}

function requestEnvelope(item) {
  return {
    artifactId: item.id,
    type: item.type,
    title: item.title,
    prompt: item.prompt,
    body: item.body,
    runId: item.agent.runId,
    requesterType: item.agent.requesterType,
    requesterName: item.agent.requesterName,
    goal: item.agent.goal,
    submittedAt: item.agent.submittedAt
  };
}

function returnEnvelope(agent) {
  return {
    mode: agent.returnMode,
    target: agent.returnTarget || "local export",
    format: "application/json"
  };
}

function returnBehaviorFor(mode) {
  const behavior = {
    json: "Download or copy this packet into the agent run log.",
    webhook: "POST this packet to the configured webhook when the online backend exists.",
    polling: "Store this packet under the run ID so the agent can poll for it.",
    dataset: "Append this packet as a labelled row in the lab eval dataset."
  };
  return behavior[mode] || behavior.json;
}

function recommendationFor(review) {
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

function failureModesFor(review) {
  const lowScores = Object.entries(review.scores)
    .filter(([, value]) => value <= 5)
    .map(([key]) => key);
  const tagModes = review.tags.filter((tag) => ["generic", "uncanny", "confusing", "off-brand"].includes(tag));
  const verdictModes = review.verdict === "pass" ? ["first_glance_rejection"] : [];
  return [...new Set([...verdictModes, ...lowScores, ...tagModes])];
}

function scoreVectorFor(review) {
  return scoreDimensions.reduce((vector, dimension) => {
    vector[dimension.key] = {
      label: dimension.label,
      value: review.scores[dimension.key],
      weight: dimension.weight
    };
    return vector;
  }, {});
}

function preferenceLabelFor(review) {
  return review.verdict === "nice" ? "chosen" : "rejected";
}

function signalStrengthFor(review) {
  const distanceFromMaybe = Math.min(1, Math.abs(review.score - 60) / 40);
  const tagBoost = Math.min(0.1, review.tags.length * 0.025);
  const noteBoost = review.note ? 0.08 : 0;
  return roundTo(0.55 + distanceFromMaybe * 0.27 + tagBoost + noteBoost, 2);
}

function trainingUseFor(review) {
  const uses = ["preference_label", "score_vector", "eval_dataset_row"];
  if (review.tags.length || failureModesFor(review).length) {
    uses.push("failure_taxonomy");
  }
  if (review.note || review.verdict === "pass" || review.score < 78) {
    uses.push("prompt_repair");
  }
  return uses;
}

function recommendedActionFor(review) {
  if (review.verdict === "nice" && review.score >= 78) {
    return "ship_or_keep";
  }
  if (review.verdict === "nice") {
    return "iterate_from_positive";
  }
  if (review.score >= 68) {
    return "mine_traits_then_retry";
  }
  if (review.score >= 45) {
    return "repair";
  }
  return "reject_and_regenerate";
}

function repairInstructionFor(item, review) {
  const weak = weakestDimensions(review)
    .map((dimension) => dimension.label.toLowerCase())
    .join(", ");
  const typeHints = {
    website: "Make the purpose, trust signal, and visual hierarchy obvious within two seconds.",
    logo: "Simplify the mark so the category association and tiny-size recognition are immediate.",
    copy: "Rewrite the first line so it sounds specific, human, and understandable without rereading.",
    product: "Repair plausibility, materials, shadows, and desire cues before reusing this render."
  };
  const focus = weak ? ` Focus on ${weak}.` : "";

  if (review.verdict === "nice" && review.score >= 78) {
    return `Keep this direction for ${item.type}; preserve the prompt pattern and add it to positive examples.`;
  }
  if (review.verdict === "nice") {
    return `Generate one sharper variant from this direction.${focus}`;
  }
  if (review.score >= 68) {
    return `Do not ship yet. Mine the useful traits, then retry with tighter constraints.${focus}`;
  }
  return `${typeHints[item.type] || "Regenerate with a clearer concept and fewer trust breaks."}${focus}`;
}

function weakestDimensions(review) {
  const sorted = scoreDimensions
    .map((dimension) => ({
      key: dimension.key,
      label: dimension.label,
      value: review.scores[dimension.key]
    }))
    .sort((a, b) => a.value - b.value);
  const threshold = sorted[0]?.value <= 6 ? sorted[0].value : 5;
  return sorted.filter((dimension) => dimension.value <= threshold).slice(0, 2);
}

function defaultRationaleFor(item, review) {
  const tagText = review.tags.length ? ` Tags: ${review.tags.join(", ")}.` : "";
  return `${review.verdict === "nice" ? "Human accepted" : "Human rejected"} this ${item.type} on first glance at score ${review.score}.${tagText}`;
}

function calculateScore(scores) {
  const weighted = scoreDimensions.reduce((sum, dimension) => {
    return sum + scores[dimension.key] * dimension.weight;
  }, 0);
  return Math.round(weighted * 10);
}

function gradeFor(score, verdict) {
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

function defaultScoresForNext(verdict, scores) {
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

function defaultQuestion(type) {
  const questions = {
    website: "Is this website nice?",
    logo: "Does this logo make sense?",
    copy: "Is this copy nice?",
    product: "Does this product image make sense?"
  };
  return questions[type] || "Is this nice?";
}

function typeLabel(type) {
  const labels = {
    website: "Website",
    logo: "Logo",
    copy: "Copy",
    product: "Product image"
  };
  return labels[type] || "Artifact";
}

function agentLine(agent) {
  return `${agent.requesterName} / ${agent.runId}`;
}

function shortTitle(value, maxLength) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;
}

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function roundTo(value, places) {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createShortId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 7)}`;
}

function cloneDefaultState() {
  return JSON.parse(JSON.stringify(defaultState));
}

function onPointerDown(event) {
  if (event.target.closest("button, input, textarea, select, a")) {
    return;
  }

  if (!getActiveItem()) {
    return;
  }

  dragState = {
    pointerId: event.pointerId,
    startX: event.clientX,
    currentX: event.clientX
  };
  elements.swipeCard.setPointerCapture(event.pointerId);
  elements.swipeCard.classList.add("is-dragging");
}

function onPointerMove(event) {
  if (!dragState || dragState.pointerId !== event.pointerId) {
    return;
  }

  dragState.currentX = event.clientX;
  const deltaX = dragState.currentX - dragState.startX;
  const rotation = Math.max(-12, Math.min(12, deltaX / 18));
  const isNice = deltaX > 70;
  const isPass = deltaX < -70;
  const progress = Math.min(1, Math.abs(deltaX) / 140);

  elements.swipeCard.style.transform = `translateX(${deltaX}px) rotate(${rotation}deg)`;
  elements.swipeCard.style.setProperty("--drag-progress", `${progress}`);
  elements.swipeCard.classList.toggle("swipe-nice", isNice);
  elements.swipeCard.classList.toggle("swipe-pass", isPass);
  elements.acceptButton.classList.toggle("is-hot", isNice);
  elements.rejectButton.classList.toggle("is-hot", isPass);
  document.body.dataset.swipeIntent = isNice ? "nice" : isPass ? "pass" : "";
  elements.swipeBadge.textContent = isNice ? "Nice" : isPass ? "Nope" : "";
}

function onPointerUp(event) {
  if (!dragState || dragState.pointerId !== event.pointerId) {
    return;
  }

  const deltaX = dragState.currentX - dragState.startX;
  dragState = null;
  elements.swipeCard.classList.remove("is-dragging", "swipe-nice", "swipe-pass");
  clearSwipeIntent();

  if (deltaX > 120) {
    decide("nice");
    return;
  }

  if (deltaX < -120) {
    decide("pass");
    return;
  }

  elements.swipeBadge.textContent = "";
  elements.swipeCard.style.transform = "";
  elements.swipeCard.style.removeProperty("--drag-progress");
}

function clearSwipeIntent() {
  elements.acceptButton.classList.remove("is-hot");
  elements.rejectButton.classList.remove("is-hot");
  document.body.dataset.swipeIntent = "";
}

function pulseDevice() {
  if (navigator.vibrate) {
    navigator.vibrate(12);
  }
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || window.location.protocol === "file:") {
    return;
  }
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}

elements.dashboardSwitch.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-dashboard]");
  if (!button) {
    return;
  }
  state.dashboard = button.dataset.dashboard;
  saveState();
  render();
});

elements.reviewerName.addEventListener("input", () => {
  state.reviewer = elements.reviewerName.value.trim() || defaultState.reviewer;
  const saved = saveState();
  showReviewerSaveStatus(saved ? "Saved" : "Not saved", !saved);
});

elements.filterTabs.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-filter]");
  if (!button) {
    return;
  }
  state.filter = button.dataset.filter;
  setCurrentToNext();
  state.lastPacketItemId = null;
  saveState();
  render();
});

elements.humanAddButton.addEventListener("click", openAddArtifactPanel);
elements.artifactType.addEventListener("change", () => {
  renderRubric(elements.artifactType.value);
});
elements.artifactImage.addEventListener("change", handleImageSelection);
elements.artifactForm.addEventListener("submit", addArtifact);
elements.refineButton.addEventListener("click", () => {
  isRefineOpen = !isRefineOpen;
  renderRefinePanel();
});
elements.detailsButton.addEventListener("click", () => {
  isDetailSheetOpen = true;
  renderDetailSheet();
});
elements.detailCloseButton.addEventListener("click", () => {
  isDetailSheetOpen = false;
  renderDetailSheet();
});
elements.rejectButton.addEventListener("click", () => decide("pass"));
elements.acceptButton.addEventListener("click", () => decide("nice"));
elements.undoButton.addEventListener("click", undoLastReview);
elements.copyPacketButton.addEventListener("click", copyPacket);
elements.downloadPacketButton.addEventListener("click", downloadPacket);
elements.copyDatasetButton.addEventListener("click", copyDataset);
elements.downloadDatasetButton.addEventListener("click", downloadDataset);
elements.importButton.addEventListener("click", () => elements.importFile.click());
elements.importFile.addEventListener("change", () => {
  const [file] = elements.importFile.files;
  if (file) {
    importProfile(file);
  }
  elements.importFile.value = "";
});
elements.exportButton.addEventListener("click", exportProfile);
elements.resetButton.addEventListener("click", resetProfile);
elements.swipeCard.addEventListener("pointerdown", onPointerDown);
elements.swipeCard.addEventListener("pointermove", onPointerMove);
elements.swipeCard.addEventListener("pointerup", onPointerUp);
elements.swipeCard.addEventListener("pointercancel", onPointerUp);

window.addEventListener("keydown", (event) => {
  if (event.target.matches("input, textarea, select")) {
    return;
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    decide("nice");
  }

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    decide("pass");
  }

  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
    event.preventDefault();
    undoLastReview();
  }
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  elements.installButton.hidden = false;
});

elements.installButton.addEventListener("click", async () => {
  if (!deferredInstallPrompt) {
    return;
  }
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  elements.installButton.hidden = true;
});

render();
restoreStoredImages();
registerServiceWorker();
