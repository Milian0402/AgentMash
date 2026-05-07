# Completion Audit

Checked on May 7, 2026. No deployment, paid account, domain purchase, app-store submission, or human outreach has been performed.

## Objective

Make AgentMash good enough to launch publicly as a serious app, while staying inside the user constraints:

- Do not contact anyone.
- Do not spend money.
- Do not deploy or publish without approval.
- Do as much launch preparation locally as possible.

## Success Criteria

- The product name, repo, and visible app identity are AgentMash.
- The local folder is in `/Users/maximiliannordler/code`.
- The app code is split into native ES modules with a thin `app.js` entry.
- The app has two clear dashboards: Human review and Export workspace.
- Human review supports fast first-impression judgement through a swipe-card flow.
- Optional scoring, tags, and notes are hidden behind a `Refine` tap by default.
- `Refine` opens as a bottom sheet above the decision controls instead of a panel below the swipe buttons.
- Inside `Refine`, tags and the decision note are visible first, while score sliders stay behind a compact `Scores` toggle.
- Human review shows an always-visible momentum counter for current run count, today's reviews, and day streak.
- Human review surfaces profile insights from review tags, artifact types, and review volume, with self-reflection copy such as "You reject generic cues..." instead of raw stat labels.
- On mobile, deck/profile/storage controls sit behind a `Deck` sheet so the first viewport stays focused on the swipe loop.
- Artifact title, prompt, requester line, and detail copy are hidden behind a `Details` sheet by default.
- Export workspace turns those human judgements into structured packets and JSONL rows.
- Artifact intake and packet return modes are local-only, so the public app does not imply webhooks, polling, or an inbound agent pipeline.
- The app remains local-first with no analytics, payment, contact, telemetry, socket, or third-party API hooks.
- Public launch pages, PWA metadata, icons, screenshots, offline cache, preview workflow, and static host security configs exist.
- Internal publishing notes stay out of the packaged public site so users do not see pre-launch status language.
- Public build output excludes internal launch docs, submission drafts, scripts, and repo metadata.
- Mobile install polish includes a dedicated Apple touch icon.
- Mobile install polish includes local iOS startup images for common large iPhone launch surfaces.
- All public pages link the app icon and Apple touch icon so legal/support pages do not fall back to missing `/favicon.ico` requests.
- Public HTML pages share AgentMash application-name, light/dark color-scheme, and theme-color metadata.
- Public preview metadata describes local feedback packets instead of implying a live agent handoff.
- The PWA install prompt is reachable from the default Human review screen without exposing profile import, export, or reset actions there.
- UI supports automatic light and dark color schemes from the operating system preference.
- Mobile layout accounts for iOS safe-area insets around the top bar and sticky decision controls.
- Segmented review controls use pressed-button group semantics rather than incorrect tab roles.
- Keyboard focus rings are visible on interactive controls.
- Image upload validation feedback is exposed through a polite status region.
- Public pages expose the package version for support and debugging.
- Privacy and terms pages show an effective date and current build version.
- Public pages avoid deferred backend-channel language that would imply a live webhook, polling, or hosted agent pipeline.
- Public HTML pages include CSP fallback metadata for static hosts that do not honor custom header files.
- Destructive reset is clearly labelled and confirmed.
- Destructive reset clears uploaded image bytes from IndexedDB, not only visible profile state.
- Profile import confirms before replacing existing local data.
- Copy actions have a graceful browser-denial path.
- User-uploaded image artifacts are constrained to safe raster formats and a local-storage-friendly size.
- Feedback packets and JSONL rows include required `submittedAt` metadata and available image data for visual artifacts.
- Legacy or partial imported reviews without stored grade or recommendation are normalized without breaking profile loading.
- Uploaded image bytes live in IndexedDB, while profile state without `imageData` remains in `localStorage`.
- Pending upload choices stay out of IndexedDB until the artifact is submitted.
- Profile export/import bundles uploaded image bytes and restores them to IndexedDB without reintroducing image data into `localStorage`.
- Human review shows storage health for the local profile and IndexedDB image store.
- `saveState()` handles local-storage quota failures with a visible UI warning.
- Export workspace empty states render correctly with zero items and zero reviews.
- Feedback packets use schema v2 with `signalStrength` and a documented formula.
- Feedback packet export verdicts use `accepted` / `rejected` so downstream datasets do not confuse `pass` with approval.
- Dataset-mode return envelopes advertise `application/x-ndjson` instead of generic JSON.
- `schemas/feedback.v2.json` documents the packet shape for local validation by future lab consumers.
- Export workspace visibly validates the active feedback packet and JSONL rows against the local contract before copy or download.
- Reviewer name edits visibly confirm save status.
- The Refine panel closes after each decision so the next artifact returns to the fast card-first loop.
- The Details sheet closes after each decision so the next artifact returns to the clean card state.
- Undo restores the card and the deck filter that produced the decision, so undoing from `All` does not narrow the deck to a single artifact type.
- Rapid duplicate taps, keypresses, and drags are locked during the outgoing-card animation so one artifact cannot receive accidental repeated decisions.
- Mobile filter labels fit at 390 by 844 without truncating the `Product` tab.
- Reduced-motion users get shortened transition timing for the swipe-card animation.
- Decisions use supported local haptics plus a quiet WebAudio tick to give the swipe loop tactile feedback.
- Deck completion shows a stronger survived-count and keeper-card summary instead of dead air.
- Deck completion can start a local Remix session with type-specific tagline, mark-only, first-line, and cutout glance variants without overwriting existing export rows.
- Endless mode auto-loops one local glance-variant card at a time when enabled.
- Pairwise mode captures relative preference signals without creating normal swipe reviews.
- `npm run check` syntax-checks every app module and includes Playwright e2e coverage for review flow, transition locking, mobile filter readability, packet shape, Keepers completion state, Remix repeat sessions with variant metadata, Endless auto-looping, Pairwise comparison export, empty Export workspace state, image persistence, profile image export/import, offline app-shell loading, and a 500-item local stress path.
- App Store and Google Play prep is documented without creating paid accounts.
- Native wrapper handoff is documented without installing packages or creating native projects.
- Verification covers static files, metadata, security posture, forbidden hooks, launch docs, store assets, and the core runtime flow.
- Remaining requirements that need user accounts, money, contact details, deployment, or legal decisions are named and not pretended done.

## Prompt-To-Artifact Checklist

| Requirement | Evidence | Status |
| --- | --- | --- |
| Do not contact anyone or spend money. | `store/public-launch-audit.md`, `PUBLISHING.md`, and `store/app-store-submission.md` state no outreach, paid account, domain, deployment, or store submission happened. `npm run check` scans for contact/payment hooks. | Met locally |
| Research what can look nice. | `store/research-and-cost-guide.md` records design guidance and sources. | Met locally |
| Make a guide for paid launch steps such as domain, publishing, app stores, support, and accounts. | `PUBLISHING.md`, `store/public-launch-plan.md`, `store/research-and-cost-guide.md`, and `store/app-store-submission.md`. | Met locally |
| App should use fast, lazy, split-second human judgement. | Human review copy in `index.html`, input handling in `gestures.js`, rendering in `render.js`, and judgement model in `store/review-system.md`. | Met locally |
| There should be two dashboards: human user and AI agent/lab. | `index.html` has Human review and Export workspace views; `app.js` wires dashboard switching, `render.js` renders both surfaces, and `packet.js` builds local feedback packets/JSONL exports. | Met locally |
| Human review should feel like a modern swipe-card app without relationship-context wording. | `index.html`, `styles.css`, and refreshed screenshots in `store/screenshots`. `npm run check` rejects relationship-app wording. | Met locally |
| Keep the default swipe loop focused. | `index.html` hides `signalPanel` by default behind `Refine`; inside that sheet, tags and the note appear before score controls, and sliders stay hidden until `Scores` is tapped. `render.js` manages the panel and score-toggle state, `app.js` resets it after decisions, and Playwright verifies hidden, open, score controls hidden, score controls visible after `Scores`, then hidden again after a swipe. | Met locally |
| Make Refine feel like a bottom sheet. | `styles.css` positions the first-look `signalPanel` as a fixed bottom sheet above the decision controls, with the controls kept clickable in the higher layer. | Met locally |
| Add swipe-loop momentum. | `index.html` adds `streakCounter`, `render.js` derives the current run, today count, and day streak from review timestamps, and `styles.css` adds milestone animation at 10, 25, and 50. Playwright verifies the counter updates through Nice, Undo, and Nope. | Met locally |
| Give humans a return reason. | `index.html` adds `profileInsights`, `render.js` summarizes local preference patterns by tag, artifact type, and daily/total review volume in direct self-reflection language, and Playwright verifies both single-review and seeded multi-review insight output. | Met locally |
| Add subtle decision feedback. | `gestures.js` uses richer `navigator.vibrate` patterns when supported and a defensive WebAudio tick for Nice, Nope, and Pairwise decisions. `app.js` passes decision type into `pulseDevice()`. | Met locally |
| Avoid broken rapid-tap states. | `app.js` locks duplicate decisions during the outgoing-card transition, disables the decision/filter/detail/refine controls until the next card renders, and shortens timing under reduced motion. `gestures.js` blocks keyboard and drag input while locked. Playwright verifies two rapid click events create one review. | Met locally |
| Keep mobile filters readable. | `styles.css` gives the filter tabs a mobile-specific 3-column layout with nowrap labels, and Playwright verifies no filter label overflows at 390 by 844. | Met locally |
| Keep segmented controls accessible. | `index.html` uses `role="group"` for review-mode and filter segmented controls, `render.js` updates `aria-pressed` on active filter buttons, and Playwright verifies the group roles and pressed state. | Met locally |
| Keep keyboard navigation visible. | `styles.css` adds a visible `:focus-visible` outline for buttons, links, inputs, textareas, selects, and the swipe card; Playwright verifies the decision button focus ring. | Met locally |
| Announce upload validation feedback. | `index.html` marks `imageStatus` as `role="status"` with `aria-live="polite"`, and Playwright plus `npm run check:launch` verify the accessible status region. | Met locally |
| Make card details tap-to-reveal. | `index.html` hides `detailSheet` behind `Details`; `render.js` manages the sheet state and `app.js` resets it after decisions; Playwright verifies hidden, open with artifact title, close, and hidden again. | Met locally |
| Replace deck-complete dead air with Keepers. | `index.html` renders a Keepers completion state, `render.js` lists recent Nice artifacts from the completed view, and Playwright verifies the surviving artifact appears after the deck empties. | Met locally |
| Keep the review loop going after completion. | `index.html` adds `Remix deck`, `app.js` remixes the filtered local deck, `state.js` supplies type-specific tagline, mark-only, first-line, and cutout variants, and Playwright verifies old reviews remain, item IDs stay unique, variant metadata exports, JSONL rows grow only after the next swipe, and deck completion shows a survived-count keeper summary. | Met locally |
| Make the swipe loop automatic when requested. | `index.html` adds `Endless`, `state.js` creates one loop card at a time with `loopSourceItemId`, and Playwright verifies the app avoids the empty state while growing local storage only one card per completed swipe. | Met locally |
| Add pairwise preference capture. | `index.html` adds Pairwise mode, `app.js` stores `pairwiseComparisons` separately from swipe reviews, `packet.js` exports `agentmash.pairwise-row.v1`, and Playwright verifies pairwise choices do not create normal reviews while packet/export rows still work. | Met locally |
| Split app code into native ES modules. | `index.html` loads `<script type="module" src="app.js">`; `app.js` is now a thin action/wiring entry, with state/storage in `state.js`, packet/export logic in `packet.js`, rendering in `render.js`, and swipe/keyboard handling in `gestures.js`. `npm run check` syntax-checks all modules and Playwright serves them over local HTTP. | Met locally |
| Rename product and repo to AgentMash. | `package.json`, `manifest.webmanifest`, visible HTML, docs, and GitHub remote point to `Milian0402/AgentMash`. | Met locally |
| Put repo in the code folder. | Local repo path is `/Users/maximiliannordler/code/AgentMash`. | Met locally |
| Make it ready for public web launch where possible. | Privacy, terms, support, 404, manifest, service worker, icons, screenshots, preview workflow, and security header configs exist. Publishing and cost guidance stays in internal repo docs. | Met locally |
| Verify offline PWA behavior. | Playwright waits for the service worker, switches the browser context offline, reloads, and verifies the AgentMash app shell and swipe card still render. | Met locally |
| Avoid publishing internal launch docs and submission drafts. | `npm run build` writes `_site/` with only public app files. GitHub Pages, Netlify, and Vercel configs publish `_site/`. `npm run check` verifies `store/`, `scripts/`, `.github`, docs, package metadata, and host config files are not packaged. | Met locally |
| Keep internal launch status out of the public app. | `publishing.html` remains in the repo for local guidance but is no longer linked from `index.html`, copied into `_site/`, or cached by `sw.js`. `npm run check` verifies it is excluded from the public build. | Met locally |
| Make the PWA feel install-ready on iOS. | `assets/icons/apple-touch-icon.png` is 180 by 180, startup images in `assets/startup` are 1290 by 2796 and 1242 by 2688, `index.html` links them through Apple PWA metadata, `sw.js` caches them, and `npm run check` verifies the files and links. | Met locally |
| Avoid missing favicon polish errors. | `support.html`, `privacy.html`, `terms.html`, and `404.html` now link `assets/app-icon.svg` and `assets/icons/apple-touch-icon.png`; `npm run check` verifies every public HTML page links both icons. | Met locally |
| Keep public pages visually consistent when opened directly. | `index.html`, `support.html`, `privacy.html`, `terms.html`, and `404.html` include AgentMash app-name metadata, light/dark color-scheme metadata, and light/dark theme-color entries. `npm run check` verifies this for every public HTML page. | Met locally |
| Keep public preview metadata honest. | `index.html` description, Open Graph, and Twitter metadata now describe structured local feedback packets and avoid `agent-ready feedback`; `scripts/launch-check.mjs` verifies this wording. | Met locally |
| Keep public pages safer on simpler static hosts. | `index.html`, `support.html`, `privacy.html`, `terms.html`, and `404.html` include a self-only CSP meta fallback for hosts that do not honor `_headers`; `scripts/launch-check.mjs` verifies it across public HTML pages. | Met locally |
| Make install prompt reachable in the default flow. | `app.js` handles `beforeinstallprompt` and `appinstalled`, `styles.css` reveals only `Install` inside the Human review topbar when available, and Playwright verifies Import, Export, and Reset remain hidden while Install is visible and clickable. | Met locally |
| Support OS dark mode. | `index.html` advertises `light dark` color schemes, and `styles.css` uses `@media (prefers-color-scheme: dark)` to switch core variables, panels, controls, preview surfaces, and swipe chrome. `npm run check` verifies the hook exists. | Met locally |
| Avoid notch and home-indicator collisions. | `index.html` uses `viewport-fit=cover`; `styles.css` applies safe-area inset variables to the top bar, workspace bottom padding, sticky decision controls, and Refine sheet. | Met locally |
| Make public support and legal reports actionable. | `index.html`, `support.html`, `privacy.html`, and `terms.html` show the package version, `privacy.html` and `terms.html` show an effective date, and `npm run check` verifies those values. | Met locally |
| Keep public support copy polished before release. | `support.html` and `privacy.html` avoid prelaunch placeholder wording such as missing support inbox copy; `scripts/launch-check.mjs` rejects that wording in public HTML. The real support route remains a user action before public release. | Met locally |
| Avoid accidental local data loss. | Reset is labelled `Reset profile`, requires browser confirmation, clears IndexedDB image bytes, and is verified by `npm run check`. | Met locally |
| Avoid accidental profile overwrite. | Profile import prompts when local reviews, uploads, notes, added artifacts, or reviewer name exist. The support page tells users to export before importing. | Met locally |
| Avoid misleading copy status. | Packet and dataset copy use a shared helper with Clipboard API, fallback copy, and `Copy unavailable` status when blocked. | Met locally |
| Keep user uploads safe for a public local-first app. | The artifact form accepts only PNG, JPG, and WebP. `app.js` rejects other image types, `state.js` caps images at 2.5 MB and sanitizes imported image data. | Met locally |
| Avoid localStorage quota crashes from image uploads. | `state.js` stores uploaded image data in IndexedDB, writes only `imageKey` plus text state to `localStorage`, wraps `saveState()` in `try/catch`, and uses `render.js` to show `Local storage full` in the UI when saving fails. Playwright verifies image data is absent from `localStorage`, present in IndexedDB, exported in the profile bundle, cleared on reset, and restored to IndexedDB on import. | Met locally |
| Avoid orphaned pending image uploads. | `app.js` keeps selected image data in memory until submit, writes it to IndexedDB only when the artifact is added, and Playwright verifies changing from `first.png` to `second.png` leaves zero IndexedDB image keys until submit and exactly one submitted image key after. | Met locally |
| Surface storage health before it fails. | `state.js` estimates local profile bytes and IndexedDB image bytes; `render.js` shows local profile usage against an approximate 5 MB localStorage budget and image-store usage in the Human review panel. | Met locally |
| Stress-test local scale. | Playwright seeds 500 local artifacts and 250 existing reviews, drives 100 more keyboard decisions, verifies 350 unique reviews, confirms no storage warning, and verifies Export workspace still shows 350 JSONL rows and a ready packet. | Met locally |
| Keep Export workspace empty metrics honest. | Playwright verifies zero items and zero reviews render `0 artifacts`, `0` ready exports, `0` unjudged items, `None` average signal, `0 rows`, and an empty packet. | Met locally |
| Remove misleading inbound-agent scope. | The second dashboard is now framed as `Export workspace` / `Local export workspace`; `npm run check` rejects `Agent lab`, `Request Queue`, `Waiting on humans`, `Returned Signals`, `Retry queue`, and `No agent requests` in the public app. | Met locally |
| Keep export modes honest for a local-only app. | `index.html` now labels intake as `Add Artifact`, `Export metadata`, and `Export format`; only JSON packet and eval dataset formats are selectable. `state.js` normalizes legacy `webhook` or `polling` modes back to `json`; `packet.js` returns `application/json` or `application/x-ndjson`; `schemas/feedback.v2.json` only exposes `json` and `dataset`. `npm run check` rejects unavailable network-return wording in the public intake and runtime packet contract. | Met locally |
| Rename misleading confidence output. | Feedback packets use `agentmash.feedback.v2`, `signalStrength`, top-level `signalStrengthFormula`, and export verdicts normalized to `accepted` / `rejected`; eval rows use `agentmash.eval-row.v2`; `store/agent-customer-model.md` documents the migration. | Met locally |
| Add a packet validation contract. | `schemas/feedback.v2.json` describes ready, pending, and empty `agentmash.feedback.v2` packet shapes, including `signalStrength`, required `submittedAt`, image envelope metadata, request metadata, judgement fields, agent use, eval rows, and return envelope. `packet.js` validates active feedback packets and export rows locally; `render.js` surfaces `v2 valid`, `Rows valid`, `No rows`, or issue badges in Export workspace. | Met locally |
| Keep visual artifact exports useful to labs. | `packet.js` includes available image data URLs in request and eval-row artifact image envelopes; Playwright verifies uploaded image packets contain the image key, media type, and data URL while localStorage stays image-free. | Met locally |
| Avoid mislabeled positive training data. | `packet.js` only adds `failure_taxonomy` when failure modes exist and only adds `prompt_repair` for rejected, weak, or repair-needed outputs. | Met locally |
| Confirm reviewer name persistence visibly. | `index.html`, `styles.css`, `app.js`, and `render.js` show a saved/not-saved status after reviewer name edits. | Met locally |
| Add Playwright regression coverage. | `tests/review-flow.spec.mjs` is wired through `npm run check`, uses `npm run serve` for native modules, and covers Nice, Undo, Nope, rapid duplicate decision locking, mobile filter readability, compact Refine score toggle, export contract badges, Undo preserving the active deck, v2 packet shape, normalized export verdicts, dataset return format, Keepers completion state, Remix repeat sessions with variant metadata, Endless auto-looping, Pairwise comparison export, human-screen install prompt, empty Export workspace state, IndexedDB image persistence, pending upload submit-only storage, profile image export/import, offline app-shell loading, and the 500-item stress path. | Met locally |
| Use simulated local user feedback constructively. | Local subagent personas reviewed mobile swiping, export/lab data shape, launch QA, and visual polish without contacting anyone. Their concrete findings led to the public-page icon fix, Undo deck regression fix, export contract hardening, refreshed screenshots, hidden internal publishing notes, and mobile Refine/Pairwise flow fixes. | Met locally |
| Keep mobile swipe loop focused. | `index.html`, `styles.css`, `app.js`, and `render.js` move the lower human dashboard controls behind a mobile `Deck` sheet and hide the footer in the Human review phone layout. Playwright verifies the panel starts hidden and can be opened/closed. | Met locally |
| Make it closer to App Store or Google Play readiness without paid setup. | `store/app-store-listing.md`, `store/app-store-submission.md`, `store/privacy-data-safety-draft.md`, and `store/submission` draft assets. | Met locally |
| Prepare native wrapper handoff without changing the zero-dep app. | `store/native-wrapper-handoff.md` names Capacitor as the later shell path, records `com.agentmash.app`, `_site`, setup commands, native v1 privacy rules, and verification steps. No native project or package was installed. | Met locally |
| Verify core behavior, not just files. | Real browser smoke test on `http://127.0.0.1:5177` passed: title, human dashboard, note save, Nice, Undo, Nope, Export workspace, ready packet, JSONL preview, packet JSON, and download buttons. Console errors: 0. | Met locally |
| Keep the repo private. | `gh repo view Milian0402/AgentMash` showed `visibility: PRIVATE`. | Met locally |

## Verification Commands

- `npm run check`
- `npm run build`
- `npm run serve:build`
- `git status --short --branch`
- `curl -sS -o /dev/null -w %{http_code} http://127.0.0.1:5177/`
- `curl -sS -o /dev/null -w %{http_code} http://127.0.0.1:5177/store/submission/google-play-feature-graphic.png`
- Playwright CLI browser smoke test against `http://127.0.0.1:5177`
- Playwright e2e tests through `npm run check`

## Not Achieved Yet

These are still not done because they require user-owned accounts, money, public contact details, legal decisions, deployment, or store submission:

- Public URL and hosting provider selection.
- Domain purchase or final decision to use no custom domain.
- Real support contact in `support.html`.
- Open Graph metadata with final public URL.
- Public deployment.
- Public HTTPS/header/service-worker verification.
- Apple Developer Program or Google Play Console account.
- Native iOS or Android wrapper and signed build.
- Store screenshots captured from the native wrapper.
- App Review or Play review contact details.
- Legal/privacy review for paid or hosted use.

## Conclusion

AgentMash is locally launch-prepared within the user's constraints. The public launch objective is not fully complete because actual public distribution still depends on user-owned setup steps that were explicitly out of scope.
