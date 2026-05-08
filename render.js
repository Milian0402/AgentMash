import {
  agentLine,
  calculateScore,
  ensureEndlessItem,
  escapeHtml,
  estimateImageStoreBytes,
  filteredItems,
  getActiveItem,
  getPairwiseItems,
  gradeFor,
  LOCAL_STORAGE_APPROX_LIMIT,
  localStorageProfileBytes,
  normalizeVariant,
  pendingItems,
  quickTags,
  saveState,
  scoreDimensions,
  shortTitle,
  state,
  typeLabel,
  typeRubrics
} from "./state.js";
import {
  buildEvalRows,
  buildFeedbackPacket,
  buildPairwiseRows,
  buildPendingPacket,
  preferenceLabelFor,
  recommendedActionFor,
  repairInstructionFor,
  signalCoverage,
  signalStrengthFor,
  validateExportRows,
  validateFeedbackPacket
} from "./packet.js";

export const elements = {
  dashboardSwitch: document.querySelector("#dashboardSwitch"),
  humanDashboard: document.querySelector("#humanDashboard"),
  agentDashboard: document.querySelector("#agentDashboard"),
  reviewStage: document.querySelector(".review-stage"),
  humanPanel: document.querySelector("#humanPanel"),
  mobilePanelToggle: document.querySelector("#mobilePanelToggle"),
  mobilePanelClose: document.querySelector("#mobilePanelClose"),
  reviewerName: document.querySelector("#reviewerName"),
  reviewModeTabs: document.querySelector("#reviewModeTabs"),
  endlessToggle: document.querySelector("#endlessToggle"),
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
  agentDropButton: document.querySelector("#agentDropButton"),
  agentDropFile: document.querySelector("#agentDropFile"),
  agentDropStatus: document.querySelector("#agentDropStatus"),
  agentRequesterType: document.querySelector("#agentRequesterType"),
  agentRequesterName: document.querySelector("#agentRequesterName"),
  agentRunId: document.querySelector("#agentRunId"),
  agentReturnMode: document.querySelector("#agentReturnMode"),
  agentReturnTarget: document.querySelector("#agentReturnTarget"),
  agentGoal: document.querySelector("#agentGoal"),
  reviewFocus: document.querySelector("#reviewFocus"),
  reviewAudience: document.querySelector("#reviewAudience"),
  decisionStage: document.querySelector("#decisionStage"),
  reviewPriority: document.querySelector("#reviewPriority"),
  reviewContextNotes: document.querySelector("#reviewContextNotes"),
  stageEyebrow: document.querySelector("#stageEyebrow"),
  stageTitle: document.querySelector("#stageTitle"),
  stageProgress: document.querySelector("#stageProgress"),
  streakCounter: document.querySelector("#streakCounter"),
  keyboardLeftHint: document.querySelector("#keyboardLeftHint"),
  keyboardRightHint: document.querySelector("#keyboardRightHint"),
  swipeCard: document.querySelector("#swipeCard"),
  swipeActions: document.querySelector(".swipe-actions"),
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
  pairwiseStage: document.querySelector("#pairwiseStage"),
  pairLeftPreview: document.querySelector("#pairLeftPreview"),
  pairRightPreview: document.querySelector("#pairRightPreview"),
  pairLeftTitle: document.querySelector("#pairLeftTitle"),
  pairRightTitle: document.querySelector("#pairRightTitle"),
  pickLeftButton: document.querySelector("#pickLeftButton"),
  pickRightButton: document.querySelector("#pickRightButton"),
  pairwiseStatus: document.querySelector("#pairwiseStatus"),
  pairUndoButton: document.querySelector("#pairUndoButton"),
  emptyState: document.querySelector("#emptyState"),
  emptyTitle: document.querySelector("#emptyTitle"),
  emptyCopy: document.querySelector("#emptyCopy"),
  keeperList: document.querySelector("#keeperList"),
  emptyRemixButton: document.querySelector("#emptyRemixButton"),
  emptyAddButton: document.querySelector("#emptyAddButton"),
  rejectButton: document.querySelector("#rejectButton"),
  acceptButton: document.querySelector("#acceptButton"),
  undoButton: document.querySelector("#undoButton"),
  commentButton: document.querySelector("#commentButton"),
  scoreControls: document.querySelector("#scoreControls"),
  refineButton: document.querySelector("#refineButton"),
  advancedScoresButton: document.querySelector("#advancedScoresButton"),
  closeRefineButton: document.querySelector("#closeRefineButton"),
  signalPanel: document.querySelector("#signalPanel"),
  liveScore: document.querySelector("#liveScore"),
  liveGrade: document.querySelector("#liveGrade"),
  tagRow: document.querySelector("#tagRow"),
  commentReason: document.querySelector("#commentReason"),
  reviewNote: document.querySelector("#reviewNote"),
  standardType: document.querySelector("#standardType"),
  rubricList: document.querySelector("#rubricList"),
  niceRate: document.querySelector("#niceRate"),
  avgScore: document.querySelector("#avgScore"),
  keeperCount: document.querySelector("#keeperCount"),
  passCount: document.querySelector("#passCount"),
  profileInsights: document.querySelector("#profileInsights"),
  reviewedCount: document.querySelector("#reviewedCount"),
  storageHealthStatus: document.querySelector("#storageHealthStatus"),
  localStorageUsage: document.querySelector("#localStorageUsage"),
  imageStorageUsage: document.querySelector("#imageStorageUsage"),
  agentTotalRequests: document.querySelector("#agentTotalRequests"),
  agentReadyPackets: document.querySelector("#agentReadyPackets"),
  agentPendingRequests: document.querySelector("#agentPendingRequests"),
  agentAvgConfidence: document.querySelector("#agentAvgConfidence"),
  agentRequestList: document.querySelector("#agentRequestList"),
  datasetStatus: document.querySelector("#datasetStatus"),
  datasetContractStatus: document.querySelector("#datasetContractStatus"),
  datasetPreview: document.querySelector("#datasetPreview"),
  copyDatasetButton: document.querySelector("#copyDatasetButton"),
  downloadDatasetButton: document.querySelector("#downloadDatasetButton"),
  agentUseList: document.querySelector("#agentUseList"),
  agentSignalList: document.querySelector("#agentSignalList"),
  historyList: document.querySelector("#historyList"),
  packetStatus: document.querySelector("#packetStatus"),
  packetContractStatus: document.querySelector("#packetContractStatus"),
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

let reviewerStatusTimer = null;
let lastMomentumMilestone = 0;
let storageHealthRequest = 0;
let isRefineOpen = false;
let isScoreControlsOpen = false;
let isDetailSheetOpen = false;
let renderActions = {
  toggleTag: () => {}
};

export function configureRenderActions(actions) {
  renderActions = { ...renderActions, ...actions };
}

export function setStorageStatus(message) {
  elements.storageStatus.textContent = message;
  elements.storageStatus.hidden = !message;
}

export function showReviewerSaveStatus(message, isError = false) {
  window.clearTimeout(reviewerStatusTimer);
  elements.reviewerSaveStatus.textContent = message;
  elements.reviewerSaveStatus.classList.toggle("is-error", isError);
  elements.reviewerSaveStatus.hidden = false;

  reviewerStatusTimer = window.setTimeout(() => {
    elements.reviewerSaveStatus.hidden = true;
  }, isError ? 3200 : 1600);
}

export function resetReviewPanels() {
  isRefineOpen = false;
  isScoreControlsOpen = false;
  isDetailSheetOpen = false;
}

export function toggleRefinePanel() {
  isRefineOpen = !isRefineOpen;
  if (!isRefineOpen) {
    isScoreControlsOpen = false;
  }
  renderRefinePanel();
}

export function openRefinePanel() {
  isRefineOpen = true;
  renderRefinePanel();
}

export function closeRefinePanel() {
  isRefineOpen = false;
  isScoreControlsOpen = false;
  renderRefinePanel();
}

export function toggleScoreControls() {
  isScoreControlsOpen = !isScoreControlsOpen;
  renderRefinePanel();
}

export function openDetailSheet() {
  isDetailSheetOpen = true;
  renderDetailSheet();
}

export function closeDetailSheet() {
  isDetailSheetOpen = false;
  renderDetailSheet();
}

export function render() {
  const isPairwise = state.reviewMode === "pairwise";
  let activeItem = getActiveItem();
  let pending = pendingItems();
  const filtered = filteredItems();
  if (!isPairwise && !activeItem) {
    const endlessItem = ensureEndlessItem();
    if (endlessItem) {
      activeItem = endlessItem;
      pending = pendingItems();
    }
  }
  const pairwisePair = getPairwiseItems();
  const activeType = isPairwise
    ? pairwisePair?.left.type || (state.filter === "all" ? "website" : state.filter)
    : activeItem ? activeItem.type : state.filter === "all" ? "website" : state.filter;

  renderDashboardShell();
  elements.reviewerName.value = state.reviewer;
  elements.queueCount.textContent = `${isPairwise ? filtered.length : pending.length}`;
  elements.stageEyebrow.textContent = isPairwise ? `${typeLabel(activeType)} comparison` : `${typeLabel(activeType)} judgement`;
  elements.stageTitle.textContent = isPairwise
    ? pairwisePair ? "Pick the stronger first glance" : "Add two artifacts to compare"
    : activeItem ? "Trust your first reaction" : "Nothing left in this view";
  elements.stageProgress.textContent = isPairwise
    ? `${state.pairwiseComparisons.length} picks`
    : activeItem ? "Ready" : "Done";
  elements.standardType.textContent = typeLabel(activeType);

  renderTabs();
  renderReviewModeTabs();
  renderEndlessToggle();
  renderMomentum();
  renderRubric(activeType);
  renderScoreControls();
  renderTags();
  renderMetrics();
  renderStorageHealth();
  renderHistory();
  renderAgentDashboard();
  renderLiveScore();
  if (isPairwise) {
    resetReviewPanels();
  }
  renderRefinePanel();
  renderDetailSheet();

  if (isPairwise) {
    renderPairwise(pairwisePair, filtered);
    renderFeedbackPacket(packetItemForRender(null));
    saveState();
    return;
  }

  elements.pairwiseStage.hidden = true;
  elements.swipeActions.hidden = false;
  elements.refineButton.hidden = false;
  elements.keyboardLeftHint.textContent = "Left: nope";
  elements.keyboardRightHint.textContent = "Right: nice";

  elements.emptyState.hidden = Boolean(activeItem);
  elements.swipeCard.hidden = !activeItem;
  elements.rejectButton.disabled = !activeItem;
  elements.acceptButton.disabled = !activeItem;
  elements.commentButton.disabled = !activeItem;
  elements.refineButton.disabled = !activeItem;
  elements.undoButton.disabled = state.reviews.length === 0;

  if (!activeItem) {
    isDetailSheetOpen = false;
    renderCompletionSummary(filtered);
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

export function renderDashboardShell() {
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

export function renderTabs() {
  elements.filterTabs.querySelectorAll(".segment").forEach((button) => {
    const active = button.dataset.filter === state.filter;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

export function renderReviewModeTabs() {
  elements.reviewModeTabs.querySelectorAll("[data-review-mode]").forEach((button) => {
    const active = button.dataset.reviewMode === state.reviewMode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

export function renderEndlessToggle() {
  const enabled = Boolean(state.endlessMode);
  elements.endlessToggle.textContent = enabled ? "Endless on" : "Endless off";
  elements.endlessToggle.classList.toggle("active", enabled);
  elements.endlessToggle.setAttribute("aria-pressed", enabled ? "true" : "false");
  elements.endlessToggle.disabled = state.reviewMode === "pairwise";
}

export function renderMomentum() {
  const momentum = reviewMomentum();
  elements.streakCounter.textContent = `${momentum.currentRun} in a row, ${momentum.todayCount} today, ${momentum.dayStreak}-day streak`;
  const milestone = [50, 25, 10].find((value) => momentum.currentRun === value || momentum.todayCount === value) || 0;
  if (milestone && milestone !== lastMomentumMilestone) {
    lastMomentumMilestone = milestone;
    elements.streakCounter.classList.remove("milestone-hit");
    window.requestAnimationFrame(() => {
      elements.streakCounter.classList.add("milestone-hit");
      window.setTimeout(() => {
        elements.streakCounter.classList.remove("milestone-hit");
      }, 720);
    });
  }
  if (!milestone) {
    lastMomentumMilestone = 0;
  }
}

function reviewMomentum() {
  const reviews = [...state.reviews]
    .map((review) => ({
      ...review,
      createdDate: new Date(review.createdAt)
    }))
    .filter((review) => !Number.isNaN(review.createdDate.getTime()))
    .sort((a, b) => a.createdDate - b.createdDate);

  const now = new Date();
  const todayKey = localDayKey(now);
  const todayCount = reviews.filter((review) => localDayKey(review.createdDate) === todayKey).length;
  const reviewedDays = new Set(reviews.map((review) => localDayKey(review.createdDate)));
  let dayStreak = 0;
  const cursor = new Date(now);
  while (reviewedDays.has(localDayKey(cursor))) {
    dayStreak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  let currentRun = 0;
  let previousDate = now;
  for (const review of [...reviews].reverse()) {
    if (previousDate - review.createdDate > 30 * 60 * 1000) {
      break;
    }
    currentRun += 1;
    previousDate = review.createdDate;
  }

  return { currentRun, todayCount, dayStreak };
}

function localDayKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function renderPairwise(pair) {
  elements.swipeCard.hidden = true;
  elements.swipeActions.hidden = true;
  elements.refineButton.hidden = true;
  elements.rejectButton.disabled = true;
  elements.acceptButton.disabled = true;
  elements.undoButton.disabled = true;
  elements.keyboardLeftHint.textContent = "A: left";
  elements.keyboardRightHint.textContent = "L: right";

  if (!pair) {
    elements.pairwiseStage.hidden = true;
    elements.emptyState.hidden = false;
    elements.emptyTitle.textContent = "Pairwise needs two cards";
    elements.emptyCopy.textContent = "Add another artifact or switch filters to compare first impressions.";
    elements.keeperList.replaceChildren();
    elements.emptyRemixButton.hidden = true;
    return;
  }

  state.pairwise = {
    leftItemId: pair.left.id,
    rightItemId: pair.right.id
  };
  elements.emptyState.hidden = true;
  elements.pairwiseStage.hidden = false;
  elements.pairLeftPreview.innerHTML = renderPreview(pair.left);
  elements.pairRightPreview.innerHTML = renderPreview(pair.right);
  elements.pairLeftTitle.textContent = pair.left.title;
  elements.pairRightTitle.textContent = pair.right.title;
  elements.pairwiseStatus.textContent = `${state.pairwiseComparisons.length} picks`;
  elements.pairUndoButton.disabled = state.pairwiseComparisons.length === 0;
}

export function renderRubric(type) {
  elements.rubricList.replaceChildren();
  typeRubrics[type].forEach((criterion) => {
    const item = document.createElement("li");
    item.textContent = criterion;
    elements.rubricList.append(item);
  });
}

export function renderScoreControls() {
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

export function renderRefinePanel() {
  elements.signalPanel.hidden = !isRefineOpen;
  elements.refineButton.classList.toggle("active", isRefineOpen);
  elements.refineButton.setAttribute("aria-expanded", isRefineOpen ? "true" : "false");
  elements.commentButton.classList.toggle("active", isRefineOpen);
  elements.commentButton.setAttribute("aria-expanded", isRefineOpen ? "true" : "false");
  elements.scoreControls.hidden = !isRefineOpen || !isScoreControlsOpen;
  elements.advancedScoresButton.classList.toggle("active", isScoreControlsOpen);
  elements.advancedScoresButton.setAttribute("aria-expanded", isScoreControlsOpen ? "true" : "false");
}

export function renderDetailSheet() {
  elements.detailSheet.hidden = !isDetailSheetOpen;
  elements.detailsButton.classList.toggle("active", isDetailSheetOpen);
  elements.detailsButton.setAttribute("aria-expanded", isDetailSheetOpen ? "true" : "false");
}

export function renderTags() {
  elements.tagRow.replaceChildren();
  quickTags.forEach((tag) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tag-chip";
    button.textContent = tag;
    button.classList.toggle("active", state.activeTags.includes(tag));
    button.addEventListener("click", () => renderActions.toggleTag(tag));
    elements.tagRow.append(button);
  });
}

export function renderMetrics() {
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
  renderProfileInsights();
}

export function renderStorageHealth() {
  const requestId = storageHealthRequest + 1;
  storageHealthRequest = requestId;
  const localBytes = localStorageProfileBytes();
  const localRatio = localBytes / LOCAL_STORAGE_APPROX_LIMIT;

  elements.localStorageUsage.textContent = `${formatBytes(localBytes)} of ~${formatBytes(LOCAL_STORAGE_APPROX_LIMIT)}`;
  elements.storageHealthStatus.textContent = localRatio > 0.9 ? "Tight" : "Healthy";
  elements.storageHealthStatus.classList.toggle("warning", localRatio > 0.9);
  elements.imageStorageUsage.textContent = "Checking IndexedDB";

  estimateImageStoreBytes()
    .then((imageBytes) => {
      if (storageHealthRequest !== requestId) {
        return;
      }
      elements.imageStorageUsage.textContent = `${formatBytes(imageBytes)} IndexedDB`;
    })
    .catch(() => {
      if (storageHealthRequest !== requestId) {
        return;
      }
      elements.imageStorageUsage.textContent = "IndexedDB unavailable";
      elements.storageHealthStatus.textContent = "Limited";
      elements.storageHealthStatus.classList.add("warning");
    });
}

function formatBytes(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`;
}

export function renderProfileInsights() {
  elements.profileInsights.replaceChildren();
  const insights = profileInsights();

  insights.forEach((text) => {
    const row = document.createElement("p");
    row.textContent = text;
    elements.profileInsights.append(row);
  });
}

function profileInsights() {
  if (!state.reviews.length) {
    return ["No patterns yet."];
  }

  const insights = [];
  const tagRows = tagInsightRows();
  const typeRows = typeInsightRows();
  if (tagRows[0]) {
    insights.push(tagRows[0]);
  }
  if (typeRows[0]) {
    insights.push(typeRows[0]);
  }

  const reviewedToday = state.reviews.filter((review) => localDayKey(new Date(review.createdAt)) === localDayKey(new Date())).length;
  insights.push(`${reviewedToday} reviewed today, ${state.reviews.length} total.`);
  return insights.slice(0, 3);
}

function tagInsightRows() {
  const counts = new Map();
  state.reviews.forEach((review) => {
    review.tags.forEach((tag) => {
      const current = counts.get(tag) || { total: 0, rejected: 0, nice: 0 };
      current.total += 1;
      current.rejected += review.verdict === "pass" ? 1 : 0;
      current.nice += review.verdict === "nice" ? 1 : 0;
      counts.set(tag, current);
    });
  });

  return [...counts.entries()]
    .filter(([, stats]) => stats.total > 0)
    .sort(([, a], [, b]) => (
      b.total - a.total
      || signalDistance(b) - signalDistance(a)
      || b.rejected - a.rejected
    ))
    .map(([tag, stats]) => {
      const rejectedRate = Math.round(stats.rejected / stats.total * 100);
      const niceRate = 100 - rejectedRate;
      const tagLabel = sentenceCase(tag).toLowerCase();
      const totalLabel = decisionCountLabel(stats.total);
      return rejectedRate >= niceRate
        ? `You reject ${tagLabel} cues ${rejectedRate}% of the time across ${totalLabel}.`
        : `You keep ${tagLabel} cues ${niceRate}% of the time across ${totalLabel}.`;
    });
}

function typeInsightRows() {
  const counts = new Map();
  state.reviews.forEach((review) => {
    const item = state.items.find((candidate) => candidate.id === review.itemId);
    if (!item) {
      return;
    }
    const current = counts.get(item.type) || { total: 0, nice: 0 };
    current.total += 1;
    current.nice += review.verdict === "nice" ? 1 : 0;
    counts.set(item.type, current);
  });

  return [...counts.entries()]
    .filter(([, stats]) => stats.total > 0)
    .sort(([, a], [, b]) => (
      b.total - a.total
      || signalDistance(b) - signalDistance(a)
      || b.nice - a.nice
    ))
    .map(([type, stats]) => {
      const niceRate = Math.round(stats.nice / stats.total * 100);
      const nopeRate = 100 - niceRate;
      const totalLabel = decisionCountLabel(stats.total);
      if (niceRate >= 60) {
        return `${pluralTypeLabel(type)} survive ${niceRate}% of the time across ${totalLabel}.`;
      }
      if (nopeRate >= 60) {
        return `${pluralTypeLabel(type)} are rejected ${nopeRate}% of the time across ${totalLabel}.`;
      }
      return `${pluralTypeLabel(type)} split close: ${niceRate}% nice across ${totalLabel}.`;
    });
}

function signalDistance(stats) {
  const niceRate = stats.nice / stats.total;
  return Math.abs(niceRate - 0.5);
}

function decisionCountLabel(count) {
  return `${count} ${count === 1 ? "decision" : "decisions"}`;
}

function pluralTypeLabel(type) {
  return {
    website: "Websites",
    logo: "Logos",
    copy: "Copy lines",
    product: "Products"
  }[type] || `${typeLabel(type)} items`;
}

function sentenceCase(value) {
  const text = String(value).replaceAll("-", " ");
  return text ? `${text[0].toUpperCase()}${text.slice(1)}` : "";
}

export function renderCompletionSummary(filtered) {
  const itemIds = new Set(filtered.map((item) => item.id));
  const reviewsInView = state.reviews.filter((review) => itemIds.has(review.itemId));
  const keepers = [...reviewsInView]
    .filter((review) => review.verdict === "nice")
    .reverse()
    .slice(0, 6);

  elements.emptyState.classList.toggle("has-keepers", keepers.length > 0);
  elements.emptyTitle.textContent = keepers.length
    ? `${keepers.length} survived`
    : "Deck complete";
  elements.emptyCopy.textContent = keepers.length
    ? `${reviewsInView.length} decisions in this view. Keep the strongest first-glance signals moving.`
    : "No keepers in this view yet. Add another artifact or switch filters.";
  elements.emptyRemixButton.hidden = filtered.length === 0;
  elements.emptyRemixButton.textContent = filtered.length > 1 ? `Remix ${filtered.length} cards` : "Remix deck";
  elements.keeperList.replaceChildren();

  keepers.forEach((review) => {
    const item = state.items.find((candidate) => candidate.id === review.itemId);
    if (!item) {
      return;
    }

    const row = document.createElement("article");
    row.className = "keeper-item";

    const badge = document.createElement("span");
    badge.className = "keeper-badge";
    badge.textContent = "Keeper";

    const title = document.createElement("strong");
    title.textContent = item.title;

    const detail = document.createElement("span");
    detail.textContent = `${typeLabel(item.type)} / ${review.score} score`;

    row.append(badge, title, detail);
    elements.keeperList.append(row);
  });
}

export function renderHistory() {
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

export function renderAgentDashboard() {
  const reviewByItem = new Map(state.reviews.map((review) => [review.itemId, review]));
  const readyCount = state.reviews.length;
  const pendingCount = state.items.filter((item) => !reviewByItem.has(item.id)).length;
  const evalRows = buildEvalRows();
  const exportRows = [...evalRows, ...buildPairwiseRows()];
  const avgSignalStrength = evalRows.length
    ? Math.round(evalRows.reduce((sum, row) => sum + row.humanSignal.signalStrength, 0) / evalRows.length * 100)
    : null;

  elements.agentTotalRequests.textContent = `${state.items.length} artifacts`;
  elements.agentReadyPackets.textContent = `${readyCount}`;
  elements.agentPendingRequests.textContent = `${pendingCount}`;
  elements.agentAvgConfidence.textContent = avgSignalStrength === null ? "None" : `${avgSignalStrength}%`;
  renderDatasetPreview(exportRows);
  renderAgentUsePanel(exportRows);

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
        `use: ${recommendedActionFor(review)}`,
        `focus: ${item.reviewContext.focus}`,
        `audience: ${item.reviewContext.audience}`
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
    returnTarget.textContent = `Export: ${item.agent.returnMode} / ${item.agent.returnTarget || "local export"} / ${item.reviewContext.stage}`;
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

export function renderDatasetPreview(evalRows) {
  elements.datasetStatus.textContent = `${evalRows.length} rows`;
  elements.copyDatasetButton.disabled = evalRows.length === 0;
  elements.downloadDatasetButton.disabled = evalRows.length === 0;
  const contract = validateExportRows(evalRows);
  renderContractStatus(
    elements.datasetContractStatus,
    !evalRows.length ? "No rows" : contract.valid ? "Rows valid" : "Rows issue",
    evalRows.length > 0 && contract.valid,
    contract.errors
  );

  if (!evalRows.length) {
    elements.datasetPreview.textContent = "No export rows yet. Swipe at least one artifact to create JSONL eval data.";
    return;
  }

  elements.datasetPreview.textContent = evalRows
    .slice(0, 3)
    .map((row) => JSON.stringify(row))
    .join("\n");
}

export function renderAgentUsePanel(evalRows) {
  elements.agentUseList.replaceChildren();
  const packet = activePacket();
  const selectedUse = packet?.agentUse;
  const selectedContext = packet?.request?.reviewContext;
  const rows = selectedUse
    ? [
        ["Preference label", selectedUse.preferenceLabel],
        ["Signal strength", `${Math.round(selectedUse.signalStrength * 100)}%`],
        ["Review focus", selectedContext ? `${selectedContext.focus} for ${selectedContext.audience}` : "None"],
        ["Stage", selectedContext ? `${selectedContext.stage} / ${selectedContext.priority}` : "None"],
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

export function renderAgentSignals(reviewByItem) {
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

export function renderFeedbackPacket(activeItem) {
  const packetItem = activeItem;
  const review = packetItem ? state.reviews.find((candidate) => candidate.itemId === packetItem.id) : null;
  const packet = packetItem && review ? buildFeedbackPacket(packetItem, review) : buildPendingPacket(packetItem);

  elements.packetStatus.textContent = packet.status === "ready"
    ? "Ready"
    : packet.status === "empty" ? "Empty" : "Pending";
  const contract = validateFeedbackPacket(packet);
  renderContractStatus(
    elements.packetContractStatus,
    contract.valid ? `${packet.schema.replace("agentmash.feedback.", "")} valid` : "Schema issue",
    contract.valid,
    contract.errors
  );
  elements.packetPreview.textContent = JSON.stringify(packet, null, 2);
  elements.copyPacketButton.disabled = packet.status !== "ready";
  elements.downloadPacketButton.disabled = packet.status !== "ready";
}

function renderContractStatus(element, label, valid, errors = []) {
  element.textContent = label;
  element.classList.toggle("ready-pill", valid);
  element.classList.toggle("warning", !valid && errors.length > 0);
  element.title = errors.length ? errors.slice(0, 3).join("; ") : "";
}

export function packetItemForRender(activeItem) {
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

export function activePacket() {
  const packetItem = packetItemForRender(getActiveItem());
  const review = packetItem ? state.reviews.find((candidate) => candidate.itemId === packetItem.id) : null;
  if (!packetItem || !review) {
    return null;
  }
  return buildFeedbackPacket(packetItem, review);
}

export function renderPreview(item) {
  const variant = normalizeVariant(item.variant);
  const variantClass = previewVariantClass(item);
  if (item.imageData) {
    return `
      <div class="preview-image${variantClass}" aria-label="${escapeHtml(typeLabel(item.type))} image preview">
        <img src="${item.imageData}" alt="${escapeHtml(item.title)}" />
      </div>
    `;
  }

  if (item.imageKey) {
    return `
      <div class="preview-image${variantClass}" aria-label="${escapeHtml(typeLabel(item.type))} image preview">
        <span class="help-text">Image loading from this browser.</span>
      </div>
    `;
  }

  if (item.type === "logo") {
    return `
      <div class="preview-logo${variantClass}" aria-label="Generated logo preview">
        <div class="logo-board">
          <div class="logo-brand-card">
            <div class="logo-mark"></div>
            <div>
              <strong>${escapeHtml(shortTitle(item.title, 28))}</strong>
              <span>${escapeHtml(shortTitle(item.body || "Generated brand mark", 42))}</span>
            </div>
          </div>
          <div class="logo-context-row" aria-hidden="true">
            <span>App icon</span>
            <span>Bag seal</span>
            <span>Header</span>
          </div>
          <div class="logo-samples">
            <i><b></b></i>
            <i><b></b></i>
            <i><b></b></i>
          </div>
        </div>
      </div>
    `;
  }

  if (item.type === "copy") {
    const copyText = variant === "first-line"
      ? firstLine(item.body || item.prompt || "Paste copy to judge the voice, clarity, and action.")
      : item.body || item.prompt || "Paste copy to judge the voice, clarity, and action.";
    return `
      <div class="preview-copy${variantClass}" aria-label="Generated copy preview">
        <div class="copy-card">
          <div class="copy-post-header">
            <span class="copy-avatar" aria-hidden="true"></span>
            <div>
              <span class="copy-kicker">${variant === "first-line" ? "First line only" : "Generated post"}</span>
              <p class="copy-headline">${escapeHtml(shortTitle(item.title, 48))}</p>
            </div>
          </div>
          <p class="copy-text">${escapeHtml(copyText)}</p>
          <div class="copy-reaction-row" aria-hidden="true">
            <span>Save</span>
            <span>Reply</span>
            <span>Share</span>
          </div>
        </div>
      </div>
    `;
  }

  if (item.type === "product") {
    return `
      <div class="preview-product${variantClass}" aria-label="Generated product image preview">
        <div class="product-scene">
          <div class="product-surface"></div>
          <div class="product-shadow"></div>
          <div class="product-object">
            <i class="product-lid"></i>
            <i class="product-divider one"></i>
            <i class="product-divider two"></i>
            <i class="product-handle"></i>
            <i class="product-lip"></i>
          </div>
          <div class="product-caption">
            <strong>${escapeHtml(shortTitle(item.title, 28))}</strong>
            <span>${escapeHtml(shortTitle(item.body || "Generated product render", 44))}</span>
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div class="preview-website${variantClass}" aria-label="Generated website preview">
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
          <div class="site-proof-row" aria-hidden="true">
            <span><b>12</b> live runs</span>
            <span><b>4</b> blockers</span>
            <span><b>82%</b> ready</span>
          </div>
          <div class="site-cta-row">
            <span class="site-cta">Start cleanup</span>
            <span class="site-cta secondary">View handoff</span>
          </div>
        </div>
        <div class="site-visual">
          <div class="site-dashboard-top">
            <span>Approval map</span>
            <b>82%</b>
          </div>
          <div class="approval-list" aria-hidden="true">
            <span class="approval-row"><i></i><b>Legal</b><em>blocked</em></span>
            <span class="approval-row ok"><i></i><b>Brand</b><em>ready</em></span>
            <span class="approval-row warm"><i></i><b>Ops</b><em>reviewing</em></span>
          </div>
          <div class="site-chart" aria-hidden="true">
            <i></i>
            <i></i>
            <i></i>
            <i></i>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function previewVariantClass(item) {
  const variant = normalizeVariant(item.variant);
  return variant === "original" ? "" : ` is-${variant}`;
}

export function firstLine(value) {
  return String(value).split(/[.\n]/).map((part) => part.trim()).find(Boolean) || String(value);
}

export function renderLiveScore() {
  const score = calculateScore(state.draftScores);
  elements.liveScore.textContent = `${score}`;
  elements.liveGrade.textContent = gradeFor(score, score >= 60 ? "nice" : "pass");
}

export function clearSwipeIntent() {
  elements.acceptButton.classList.remove("is-hot");
  elements.rejectButton.classList.remove("is-hot");
  document.body.dataset.swipeIntent = "";
}
