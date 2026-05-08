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

1. Agent submits artifacts using the same shape as `schemas/intake.v1.json`.
2. AgentMash puts it into a human swipe deck.
3. Human judges the artifact with a first-impression swipe.
4. The app records rubric scores, tags, and optional note.
5. Human can optionally compare two artifacts in Pairwise mode.
6. AgentMash returns a JSON feedback packet, a JSONL eval row, and optional pairwise JSONL rows.
7. The agent uses that data to keep, retry, repair, reject, rank, or add the output to an eval set.

## Local Return Channels

- Local agent drop: user imports an `agentmash.intake.v1` JSON file through `Import drop`.
- JSON packet: user copies or downloads the feedback.
- Dataset row: lab collects judgements as labelled eval rows.

Webhook and polling channels are deferred until there is authentication, server storage, deletion policy, and support coverage.

## Backend-Ready Intake Contract

The current build does not have a backend. It does have a local intake contract that a backend, API endpoint, or MCP tool can reuse later.

Schema file: `schemas/intake.v1.json`

```json
{
  "schema": "agentmash.intake.v1",
  "source": {
    "requesterType": "agent | lab | team",
    "requesterName": "string",
    "runId": "string",
    "goal": "string",
    "returnMode": "json | dataset",
    "returnTarget": "string"
  },
  "reviewContext": {
    "focus": "first_impression | trust | clarity | memorability | conversion | visual_quality",
    "audience": "general | buyers | developers | executives | researchers | internal",
    "stage": "concept | variant | prelaunch | regression",
    "priority": "normal | high | urgent",
    "notes": "string"
  },
  "artifacts": [
    {
      "id": "string",
      "type": "website | logo | copy | product",
      "title": "string",
      "prompt": "string",
      "body": "string",
      "question": "string",
      "imageData": "data:image/png;base64,...",
      "reviewContext": {}
    }
  ]
}
```

The local app imports this JSON file, normalizes each artifact, moves image bytes into IndexedDB, keeps text state in `localStorage`, and sends the user back to the Human review deck. It performs no network action.

Later backend shape:

- API: `POST /v1/intake` can accept the same `agentmash.intake.v1` payload and return accepted artifact IDs plus validation status.
- API: `GET /v1/feedback/{runId}` can return ready feedback packets, JSONL eval rows, and pairwise rows.
- API: `DELETE /v1/artifacts/{artifactId}` can remove submitted artifacts and related image bytes after auth and ownership checks.
- MCP: a future tool such as `agentmash.submit_artifacts` can use `schemas/intake.v1.json` as its `inputSchema`, and return structured content with accepted IDs, rejected rows, and validation errors.
- Security: do not expose either path until auth, user consent, uploaded-file limits, storage retention, deletion, rate limits, and support coverage exist.

Contract handoff files:

- `schemas/api.v1.openapi.json`: OpenAPI 3.1 draft with future intake, feedback-bundle, and deletion routes.
- `schemas/mcp-tools.v1.json`: MCP tool draft with `agentmash.submit_artifacts`, `agentmash.get_feedback_bundle`, and `agentmash.request_deletion`.
- `store/backend-api-mcp-handoff.md`: implementation order and user-owned launch actions for a future backend.

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
    "variant": "original | thumbnail | first-line | tagline | mark-only | cutout",
    "type": "website | logo | copy | product",
    "title": "string",
    "runId": "string",
    "requesterType": "agent | lab | team",
    "requesterName": "string",
    "goal": "string",
    "submittedAt": "date-time",
    "reviewContext": {
      "focus": "first_impression | trust | clarity | memorability | conversion | visual_quality",
      "audience": "general | buyers | developers | executives | researchers | internal",
      "stage": "concept | variant | prelaunch | regression",
      "priority": "normal | high | urgent",
      "notes": "string"
    },
    "image": {
      "imageKey": "string",
      "hasImage": true,
      "included": true,
      "mediaType": "image/png",
      "dataUrl": "data:image/png;base64,..."
    }
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
    "signalStrength": 0.82,
    "reviewContext": {}
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

- `agentmash.intake.v1` documents the artifact submission shape for local agent-drop imports and later backend/API/MCP intake.
- `agentmash.intake-ack.v1`, `agentmash.feedback-bundle.v1`, and `agentmash.deletion-ack.v1` are prepared as future backend response contracts in the OpenAPI and MCP handoff files.
- `agentmash.feedback.v2` renames `confidence` to `signalStrength` because the value measures score extremity plus annotation strength, not statistical confidence.
- Feedback packets now include top-level `signalStrengthFormula` so agents and labs can interpret the score without reverse-engineering it.
- Feedback packets, eval-row artifacts, and agent-use blocks now include `reviewContext` so downstream consumers know the review focus, audience, decision stage, priority, and notes behind the human signal.
- `agentmash.eval-row.v2` uses the same `signalStrength` name inside `humanSignal` and `agentUse`.
- Request and eval-row artifact payloads include `submittedAt`; the local runtime validator requires it so `v2 valid` matches the published schema.
- Visual artifact payloads include an `image` envelope. If the image is available in IndexedDB, local packet and JSONL exports include the data URL so lab users can evaluate the artifact without a separate image store.
- `trainingUse` only includes `failure_taxonomy` when failure modes exist, and only includes `prompt_repair` for rejected, weak, or repair-needed outputs. A strong accepted artifact with a note stays a positive example instead of being mislabeled as repair data.
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
- Review context fields for signal focus, audience, decision stage, priority, and optional notes.
- Local agent-drop JSON import using `agentmash.intake.v1`.
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
