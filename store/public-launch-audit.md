# Public Launch Audit

Checked on May 8, 2026. No deployment, paid account, domain purchase, app-store submission, or human outreach has been performed.

## Objective

Make AgentMash good enough to launch publicly as a serious app.

## Launch-Ready Locally

- Product name and private GitHub repository are `AgentMash`.
- Local repo path is `/Users/maximiliannordler/code/AgentMash`.
- App code is split into native ES modules: thin entry, state/storage, packets/exports, rendering, and gestures.
- Human review dashboard is phone-first and supports swipe, buttons, keyboard shortcuts, undo, scoring, tags, and notes.
- Default Human review flow keeps scoring, tags, and notes behind a `Refine` tap so the first-pass loop stays card-first.
- `Refine` opens as a bottom sheet above the decision controls so users do not scroll below the swipe buttons to adjust scores.
- The Refine sheet keeps tags and the note visible first, with score sliders tucked behind a `Scores` toggle.
- Human review shows a compact momentum counter for current run count, today's reviews, and day streak, with subtle 10/25/50 milestone animation.
- Human review shows profile insights summarizing local preference patterns, artifact-type survival, and review volume from local data.
- Decisions use supported vibration patterns and a quiet local WebAudio tick for tactile feedback.
- Title, prompt, requester line, and artifact detail are hidden behind a `Details` sheet by default so the card stays focused on one visual object.
- Export workspace collects ready packets, JSON downloads, and JSONL eval rows from local review data.
- Add Artifact is reachable from the human dashboard and returns to the swipe deck after submit.
- On mobile Human review, deck/profile/storage controls are tucked behind a `Deck` sheet so the first viewport stays focused on the swipe loop.
- Artifact intake uses local export wording and only offers JSON packet or eval dataset export formats, avoiding unavailable webhook or polling choices.
- Add Artifact includes review context fields for signal focus, audience, decision stage, priority, and notes.
- Local `Import drop` accepts backend-ready `agentmash.intake.v1` JSON files without contacting a server and rejects malformed drops with a clear status message.
- Starter artifacts are credible launch examples instead of placeholder-only cards.
- Privacy, terms, support, 404, manifest, icons, service worker, and static host config are present for the public build.
- PWA manifest includes mobile and desktop screenshots.
- PWA manifest, package metadata, and README one-line description use consistent structured feedback-packet wording.
- PWA manifest declares `en-US` language and left-to-right text direction for install surfaces.
- PWA icon PNGs are verified at 192 by 192, 512 by 512, and 1024 by 1024, with the Apple touch icon verified at 180 by 180.
- Public build script packages `_site/` without internal launch docs, submission drafts, scripts, or repo metadata.
- Public build packages `schemas/feedback.v2.json`, `schemas/intake.v1.json`, `schemas/api.v1.openapi.json`, `schemas/mcp-tools.v1.json`, and `schemas/examples/` so future integrators can inspect the machine-readable contracts and sample payloads.
- `npm run ready:public` runs the full local quality gate and rebuilds `_site/` before the user connects hosting.
- `npm run configure:public -- --url https://YOUR-PUBLIC-URL --support YOUR-SUPPORT-ROUTE` is ready to stamp final public URL and support metadata locally once the user chooses them.
- The same final metadata command writes `robots.txt` with the public sitemap URL and writes `sitemap.xml` with public app, support, privacy, and terms URLs.
- `npm run verify:public -- https://YOUR-PUBLIC-URL` is ready for the first live host/domain check after user-owned deployment.
- Internal publishing notes are not linked from the app footer, packaged into `_site/`, or cached by the service worker.
- GitHub Pages, Netlify, and Vercel configs publish `_site/` instead of repo root.
- Public status pages avoid naming unavailable backend return channels.
- Static host configs set `Cache-Control: no-cache` for `sw.js` and `manifest.webmanifest` so app-shell updates are not held behind stale edge/browser caching.
- Dedicated Apple touch icon is present for iOS home-screen install polish.
- Apple startup images are present for common large iPhone PWA launch surfaces.
- Every public HTML page links the favicon and Apple touch icon to avoid missing icon requests.
- Every public HTML page carries AgentMash app-name, light/dark color-scheme, and theme-color metadata.
- Every public HTML page carries description metadata, including the 404 page.
- Public description, Open Graph, and Twitter preview copy frame AgentMash as local-first feedback packets instead of implying live agent handoff.
- Every public HTML page carries a self-only CSP meta fallback for hosts that ignore custom security header files.
- The PWA install prompt is visible from the default Human review screen without exposing Import, Export, or Reset in that flow.
- Light and dark modes follow the user's operating system preference.
- Top and bottom spacing use iOS safe-area insets to reduce notch and home-indicator collisions.
- Public footer and support page expose the current release version for support/debugging without labeling the public app as beta.
- Public support and privacy pages avoid prelaunch placeholder language such as missing support inbox copy.
- Privacy and terms pages expose the effective date and current build version.
- Reset uses profile wording and requires confirmation before clearing local data.
- Reset clears uploaded image bytes from IndexedDB as well as local profile state.
- Profile import requires confirmation when local data exists, with export-first backup guidance.
- Copy actions handle browser clipboard denial without throwing or falsely reporting success.
- User image uploads are restricted to PNG, JPG, or WebP files under 2.5 MB and stored in IndexedDB instead of `localStorage`.
- `saveState()` strips image data before writing profile state and shows a visible local-storage-full warning if browser storage rejects the save.
- Pending image choices stay out of IndexedDB until the artifact is submitted.
- Profile export/import includes uploaded image bytes and restores them to IndexedDB while keeping `localStorage` image-free.
- Human review shows storage health for local profile usage and IndexedDB image usage.
- Reviewer name edits show a visible saved/not-saved status.
- Feedback packets use `agentmash.feedback.v2`, `signalStrength`, and a top-level `signalStrengthFormula`.
- Feedback packets and JSONL rows include required `submittedAt` metadata and available local image data for visual artifacts.
- Training-use labels avoid marking strong accepted artifacts as failure taxonomy or prompt repair data.
- Feedback packet export verdicts are normalized to `accepted` / `rejected`, while the human UI keeps Nice/Nope copy.
- Dataset-mode return envelopes report `application/x-ndjson` for local JSONL exports.
- `schemas/feedback.v2.json` documents the local packet contract for future validation.
- `schemas/intake.v1.json` documents the local agent-drop contract for future backend, API, or MCP intake.
- `schemas/api.v1.openapi.json` documents contract-only future backend routes for intake, feedback bundle retrieval, and deletion.
- `schemas/mcp-tools.v1.json` documents contract-only future MCP tools for artifact submission, feedback bundle retrieval, and deletion requests.
- `schemas/examples/` provides sample intake, acknowledgement, and feedback bundle payloads.
- The public URL verifier fetches the schema, contract, and example URLs and confirms their contract metadata.
- Export workspace shows local contract status badges for the active feedback packet and JSONL dataset rows.
- Refine panel is hidden by default and closes after a decision, keeping the next card in the fast swipe loop.
- Refine score sliders are hidden behind `Scores` until explicitly opened.
- On mobile, the Refine sheet clears the decision rail even during the opening animation.
- Details sheet is hidden by default and closes after a decision, keeping the next artifact card clean.
- Undo preserves the deck filter that produced the decision, so undoing from `All` restores the full deck instead of narrowing to one artifact type.
- Rapid duplicate decision input is locked while the outgoing card animates, then controls unlock when the next card is ready.
- Mobile filter labels are checked at 390 by 844 so `Product` does not truncate.
- Segmented review controls expose pressed-button group semantics instead of incorrect ARIA tab semantics.
- Keyboard focus rings are visible on buttons, links, form controls, and the swipe card.
- Image upload validation feedback is announced through a polite status region.
- Switching into Pairwise mode on mobile scrolls the review stage back into view.
- Mobile Human review hides the footer and lower dashboard controls until the user opens `Deck`.
- Reduced-motion preference shortens swipe-card transition timing.
- Deck completion shows a survived-count keeper summary instead of dead air, listing recent artifacts that passed the review flow.
- Deck completion can start a local Remix session that creates type-specific tagline, mark-only, first-line, and cutout glance variants without overwriting existing export rows.
- Endless mode can auto-loop one local glance-variant card at a time when the swipe deck empties, avoiding bulk storage growth.
- Human review includes Pairwise mode for choosing the stronger of two artifacts without creating normal swipe reviews.
- Export workspace includes `agentmash.pairwise-row.v1` JSONL rows and optional pairwise context in ready feedback packets.
- Export workspace zero-item and zero-review states are covered by Playwright and show zero ready exports, zero unjudged items, no average signal, empty packet status, and zero dataset rows.
- Agent-facing surface was reframed as a local export workspace, removing inbound-traffic wording such as request queue, waiting on humans, returned signals, and retry queue.
- Store listing, App Store submission prep, and privacy/data safety drafts are present.
- Native wrapper handoff is documented for a later Capacitor iOS/Android shell without installing native dependencies.
- Draft store submission image assets are present in `store/submission`.
- App data stays local unless the user imports, exports, copies, or downloads it.

## Verification Evidence

- `npm run check` passes.
- `npm run ready:public` passes and rebuilds `_site/` after the full local quality gate.
- `npm run check:configure-public` runs the final public URL/support metadata command against temporary copies, verifies the written metadata, verifies sitemap and robots output, verifies idempotency, verifies dry-run does not mutate files, and verifies blank or placeholder support routes are rejected.
- `npm run check:verify-public` serves a configured temporary public build on localhost and runs the same public URL verifier that will be used after hosting exists.
- `npm run check:launch` passes.
- `npm run check` syntax-checks `app.js`, `state.js`, `packet.js`, `render.js`, and `gestures.js`.
- Playwright runs the module app through `npm run serve` at `http://127.0.0.1:5177/`, not a blocked `file://` module load.
- `npm run check` now includes Playwright e2e coverage for Nice, Undo, Nope, keyboard shortcuts, rapid duplicate decision locking, mobile header clearance, mobile Refine sheet clearance, mobile Pairwise scroll, export contract badges, legacy import normalization, v2 packet shape, visual image payloads, normalized export verdicts, dataset return format, backend-ready agent-drop import, Keepers completion state, Remix repeat sessions with variant metadata, Endless auto-looping, Pairwise comparison export, human-screen install prompt, empty Export workspace state, IndexedDB image storage, pending upload submit-only storage, profile image export/import, offline app-shell loading, and a 500-item local stress path.
- `manifest.webmanifest`, `package.json`, and `vercel.json` parse as JSON.
- `npm run check` verifies manifest and package descriptions use structured feedback-packet wording.
- `npm run check` verifies the PWA manifest language and text direction.
- `npm run check` verifies PWA icon PNG dimensions match manifest-declared install sizes.
- `npm run check` verifies public PWA screenshot PNG dimensions match the manifest-declared 390 by 844 and 1440 by 1000 sizes.
- `npm run check` verifies `_headers`, Netlify, and Vercel keep the service worker and manifest update-friendly with `Cache-Control: no-cache`.
- `npm run check` syntax-checks the live public URL verifier without contacting any host.
- `npm run check` verifies the live public URL verifier checks final canonical/Open Graph/Twitter metadata, preview image URLs, public support contact metadata, robots, sitemap, public contract URLs, and public example URLs.
- `npm run check` verifies the local public-readiness script exists.
- `npm run check` verifies the local final-metadata configurator exists, is syntax-checked, covers canonical/Open Graph/Twitter/support/privacy fields, has no network hooks, and has an isolated write-path checker.
- `npm run check` verifies the public URL verifier smoke check serves a configured local public build and calls `scripts/verify-public-url.mjs`.
- `schemas/feedback.v2.json` parses as JSON and is checked for the `agentmash.feedback.v2` contract.
- `schemas/intake.v1.json` parses as JSON and is checked for the `agentmash.intake.v1` contract.
- `schemas/api.v1.openapi.json` parses as JSON and is checked for contract-only OpenAPI 3.1 routes.
- `schemas/mcp-tools.v1.json` parses as JSON and is checked for contract-only MCP tool definitions.
- `schemas/examples/intake.v1.json`, `schemas/examples/intake-ack.v1.json`, and `schemas/examples/feedback-bundle.v1.json` parse as JSON and are checked for matching contract metadata.
- The runtime packet schema and app code are checked to keep return modes local-only: `json` and `dataset`.
- `store/native-wrapper-handoff.md` records the later native shell path, bundle IDs, `_site` web directory, and no-analytics native rules.
- Mobile browser check at 390 by 844 showed no horizontal overflow.
- Desktop browser check at 1440 by 1000 showed no horizontal overflow.
- Browser console showed zero errors during human review and add-artifact testing.
- No third-party analytics, payments, telemetry, sockets, or API calls were found. The only network fetch is the service worker same-origin cache path.
- Store and public PWA screenshots were refreshed from the current local app after the Export workspace rename, public-footer cleanup, and mobile header fixes.
- Manifest screenshots point to tracked screenshot assets.
- Public manifest screenshots point to `assets/screenshots`.
- `npm run check` builds `_site/` and verifies internal files are not packaged.
- `_site/` includes all public app modules, public schema files, and `sw.js` caches those module and schema files.
- `sw.js` cache name is `agentmash-v37` after adding public contract examples to the app shell, so the offline app shell refreshes when this build is published.
- Playwright e2e test passed: after service worker readiness, the app reloaded offline and rendered the AgentMash shell and swipe card.
- Netlify and Vercel configs are checked for `npm run build` plus `_site/` output.
- Apple touch icon is linked from `index.html`, cached by `sw.js`, and sized at 180 by 180.
- Apple startup images are linked from `index.html`, cached by `sw.js`, and checked at 1290 by 2796 and 1242 by 2688.
- `npm run check` verifies `index.html`, support, privacy, terms, and 404 pages all link the app favicon and Apple touch icon.
- `npm run check` verifies every public HTML page has description metadata.
- `npm run check` verifies `publishing.html` is excluded from the public build.
- `npm run check` verifies every public HTML page has AgentMash app-name metadata plus light and dark theme-color metadata.
- `npm run check` verifies public preview metadata uses local feedback-packet wording and avoids `agent-ready feedback`.
- `npm run check` verifies public pages avoid beta labels and prelaunch support placeholder wording.
- `npm run check` verifies every public HTML page has CSP fallback metadata with self-only defaults, blocked object embedding, self-only connections, and self-only form actions.
- Playwright e2e test passed: a synthetic install prompt showed the `Install` button on Human review, kept Import/Export/Reset hidden, and hid Install after the prompt resolved.
- `index.html` declares `light dark` color schemes, and `styles.css` includes a dark-mode `prefers-color-scheme` branch.
- `index.html`, `support.html`, `privacy.html`, and `terms.html` show the package version; privacy and terms also show the effective date.
- `index.html` avoids demo reset wording and `app.js` confirms before reset.
- Playwright reset smoke test passed: cancel kept one review, confirm cleared it, and console errors stayed at zero.
- Import confirmation protects local reviews, uploads, notes, added artifacts, and reviewer name from silent overwrite.
- Playwright import smoke test passed: cancel kept one existing review, confirm replaced it with the imported profile, and console errors stayed at zero.
- Copy buttons show `Copy unavailable` if the browser blocks clipboard writes and the fallback path fails.
- Playwright clipboard-denial smoke test passed for packet and dataset copy buttons with zero console errors.
- SVG uploads are excluded from the public artifact form; imported image data is sanitized to PNG, JPG, or WebP data URLs.
- Playwright upload smoke test passed: SVG rejected, over-2.5 MB PNG rejected, small PNG accepted, and console errors stayed at zero.
- Playwright e2e test passed: a tiny PNG upload stored an `imageKey` in `localStorage`, left `imageData` empty in `localStorage`, and stored the data URL in IndexedDB.
- Playwright e2e test passed: selecting `first.png`, then selecting `second.png`, left zero IndexedDB image keys until submit and exactly one submitted image key after.
- Playwright e2e test passed: an invalid agent-drop JSON was rejected without changing the deck; a valid `agentmash.intake.v1` import then added an artifact to the Human review deck, stored image bytes in IndexedDB, kept `localStorage` image-free, and exported review context through request, eval-row artifact, and agent-use packet sections.
- Playwright e2e test passed: profile export bundled uploaded image data, reset cleared the profile and removed the old IndexedDB image bytes, import restored the artifact, `localStorage` kept only the `imageKey`, and IndexedDB contained the restored data URL.
- Playwright e2e test passed: Nice, Undo, and Nope produced a ready `agentmash.feedback.v2` packet with `signalStrength`, no `confidence` field, `accepted` / `rejected` export verdicts, and `agentmash.eval-row.v2`.
- Playwright e2e test passed: a dataset-mode pending packet reported `application/x-ndjson` in the expected return envelope.
- Playwright e2e test passed: Export workspace showed `v2 valid` for packets, `Rows valid` when JSONL rows existed, and `No rows` in the empty dataset state.
- Playwright e2e test passed: Undo from the `All` deck restored `1 / 4` progress and left the active filter as `all`.
- Playwright e2e test passed: two rapid decision events produced one review, left the transition lock active immediately, then unlocked the next card.
- Playwright e2e test passed: Arrow keys handled Nice/Nope decisions, `Control+Z` undid swipe and pairwise choices, and arrow keys were ignored while typing in the decision note.
- Playwright e2e test passed: filter labels had no horizontal overflow at 390 by 844.
- Playwright e2e test passed: review-mode and filter segmented controls use group roles, and active filters expose `aria-pressed`.
- Playwright e2e test passed: the Nice decision button exposes a visible keyboard focus ring.
- Playwright e2e test passed: the image upload status element exposes `role="status"` and `aria-live="polite"`.
- Playwright e2e test passed: the always-visible momentum counter updated through Nice, Undo, and Nope.
- Playwright e2e test passed: profile insights generated direct self-reflection copy after one review and after a seeded multi-review pattern.
- Playwright e2e test passed: the storage health indicator rendered local profile usage and IndexedDB image status.
- Playwright e2e test passed: Refine opens the hidden scoring/note panel, clears the mobile decision rail, and the panel closes again after a decision.
- Playwright e2e test passed: Refine shows tags and the note immediately, keeps score controls hidden by default, then reveals them after `Scores`.
- Playwright e2e test passed: Details opens the hidden artifact detail sheet and closes it again.
- Playwright e2e test passed: completing the deck after a Nice judgement renders a survived-count keeper summary with the surviving artifact.
- Playwright e2e test passed: Remix deck doubles local items from 4 to 8, creates tagline, mark-only, first-line, and cutout variants, keeps the original 4 reviews, adds a fifth review on the next swipe, preserves unique reviewed item IDs, exports variant metadata, and shows 5 JSONL rows.
- Playwright e2e test passed: Endless mode creates one local loop card after deck completion, records it as a normal v2 review on swipe, then creates only one next loop card.
- Playwright e2e test passed: Pairwise mode records a comparison without creating a swipe review, exports `agentmash.pairwise-row.v1`, then keeps normal v2 packets and rows working after returning to Swipe mode.
- Playwright e2e test passed: mobile Pairwise mode scrolls the review stage into view after switching modes.
- Playwright e2e test passed: mobile Human review starts with the lower control panel and footer hidden, opens the `Deck` sheet, and closes it again.
- Playwright e2e test passed: partial legacy reviews without grade or recommendation load, normalize, and export as valid v2 packets.
- Playwright e2e test passed: uploaded image packets include image key, media type, and data URL while localStorage remains image-free.
- Playwright e2e test passed: zero items and zero reviews rendered empty Export workspace counts and an empty packet without stale metrics.
- Playwright e2e test passed: a 500-item profile with 250 existing reviews accepted 100 more keyboard decisions under reduced-motion timing, preserved 350 unique review rows, avoided storage warnings, and kept Export workspace usable.
- Local simulated-user review was run with four personas: mobile swiper, lab/export consumer, launch QA, and visual critic. No outreach occurred. Findings were converted into the Undo deck fix, export verdict/format normalization, public-page icon metadata checks, export contract hardening, mobile sheet/Pairwise fixes, internal publishing-page cleanup, and screenshot refresh.
- `npm run serve:build` served `_site/`; `/` and `assets/icons/apple-touch-icon.png` returned 200, while `store/completion-audit.md` returned 404.
- Draft submission assets are sized for Apple iPhone 6.9, Apple iPhone 6.5, Google phone, and Google Play feature graphic planning.
- GitHub repo is private at `https://github.com/Milian0402/AgentMash`.
- README and publishing runbook describe the current state as private launch prep instead of a public beta.

## Runtime Smoke Evidence

Playwright CLI checked `http://127.0.0.1:5177` on May 7, 2026 after the local folder move.

Passed checks:

- Page title is AgentMash.
- Human dashboard is visible.
- Decision note saves.
- Nice swipe saves one review.
- Undo clears that review.
- Nope swipe creates a completed review.
- Export workspace opens.
- Packet status becomes ready.
- JSONL preview includes `preference_label`.
- Packet preview includes `humanJudgement` and `verdict`.
- JSON and JSONL download buttons are enabled.
- Browser console reported zero errors.

## Remaining Public Launch Blockers

- Pick the public URL and hosting provider.
- Decide whether to buy a domain.
- Run `npm run configure:public -- --url https://YOUR-PUBLIC-URL --support YOUR-SUPPORT-ROUTE`.
- Run `npm run ready:public` again after configuring the final public metadata.
- Run the manual deployment workflow or connect a static host.
- Verify HTTPS, headers, service worker update behavior, privacy page, terms page, and support page on the public host.

## Remaining App Store Blockers

- Apple Developer Program or Google Play Console account.
- User-owned seller/developer identity.
- Google Play closed-testing production-access requirement if using a new personal developer account.
- Public support URL with real contact information.
- Public privacy URL with developer identity and inquiry route.
- Native iOS or Android wrapper and signed build.
- Store-size screenshots from the native build.
- Apple privacy labels or Google Play Data safety submission.
- Store review contact details.

## Not In Scope Yet

- Paid plans, billing, auth, server storage, lab customer accounts, webhooks, or polling endpoints.
- Legal review.
- No backend, public inbound agent submission, polling, webhook, or customer pipeline exists; the current second dashboard is a local export workspace with future-compatible JSON, OpenAPI, and MCP contracts.
