# Publishing Runbook

AgentMash is currently a private static PWA in `Milian0402/AgentMash` and is being prepared as a public beta candidate.

No deployment, paid account, domain purchase, app-store submission, or human outreach has been performed.

## Current Status

- Private GitHub repo exists.
- `main` contains the static app.
- Local preview runs with `npm run serve`.
- Public package builds with `npm run build` into `_site/`.
- Syntax check runs with `npm run check`.
- Privacy, terms, support, app metadata, icons, and offline caching are present.
- Manifest screenshots, store copy, app-store submission prep, privacy/data safety drafts, and draft submission images are present.
- A manual GitHub Pages workflow is present, but it does not run on push.
- The public package excludes internal `store/` launch docs, submission drafts, scripts, and repo metadata.

## Free Web Publishing Paths

These can be free at small scale, but always confirm limits before enabling them.

- GitHub Pages: good first preview choice because the repo is already on GitHub. The included workflow is manual so it does not consume Actions minutes unless started. GitHub Pages does not apply the custom security header configs in this repo.
- Netlify: `netlify.toml` is ready for static hosting and security headers.
- Vercel: `vercel.json` is ready for static hosting and security headers.
- Cloudflare Pages: `_headers` is ready for static hosting and security headers.

## Things That Can Cost Money

- Domain name: usually yearly.
- Custom email or support inbox: may be free, may cost monthly.
- GitHub Actions minutes: possible if workflows are run often on private repos.
- Paid hosting tier: possible if traffic, bandwidth, seats, or team features exceed free limits.
- Monitoring, analytics, error tracking, or uptime checks: optional.
- Apple Developer Program: required for App Store distribution.
- Google Play Console: required for Google Play distribution.
- Legal review: optional, but sensible before a paid public launch.

## Public Website Checklist

- Run `npm run build`.
- Confirm `_site/` contains public app files only.
- Pick a final public URL.
- Decide whether to buy a domain.
- Add a real support contact to `support.html` and link it from `privacy.html`.
- Update Open Graph URLs after the final domain exists.
- Enable HTTPS on the host.
- Confirm `support.html`, `privacy.html`, `terms.html`, and `manifest.webmanifest` are reachable.
- Test the installed PWA on desktop and mobile.
- Confirm service worker updates after a new deploy.

## Agent Customer Checklist

- Decide whether customers are agents, labs, product teams, or all three.
- Add authentication before accepting third-party submissions.
- Add artifact upload limits and retention rules.
- Add a server-side queue for human review tasks.
- Store feedback packets by `runId`.
- Add one return channel first: JSON polling is simplest, webhook is more useful for labs.
- Add billing only after usage limits, support contact, and deletion policy are clear.

## App Store Checklist

- Read `store/app-store-submission.md`.
- Read `store/privacy-data-safety-draft.md`.
- Choose iOS, Android, or both.
- Create paid developer accounts only when ready.
- Publish privacy and support pages first.
- Wrap the PWA in a native shell.
- Generate required platform icon sizes from `assets/icons/app-icon-1024.png`.
- Capture screenshots from the native build on accepted store device sizes.
- Publish privacy policy at a public URL.
- Complete Apple privacy labels and Google Play Data safety.
- Submit only after a real support contact exists.
