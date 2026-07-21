# AgentMash

A local-first swipe app plus optional same-origin API for turning fast human judgement on AI-generated websites, logos, copy, and product images into structured feedback packets.

Status: public development build. The app has not been deployed, listed, sold, or submitted to an app store.

## What It Does

- Swipe right or press the right arrow when an artifact is nice.
- Swipe left or press the left arrow when it is not worth keeping.
- Use the Human review dashboard for the fast swipe flow.
- Use the Export workspace to collect ready packets and JSONL rows from local review data.
- Compare two artifacts in Pairwise mode when relative preference is the stronger signal.
- Keep reviewing with Remix or opt-in Endless mode when the current deck is complete.
- Add artifacts from the human deck or the local export form.
- Import backend-ready local agent-drop JSON files shaped like `schemas/intake.v1.json`.
- Upload real screenshots, logos, and product images.
- Paste generated copy and source notes.
- Score each artifact on gut pull, coherence, craft, and usefulness.
- Attach source, run, review context, and local export metadata.
- Generate structured feedback packets future agents or labs could consume from local exports.
- Generate local JSONL eval rows with preference labels, signal strength, failure modes, and repair instructions.
- Save tags, notes, history, and profile metrics locally.
- Export and import the private profile as JSON.
- Run as a static PWA with app metadata and offline caching.

## Judgement System

The score is weighted toward human intuition:

- Gut pull: 35%
- Makes sense: 25%
- Craft: 22%
- Useful: 18%

Details live in `store/review-system.md`.

## Agent Customers

The app models agents and labs as customers that need human first-impression judgement on generated artifacts. The browser app creates a JSON feedback packet and a JSONL eval row after each swipe. It can still run fully local, or it can connect to the included API server to pull queued agent submissions and send reviewed feedback bundles back.

The repo includes `schemas/intake.v1.json` for local agent-drop imports and live API intake, `schemas/api.v1.openapi.json` for the implemented HTTP API, and `schemas/mcp-tools.v1.json` as a contract-only MCP handoff.

Details live in `store/agent-customer-model.md`.

## Local-First Use

The app does not send data anywhere by default. Profile data is stored in `localStorage`, while uploaded image bytes live in IndexedDB for the browser that opens it. Exported JSON files and local API storage are ignored by git through `.gitignore`.

When the reviewer enters an API token and uses `Pull queue` or `Send feedback`, the app calls the configured same-origin AgentMash API server.

## Run

```sh
npm run serve
```

Then visit `http://localhost:5177`.

Native ES modules are used, so use the local server instead of opening `index.html` directly.

## Run With API

```sh
npm run serve:api
```

Then visit `http://localhost:5179`. For local development, the server prints a dev bearer token. For production, set `AGENTMASH_API_TOKEN` and serve the app through this server or a same-origin reverse proxy.

Core endpoints:

- `POST /v1/intake`: agents submit `agentmash.intake.v1` artifacts with optional PNG, JPG, or WebP data URLs.
- `GET /v1/review-queue`: the reviewer app pulls queued artifacts into the swipe deck.
- `POST /v1/feedback`: the reviewer app publishes `agentmash.feedback-bundle.v1` after reviews.
- `GET /v1/feedback/{runId}`: agents fetch ready or pending feedback for their run.
- `DELETE /v1/artifacts/{artifactId}`: delete submitted artifact metadata and stored image data.

## Check

```sh
npm run check
```

## Build

```sh
npm run build
```

This writes the public static site to `_site/`. Internal launch docs, submission drafts, scripts, and repo metadata are not packaged.

Preview the public package:

```sh
npm run serve:build
```

Sync and verify the iOS wrapper:

```sh
npm run ios:sync
npm run ios:build:sim
npm run ios:build:device
npm run ios:archive:unsigned
```

Refresh launch screenshots, iOS startup images, and draft store assets from the local app:

```sh
npm run refresh:assets
```

## Launch Check

```sh
npm run check:launch
```

This verifies required pages, app metadata, offline shell files, static-host security headers, local-only network constraints, sitemap packaging, and AgentMash naming.

`npm run ready:public` is a local quality gate, not a final release command. A build made before final metadata configuration does not include a public sitemap URL.

After you choose a final public URL and support route, configure local launch metadata before building:

```sh
npm run configure:public -- --url https://YOUR-PUBLIC-URL --support YOUR-SUPPORT-ROUTE
```

This only edits local files, including `robots.txt` and `sitemap.xml`. It does not deploy, contact anyone, create accounts, or spend money.

Then run `npm run ready:public` again and only deploy the rebuilt `_site/` directory.

## Publish Prep

- `manifest.webmanifest`: PWA metadata.
- `sw.js`: offline app shell cache.
- `assets/icons`: installable PNG app icons.
- `assets/icons/apple-touch-icon.png`: iOS home-screen icon.
- `assets/startup`: iOS PWA startup images derived from the local launch screenshots.
- `assets/screenshots`: public PWA screenshots.
- `support.html`: local self-support page.
- `privacy.html`: privacy page draft.
- `terms.html`: terms page draft.
- `CHANGELOG.md`: private release history for local launch-prep builds.
- `PUBLISHING.md`: private publishing runbook and cost-bearing user-action notes.
- `store/research-and-cost-guide.md`: design research and cost guide.
- `.github/workflows/pages.yml`: manual GitHub Pages deploy workflow.
- `_headers`, `netlify.toml`, and `vercel.json`: static host security headers.
- `store/app-store-listing.md`: store listing copy.
- `store/app-store-submission.md`: App Store and Google Play submission prep.
- `store/privacy-data-safety-draft.md`: Apple privacy label and Google Play Data safety draft.
- `ios/`: Capacitor iOS wrapper that packages `_site/` into `com.agentmash.app`.
- `capacitor.config.json`: native wrapper config for AgentMash.
- `store/native-wrapper-handoff.md`: native iOS wrapper status and Android/store handoff notes.
- `store/submission`: draft store screenshots and Google Play feature graphic.
- `store/agent-customer-model.md`: how agents/labs become customers and get feedback back.
- `server/agentmash-api.mjs`: same-origin API server for agent intake, review queue, feedback return, and deletion.
- `store/backend-api-mcp-handoff.md`: backend API and MCP handoff notes.
- `schemas/intake.v1.json`: backend-ready local agent-drop intake contract, packaged publicly for future integrators.
- `schemas/feedback.v2.json`: local feedback packet and eval-row contract, packaged publicly for future integrators.
- `schemas/api.v1.openapi.json`: OpenAPI contract for the included backend.
- `schemas/mcp-tools.v1.json`: contract-only MCP tool draft for a future server.
- `schemas/examples`: public sample intake, acknowledgement, and feedback bundle payloads.
- `store/completion-audit.md`: prompt-to-artifact launch readiness audit.
- `store/public-launch-plan.md`: cheapest practical public launch sequence.
- `store/research-and-cost-guide.md`: design research and cost guide.
- `store/release-checklist.md`: website and app store checklist.
- `store/public-launch-audit.md`: current launch evidence and remaining blockers.

## Not Done Yet

- No public website has been deployed.
- No domain has been bought.
- No public support inbox has been added.
- No app-store developer account has been created.
- The iOS wrapper exists and builds locally, but no signed App Store archive has been uploaded.
- No Android wrapper has been created yet.
- No billing, accounts, hosted production database, or public support operation exists yet.
- No MCP server exists yet; the MCP file remains a contract draft.

## License

MIT. See [LICENSE](LICENSE).
