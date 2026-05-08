# Publishing Runbook

AgentMash is currently a private static PWA in `Milian0402/AgentMash` and is being prepared for public launch.

No deployment, paid account, domain purchase, app-store submission, or human outreach has been performed.

## Current Status

- Private GitHub repo exists.
- `main` contains the static app.
- Local preview runs with `npm run serve`.
- The app uses native ES modules, so local preview should run over HTTP instead of `file://`.
- Public package builds with `npm run build` into `_site/`.
- Public package preview runs with `npm run serve:build`.
- Syntax check runs with `npm run check`.
- Privacy, terms, support, app metadata, icons, and offline caching are present.
- Manifest screenshots, store copy, app-store submission prep, privacy/data safety drafts, and draft submission images are present.
- A manual GitHub Pages workflow is present, but it does not run on push.
- The public package excludes internal `store/` launch docs, submission drafts, scripts, and repo metadata.

## Free Web Publishing Paths

These can be free at small scale, but always confirm limits before enabling them.

- GitHub Pages: good first preview choice because the repo is already on GitHub. The included workflow is manual so it does not consume Actions minutes unless started. GitHub Pages does not apply the custom security header configs in this repo.
- Netlify: `netlify.toml` runs `npm run build`, publishes `_site/`, and applies security headers.
- Vercel: `vercel.json` runs `npm run build`, publishes `_site/`, and applies security headers.
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

- Run `npm run ready:public`.
- Confirm `_site/` contains public app files only.
- Confirm the chosen host publishes `_site/`, not the repo root.
- Pick a final public URL.
- Decide whether to buy a domain.
- Add a real support contact and final preview URLs locally:

```sh
npm run configure:public -- --url https://YOUR-PUBLIC-URL --support YOUR-SUPPORT-ROUTE
```

- Run `npm run ready:public` again after configuring the final URL/support route.
- Enable HTTPS on the host.
- Confirm `support.html`, `privacy.html`, `terms.html`, `robots.txt`, `sitemap.xml`, and `manifest.webmanifest` are reachable.
- Run `npm run verify:public -- https://YOUR-PUBLIC-URL` after the host is live.
- Test the installed PWA on desktop and mobile.
- Confirm service worker updates after a new deploy.

## Live Host Verification

After you connect hosting and any domain, run:

```sh
npm run verify:public -- https://YOUR-PUBLIC-URL
```

The verifier checks the public app shell, final canonical/Open Graph/Twitter URLs, preview image URLs, public support contact metadata, robots/sitemap output, support/privacy/terms/404 pages, manifest, service worker, Apple touch icon, update-friendly cache headers for `sw.js` and `manifest.webmanifest`, and that internal files such as `store/completion-audit.md`, `package.json`, and `PUBLISHING.md` are not public.

Warnings mean the site can load but the host should be reviewed, usually because security headers or no-cache headers are missing. Failures should be fixed before announcing the link.

## Local Public-Ready Command

Before connecting or updating a host, run:

```sh
npm run ready:public
```

This runs the full local quality gate and rebuilds `_site/`. It does not deploy, publish, contact anyone, create an account, or spend money.

## Final URL And Support Metadata

After you choose the public URL and support route, run:

```sh
npm run configure:public -- --url https://YOUR-PUBLIC-URL --support YOUR-SUPPORT-ROUTE
```

This updates canonical, Open Graph, Twitter preview, support, privacy-page, `robots.txt`, and `sitemap.xml` metadata in local files only. It does not contact the support route, create accounts, publish, or spend money. Run `npm run ready:public` after it so `_site/` contains the final metadata.

`YOUR-SUPPORT-ROUTE` must be replaced with a real public support route before this command will run.

## Agent Customer Checklist

- Decide whether customers are agents, labs, product teams, or all three.
- Add authentication before accepting third-party submissions.
- Add artifact upload limits and retention rules.
- Add a server-side queue for human review tasks.
- Store feedback packets by `runId`.
- Define one hosted return channel only after authentication, deletion rules, and support coverage exist. Keep the local JSON and JSONL exports as the first supported path.
- Add billing only after usage limits, support contact, and deletion policy are clear.

## App Store Checklist

- Read `store/app-store-submission.md`.
- Read `store/privacy-data-safety-draft.md`.
- Read `store/native-wrapper-handoff.md`.
- Choose iOS, Android, or both.
- Create paid developer accounts only when ready.
- Publish privacy and support pages first.
- Wrap the PWA in a native shell.
- Generate required platform icon sizes from `assets/icons/app-icon-1024.png`.
- Capture screenshots from the native build on accepted store device sizes.
- Publish privacy policy at a public URL.
- Complete Apple privacy labels and Google Play Data safety.
- Submit only after a real support contact exists.
