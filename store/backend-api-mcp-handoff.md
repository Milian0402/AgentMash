# Backend API and MCP Handoff

AgentMash now includes a small same-origin HTTP API server in `server/agentmash-api.mjs`. The browser app still works local-first by default, but reviewers can connect it to this API from the Export workspace.

## Implemented API Files

- `server/agentmash-api.mjs`: built-in Node server that serves the PWA and `/v1` API routes.
- `intake.js`: shared intake validation and normalization helpers.
- `api-client.js`: browser client for pulling queued artifacts and publishing feedback bundles.
- `schemas/intake.v1.json`: artifact submission payload used by local imports and live API intake.
- `schemas/feedback.v2.json`: ready, pending, and empty feedback packet contract.
- `schemas/api.v1.openapi.json`: OpenAPI 3.1 contract for the implemented backend.
- `schemas/mcp-tools.v1.json`: MCP tool contract draft for a future MCP server.
- `schemas/examples/intake.v1.json`: sample artifact submission.
- `schemas/examples/intake-ack.v1.json`: sample intake acknowledgement.
- `schemas/examples/feedback-bundle.v1.json`: sample feedback bundle response.

## Implemented Backend Shape

The smallest useful agent loop is now present:

- `POST /v1/intake`: validates `agentmash.intake.v1`, stores accepted artifacts, stores image data separately, and returns `agentmash.intake-ack.v1`.
- `GET /v1/review-queue`: returns queued artifacts for the human reviewer app, including image data when requested.
- `POST /v1/feedback`: stores `agentmash.feedback-bundle.v1` after the reviewer sends ready feedback.
- `GET /v1/feedback/{runId}`: returns ready or pending feedback packets, eval rows, and pairwise rows for an agent run.
- `DELETE /v1/artifacts/{artifactId}`: removes submitted artifact metadata and related image data after bearer-token auth.
- `GET /v1/health`: exposes API health and intake limits.

Run locally:

```sh
npm run serve:api
```

Production must set `AGENTMASH_API_TOKEN`. Local development uses `agentmash-local-dev-token` only when no token is provided.

## Data Boundaries

- Human reviewer: swipes, adds notes, exports local files, or explicitly pulls/sends API data.
- Agent or lab: submits artifacts only through authenticated API calls.
- Backend: validates payloads, stores artifact metadata, stores image data under `.agentmash-api/images`, exposes deletion, and returns feedback bundles.

The browser app does not auto-sync. A reviewer has to use `Pull queue` or `Send feedback`.

## Future MCP Shape

The MCP contract mirrors the API but is still contract-only:

- `agentmash.submit_artifacts`: input is `agentmash.intake.v1`, output is `agentmash.intake-ack.v1`.
- `agentmash.get_feedback_bundle`: input is `runId`, optional `limit`, and optional `includeImageData`; output is `agentmash.feedback-bundle.v1`.
- `agentmash.request_deletion`: input is `artifactId`, optional `runId`, and optional reason; output is `agentmash.deletion-ack.v1`.

Add the MCP server only after the HTTP API behavior is stable.

## Remaining Product Work

- Production hosting provider or server runtime.
- Domain or same-origin reverse proxy.
- Account model beyond one bearer token.
- Storage retention policy and audit logging.
- Public support route or inbox.
- Public privacy and terms updates for any hosted service.
- Billing, quotas, and customer workspaces if this becomes a paid lab product.
