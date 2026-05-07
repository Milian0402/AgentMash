import {
  normalizeVariant,
  recommendationFor,
  roundTo,
  scoreDimensions,
  state,
  typeRubrics
} from "./state.js";

export function buildEvalRows() {
  return state.reviews
    .map((review) => {
      const item = state.items.find((candidate) => candidate.id === review.itemId);
      return item ? buildEvalRow(item, review) : null;
    })
    .filter(Boolean);
}

export function buildPairwiseRows() {
  return state.pairwiseComparisons
    .map((comparison) => {
      const left = state.items.find((item) => item.id === comparison.leftItemId);
      const right = state.items.find((item) => item.id === comparison.rightItemId);
      const winner = state.items.find((item) => item.id === comparison.winnerItemId);
      const loser = state.items.find((item) => item.id === comparison.loserItemId);
      if (!left || !right || !winner || !loser) {
        return null;
      }

      const preferenceLabel = comparison.winnerItemId === comparison.leftItemId
        ? "left_preferred"
        : "right_preferred";
      return {
        schema: "agentmash.pairwise-row.v1",
        rowId: `pairwise-${comparison.id}`,
        createdAt: comparison.createdAt,
        reviewer: comparison.reviewer,
        comparison: {
          left: artifactSummary(left),
          right: artifactSummary(right),
          winner: artifactSummary(winner),
          loser: artifactSummary(loser),
          preferenceLabel,
          scoreDelta: comparison.scoreDelta,
          reasonTags: comparison.reasonTags,
          note: comparison.note
        },
        humanSignal: {
          comparisonType: "pairwise_preference",
          winnerArtifactId: winner.id,
          loserArtifactId: loser.id,
          preferenceLabel,
          scoreDelta: comparison.scoreDelta,
          judgedAt: comparison.createdAt
        },
        agentUse: {
          trainingUse: ["pairwise_preference", "ranking_signal"],
          preferenceLabel,
          recommendedAction: "Use as a relative ranking signal between two generated artifacts.",
          signalStrength: 1
        }
      };
    })
    .filter(Boolean);
}

export function artifactSummary(item) {
  return {
    artifactId: item.id,
    variant: normalizeVariant(item.variant),
    type: item.type,
    title: item.title,
    runId: item.agent.runId,
    requesterType: item.agent.requesterType,
    requesterName: item.agent.requesterName,
    submittedAt: submittedAtFor(item),
    image: imageEnvelope(item, { includeData: false })
  };
}

export function buildExportRows() {
  return [...buildEvalRows(), ...buildPairwiseRows()];
}

export function signalCoverage(evalRows) {
  return [...new Set(evalRows.flatMap((row) => row.agentUse.trainingUse))];
}

export function buildPendingPacket(item) {
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

export function buildFeedbackPacket(item, review) {
  const humanSignal = humanSignalFor(item, review);
  const agentUse = agentUseFor(item, review);
  const pairwiseComparisons = pairwiseComparisonsFor(item);
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
      verdict: exportVerdictFor(review),
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
    pairwiseComparisons,
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

export function buildEvalRow(item, review) {
  return {
    schema: "agentmash.eval-row.v2",
    rowId: `eval-${review.id}`,
    createdAt: review.createdAt,
    artifact: {
      artifactId: item.id,
      variant: normalizeVariant(item.variant),
      type: item.type,
      title: item.title,
      prompt: item.prompt,
      body: item.body,
      requesterName: item.agent.requesterName,
      requesterType: item.agent.requesterType,
      runId: item.agent.runId,
      goal: item.agent.goal,
      submittedAt: submittedAtFor(item),
      image: imageEnvelope(item)
    },
    humanSignal: humanSignalFor(item, review),
    agentUse: agentUseFor(item, review)
  };
}

export function humanSignalFor(item, review) {
  const pairwisePreference = pairwiseComparisonsFor(item);
  return {
    reviewer: review.reviewer,
    verdict: exportVerdictFor(review),
    preferenceLabel: preferenceLabelFor(review),
    firstImpression: review.verdict === "nice" ? "accepted_on_first_glance" : "rejected_on_first_glance",
    score: review.score,
    grade: review.grade,
    signalStrength: signalStrengthFor(review),
    scoreVector: scoreVectorFor(review),
    tags: review.tags,
    failureModes: failureModesFor(review),
    ...(pairwisePreference.length ? { pairwisePreference } : {}),
    rationale: review.note || defaultRationaleFor(item, review),
    judgedAt: review.createdAt
  };
}

export function exportVerdictFor(review) {
  return review.verdict === "nice" ? "accepted" : "rejected";
}

export function pairwiseComparisonsFor(item) {
  return state.pairwiseComparisons
    .filter((comparison) => [comparison.leftItemId, comparison.rightItemId].includes(item.id))
    .map((comparison) => {
      const comparedItemId = comparison.leftItemId === item.id ? comparison.rightItemId : comparison.leftItemId;
      const comparedItem = state.items.find((candidate) => candidate.id === comparedItemId);
      return {
        comparisonId: comparison.id,
        role: comparison.winnerItemId === item.id ? "winner" : "loser",
        comparedWith: comparedItem ? artifactSummary(comparedItem) : { artifactId: comparedItemId },
        winnerItemId: comparison.winnerItemId,
        loserItemId: comparison.loserItemId,
        scoreDelta: comparison.scoreDelta,
        judgedAt: comparison.createdAt
      };
    });
}

export function agentUseFor(item, review) {
  return {
    trainingUse: trainingUseFor(review),
    preferenceLabel: preferenceLabelFor(review),
    recommendedAction: recommendedActionFor(review),
    repairInstruction: repairInstructionFor(item, review),
    signalStrength: signalStrengthFor(review),
    returnTarget: item.agent.returnTarget || "local export"
  };
}

export function signalStrengthFormula() {
  return {
    name: "score_extremity_plus_annotation",
    description: "Signal strength is score extremity around a neutral 60 score plus small boosts for tags and a note.",
    expression: "roundTo(0.55 + min(1, abs(score - 60) / 40) * 0.27 + min(0.1, tagCount * 0.025) + noteBoost, 2)",
    noteBoost: 0.08,
    range: [0.55, 1]
  };
}

export function requestEnvelope(item) {
  return {
    artifactId: item.id,
    variant: normalizeVariant(item.variant),
    type: item.type,
    title: item.title,
    prompt: item.prompt,
    body: item.body,
    runId: item.agent.runId,
    requesterType: item.agent.requesterType,
    requesterName: item.agent.requesterName,
    goal: item.agent.goal,
    submittedAt: submittedAtFor(item),
    image: imageEnvelope(item)
  };
}

export function submittedAtFor(item) {
  return item.agent?.submittedAt || item.createdAt || new Date().toISOString();
}

export function imageEnvelope(item, { includeData = true } = {}) {
  const dataUrl = includeData ? item.imageData || "" : "";
  const mediaType = dataUrl.match(/^data:([^;]+);base64,/)?.[1] || "";
  return {
    imageKey: item.imageKey || "",
    hasImage: Boolean(item.imageKey || item.imageData),
    included: Boolean(dataUrl),
    mediaType,
    dataUrl
  };
}

export function returnEnvelope(agent) {
  return {
    mode: agent.returnMode,
    target: agent.returnTarget || "local export",
    format: returnFormatFor(agent.returnMode)
  };
}

export function returnFormatFor(mode) {
  return mode === "dataset" ? "application/x-ndjson" : "application/json";
}

export function returnBehaviorFor(mode) {
  const behavior = {
    json: "Download or copy this packet into a local run log.",
    dataset: "Use this packet as the source for the local JSONL eval export."
  };
  return behavior[mode] || behavior.json;
}

export function validateFeedbackPacket(packet) {
  const errors = [];
  if (!packet || typeof packet !== "object") {
    return { valid: false, errors: ["packet must be an object"] };
  }

  requireValue(errors, packet.schema === "agentmash.feedback.v2", "schema must be agentmash.feedback.v2");
  requireValue(errors, ["ready", "pending", "empty"].includes(packet.status), "status must be ready, pending, or empty");
  requireObject(errors, packet.signalStrengthFormula, "signalStrengthFormula");

  if (packet.status === "ready") {
    requireString(errors, packet.packetId, "packetId");
    requireString(errors, packet.generatedAt, "generatedAt");
    validateRequest(packet.request, errors, "request");
    validateHumanSignal(packet.humanSignal, errors, "humanSignal");
    validateHumanJudgement(packet.humanJudgement, errors, "humanJudgement");
    requireObject(errors, packet.interpretation, "interpretation");
    validateAgentUse(packet.agentUse, errors, "agentUse");
    validateEvalRow(packet.evalRow, errors, "evalRow");
    validateReturnEnvelope(packet.return, errors, "return");
  } else if (packet.status === "pending") {
    validateRequest(packet.request, errors, "request");
    validateReturnEnvelope(packet.expectedReturn, errors, "expectedReturn");
    requireObject(errors, packet.pendingHumanSignal, "pendingHumanSignal");
  } else if (packet.status === "empty") {
    requireString(errors, packet.message, "message");
  }

  return { valid: errors.length === 0, errors };
}

export function validateExportRows(rows) {
  const errors = [];
  if (!Array.isArray(rows)) {
    return { valid: false, errors: ["rows must be an array"] };
  }

  rows.forEach((row, index) => {
    const rowErrors = validateExportRow(row).errors;
    rowErrors.forEach((error) => errors.push(`row ${index + 1}: ${error}`));
  });
  return { valid: errors.length === 0, errors };
}

export function validateExportRow(row) {
  const errors = [];
  if (!row || typeof row !== "object") {
    return { valid: false, errors: ["row must be an object"] };
  }

  if (row.schema === "agentmash.eval-row.v2") {
    validateEvalRow(row, errors, "row");
  } else if (row.schema === "agentmash.pairwise-row.v1") {
    requireString(errors, row.rowId, "row.rowId");
    requireString(errors, row.createdAt, "row.createdAt");
    requireString(errors, row.reviewer, "row.reviewer");
    requireObject(errors, row.comparison, "row.comparison");
    requireObject(errors, row.humanSignal, "row.humanSignal");
    validateAgentUse(row.agentUse, errors, "row.agentUse");
  } else {
    errors.push("schema must be agentmash.eval-row.v2 or agentmash.pairwise-row.v1");
  }

  return { valid: errors.length === 0, errors };
}

function validateEvalRow(row, errors, path) {
  requireValue(errors, row?.schema === "agentmash.eval-row.v2", `${path}.schema must be agentmash.eval-row.v2`);
  requireString(errors, row?.rowId, `${path}.rowId`);
  requireString(errors, row?.createdAt, `${path}.createdAt`);
  requireObject(errors, row?.artifact, `${path}.artifact`);
  validateRequest(row?.artifact, errors, `${path}.artifact`);
  validateHumanSignal(row?.humanSignal, errors, `${path}.humanSignal`);
  validateAgentUse(row?.agentUse, errors, `${path}.agentUse`);
}

function validateRequest(request, errors, path) {
  requireString(errors, request?.artifactId, `${path}.artifactId`);
  requireValue(errors, ["original", "thumbnail", "first-line", "tagline", "mark-only", "cutout"].includes(request?.variant), `${path}.variant`);
  requireValue(errors, ["website", "logo", "copy", "product"].includes(request?.type), `${path}.type`);
  requireString(errors, request?.title, `${path}.title`);
  requireString(errors, request?.runId, `${path}.runId`);
  requireValue(errors, ["agent", "lab", "team"].includes(request?.requesterType), `${path}.requesterType`);
  requireString(errors, request?.requesterName, `${path}.requesterName`);
  requireString(errors, request?.submittedAt, `${path}.submittedAt`);
}

function validateHumanSignal(signal, errors, path) {
  requireString(errors, signal?.reviewer, `${path}.reviewer`);
  requireValue(errors, ["accepted", "rejected"].includes(signal?.verdict), `${path}.verdict`);
  requireValue(errors, ["chosen", "rejected"].includes(signal?.preferenceLabel), `${path}.preferenceLabel`);
  requireNumber(errors, signal?.score, `${path}.score`);
  requireNumber(errors, signal?.signalStrength, `${path}.signalStrength`);
  requireObject(errors, signal?.scoreVector, `${path}.scoreVector`);
  requireString(errors, signal?.judgedAt, `${path}.judgedAt`);
}

function validateHumanJudgement(judgement, errors, path) {
  requireString(errors, judgement?.reviewer, `${path}.reviewer`);
  requireValue(errors, ["accepted", "rejected"].includes(judgement?.verdict), `${path}.verdict`);
  requireValue(errors, ["chosen", "rejected"].includes(judgement?.preferenceLabel), `${path}.preferenceLabel`);
  requireNumber(errors, judgement?.signalStrength, `${path}.signalStrength`);
  requireNumber(errors, judgement?.score, `${path}.score`);
  requireObject(errors, judgement?.scores, `${path}.scores`);
  requireString(errors, judgement?.judgedAt, `${path}.judgedAt`);
}

function validateAgentUse(agentUse, errors, path) {
  requireValue(errors, Array.isArray(agentUse?.trainingUse), `${path}.trainingUse`);
  requireValue(errors, ["chosen", "rejected", "left_preferred", "right_preferred"].includes(agentUse?.preferenceLabel), `${path}.preferenceLabel`);
  requireString(errors, agentUse?.recommendedAction, `${path}.recommendedAction`);
  requireNumber(errors, agentUse?.signalStrength, `${path}.signalStrength`);
}

function validateReturnEnvelope(envelope, errors, path) {
  requireValue(errors, ["json", "dataset"].includes(envelope?.mode), `${path}.mode`);
  requireString(errors, envelope?.target, `${path}.target`);
  requireValue(errors, ["application/json", "application/x-ndjson"].includes(envelope?.format), `${path}.format`);
}

function requireObject(errors, value, path) {
  requireValue(errors, Boolean(value) && typeof value === "object" && !Array.isArray(value), `${path} must be an object`);
}

function requireString(errors, value, path) {
  requireValue(errors, typeof value === "string" && value.length > 0, `${path} must be a string`);
}

function requireNumber(errors, value, path) {
  requireValue(errors, Number.isFinite(value), `${path} must be a number`);
}

function requireValue(errors, condition, message) {
  if (!condition) {
    errors.push(message);
  }
}

export function failureModesFor(review) {
  const lowScores = Object.entries(review.scores)
    .filter(([, value]) => value <= 5)
    .map(([key]) => key);
  const tagModes = review.tags.filter((tag) => ["generic", "uncanny", "confusing", "off-brand"].includes(tag));
  const verdictModes = review.verdict === "pass" ? ["first_glance_rejection"] : [];
  return [...new Set([...verdictModes, ...lowScores, ...tagModes])];
}

export function scoreVectorFor(review) {
  return scoreDimensions.reduce((vector, dimension) => {
    vector[dimension.key] = {
      label: dimension.label,
      value: review.scores[dimension.key],
      weight: dimension.weight
    };
    return vector;
  }, {});
}

export function preferenceLabelFor(review) {
  return review.verdict === "nice" ? "chosen" : "rejected";
}

export function signalStrengthFor(review) {
  const distanceFromMaybe = Math.min(1, Math.abs(review.score - 60) / 40);
  const tagBoost = Math.min(0.1, review.tags.length * 0.025);
  const noteBoost = review.note ? 0.08 : 0;
  return roundTo(0.55 + distanceFromMaybe * 0.27 + tagBoost + noteBoost, 2);
}

export function trainingUseFor(review) {
  const uses = ["preference_label", "score_vector", "eval_dataset_row"];
  const failureModes = failureModesFor(review);
  if (failureModes.length) {
    uses.push("failure_taxonomy");
  }
  if (review.verdict === "pass" || review.score < 78 || failureModes.length) {
    uses.push("prompt_repair");
  }
  return uses;
}

export function recommendedActionFor(review) {
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

export function repairInstructionFor(item, review) {
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

export function weakestDimensions(review) {
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

export function defaultRationaleFor(item, review) {
  const tagText = review.tags.length ? ` Tags: ${review.tags.join(", ")}.` : "";
  return `${review.verdict === "nice" ? "Human accepted" : "Human rejected"} this ${item.type} on first glance at score ${review.score}.${tagText}`;
}
