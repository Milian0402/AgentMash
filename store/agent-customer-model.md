# Agent Customer Model

If this app were online, the paying customer would likely be an agent builder, lab, or product team that needs cheap human first-impression feedback before using generated assets downstream.

## Why Agents Would Buy It

Agents can generate many websites, logos, copy variants, and product images. They are bad at knowing which ones humans reject instantly. AgentMash gives them a fast human preference signal:

- The human sees one artifact.
- The human swipes within a few seconds.
- The human may add a small note or tags.
- The app returns a structured packet to the agent run.

The value is not deep critique. The value is the immediate lazy human reaction that predicts whether a normal viewer will bounce.

## Future Online Flow

1. Agent submits an artifact review request.
2. AgentMash puts it into a human swipe deck.
3. Human judges the artifact with a first-impression swipe.
4. The app records rubric scores, tags, and optional note.
5. Human can optionally compare two artifacts in Pairwise mode.
6. AgentMash returns a JSON feedback packet, a JSONL eval row, and optional pairwise JSONL rows.
7. The agent uses that data to keep, retry, repair, reject, rank, or add the output to an eval set.

## Local Return Channels

- JSON packet: user copies or downloads the feedback.
- Dataset row: lab collects judgements as labelled eval rows.

Webhook and polling channels are deferred until there is authentication, server storage, deletion policy, and support coverage.

## Packet Contract

```json
{
  "schema": "agentmash.feedback.v2",
  "status": "ready",
  "signalStrengthFormula": {
    "name": "score_extremity_plus_annotation",
    "description": "Signal strength is score extremity around a neutral 60 score plus small boosts for tags and a note.",
    "expression": "roundTo(0.55 + min(1, abs(score - 60) / 40) * 0.27 + min(0.1, tagCount * 0.025) + noteBoost, 2)",
    "noteBoost": 0.08,
    "range": [0.55, 1]
  },
  "request": {
    "artifactId": "string",
    "type": "website | logo | copy | product",
    "runId": "string",
    "requesterType": "agent | lab | team",
    "requesterName": "string",
    "goal": "string"
  },
  "humanJudgement": {
    "verdict": "accepted | rejected",
    "firstImpression": "accepted_on_first_glance | rejected_on_first_glance",
    "preferenceLabel": "chosen | rejected",
    "signalStrength": 0.82,
    "score": 0,
    "grade": "Keeper | Promising | Interesting | Needs work | Reject",
    "scores": {
      "gut": 0,
      "sense": 0,
      "craft": 0,
      "useful": 0
    },
    "tags": [],
    "note": "string"
  },
  "pairwiseComparisons": [],
  "interpretation": {
    "recommendation": "string",
    "likelyFailureModes": [],
    "repairInstruction": "string",
    "criteriaUsed": []
  },
  "agentUse": {
    "trainingUse": ["preference_label", "score_vector", "failure_taxonomy", "prompt_repair"],
    "preferenceLabel": "chosen | rejected",
    "recommendedAction": "ship_or_keep | iterate_from_positive | mine_traits_then_retry | repair | reject_and_regenerate",
    "repairInstruction": "string",
    "signalStrength": 0.82
  },
  "evalRow": {
    "schema": "agentmash.eval-row.v2",
    "artifact": {},
    "humanSignal": {},
    "agentUse": {}
  },
  "return": {
    "mode": "json | dataset",
    "target": "string",
    "format": "application/json | application/x-ndjson",
    "deliveryStatus": "local_ready"
  }
}
```

Migration note: v2 exports normalize the human UI labels Nice/Nope into `accepted` / `rejected` so downstream datasets do not confuse `pass` with approval. The local review state still stores the UI verdicts because they drive copy, styling, and undo behavior inside the app.

The Export workspace validates the active feedback packet and JSONL export rows locally before copy/download. It does not call an outside schema service or send review data anywhere.

## Pairwise Row Contract

```json
{
  "schema": "agentmash.pairwise-row.v1",
  "comparison": {
    "left": {},
    "right": {},
    "winner": {},
    "loser": {},
    "preferenceLabel": "left_preferred | right_preferred",
    "scoreDelta": 1
  },
  "humanSignal": {
    "comparisonType": "pairwise_preference",
    "winnerArtifactId": "string",
    "loserArtifactId": "string"
  },
  "agentUse": {
    "trainingUse": ["pairwise_preference", "ranking_signal"]
  }
}
```

## Migration Notes

- `agentmash.feedback.v2` renames `confidence` to `signalStrength` because the value measures score extremity plus annotation strength, not statistical confidence.
- Feedback packets now include top-level `signalStrengthFormula` so agents and labs can interpret the score without reverse-engineering it.
- `agentmash.eval-row.v2` uses the same `signalStrength` name inside `humanSignal` and `agentUse`.
- `agentmash.pairwise-row.v1` is additive. It does not change the v2 feedback packet or eval-row contract.
- Return modes are now local-only: `json` and `dataset`. Legacy `webhook` or `polling` values are normalized to `json` in the local app.

## What Agents Do With It

- Keeper: add to positive examples and preserve the prompt pattern.
- Promising: generate variants around the same direction.
- Interesting: keep useful traits but do not ship.
- Needs work: repair weak dimensions.
- Reject: avoid the concept and try a different direction.
- JSONL eval row: store as a labelled dataset record for later model, prompt, or agent comparisons.
- Pairwise row: store as a relative ranking signal for preference models, candidate sorting, or prompt comparison.

## Product Surface Implemented Locally

- Intake fields for source type, source name, run ID, export format, export label, and review goal.
- A Human review dashboard for the fast swipe judgement flow.
- A local Export workspace for reviewed artifacts, ready packets, JSON downloads, and JSONL rows.
- Lab-ready eval rows with `humanSignal`, `agentUse`, preference label, signal strength, failure modes, and repair instruction.
- Schema v2 packets and eval rows use `signalStrength` for the score-extremity signal.
- Pending packet before judgement so an agent can see what signal is expected.
- Ready packet after the first-impression swipe.
- Pairwise mode for relative preference capture between two artifacts.
- Pairwise JSONL rows with winner, loser, preference label, and ranking signal.
- Copy and JSON export actions for the selected packet.
- Copy and JSONL export actions for all ready eval rows.
- History entries that preserve requester name and run ID.

## No-Contact Local Implementation

The current app does not send packets anywhere. It creates the exact JSON packet locally so the online business flow can be tested without accounts, deployment, money, or contacting anyone.
