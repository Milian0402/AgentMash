# Backend API and MCP Handoff

This is a contract handoff for the future online version. The current AgentMash app remains local-first and does not deploy a backend, expose an MCP server, create accounts, contact anyone, or spend money.

## Contract Files

- `schemas/intake.v1.json`: artifact submission payload already used by local agent-drop import.
- `schemas/feedback.v2.json`: ready, pending, and empty feedback packet contract.
- `schemas/api.v1.openapi.json`: OpenAPI 3.1 draft for a future backend.
- `schemas/mcp-tools.v1.json`: MCP tool contract draft for a future server.

The public static build packages these files so a future integrator can inspect the contract before a real server exists.

## Future Backend Shape

The smallest useful backend has three routes:

- `POST /v1/intake`: validate `agentmash.intake.v1`, store accepted artifacts, and return `agentmash.intake-ack.v1`.
- `GET /v1/feedback/{runId}`: return `agentmash.feedback-bundle.v1` with ready feedback packets, eval rows, and pairwise rows.
- `DELETE /v1/artifacts/{artifactId}`: remove a submitted artifact and related image bytes after auth and ownership checks.

Do not add these routes to the public app until the user has chosen hosting, authentication, deletion rules, retention, support coverage, and public terms.

## Future MCP Shape

The MCP contract mirrors the API:

- `agentmash.submit_artifacts`: input is `agentmash.intake.v1`, output is `agentmash.intake-ack.v1`.
- `agentmash.get_feedback_bundle`: input is `runId`, optional `limit`, and optional `includeImageData`; output is `agentmash.feedback-bundle.v1`.
- `agentmash.request_deletion`: input is `artifactId`, optional `runId`, and optional reason; output is `agentmash.deletion-ack.v1`.

The current MCP tools specification describes tools with `name`, optional `title`, `description`, `inputSchema`, optional `outputSchema`, and annotations. It also says structured tool results should conform to `outputSchema` when provided. Source: https://modelcontextprotocol.io/specification/2025-11-25/server/tools

## Data Boundaries

The app should stay explicit about who owns each data movement:

- Human reviewer: swipes, adds notes, exports or imports local files.
- Agent or lab: submits artifacts only after a future authenticated backend exists.
- Backend: validates payloads, stores artifacts, stores image bytes, exposes deletion, and returns feedback bundles.

The current runtime intentionally avoids network calls, sockets, analytics, payments, and third-party SDKs. The future backend should keep that separation: the static app can stay usable offline, while online submission is added only after consent and account boundaries exist.

## First Backend Build Order

1. Implement schema validation for `agentmash.intake.v1`.
2. Store text metadata and image bytes separately.
3. Add deletion by artifact ID before inviting outside submitters.
4. Add `POST /v1/intake` with rate limits and max image size checks.
5. Add `GET /v1/feedback/{runId}` after reviewed packets are stored.
6. Add MCP tools only after the API behavior is stable.
7. Add public documentation and support copy only after the server exists.

## App Integration Later

The current UI should not promise live intake yet. When the backend exists, add a connected mode behind explicit setup:

- Keep local import/export as the default fallback.
- Let users choose a workspace or account before any upload.
- Show exactly what will be uploaded before sending artifacts or image bytes.
- Keep the same `reviewContext`, `signalStrength`, packet, eval-row, and pairwise-row fields.
- Run the existing Playwright suite plus new tests for auth failure, payload validation, offline fallback, deletion, and export consistency.

## Needs User Action Later

- Hosting provider or server runtime.
- Domain or subdomain.
- Authentication and account model.
- Retention and deletion policy.
- Public support route or inbox.
- Public privacy and terms updates for server-side storage.
- App Store data safety updates if the native wrapper starts sending data to a server.
