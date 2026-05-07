# Release Checklist

Last local verification: May 7, 2026. No deployment, paid account, domain purchase, app-store submission, or human outreach has been performed.

## Verified Locally

- [x] Run `npm run check`.
- [x] Run `npm run check:launch`.
- [x] Run `npm run check:configure-public`.
- [x] Syntax-check `app.js`, `state.js`, `packet.js`, `render.js`, `gestures.js`, `sw.js`, and launch scripts.
- [x] Run Playwright e2e coverage through local HTTP with `npm run serve`.
- [x] Run `npm run ready:public`.
- [x] Confirm `_site/` includes public app files and native modules.
- [x] Confirm `_site/` excludes internal `store/`, `scripts/`, tests, repo metadata, package files, and host config files.
- [x] Confirm GitHub Pages, Netlify, and Vercel configs use `_site/` as the publish or output directory.
- [x] Confirm the service worker caches the public app shell, icons, screenshots, pages, and native modules.
- [x] Confirm the service worker renders the app shell after an offline reload.
- [x] Test desktop layout at 1440 by 1000.
- [x] Test mobile layout at 390 by 844.
- [x] Confirm starter artifacts cover website, logo, copy, and product image review types.
- [x] Confirm SVG upload is rejected.
- [x] Confirm oversized image upload is rejected.
- [x] Confirm a small PNG upload stores bytes in IndexedDB, not `localStorage`.
- [x] Confirm profile export/import restores uploaded image bytes to IndexedDB without storing them in `localStorage`.
- [x] Confirm reset removes uploaded image bytes from IndexedDB.
- [x] Confirm storage health reports local profile usage and IndexedDB image usage.
- [x] Stress-test 500 local artifacts, 250 existing reviews, and 100 more swipes.
- [x] Swipe Nice and Nope.
- [x] Confirm rapid duplicate decisions create one review and lock controls until the next card is ready.
- [x] Undo a decision.
- [x] Confirm Undo preserves the active deck filter.
- [x] Open and close Details.
- [x] Open Refine and verify it closes after a decision.
- [x] Confirm Refine opens as a bottom sheet above the decision controls.
- [x] Confirm Refine keeps score sliders behind the `Scores` toggle.
- [x] Confirm the momentum counter updates after Nice, Undo, and Nope.
- [x] Confirm profile insights update after a review.
- [x] Confirm decisions use supported haptic patterns and a quiet local WebAudio tick.
- [x] Confirm light and dark color schemes follow OS preference.
- [x] Confirm reduced-motion timing keeps swipe decisions usable.
- [x] Confirm the mobile layout uses iOS safe-area inset spacing.
- [x] Confirm mobile filter labels do not truncate at 390 by 844.
- [x] Complete a deck and show Keepers.
- [x] Start a Remix session.
- [x] Enable Endless mode and verify one loop card is created at a time.
- [x] Record a Pairwise comparison without creating a swipe review.
- [x] Export ready JSON and JSONL data.
- [x] Confirm exported packet verdicts use `accepted` and `rejected`.
- [x] Confirm dataset-mode return envelopes use `application/x-ndjson`.
- [x] Confirm Export workspace shows local packet and JSONL contract status.
- [x] Confirm `schemas/feedback.v2.json` documents the v2 feedback packet contract.
- [x] Confirm v2 packet validation requires `submittedAt` and image envelope metadata is exported when available.
- [x] Confirm legacy imported reviews without grade or recommendation still load.
- [x] Confirm native wrapper handoff exists without installing native dependencies.
- [x] Confirm empty Export workspace metrics show zero items, zero rows, and no stale average signal.
- [x] Confirm no console errors in local smoke testing.
- [x] Confirm app icons load in the manifest.
- [x] Confirm manifest screenshots load from public assets.
- [x] Confirm screenshots were refreshed from the current app language and mobile header.
- [x] Confirm all public HTML pages link the app favicon and Apple touch icon.
- [x] Confirm all public HTML pages include app-name, color-scheme, and light/dark theme-color metadata.
- [x] Confirm internal publishing notes are not linked from the app footer or packaged into `_site/`.
- [x] Confirm the install prompt is visible from the Human review screen without exposing other profile actions.
- [x] Confirm support, privacy, terms, publishing, and 404 pages render locally.
- [x] Confirm no analytics, payment, contact, telemetry, socket, third-party API, or outbound fetch hooks exist in the public app surface.
- [x] Confirm pending image uploads are written to IndexedDB only after submit.
- [x] Confirm mobile Refine sheets clear the decision rail and Pairwise mode scrolls back to the review stage.
- [x] Confirm mobile Human review keeps deck/profile controls behind the `Deck` sheet by default.

## Needs User Action Before Public Website Launch

- [ ] Pick hosting provider.
- [ ] Decide whether to buy a domain or launch on a free host subdomain.
- [ ] Decide whether to use GitHub Pages, Netlify, Vercel, Cloudflare Pages, or another static host.
- [ ] Run `npm run configure:public -- --url https://YOUR-PUBLIC-URL --support YOUR-SUPPORT-ROUTE`.
- [ ] Add developer identity and inquiry route to `privacy.html` if required for the launch type.
- [ ] Run `npm run ready:public` again after configuring the final public metadata.
- [ ] Deploy static files.
- [ ] Confirm `support.html` is publicly reachable.
- [ ] Confirm `privacy.html` is publicly reachable.
- [ ] Confirm `terms.html` is publicly reachable.
- [ ] Run `npm run verify:public -- https://YOUR-PUBLIC-URL`.
- [ ] Confirm security headers on the public host.
- [ ] Confirm HTTPS.
- [ ] Confirm service worker install and update behavior on the public host.

## Deferred Agent Customer Service

- [ ] Decide who can submit artifacts: agents, labs, product teams, or internal users only.
- [ ] Add authentication before accepting outside submissions.
- [ ] Add storage and deletion rules for uploaded artifacts.
- [ ] Add a review queue backed by a server.
- [ ] If a backend is built later, add one return channel first after auth and deletion rules exist.
- [ ] Add usage limits before billing.
- [ ] Add billing only after support and retention policies are clear.

## Needs User Action Before App Stores

- [ ] Read `store/app-store-submission.md`.
- [ ] Read `store/privacy-data-safety-draft.md`.
- [ ] Read `store/native-wrapper-handoff.md`.
- [ ] Decide iOS, Android, web-only, or both stores.
- [ ] Create developer account only when ready to pay.
- [ ] Publish `privacy.html` and `support.html` at stable public URLs.
- [ ] Add developer identity and support contact details.
- [ ] Wrap the app in a native shell.
- [ ] Generate the final platform icon set from `store/app-icon-1024.png`.
- [ ] Capture store screenshots from the native build, not only the PWA preview.
- [ ] Replace draft assets in `store/submission` with screenshots from the final native build.
- [ ] Fill Apple privacy labels and Google Play Data safety forms.
- [ ] Add App Review or Play review contact details.
- [ ] Run real iPhone and Android device tests.
- [ ] Submit for review.
