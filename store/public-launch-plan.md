# Public Launch Plan

Checked on May 7, 2026. No deployment, paid account, domain purchase, app-store submission, or human outreach has been performed.

## Launch Positioning

AgentMash is a local-first review deck for turning fast human judgement on AI-generated work into structured feedback.

Use this framing:

- Swipe through AI-generated work.
- Trust the first reaction.
- Capture a structured feedback packet.
- Export JSON or JSONL when a human wants to hand the signal to an agent, lab, or dataset.

Do not frame the current build as:

- A hosted lab platform.
- A paid feedback API.
- A replacement for formal user research.
- A production training data service.
- A tool that automatically sends private review data anywhere.

## Closest Launch Path

The cheapest serious path is:

1. Launch the web/PWA version first on a free static host.
2. Use the hosted privacy and support pages as the canonical public URLs.
3. Run a small real-user test before buying app-store accounts.
4. Package for iOS or Android only if mobile install demand is real.
5. Add hosted lab features only after there is actual demand for submitted jobs, return channels, and shared accounts.

This keeps the app launchable without paying for a domain, app-store accounts, hosted storage, or support tooling too early.

## Ready Now

- Private GitHub repo named `AgentMash`.
- Static PWA app shell.
- Installable manifest with app icons and screenshots.
- Offline service worker.
- Human review dashboard.
- Agent lab dashboard.
- Local-only privacy model.
- Export and import.
- JSON feedback packets.
- JSONL eval rows.
- Privacy, terms, support, publishing, and 404 pages.
- Static host headers for GitHub Pages, Netlify, Vercel, and Cloudflare Pages style hosting.
- Store listing copy and privacy/data safety drafts.
- Draft store submission screenshots and feature graphic in `store/submission`.
- Launch verifier through `npm run check`.

## Minimum Public Website Launch

These are the only steps left for a serious public web launch:

1. Pick the public URL.
2. Pick a static host.
3. Decide whether a custom domain is worth paying for now.
4. Add a real public support contact to `support.html`.
5. Update Open Graph metadata after the final public URL exists.
6. Deploy the static files.
7. Run `npm run check` before deployment.
8. Recheck HTTPS, security headers, support, privacy, terms, manifest, and service worker on the public URL.

## Minimum App Store Launch

These steps cannot be completed locally without paid accounts and user-owned identity details:

1. Join the Apple Developer Program or create a Google Play Console account.
2. Choose the seller/developer identity that will appear in the store.
3. Publish `privacy.html` and `support.html` at stable public URLs.
4. Create a native iOS or Android wrapper around the static app.
5. Generate screenshots from that native build on required device sizes.
6. Fill Apple privacy labels or Google Play Data safety using `store/privacy-data-safety-draft.md`.
7. Provide App Review or Play review contact details.
8. Submit for review.

## First Public Test

Before paying for app stores, test these five artifact types:

- One website screenshot.
- One logo candidate.
- One generated copy sample.
- One product image.
- One intentionally weak artifact.

For each artifact, verify:

- Swipe Nice and Nope both feel obvious.
- Undo works.
- Scoring saves.
- Tags save.
- Notes save.
- Agent lab shows a ready packet.
- JSON download works.
- JSONL dataset row is valid.

## Upgrade Path

Move toward a paid lab/customer product only after:

- Outside users complete real review sessions.
- Support issues are understood.
- A retention and deletion policy exists.
- Agent/lab customers ask for hosted submissions or return channels.
- Backend auth, queueing, rate limits, and abuse handling are designed.
- Legal/privacy review is complete for hosted or paid use.
