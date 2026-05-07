# Agent Customer Model

If this app were online, the paying customer would likely be an agent builder, lab, or product team that needs cheap human first-impression feedback before using generated assets downstream.

## Why Agents Would Buy It

Agents can generate many websites, logos, copy variants, and product images. They are bad at knowing which ones humans reject instantly. AgentMash gives them a fast human preference signal:

- The human sees one artifact.
- The human swipes within a few seconds.
- The human may add a small note or tags.
- The app returns a structured packet to the agent run.

The value is not deep critique. The value is the immediate lazy human reaction that predicts whether a normal viewer will bounce.

## Online Flow

1. Agent submits an artifact review request.
2. AgentMash puts it into a human swipe deck.
3. Human judges the artifact with a first-impression swipe.
4. The app records rubric scores, tags, and optional note.
5. AgentMash returns a JSON feedback packet and a JSONL eval row.
6. The agent uses that data to keep, retry, repair, reject, or add the output to an eval set.

## Return Channels

- JSON packet: user copies or downloads the feedback.
- Webhook: online backend posts the packet to the agent or lab.
- Polling: agent polls by `runId` until feedback is ready.
- Dataset row: lab collects judgements as labelled eval rows.

## Packet Contract

```json
{
  "schema": "agentmash.feedback.v1",
  "status": "ready",
  "request": {
    "artifactId": "string",
    "type": "website | logo | copy | product",
    "runId": "string",
    "requesterType": "agent | lab | team",
    "requesterName": "string",
    "goal": "string"
  },
  "humanJudgement": {
    "verdict": "nice | pass",
    "firstImpression": "accepted_on_first_glance | rejected_on_first_glance",
    "preferenceLabel": "chosen | rejected",
    "confidence": 0.82,
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
    "confidence": 0.82
  },
  "evalRow": {
    "schema": "agentmash.eval-row.v1",
    "artifact": {},
    "humanSignal": {},
    "agentUse": {}
  },
  "return": {
    "mode": "json | webhook | polling | dataset",
    "target": "string",
    "format": "application/json",
    "deliveryStatus": "local_ready"
  }
}
```

## What Agents Do With It

- Keeper: add to positive examples and preserve the prompt pattern.
- Promising: generate variants around the same direction.
- Interesting: keep useful traits but do not ship.
- Needs work: repair weak dimensions.
- Reject: avoid the concept and try a different direction.
- JSONL eval row: store as a labelled dataset record for later model, prompt, or agent comparisons.

## Product Surface Implemented Locally

- Intake fields for requester type, requester name, run ID, return mode, return target, and agent goal.
- A Human review dashboard for the fast swipe judgement flow.
- An Agent lab dashboard for request status, ready packets, and returned signals.
- Lab-ready eval rows with `humanSignal`, `agentUse`, preference label, confidence, failure modes, and repair instruction.
- Pending packet before judgement so an agent can see what signal is expected.
- Ready packet after the first-impression swipe.
- Copy and JSON export actions for the selected packet.
- Copy and JSONL export actions for all ready eval rows.
- History entries that preserve requester name and run ID.

## No-Contact Local Implementation

The current app does not send packets anywhere. It creates the exact JSON packet locally so the online business flow can be tested without accounts, deployment, money, or contacting anyone.
