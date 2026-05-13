import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createAgentMashServer } from "../server/agentmash-api.mjs";

const tinyPngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=";
const token = "api-smoke-token";
const dataDir = await mkdtemp(join(tmpdir(), "agentmash-api-"));
const server = createAgentMashServer({ dataDir, token, staticDir: "." });

try {
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  const unauthorized = await fetch(`${baseUrl}/v1/review-queue`);
  assert.equal(unauthorized.status, 401);

  const intake = {
    schema: "agentmash.intake.v1",
    source: {
      requesterType: "agent",
      requesterName: "api-smoke-agent",
      runId: "api-smoke-run",
      goal: "Check whether the API loop accepts visual artifacts.",
      returnMode: "json",
      returnTarget: "api-smoke"
    },
    reviewContext: {
      focus: "visual_quality",
      audience: "buyers",
      stage: "prelaunch",
      priority: "high",
      notes: "Smoke test visual intake."
    },
    artifacts: [
      {
        id: "api-smoke-artifact",
        type: "product",
        title: "API smoke product render",
        prompt: "Generated test image.",
        body: "Tiny image payload.",
        imageData: `data:image/png;base64,${tinyPngBase64}`
      }
    ]
  };

  const intakeResponse = await fetch(`${baseUrl}/v1/intake`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(intake)
  });
  assert.equal(intakeResponse.status, 202);
  const intakeAck = await intakeResponse.json();
  assert.equal(intakeAck.schema, "agentmash.intake-ack.v1");
  assert.equal(intakeAck.accepted[0].artifactId, "api-smoke-artifact");

  const queueResponse = await fetch(`${baseUrl}/v1/review-queue?includeImageData=true`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(queueResponse.status, 200);
  const queue = await queueResponse.json();
  assert.equal(queue.schema, "agentmash.review-queue.v1");
  assert.equal(queue.artifacts[0].id, "api-smoke-artifact");
  assert.match(queue.artifacts[0].imageData, /^data:image\/png;base64,/);

  const feedbackBundle = {
    schema: "agentmash.feedback-bundle.v1",
    runId: "api-smoke-run",
    status: "ready",
    generatedAt: new Date().toISOString(),
    summary: {
      artifactCount: 1,
      reviewedArtifacts: 1,
      pendingArtifacts: 0,
      packetCount: 1,
      evalRowCount: 1,
      pairwiseRowCount: 0,
      runIds: ["api-smoke-run"],
      reviewers: ["API smoke reviewer"]
    },
    packets: [
      {
        schema: "agentmash.feedback.v2",
        status: "ready",
        request: {
          artifactId: "api-smoke-artifact",
          runId: "api-smoke-run"
        },
        humanJudgement: {
          reviewer: "API smoke reviewer"
        }
      }
    ],
    evalRows: [
      {
        schema: "agentmash.eval-row.v2",
        artifact: {
          artifactId: "api-smoke-artifact",
          runId: "api-smoke-run"
        }
      }
    ],
    pairwiseRows: []
  };

  const feedbackWrite = await fetch(`${baseUrl}/v1/feedback`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(feedbackBundle)
  });
  assert.equal(feedbackWrite.status, 202);
  const feedbackAck = await feedbackWrite.json();
  assert.equal(feedbackAck.schema, "agentmash.feedback-ack.v1");
  assert.deepEqual(feedbackAck.runIds, ["api-smoke-run"]);

  const feedbackRead = await fetch(`${baseUrl}/v1/feedback/api-smoke-run`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(feedbackRead.status, 200);
  const readyFeedback = await feedbackRead.json();
  assert.equal(readyFeedback.status, "ready");
  assert.equal(readyFeedback.packets[0].request.artifactId, "api-smoke-artifact");

  const deleteResponse = await fetch(`${baseUrl}/v1/artifacts/api-smoke-artifact`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(deleteResponse.status, 200);
  const deleteAck = await deleteResponse.json();
  assert.equal(deleteAck.schema, "agentmash.deletion-ack.v1");
} finally {
  await new Promise((resolve) => server.close(resolve));
  await rm(dataDir, { recursive: true, force: true });
}
