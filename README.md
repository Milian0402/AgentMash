# AgentMash

A local-first swipe app for turning fast human judgement on AI-generated websites, logos, copy, and product images into structured feedback.

Status: public-beta candidate. The app is on GitHub, but it has not been deployed, listed, sold, or submitted to an app store.

## What It Does

- Swipe right or press the right arrow when an artifact is nice.
- Swipe left or press the left arrow when it should pass.
- Use the Human review dashboard for the fast swipe flow.
- Use the Export workspace to collect ready packets and JSONL rows from local review data.
- Add artifacts from the human deck or the lab request form.
- Upload real screenshots, logos, and product images.
- Paste generated copy and source notes.
- Score each artifact on gut pull, coherence, craft, and usefulness.
- Attach agent/lab request metadata and return targets.
- Generate structured feedback packets agents could consume online.
- Generate lab-ready JSONL eval rows with preference labels, signal strength, failure modes, and repair instructions.
- Save tags, notes, history, and profile metrics locally.
- Export and import the private profile as JSON.
- Run as a static PWA with app metadata and offline caching.

## Judgement System

The score is weighted toward human intuition:

- Gut pull: 35%
- Makes sense: 25%
- Craft: 22%
- Useful: 18%

Details live in `store/review-system.md`.

## Agent Customers

The app models agents and labs as customers that submit generated artifacts for human first-impression judgement. The local build creates a JSON feedback packet and a JSONL eval row after each swipe. In an online version that data could be returned by webhook, polling, JSON download, or dataset export.

Details live in `store/agent-customer-model.md`.

## Local-First Use

The app does not send data anywhere. Profile data is stored in `localStorage` for the browser that opens it. Exported JSON files are ignored by git through `.gitignore`.

## Run

```sh
npm run serve
```

Then visit `http://localhost:5177`.

## Check

```sh
npm run check
```

## Build

```sh
npm run build
```

This writes the public static site to `_site/`. Internal launch docs, submission drafts, scripts, and repo metadata are not packaged.

Preview the public package:

```sh
npm run serve:build
```

## Launch Check

```sh
npm run check:launch
```

This verifies required pages, app metadata, offline shell files, static-host security headers, local-only network constraints, and AgentMash naming.

## Publish Prep

- `manifest.webmanifest`: PWA metadata.
- `sw.js`: offline app shell cache.
- `assets/icons`: installable PNG app icons.
- `assets/icons/apple-touch-icon.png`: iOS home-screen icon.
- `assets/screenshots`: public PWA screenshots.
- `support.html`: support page draft.
- `privacy.html`: privacy page draft.
- `terms.html`: terms page draft.
- `publishing.html`: user-facing launch status page.
- `PUBLISHING.md`: private publishing runbook.
- `.github/workflows/pages.yml`: manual GitHub Pages deploy workflow.
- `_headers`, `netlify.toml`, and `vercel.json`: static host security headers.
- `store/app-store-listing.md`: store listing copy.
- `store/app-store-submission.md`: App Store and Google Play submission prep.
- `store/privacy-data-safety-draft.md`: Apple privacy label and Google Play Data safety draft.
- `store/submission`: draft store screenshots and Google Play feature graphic.
- `store/agent-customer-model.md`: how agents/labs become customers and get feedback back.
- `store/completion-audit.md`: prompt-to-artifact launch readiness audit.
- `store/public-launch-plan.md`: cheapest practical public launch sequence.
- `store/research-and-cost-guide.md`: design research and cost guide.
- `store/release-checklist.md`: website and app store checklist.
- `store/public-launch-audit.md`: current launch evidence and remaining blockers.

## Not Done Yet

- No public website has been deployed.
- No domain has been bought.
- No public support inbox has been added.
- No app-store developer account has been created.
- No native iOS or Android wrapper has been created.
- No billing, auth, or backend exists for agent customers.
