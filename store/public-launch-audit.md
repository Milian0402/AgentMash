# Public Launch Audit

Checked on May 7, 2026. No deployment, paid account, domain purchase, app-store submission, or human outreach has been performed.

## Objective

Make AgentMash good enough to launch publicly as a serious app.

## Launch-Ready Locally

- Product name and private GitHub repository are `AgentMash`.
- Local repo path is `/Users/maximiliannordler/code/AgentMash`.
- Human review dashboard is phone-first and supports swipe, buttons, keyboard shortcuts, undo, scoring, tags, and notes.
- Agent lab dashboard collects requests, ready packets, JSON downloads, and JSONL eval rows.
- Add Artifact is reachable from the human dashboard and returns to the swipe deck after submit.
- Starter artifacts are credible launch examples instead of placeholder-only cards.
- Privacy, terms, support, publishing, 404, manifest, icons, service worker, and static host config are present.
- PWA manifest includes mobile and desktop screenshots.
- Public build script packages `_site/` without internal launch docs, submission drafts, scripts, or repo metadata.
- GitHub Pages, Netlify, and Vercel configs publish `_site/` instead of repo root.
- Dedicated Apple touch icon is present for iOS home-screen install polish.
- Public footer and support page expose the current release version for support/debugging.
- Reset uses profile wording and requires confirmation before clearing local data.
- Profile import requires confirmation when local data exists, with export-first backup guidance.
- Copy actions handle browser clipboard denial without throwing or falsely reporting success.
- User image uploads are restricted to PNG, JPG, or WebP files under 2.5 MB.
- Store listing, App Store submission prep, and privacy/data safety drafts are present.
- Draft store submission image assets are present in `store/submission`.
- App data stays local unless the user imports, exports, copies, or downloads it.

## Verification Evidence

- `npm run check` passes.
- `npm run check:launch` passes.
- `manifest.webmanifest`, `package.json`, and `vercel.json` parse as JSON.
- Mobile browser check at 390 by 844 showed no horizontal overflow.
- Desktop browser check at 1440 by 1000 showed no horizontal overflow.
- Browser console showed zero errors during human review and add-artifact testing.
- No third-party analytics, payments, telemetry, sockets, or API calls were found. The only network fetch is the service worker same-origin cache path.
- Store screenshots were refreshed in `store/screenshots/`.
- Manifest screenshots point to tracked screenshot assets.
- Public manifest screenshots point to `assets/screenshots`.
- `npm run check` builds `_site/` and verifies internal files are not packaged.
- Netlify and Vercel configs are checked for `npm run build` plus `_site/` output.
- Apple touch icon is linked from `index.html`, cached by `sw.js`, and sized at 180 by 180.
- `index.html` and `support.html` show the package version.
- `index.html` avoids demo reset wording and `app.js` confirms before reset.
- Playwright reset smoke test passed: cancel kept one review, confirm cleared it, and console errors stayed at zero.
- Import confirmation protects local reviews, uploads, notes, added artifacts, and reviewer name from silent overwrite.
- Playwright import smoke test passed: cancel kept one existing review, confirm replaced it with the imported profile, and console errors stayed at zero.
- Copy buttons show `Copy unavailable` if the browser blocks clipboard writes and the fallback path fails.
- Playwright clipboard-denial smoke test passed for packet and dataset copy buttons with zero console errors.
- SVG uploads are excluded from the public artifact form; imported image data is sanitized to PNG, JPG, or WebP data URLs.
- Playwright upload smoke test passed: SVG rejected, over-2.5 MB PNG rejected, small PNG accepted, and console errors stayed at zero.
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
- Agent lab opens.
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
