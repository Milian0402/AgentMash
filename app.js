import {
  ALLOWED_IMAGE_TYPES,
  APP_VERSION,
  MAX_IMAGE_BYTES,
  calculateScore,
  clearImageStore,
  cloneDefaultState,
  configureStorageStatus,
  createId,
  createShortId,
  defaultQuestion,
  defaultScores,
  defaultScoresForNext,
  defaultState,
  filteredItems,
  getActiveItem,
  getPairwiseItems,
  gradeFor,
  hydrateStateImages,
  normalizeReviewMode,
  normalizeScores,
  normalizeState,
  persistInlineImages,
  recommendationFor,
  replaceState,
  safeImageData,
  sampleItems,
  saveState,
  setCurrentToNext,
  setNextPairwise,
  state,
  variantForRemix,
  writeImageData
} from "./state.js";
import {
  activePacket,
  closeDetailSheet,
  configureRenderActions,
  elements,
  openDetailSheet,
  render,
  renderRubric,
  renderTags,
  resetReviewPanels,
  setStorageStatus,
  showReviewerSaveStatus,
  toggleRefinePanel
} from "./render.js";
import { buildExportRows } from "./packet.js";
import { installGestureHandlers, pulseDevice } from "./gestures.js";

let pendingImageData = "";
let pendingImageKey = "";
let deferredInstallPrompt = null;

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
  resetReviewPanels();
  setCurrentToNext();
  saveState();
  pulseDevice(verdict);
  animateDecision(verdict);
}

function choosePairwise(side) {
  const pair = getPairwiseItems();
  if (!pair) {
    return;
  }

  const winner = side === "left" ? pair.left : pair.right;
  const loser = side === "left" ? pair.right : pair.left;
  state.pairwiseComparisons.push({
    id: createId(),
    leftItemId: pair.left.id,
    rightItemId: pair.right.id,
    winnerItemId: winner.id,
    loserItemId: loser.id,
    reviewer: state.reviewer,
    scoreDelta: 1,
    reasonTags: [],
    note: "",
    createdAt: new Date().toISOString()
  });
  setNextPairwise(pair);
  saveState();
  pulseDevice("pairwise");
  render();
}

function undoLastComparison() {
  const comparison = state.pairwiseComparisons.pop();
  if (!comparison) {
    return;
  }
  state.pairwise = {
    leftItemId: comparison.leftItemId,
    rightItemId: comparison.rightItemId
  };
  saveState();
  render();
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

function remixCurrentDeck() {
  const sourceItems = filteredItems();
  if (!sourceItems.length) {
    return;
  }

  const createdAt = new Date().toISOString();
  const remixItems = sourceItems.map((item) => ({
    ...item,
    id: createId(),
    variant: variantForRemix(item),
    agent: {
      ...item.agent,
      runId: createShortId("remix"),
      submittedAt: createdAt
    },
    createdAt
  }));

  state.items = [...remixItems, ...state.items];
  state.currentItemId = remixItems[0].id;
  state.lastPacketItemId = null;
  state.activeTags = [];
  state.draftScores = { ...defaultScores };
  elements.reviewNote.value = "";
  resetReviewPanels();
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
  return buildExportRows().map((row) => JSON.stringify(row)).join("\n");
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
      let importWarning = "";
      try {
        await clearImageStore();
      } catch {
        importWarning = "Profile imported, but previous image storage could not be fully cleared.";
      }
      replaceState(normalizeState(profile));
      try {
        await persistInlineImages();
      } catch {
        state.items = state.items.map((item) => ({
          ...item,
          imageData: ""
        }));
        importWarning = "Profile imported, but image storage is full or unavailable. Text, reviews, and packet data were saved without embedded images.";
      }
      setCurrentToNext();
      saveState();
      if (importWarning || state.items.some((item) => item.imageKey && !item.imageData)) {
        setStorageStatus(importWarning || "Profile imported, but image storage is full or unavailable. Text, reviews, and packet data were saved without embedded images.");
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
    "Import this AgentMash profile? This replaces reviews, comparisons, uploads, notes, and added artifacts in this browser. Export first if you want a backup."
  );
}

function hasLocalProfileData() {
  const sampleIds = new Set(sampleItems.map((item) => item.id));
  return (
    state.reviews.length > 0
    || state.pairwiseComparisons.length > 0
    || state.items.some((item) => !sampleIds.has(item.id) || item.imageData)
    || state.reviewer !== defaultState.reviewer
  );
}

async function resetProfile() {
  const confirmed = window.confirm(
    "Reset this local AgentMash profile? This clears reviews, comparisons, uploads, notes, and added artifacts in this browser."
  );
  if (!confirmed) {
    return;
  }

  let clearFailed = false;
  try {
    await clearImageStore();
  } catch {
    clearFailed = true;
  }
  replaceState(cloneDefaultState());
  pendingImageData = "";
  pendingImageKey = "";
  elements.reviewNote.value = "";
  elements.imageStatus.textContent = "No image selected.";
  saveState();
  render();
  if (clearFailed) {
    setStorageStatus("Profile reset, but image storage could not be cleared. Clear browser storage or reinstall before sharing this device.");
  }
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || window.location.protocol === "file:") {
    return;
  }
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}

configureStorageStatus(setStorageStatus);
configureRenderActions({ toggleTag });

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

elements.reviewModeTabs.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-review-mode]");
  if (!button) {
    return;
  }
  state.reviewMode = normalizeReviewMode(button.dataset.reviewMode);
  if (state.reviewMode === "pairwise") {
    setNextPairwise();
  }
  resetReviewPanels();
  saveState();
  render();
});

elements.endlessToggle.addEventListener("click", () => {
  state.endlessMode = !state.endlessMode;
  if (state.endlessMode) {
    state.reviewMode = "swipe";
  }
  saveState();
  render();
});

elements.filterTabs.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-filter]");
  if (!button) {
    return;
  }
  state.filter = button.dataset.filter;
  setCurrentToNext();
  setNextPairwise();
  state.lastPacketItemId = null;
  saveState();
  render();
});

elements.humanAddButton.addEventListener("click", openAddArtifactPanel);
elements.emptyRemixButton.addEventListener("click", remixCurrentDeck);
elements.emptyAddButton.addEventListener("click", openAddArtifactPanel);
elements.artifactType.addEventListener("change", () => {
  renderRubric(elements.artifactType.value);
});
elements.artifactImage.addEventListener("change", handleImageSelection);
elements.artifactForm.addEventListener("submit", addArtifact);
elements.refineButton.addEventListener("click", toggleRefinePanel);
elements.detailsButton.addEventListener("click", openDetailSheet);
elements.detailCloseButton.addEventListener("click", closeDetailSheet);
elements.pickLeftButton.addEventListener("click", () => choosePairwise("left"));
elements.pickRightButton.addEventListener("click", () => choosePairwise("right"));
elements.pairUndoButton.addEventListener("click", undoLastComparison);
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

installGestureHandlers({
  decide,
  choosePairwise,
  undoLastComparison,
  undoLastReview
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
