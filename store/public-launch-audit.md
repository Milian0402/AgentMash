# Public Launch Audit

Checked on May 7, 2026. No deployment, paid account, domain purchase, app-store submission, or human outreach has been performed.

## Objective

Make AgentMash good enough to launch publicly as a serious app.

## Launch-Ready Locally

- Product name and private GitHub repository are `AgentMash`.
- Local repo path is `/Users/maximiliannordler/code/AgentMash`.
- App code is split into native ES modules: thin entry, state/storage, packets/exports, rendering, and gestures.
- Human review dashboard is phone-first and supports swipe, buttons, keyboard shortcuts, undo, scoring, tags, and notes.
- Default Human review flow keeps scoring, tags, and notes behind a `Refine` tap so the first-pass loop stays card-first.
- `Refine` opens as a bottom sheet above the decision controls so users do not scroll below the swipe buttons to adjust scores.
- Human review shows a compact momentum counter for current run count, today's reviews, and day streak, with subtle 10/25/50 milestone animation.
- Human review shows profile insights summarizing rejection rates, nice rates, and review volume from local data.
- Decisions use supported vibration patterns and a quiet local WebAudio tick for tactile feedback.
- Title, prompt, requester line, and artifact detail are hidden behind a `Details` sheet by default so the card stays focused on one visual object.
- Export workspace collects ready packets, JSON downloads, and JSONL eval rows from local review data.
- Add Artifact is reachable from the human dashboard and returns to the swipe deck after submit.
- Artifact intake uses local export wording and only offers JSON packet or eval dataset export formats, avoiding unavailable webhook or polling choices.
- Starter artifacts are credible launch examples instead of placeholder-only cards.
- Privacy, terms, support, publishing, 404, manifest, icons, service worker, and static host config are present.
- PWA manifest includes mobile and desktop screenshots.
- Public build script packages `_site/` without internal launch docs, submission drafts, scripts, or repo metadata.
- GitHub Pages, Netlify, and Vercel configs publish `_site/` instead of repo root.
- Public status pages avoid naming unavailable backend return channels.
- Dedicated Apple touch icon is present for iOS home-screen install polish.
- The PWA install prompt is visible from the default Human review screen without exposing Import, Export, or Reset in that flow.
- Light and dark modes follow the user's operating system preference.
- Top and bottom spacing use iOS safe-area insets to reduce notch and home-indicator collisions.
- Public footer and support page expose the current release version for support/debugging.
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
- `schemas/feedback.v2.json` documents the local packet contract for future validation.
- Refine panel is hidden by default and closes after a decision, keeping the next card in the fast swipe loop.
- Details sheet is hidden by default and closes after a decision, keeping the next artifact card clean.
- Deck completion shows a Keepers summary instead of dead air, listing recent artifacts that survived the review flow.
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
- `npm run check:launch` passes.
- `npm run check` syntax-checks `app.js`, `state.js`, `packet.js`, `render.js`, and `gestures.js`.
- Playwright runs the module app through `npm run serve` at `http://127.0.0.1:5177/`, not a blocked `file://` module load.
- `npm run check` now includes Playwright e2e coverage for Nice, Undo, Nope, v2 packet shape, Keepers completion state, Remix repeat sessions with variant metadata, Endless auto-looping, Pairwise comparison export, human-screen install prompt, empty Export workspace state, IndexedDB image storage, pending upload submit-only storage, profile image export/import, offline app-shell loading, and a 500-item local stress path.
- `manifest.webmanifest`, `package.json`, and `vercel.json` parse as JSON.
- `schemas/feedback.v2.json` parses as JSON and is checked for the `agentmash.feedback.v2` contract.
- The runtime packet schema and app code are checked to keep return modes local-only: `json` and `dataset`.
- `store/native-wrapper-handoff.md` records the later native shell path, bundle IDs, `_site` web directory, and no-analytics native rules.
- Mobile browser check at 390 by 844 showed no horizontal overflow.
- Desktop browser check at 1440 by 1000 showed no horizontal overflow.
- Browser console showed zero errors during human review and add-artifact testing.
- No third-party analytics, payments, telemetry, sockets, or API calls were found. The only network fetch is the service worker same-origin cache path.
- Store screenshots were refreshed in `store/screenshots/`.
- Manifest screenshots point to tracked screenshot assets.
- Public manifest screenshots point to `assets/screenshots`.
- `npm run check` builds `_site/` and verifies internal files are not packaged.
- `_site/` includes all public app modules and `sw.js` caches those module files.
- `sw.js` cache name was bumped to `agentmash-v19` after public app-shell code changes.
- Playwright e2e test passed: after service worker readiness, the app reloaded offline and rendered the AgentMash shell and swipe card.
- Netlify and Vercel configs are checked for `npm run build` plus `_site/` output.
- Apple touch icon is linked from `index.html`, cached by `sw.js`, and sized at 180 by 180.
- Playwright e2e test passed: a synthetic install prompt showed the `Install` button on Human review, kept Import/Export/Reset hidden, and hid Install after the prompt resolved.
- `index.html` declares `light dark` color schemes, and `styles.css` includes a dark-mode `prefers-color-scheme` branch.
- `index.html` and `support.html` show the package version.
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
- Playwright e2e test passed: profile export bundled uploaded image data, reset cleared the profile and removed the old IndexedDB image bytes, import restored the artifact, `localStorage` kept only the `imageKey`, and IndexedDB contained the restored data URL.
- Playwright e2e test passed: Nice, Undo, and Nope produced a ready `agentmash.feedback.v2` packet with `signalStrength`, no `confidence` field, and `agentmash.eval-row.v2`.
- Playwright e2e test passed: the always-visible momentum counter updated through Nice, Undo, and Nope.
- Playwright e2e test passed: profile insights generated a type-rate insight after a review.
- Playwright e2e test passed: the storage health indicator rendered local profile usage and IndexedDB image status.
- Playwright e2e test passed: Refine opens the hidden scoring/note panel and the panel closes again after a decision.
- Playwright e2e test passed: Details opens the hidden artifact detail sheet and closes it again.
- Playwright e2e test passed: completing the deck after a Nice judgement renders a Keepers summary with the surviving artifact.
- Playwright e2e test passed: Remix deck doubles local items from 4 to 8, creates tagline, mark-only, first-line, and cutout variants, keeps the original 4 reviews, adds a fifth review on the next swipe, preserves unique reviewed item IDs, exports variant metadata, and shows 5 JSONL rows.
- Playwright e2e test passed: Endless mode creates one local loop card after deck completion, records it as a normal v2 review on swipe, then creates only one next loop card.
- Playwright e2e test passed: Pairwise mode records a comparison without creating a swipe review, exports `agentmash.pairwise-row.v1`, then keeps normal v2 packets and rows working after returning to Swipe mode.
- Playwright e2e test passed: zero items and zero reviews rendered empty Export workspace counts and an empty packet without stale metrics.
- Playwright e2e test passed: a 500-item profile with 250 existing reviews accepted 100 more keyboard decisions, preserved 350 unique review rows, avoided storage warnings, and kept Export workspace usable.
- `npm run serve:build` served `_site/`; `/` and `assets/icons/apple-touch-icon.png` returned 200, while `store/completion-audit.md` returned 404.
- Draft submission assets are sized for Apple iPhone 6.9, Apple iPhone 6.5, Google phone, and Google Play feature graphic planning.
- GitHub repo is private at `https://github.com/Milian0402/AgentMash`.

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
- Add the real support contact to `support.html`.
- Update Open Graph metadata after the final public URL exists.
- Run the manual deployment workflow or connect a static host.
- Verify HTTPS, headers, service worker update behavior, privacy page, terms page, and support page on the public host.

## Remaining App Store Blockers

- Apple Developer Program or Google Play Console account.
- User-owned seller/developer identity.
- Public support URL with real contact information.
- Public privacy URL with developer identity and inquiry route.
- Native iOS or Android wrapper and signed build.
- Store-size screenshots from the native build.
- Apple privacy labels or Google Play Data safety submission.
- Store review contact details.

## Not In Scope Yet

- Paid plans, billing, auth, server storage, lab customer accounts, webhooks, or polling endpoints.
- Legal review.
- No backend, inbound agent submission, polling, webhook, or customer pipeline exists; the current second dashboard is a local export workspace.
