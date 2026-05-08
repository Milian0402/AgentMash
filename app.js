import {
  ALLOWED_IMAGE_TYPES,
  APP_VERSION,
  MAX_IMAGE_BYTES,
  audienceOptions,
  artifactTypes,
  calculateScore,
  clearImageStore,
  cloneDefaultState,
  configureStorageStatus,
  createId,
  createShortId,
  decisionStageOptions,
  defaultQuestion,
  defaultScores,
  defaultScoresForNext,
  defaultState,
  filteredItems,
  getActiveItem,
  getPairwiseItems,
  gradeFor,
  hydrateStateImages,
  normalizeItem,
  normalizeReviewMode,
  normalizeScores,
  normalizeState,
  persistInlineImages,
  priorityOptions,
  recommendationFor,
  replaceState,
  reviewFocusOptions,
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
  openRefinePanel,
  render,
  renderRubric,
  renderTags,
  resetReviewPanels,
  setStorageStatus,
  showReviewerSaveStatus,
  toggleScoreControls,
  toggleRefinePanel
} from "./render.js";
import { buildExportRows } from "./packet.js";
import { installGestureHandlers, pulseDevice } from "./gestures.js";

let pendingImageData = "";
let deferredInstallPrompt = null;
let imageSelectionToken = 0;
let isDecisionTransitioning = false;
let decisionAnimationTimer = 0;

function setMobilePanelOpen(isOpen) {
  document.body.dataset.mobilePanelOpen = isOpen ? "true" : "false";
  elements.mobilePanelToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
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
  if (isDecisionTransitioning) {
    return;
  }

  const item = getActiveItem();
  if (!item) {
    return;
  }

  const scores = normalizeScores(state.draftScores);
  const score = calculateScore(scores);
  const grade = gradeFor(score, verdict);
  setDecisionTransitioning(true);

  state.reviews = state.reviews.filter((review) => review.itemId !== item.id);
  state.reviews.push({
    id: createId(),
    itemId: item.id,
    reviewer: state.reviewer,
    filter: state.filter,
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
  elements.commentReason.value = "";
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
  if (isDecisionTransitioning) {
    return;
  }

  const review = state.reviews.pop();
  if (!review) {
    return;
  }
  const item = state.items.find((candidate) => candidate.id === review.itemId);
  if (["all", ...artifactTypes].includes(review.filter)) {
    state.filter = review.filter;
  } else if (item && state.filter !== "all" && state.filter !== item.type) {
    state.filter = "all";
  }
  state.currentItemId = review.itemId;
  state.lastPacketItemId = state.reviews.at(-1)?.itemId || null;
  state.draftScores = normalizeScores(review.scores);
  state.activeTags = [...review.tags];
  elements.reviewNote.value = review.note;
  elements.commentReason.value = "";
  saveState();
  render();
}

function animateDecision(verdict) {
  window.clearTimeout(decisionAnimationTimer);
  const x = verdict === "nice" ? window.innerWidth : -window.innerWidth;
  const rotation = verdict === "nice" ? 12 : -12;
  elements.swipeBadge.textContent = verdict === "nice" ? "Nice" : "Nope";
  elements.swipeCard.classList.add(verdict === "nice" ? "swipe-nice" : "swipe-pass");
  elements.swipeCard.style.transform = `translateX(${x}px) rotate(${rotation}deg)`;
  elements.swipeCard.style.opacity = "0";

  decisionAnimationTimer = window.setTimeout(() => {
    setDecisionTransitioning(false);
    render();
  }, decisionAnimationDuration());
}

function decisionAnimationDuration() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 35 : 190;
}

function setDecisionTransitioning(isLocked) {
  isDecisionTransitioning = isLocked;
  document.body.dataset.decisionTransition = isLocked ? "true" : "false";
  elements.swipeCard.classList.toggle("is-transitioning", isLocked);
  elements.swipeCard.setAttribute("aria-busy", isLocked ? "true" : "false");
  [
    elements.rejectButton,
    elements.acceptButton,
    elements.undoButton,
    elements.commentButton,
    elements.refineButton,
    elements.detailsButton,
    elements.advancedScoresButton
  ].forEach((button) => {
    button.disabled = isLocked;
  });
  elements.filterTabs.querySelectorAll("button").forEach((button) => {
    button.disabled = isLocked;
  });
}

function openCommentSheet() {
  openRefinePanel();
  window.setTimeout(() => {
    try {
      elements.reviewNote.focus({ preventScroll: true });
    } catch {
      elements.reviewNote.focus();
    }
  }, 0);
}

function applyQuickCommentReason() {
  const reason = elements.commentReason.value.trim();
  if (!reason) {
    return;
  }

  const currentNote = elements.reviewNote.value.trim();
  elements.reviewNote.value = currentNote ? `${currentNote}\n${reason}` : reason;
  elements.commentReason.value = "";
  openCommentSheet();
}

async function addArtifact(event) {
  event.preventDefault();
  const type = elements.artifactType.value;
  const title = elements.artifactTitle.value.trim();

  if (!title) {
    elements.artifactTitle.focus();
    return;
  }

  let imageKey = "";
  if (pendingImageData) {
    imageKey = createShortId("image");
    try {
      await writeImageData(imageKey, pendingImageData);
    } catch {
      elements.imageStatus.textContent = "Local image storage is full or unavailable. Add a text-only artifact or use a smaller image.";
      return;
    }
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
      requesterName: elements.agentRequesterName.value.trim() || `${elements.agentRequesterType.value}-source`,
      runId: elements.agentRunId.value.trim() || createShortId("run"),
      goal: elements.agentGoal.value.trim(),
      returnMode: elements.agentReturnMode.value,
      returnTarget: elements.agentReturnTarget.value.trim(),
      submittedAt: new Date().toISOString()
    },
    reviewContext: {
      focus: elements.reviewFocus.value,
      audience: elements.reviewAudience.value,
      stage: elements.decisionStage.value,
      priority: elements.reviewPriority.value,
      notes: elements.reviewContextNotes.value.trim()
    },
    imageKey,
    imageData: pendingImageData,
    createdAt: new Date().toISOString()
  };

  state.items = [item, ...state.items];
  state.filter = type;
  state.currentItemId = item.id;
  state.dashboard = "human";
  pendingImageData = "";
  imageSelectionToken += 1;
  elements.artifactForm.reset();
  elements.imageStatus.textContent = "No image selected.";
  resetArtifactFormDefaults();
  saveState();
  render();
}

function resetArtifactFormDefaults() {
  elements.agentRequesterType.value = "agent";
  elements.agentReturnMode.value = "json";
  elements.reviewFocus.value = "first_impression";
  elements.reviewAudience.value = "general";
  elements.decisionStage.value = "concept";
  elements.reviewPriority.value = "normal";
}

function payloadArtifacts(payload) {
  if (Array.isArray(payload?.artifacts)) {
    return payload.artifacts;
  }
  return [];
}

function validateAgentDropPayload(payload) {
  const errors = [];
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return ["payload must be an agentmash.intake.v1 object"];
  }

  if (payload.schema !== "agentmash.intake.v1") {
    errors.push("schema must be agentmash.intake.v1");
  }

  if (!Array.isArray(payload.artifacts) || payload.artifacts.length === 0) {
    errors.push("artifacts must include at least one artifact");
  }

  validateSource(payload.source, errors, "source");
  validateReviewContextInput(payload.reviewContext, errors, "reviewContext");

  payloadArtifacts(payload).forEach((artifact, index) => {
    const path = `artifacts[${index}]`;
    if (!artifact || typeof artifact !== "object" || Array.isArray(artifact)) {
      errors.push(`${path} must be an object`);
      return;
    }

    if (!artifactTypes.includes(artifact.type)) {
      errors.push(`${path}.type must be website, logo, copy, or product`);
    }
    if (!isNonEmptyString(artifact.title)) {
      errors.push(`${path}.title is required`);
    }

    validateSource(artifact.agent, errors, `${path}.agent`);
    validateReviewContextInput(artifact.reviewContext || artifact.context, errors, `${path}.reviewContext`);
    validateImageDataUrl(artifact.imageData, errors, `${path}.imageData`);
    validateImageDataUrl(artifact.image?.dataUrl, errors, `${path}.image.dataUrl`);
  });

  return errors;
}

function validateSource(source, errors, path) {
  if (source === undefined) {
    return;
  }
  if (!source || typeof source !== "object" || Array.isArray(source)) {
    errors.push(`${path} must be an object`);
    return;
  }
  if (source.requesterType !== undefined && !["agent", "lab", "team"].includes(source.requesterType)) {
    errors.push(`${path}.requesterType must be agent, lab, or team`);
  }
  if (source.returnMode !== undefined && !["json", "dataset"].includes(source.returnMode)) {
    errors.push(`${path}.returnMode must be json or dataset`);
  }
}

function validateReviewContextInput(context, errors, path) {
  if (context === undefined) {
    return;
  }
  if (!context || typeof context !== "object" || Array.isArray(context)) {
    errors.push(`${path} must be an object`);
    return;
  }
  if (context.focus !== undefined && !reviewFocusOptions.includes(context.focus)) {
    errors.push(`${path}.focus is not supported`);
  }
  if (context.audience !== undefined && !audienceOptions.includes(context.audience)) {
    errors.push(`${path}.audience is not supported`);
  }
  if (context.stage !== undefined && !decisionStageOptions.includes(context.stage)) {
    errors.push(`${path}.stage is not supported`);
  }
  if (context.priority !== undefined && !priorityOptions.includes(context.priority)) {
    errors.push(`${path}.priority is not supported`);
  }
}

function validateImageDataUrl(value, errors, path) {
  if (value === undefined || value === "") {
    return;
  }
  if (typeof value !== "string" || !safeImageData(value)) {
    errors.push(`${path} must be a PNG, JPG, or WebP data URL`);
  }
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeAgentDropItem(rawArtifact, payload = {}) {
  const payloadSource = payload.source || payload.agent || {};
  const artifactAgent = rawArtifact.agent || {};
  const imageData = safeImageData(rawArtifact.imageData || rawArtifact.image?.dataUrl || "");
  return normalizeItem({
    ...rawArtifact,
    imageData,
    agent: {
      ...payloadSource,
      ...artifactAgent,
      requesterType: artifactAgent.requesterType || payloadSource.requesterType || "agent",
      requesterName: artifactAgent.requesterName || artifactAgent.name || payloadSource.requesterName || payloadSource.name,
      runId: artifactAgent.runId || rawArtifact.runId || payloadSource.runId || payload.runId,
      goal: artifactAgent.goal || rawArtifact.goal || payloadSource.goal || payload.goal,
      returnMode: artifactAgent.returnMode || payload.returnMode || payloadSource.returnMode || "json",
      returnTarget: artifactAgent.returnTarget || payload.returnTarget || payloadSource.returnTarget
    },
    reviewContext: {
      ...(payload.reviewContext || payload.context || {}),
      ...(rawArtifact.reviewContext || rawArtifact.context || {})
    },
    createdAt: rawArtifact.createdAt || new Date().toISOString()
  });
}

async function importAgentDrop(file) {
  elements.agentDropStatus.textContent = "Reading agent drop...";
  try {
    const payload = JSON.parse(await file.text());
    const validationErrors = validateAgentDropPayload(payload);
    if (validationErrors.length) {
      elements.agentDropStatus.textContent = `Agent drop rejected: ${validationErrors.slice(0, 3).join("; ")}.`;
      return;
    }

    const artifacts = payloadArtifacts(payload)
      .filter((artifact) => artifact && typeof artifact === "object")
      .map((artifact) => normalizeAgentDropItem(artifact, payload));

    if (!artifacts.length) {
      elements.agentDropStatus.textContent = "No artifacts found in that JSON file.";
      return;
    }

    let imageFailures = 0;
    await Promise.all(artifacts.map(async (item) => {
      if (!item.imageData) {
        return;
      }
      try {
        await writeImageData(item.imageKey, item.imageData);
      } catch {
        item.imageKey = "";
        item.imageData = "";
        imageFailures += 1;
      }
    }));

    state.items = [...artifacts, ...state.items];
    state.filter = artifacts[0].type;
    state.currentItemId = artifacts[0].id;
    state.lastPacketItemId = null;
    state.dashboard = "human";
    saveState();
    elements.agentDropStatus.textContent = imageFailures
      ? `Imported ${artifacts.length} artifacts. ${imageFailures} image${imageFailures === 1 ? "" : "s"} could not be stored.`
      : `Imported ${artifacts.length} artifacts from agent drop.`;
    render();
  } catch {
    elements.agentDropStatus.textContent = "Could not import that agent drop JSON file.";
  }
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
  const selectionToken = imageSelectionToken + 1;
  imageSelectionToken = selectionToken;
  const [file] = elements.artifactImage.files;
  pendingImageData = "";

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

    if (selectionToken !== imageSelectionToken) {
      return;
    }

    pendingImageData = imageData;
    elements.imageStatus.textContent = `${file.name} ready for local review.`;
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
  imageSelectionToken += 1;
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

function scrollReviewStageIntoView() {
  if (state.dashboard !== "human" || !window.matchMedia("(max-width: 760px)").matches) {
    return;
  }
  window.requestAnimationFrame(() => {
    elements.reviewStage.scrollIntoView({ block: "start", behavior: "auto" });
  });
}

configureStorageStatus(setStorageStatus);
configureRenderActions({ toggleTag });

elements.dashboardSwitch.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-dashboard]");
  if (!button) {
    return;
  }
  state.dashboard = button.dataset.dashboard;
  setMobilePanelOpen(false);
  saveState();
  render();
  scrollReviewStageIntoView();
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
  setMobilePanelOpen(false);
  saveState();
  render();
  scrollReviewStageIntoView();
});

elements.endlessToggle.addEventListener("click", () => {
  state.endlessMode = !state.endlessMode;
  if (state.endlessMode) {
    state.reviewMode = "swipe";
  }
  setMobilePanelOpen(false);
  saveState();
  render();
});

elements.filterTabs.addEventListener("click", (event) => {
  if (isDecisionTransitioning) {
    return;
  }

  const button = event.target.closest("button[data-filter]");
  if (!button) {
    return;
  }
  state.filter = button.dataset.filter;
  setCurrentToNext();
  setNextPairwise();
  state.lastPacketItemId = null;
  setMobilePanelOpen(false);
  saveState();
  render();
});

elements.mobilePanelToggle.addEventListener("click", () => {
  setMobilePanelOpen(document.body.dataset.mobilePanelOpen !== "true");
});
elements.mobilePanelClose.addEventListener("click", () => setMobilePanelOpen(false));
elements.humanAddButton.addEventListener("click", openAddArtifactPanel);
elements.emptyRemixButton.addEventListener("click", remixCurrentDeck);
elements.emptyAddButton.addEventListener("click", openAddArtifactPanel);
elements.artifactType.addEventListener("change", () => {
  renderRubric(elements.artifactType.value);
});
elements.artifactImage.addEventListener("change", handleImageSelection);
elements.artifactForm.addEventListener("submit", addArtifact);
elements.agentDropButton.addEventListener("click", () => elements.agentDropFile.click());
elements.agentDropFile.addEventListener("change", () => {
  const [file] = elements.agentDropFile.files;
  if (file) {
    importAgentDrop(file);
  }
  elements.agentDropFile.value = "";
});
elements.refineButton.addEventListener("click", toggleRefinePanel);
elements.commentButton.addEventListener("click", openCommentSheet);
elements.commentReason.addEventListener("change", applyQuickCommentReason);
elements.advancedScoresButton.addEventListener("click", toggleScoreControls);
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
  undoLastReview,
  isDecisionLocked: () => isDecisionTransitioning
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
  try {
    await deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
  } finally {
    deferredInstallPrompt = null;
    elements.installButton.hidden = true;
  }
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  elements.installButton.hidden = true;
});

render();
restoreStoredImages();
registerServiceWorker();
