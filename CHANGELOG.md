# Changelog

AgentMash uses this file as a private release history for local launch-prep builds. Public user-facing release notes can be derived from it later, after the app has a final public URL and support route.

## 0.3.0 - 2026-05-08

- Reworked Human review around a card-first swipe loop with compact mobile chrome, stronger card shadows, a cleaner decision rail, a visible momentum counter, Keepers completion, Remix sessions, Endless mode, and Pairwise mode.
- Added the `Comment` shortcut and quick-reason dropdown so reviewers can add optional rationale without leaving the fast swipe flow.
- Split the app into native ES modules: `app.js`, `state.js`, `packet.js`, `render.js`, and `gestures.js`, while keeping the no-build runtime model.
- Moved uploaded image bytes out of `localStorage` and into IndexedDB, added clear local-storage-full messaging, and covered image export/import roundtrips.
- Upgraded feedback output to `agentmash.feedback.v2` with `signalStrength`, a documented signal strength formula, JSONL eval rows, and schema validation.
- Reframed the non-human dashboard as a local Export workspace with JSON and JSONL exports instead of implying live inbound agent traffic.
- Added local agent-drop import support against `schemas/intake.v1.json`, plus contract-only future OpenAPI and MCP handoff files.
- Added public launch prep assets: PWA manifest, app icons, Apple startup images, public screenshots, draft store screenshots, static-host security headers, privacy, terms, support, 404, and manual GitHub Pages workflow.
- Added `npm run refresh:assets`, `npm run configure:public`, `npm run ready:public`, and `npm run verify:public` for repeatable local preparation.
- Updated the default website review card with realistic status cards, action chips, approval rows, and a mini dashboard instead of anonymous wireframe bars.
- Updated the starter logo, copy, and product cards with more realistic brand, post, and product-render details.
- Replaced the swipe rail's text glyphs with CSS-drawn decision icons for a more polished first impression.
- Tightened mobile Pairwise mode so both choices fit in one compact comparison view.
- Added a Done control to the Comment/Refine sheet so users can back out without making a decision.
- Updated the offline service worker cache to `agentmash-v50` after the mobile swipe rail, momentum pill, Comment sheet polish, and short-phone launch screenshot fix.

Constraints kept in this build:

- No public deployment was performed.
- No domain was bought.
- No paid service, app-store account, or hosting account was created.
- No email, Slack, API, backend, MCP server, analytics, billing, or live agent pipeline was added.
- The GitHub Pages workflow remains manual-only.

Remaining user-owned launch actions:

- Choose the final public URL and support route.
- Run `npm run configure:public -- --url https://YOUR-PUBLIC-URL --support YOUR-SUPPORT-ROUTE`.
- Run `npm run ready:public` after configuration.
- Deploy the rebuilt `_site/` directory through a chosen host.
- Verify the deployed URL with `npm run verify:public -- --url https://YOUR-PUBLIC-URL`.
- Create any app-store developer accounts, native wrapper builds, store listings, domain, and support channel when ready.
