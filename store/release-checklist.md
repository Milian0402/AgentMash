# Release Checklist

Last local verification: May 7, 2026. No deployment, paid account, domain purchase, app-store submission, or human outreach has been performed.

## Verified Locally

- [x] Run `npm run check`.
- [x] Run `npm run check:launch`.
- [x] Syntax-check `app.js`, `state.js`, `packet.js`, `render.js`, `gestures.js`, `sw.js`, and launch scripts.
- [x] Run Playwright e2e coverage through local HTTP with `npm run serve`.
- [x] Run `npm run build`.
- [x] Confirm `_site/` includes public app files and native modules.
- [x] Confirm `_site/` excludes internal `store/`, `scripts/`, tests, repo metadata, package files, and host config files.
- [x] Confirm GitHub Pages, Netlify, and Vercel configs use `_site/` as the publish or output directory.
- [x] Confirm the service worker caches the public app shell, icons, screenshots, pages, and native modules.
- [x] Test desktop layout at 1440 by 1000.
- [x] Test mobile layout at 390 by 844.
- [x] Confirm starter artifacts cover website, logo, copy, and product image review types.
- [x] Confirm SVG upload is rejected.
- [x] Confirm oversized image upload is rejected.
- [x] Confirm a small PNG upload stores bytes in IndexedDB, not `localStorage`.
- [x] Confirm profile export/import restores uploaded image bytes to IndexedDB without storing them in `localStorage`.
- [x] Confirm storage health reports local profile usage and IndexedDB image usage.
- [x] Stress-test 500 local artifacts, 250 existing reviews, and 100 more swipes.
- [x] Swipe Nice and Nope.
- [x] Undo a decision.
- [x] Open and close Details.
- [x] Open Refine and verify it closes after a decision.
- [x] Confirm Refine opens as a bottom sheet above the decision controls.
- [x] Confirm the momentum counter updates after Nice, Undo, and Nope.
- [x] Confirm decisions use supported haptic patterns and a quiet local WebAudio tick.
- [x] Confirm light and dark color schemes follow OS preference.
- [x] Confirm the mobile layout uses iOS safe-area inset spacing.
- [x] Complete a deck and show Keepers.
- [x] Start a Remix session.
- [x] Enable Endless mode and verify one loop card is created at a time.
- [x] Record a Pairwise comparison without creating a swipe review.
- [x] Export ready JSON and JSONL data.
- [x] Confirm `schemas/feedback.v2.json` documents the v2 feedback packet contract.
- [x] Confirm empty Export workspace metrics show zero items, zero rows, and no stale average signal.
- [x] Confirm no console errors in local smoke testing.
- [x] Confirm app icons load in the manifest.
- [x] Confirm manifest screenshots load from public assets.
- [x] Confirm support, privacy, terms, publishing, and 404 pages render locally.
- [x] Confirm no analytics, payment, contact, telemetry, socket, third-party API, or outbound fetch hooks exist in the public app surface.

## Needs User Action Before Public Website Launch

- [ ] Pick hosting provider.
- [ ] Decide whether to buy a domain or launch on a free host subdomain.
- [ ] Decide whether to use GitHub Pages, Netlify, Vercel, Cloudflare Pages, or another static host.
- [ ] Add a real support contact to `support.html`.
- [ ] Add developer identity and inquiry route to `privacy.html` if required for the launch type.
- [ ] Update Open Graph URLs after the final public URL exists.
- [ ] Deploy static files.
- [ ] Confirm `support.html` is publicly reachable.
- [ ] Confirm `privacy.html` is publicly reachable.
- [ ] Confirm `terms.html` is publicly reachable.
- [ ] Confirm security headers on the public host.
- [ ] Confirm HTTPS.
- [ ] Confirm service worker install and update behavior on the public host.

## Deferred Agent Customer Service

- [ ] Decide who can submit artifacts: agents, labs, product teams, or internal users only.
- [ ] Add authentication before accepting outside submissions.
- [ ] Add storage and deletion rules for uploaded artifacts.
- [ ] Add a review queue backed by a server.
- [ ] Add one return channel first: JSON polling or webhook.
- [ ] Add usage limits before billing.
- [ ] Add billing only after support and retention policies are clear.

## Needs User Action Before App Stores

- [ ] Read `store/app-store-submission.md`.
- [ ] Read `store/privacy-data-safety-draft.md`.
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
