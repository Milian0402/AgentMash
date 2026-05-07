const APP_VERSION = 3;
const STORAGE_KEY = "nice-or-not.private-profile.v3";
const OLD_STORAGE_KEY = "nice-or-not.private-profile.v1";
const PREVIOUS_STORAGE_KEYS = ["nice-or-not.private-profile.v2", OLD_STORAGE_KEY];

const artifactTypes = ["website", "logo", "copy", "product"];
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
    title: "AI operations landing page",
    prompt: "Generated website concept for a workflow tool. Judge if it feels useful, premium, and clear.",
    body: "Autopilot for the messy middle of operations.",
    question: "Is this website nice?",
    agent: {
      requesterType: "agent",
      requesterName: "landing-page-agent",
      runId: "demo-site-001",
      goal: "Learn whether a generated landing page earns human trust quickly.",
      returnMode: "json",
      returnTarget: "local-demo/site-feedback"
    },
    createdAt: "2026-05-07T00:00:00.000Z"
  },
  {
    id: "logo-bakery-001",
    type: "logo",
    title: "Bakery logo mark",
    prompt: "Generated brand mark for a small bakery that wants to feel modern without losing warmth.",
    body: "A folded loaf shape mixed with a chat bubble.",
    question: "Does this logo make sense?",
    agent: {
      requesterType: "lab",
      requesterName: "brand-eval-lab",
      runId: "demo-logo-001",
      goal: "Test whether logo candidates make semantic and visual sense.",
      returnMode: "json",
      returnTarget: "local-demo/logo-feedback"
    },
    createdAt: "2026-05-07T00:00:00.000Z"
  },
  {
    id: "copy-launch-001",
    type: "copy",
    title: "Launch post copy",
    prompt: "Generated social copy for an AI notes app. Check if it sounds believable or too synthetic.",
    body: "Your notes already know the answer. Ask once, find the thread, and turn scattered thoughts into the next draft.",
    question: "Is this copy nice?",
    agent: {
      requesterType: "agent",
      requesterName: "copy-agent",
      runId: "demo-copy-001",
      goal: "Compare generated copy against human specificity and believability.",
      returnMode: "json",
      returnTarget: "local-demo/copy-feedback"
    },
    createdAt: "2026-05-07T00:00:00.000Z"
  },
  {
    id: "product-render-001",
    type: "product",
    title: "Kitchen organizer render",
    prompt: "Generated product image for a storage tray. Decide if the object looks coherent enough to sell.",
    body: "Modular counter tray with dividers, soft plastic, and a removable lid.",
    question: "Does this product image make sense?",
    agent: {
      requesterType: "lab",
      requesterName: "product-image-lab",
      runId: "demo-product-001",
      goal: "Catch visual trust breaks before product image candidates are reused.",
      returnMode: "json",
      returnTarget: "local-demo/product-feedback"
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
let deferredInstallPrompt = null;

const elements = {
  reviewerName: document.querySelector("#reviewerName"),
  filterTabs: document.querySelector("#filterTabs"),
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
  swipeCard: document.querySelector("#swipeCard"),
  swipeBadge: document.querySelector("#swipeBadge"),
  cardPreview: document.querySelector("#cardPreview"),
  artifactTypeLabel: document.querySelector("#artifactTypeLabel"),
  artifactIndexLabel: document.querySelector("#artifactIndexLabel"),
  artifactTitleLabel: document.querySelector("#artifactTitleLabel"),
  artifactPromptLabel: document.querySelector("#artifactPromptLabel"),
  agentMetaLabel: document.querySelector("#agentMetaLabel"),
  artifactQuestionLabel: document.querySelector("#artifactQuestionLabel"),
  emptyState: document.querySelector("#emptyState"),
  rejectButton: document.querySelector("#rejectButton"),
  acceptButton: document.querySelector("#acceptButton"),
  undoButton: document.querySelector("#undoButton"),
  scoreControls: document.querySelector("#scoreControls"),
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
  historyList: document.querySelector("#historyList"),
  packetStatus: document.querySelector("#packetStatus"),
  packetPreview: document.querySelector("#packetPreview"),
  copyPacketButton: document.querySelector("#copyPacketButton"),
  downloadPacketButton: document.querySelector("#downloadPacketButton"),
  importButton: document.querySelector("#importButton"),
  importFile: document.querySelector("#importFile"),
  exportButton: document.querySelector("#exportButton"),
  resetButton: document.querySelector("#resetButton"),
  installButton: document.querySelector("#installButton")
};

function loadState() {
  const stored = [STORAGE_KEY, ...PREVIOUS_STORAGE_KEYS]
    .map((key) => window.localStorage.getItem(key))
    .find(Boolean);
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
  const items = Array.isArray(candidate.items) && candidate.items.length
    ? candidate.items.map(normalizeItem)
    : sampleItems;
  const itemIds = new Set(items.map((item) => item.id));
  const reviews = Array.isArray(candidate.reviews)
    ? candidate.reviews.filter((review) => itemIds.has(review.itemId)).map(normalizeReview)
    : [];
  const filter = ["all", ...artifactTypes].includes(candidate.filter) ? candidate.filter : "all";
  const currentItemId = itemIds.has(candidate.currentItemId) ? candidate.currentItemId : items[0].id;

  return {
    version: APP_VERSION,
    reviewer: cleanText(candidate.reviewer) || defaultState.reviewer,
    filter,
    items,
    reviews,
    currentItemId,
    activeTags: normalizeTags(candidate.activeTags),
    draftScores: normalizeScores(candidate.draftScores || { sense: candidate.senseScore }),
    lastPacketItemId: cleanText(candidate.lastPacketItemId),
    installedAt: cleanText(candidate.installedAt) || new Date().toISOString()
  };
}

function normalizeItem(item) {
  const type = artifactTypes.includes(item.type) ? item.type : "website";
  return {
    id: cleanText(item.id) || createId(),
    type,
    title: cleanText(item.title) || "Untitled artifact",
    prompt: cleanText(item.prompt),
    body: cleanText(item.body || item.copy || item.description),
    question: cleanText(item.question) || defaultQuestion(type),
    agent: normalizeAgent(item.agent),
    imageData: typeof item.imageData === "string" && item.imageData.startsWith("data:image/")
      ? item.imageData
      : "",
    createdAt: cleanText(item.createdAt) || new Date().toISOString()
  };
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
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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

  elements.reviewerName.value = state.reviewer;
  elements.queueCount.textContent = `${pending.length}`;
  elements.stageEyebrow.textContent = `${typeLabel(activeType)} judgement`;
  elements.stageTitle.textContent = activeItem ? "Trust your first reaction" : "Nothing left in this view";
  elements.standardType.textContent = typeLabel(activeType);

  renderTabs();
  renderRubric(activeType);
  renderScoreControls();
  renderTags();
  renderMetrics();
  renderHistory();
  renderLiveScore();

  elements.emptyState.hidden = Boolean(activeItem);
  elements.swipeCard.hidden = !activeItem;
  elements.rejectButton.disabled = !activeItem;
  elements.acceptButton.disabled = !activeItem;
  elements.undoButton.disabled = state.reviews.length === 0;

  if (!activeItem) {
    saveState();
    renderFeedbackPacket(packetItemForRender(null));
    return;
  }

  const filteredIndex = filtered.findIndex((item) => item.id === activeItem.id) + 1;
  state.currentItemId = activeItem.id;
  elements.cardPreview.innerHTML = renderPreview(activeItem);
  elements.artifactTypeLabel.textContent = typeLabel(activeItem.type);
  elements.artifactIndexLabel.textContent = `${filteredIndex} of ${filtered.length}`;
  elements.artifactTitleLabel.textContent = activeItem.title;
  elements.artifactPromptLabel.textContent = activeItem.prompt || "No source note yet.";
  elements.agentMetaLabel.textContent = agentLine(activeItem.agent);
  elements.artifactQuestionLabel.textContent = activeItem.question;
  elements.swipeCard.style.transform = "";
  elements.swipeCard.style.opacity = "1";
  elements.swipeBadge.textContent = "";
  elements.swipeCard.classList.remove("swipe-nice", "swipe-pass", "is-dragging");
  renderFeedbackPacket(packetItemForRender(activeItem));
  saveState();
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
    verdict.textContent = review.verdict === "nice" ? "Nice" : "Pass";

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

function renderFeedbackPacket(activeItem) {
  const packetItem = activeItem;
  const review = packetItem ? state.reviews.find((candidate) => candidate.itemId === packetItem.id) : null;
  const packet = packetItem && review ? buildFeedbackPacket(packetItem, review) : buildPendingPacket(packetItem);

  elements.packetStatus.textContent = packet.status === "ready" ? "Ready" : "Pending";
  elements.packetPreview.textContent = JSON.stringify(packet, null, 2);
  elements.copyPacketButton.disabled = packet.status !== "ready";
  elements.downloadPacketButton.disabled = packet.status !== "ready";
}

function packetItemForRender(activeItem) {
  if (state.lastPacketItemId) {
    const lastPacketItem = state.items.find((item) => item.id === state.lastPacketItemId);
    const hasReview = state.reviews.some((review) => review.itemId === state.lastPacketItemId);
    if (lastPacketItem && hasReview) {
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

  if (item.type === "logo") {
    return `
      <div class="preview-logo" aria-label="Generated logo preview">
        <div class="logo-board">
          <div class="logo-mark"></div>
          <span>${escapeHtml(shortTitle(item.title, 22))}</span>
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
          <div class="product-object"></div>
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
          <strong>${escapeHtml(item.body || item.title)}</strong>
          <div class="site-line"></div>
          <div class="site-line short"></div>
          <div class="site-line muted"></div>
          <div class="site-cta-row">
            <span class="site-cta"></span>
            <span class="site-cta secondary"></span>
          </div>
        </div>
        <div class="site-visual">
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
  setCurrentToNext();
  saveState();
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
  elements.swipeBadge.textContent = verdict === "nice" ? "Nice" : "Pass";
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
    imageData: pendingImageData,
    createdAt: new Date().toISOString()
  };

  state.items = [item, ...state.items];
  state.filter = type;
  state.currentItemId = item.id;
  pendingImageData = "";
  elements.artifactForm.reset();
  elements.imageStatus.textContent = "No image selected.";
  elements.agentRequesterType.value = "agent";
  elements.agentReturnMode.value = "json";
  saveState();
  render();
}

function handleImageSelection() {
  const [file] = elements.artifactImage.files;
  pendingImageData = "";

  if (!file) {
    elements.imageStatus.textContent = "No image selected.";
    return;
  }

  if (!file.type.startsWith("image/")) {
    elements.imageStatus.textContent = "Choose an image file.";
    elements.artifactImage.value = "";
    return;
  }

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    pendingImageData = String(reader.result);
    elements.imageStatus.textContent = `${file.name} ready for local review.`;
  });
  reader.readAsDataURL(file);
}

function exportProfile() {
  const payload = {
    exportedAt: new Date().toISOString(),
    app: "Nice or Not",
    version: APP_VERSION,
    profile: state
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `nice-or-not-profile-${new Date().toISOString().slice(0, 10)}.json`;
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
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
  }
  elements.packetStatus.textContent = "Copied";
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
  link.download = `${packet.request.runId}-nice-or-not-feedback.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function importProfile(file) {
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      const profile = parsed.profile || parsed;
      state = normalizeState(profile);
      setCurrentToNext();
      saveState();
      render();
    } catch {
      window.alert("That file does not look like a Nice or Not profile.");
    }
  });
  reader.readAsText(file);
}

function resetDemo() {
  state = cloneDefaultState();
  pendingImageData = "";
  elements.reviewNote.value = "";
  elements.imageStatus.textContent = "No image selected.";
  saveState();
  render();
}

function buildPendingPacket(item) {
  if (!item) {
    return {
      schema: "nice-or-not.feedback.v1",
      status: "empty",
      message: "No active agent request."
    };
  }
  return {
    schema: "nice-or-not.feedback.v1",
    status: "pending",
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
  return {
    schema: "nice-or-not.feedback.v1",
    status: "ready",
    packetId: `feedback-${review.id}`,
    generatedAt: new Date().toISOString(),
    request: requestEnvelope(item),
    humanJudgement: {
      reviewer: review.reviewer,
      verdict: review.verdict,
      firstImpression: review.verdict === "nice" ? "accepted_on_first_glance" : "rejected_on_first_glance",
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
      criteriaUsed: typeRubrics[item.type]
    },
    return: {
      ...returnEnvelope(item.agent),
      deliveryStatus: "local_ready",
      onlineBehavior: returnBehaviorFor(item.agent.returnMode)
    }
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
    .filter(([, value]) => value <= 4)
    .map(([key]) => key);
  const tagModes = review.tags.filter((tag) => ["generic", "uncanny", "confusing", "off-brand"].includes(tag));
  return [...new Set([...lowScores, ...tagModes])];
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
  return `${agent.requesterName} submitted ${agent.runId}. Return: ${agent.returnMode} -> ${agent.returnTarget || "local export"}.`;
}

function shortTitle(value, maxLength) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;
}

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
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

  elements.swipeCard.style.transform = `translateX(${deltaX}px) rotate(${rotation}deg)`;
  elements.swipeCard.classList.toggle("swipe-nice", isNice);
  elements.swipeCard.classList.toggle("swipe-pass", isPass);
  elements.swipeBadge.textContent = isNice ? "Nice" : isPass ? "Pass" : "";
}

function onPointerUp(event) {
  if (!dragState || dragState.pointerId !== event.pointerId) {
    return;
  }

  const deltaX = dragState.currentX - dragState.startX;
  dragState = null;
  elements.swipeCard.classList.remove("is-dragging", "swipe-nice", "swipe-pass");

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
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || window.location.protocol === "file:") {
    return;
  }
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}

elements.reviewerName.addEventListener("input", () => {
  state.reviewer = elements.reviewerName.value.trim() || defaultState.reviewer;
  saveState();
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

elements.artifactType.addEventListener("change", () => {
  renderRubric(elements.artifactType.value);
});
elements.artifactImage.addEventListener("change", handleImageSelection);
elements.artifactForm.addEventListener("submit", addArtifact);
elements.rejectButton.addEventListener("click", () => decide("pass"));
elements.acceptButton.addEventListener("click", () => decide("nice"));
elements.undoButton.addEventListener("click", undoLastReview);
elements.copyPacketButton.addEventListener("click", copyPacket);
elements.downloadPacketButton.addEventListener("click", downloadPacket);
elements.importButton.addEventListener("click", () => elements.importFile.click());
elements.importFile.addEventListener("change", () => {
  const [file] = elements.importFile.files;
  if (file) {
    importProfile(file);
  }
  elements.importFile.value = "";
});
elements.exportButton.addEventListener("click", exportProfile);
elements.resetButton.addEventListener("click", resetDemo);
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
registerServiceWorker();
