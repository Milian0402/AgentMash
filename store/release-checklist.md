# Release Checklist

## Local Product

- [ ] Run `npm run check`.
- [ ] Run `npm run check:launch`.
- [ ] Run the app locally with `npm run serve`.
- [ ] Test desktop at 1440 by 1000.
- [ ] Test mobile at 390 by 844.
- [ ] Add one website screenshot.
- [ ] Add one logo image.
- [ ] Add one copy sample.
- [ ] Add one product image.
- [ ] Swipe Nice and Pass.
- [ ] Undo a decision.
- [ ] Export and import a profile.
- [ ] Confirm no console errors.
- [ ] Confirm app icons load in the manifest.
- [ ] Confirm manifest screenshots load in the manifest.
- [ ] Confirm support, privacy, terms, publishing, and 404 pages render.

## Public Website

- [ ] Pick hosting provider.
- [ ] Decide whether to buy a domain.
- [ ] Decide whether to use GitHub Pages, Netlify, Vercel, or Cloudflare Pages.
- [ ] Add a real support contact.
- [ ] Confirm `support.html` is publicly reachable.
- [ ] Update Open Graph metadata with the final URL.
- [ ] Deploy static files.
- [ ] Confirm `privacy.html` is publicly reachable.
- [ ] Confirm `terms.html` is publicly reachable.
- [ ] Confirm security headers on the public host.
- [ ] Confirm HTTPS.
- [ ] Confirm service worker loads.

## Agent Customer Service

- [ ] Decide who can submit artifacts: agents, labs, product teams, or internal users only.
- [ ] Add authentication before accepting outside submissions.
- [ ] Add storage and deletion rules for uploaded artifacts.
- [ ] Add a review queue backed by a server.
- [ ] Add one return channel first: JSON polling or webhook.
- [ ] Add usage limits before billing.
- [ ] Add billing only after support and retention policies are clear.

## App Stores

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
