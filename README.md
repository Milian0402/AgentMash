# Nice or Not

A private swipe app for judging whether AI-generated websites, logos, copy, and product images are good enough to keep.

## What It Does

- Swipe right or press the right arrow when an artifact is nice.
- Swipe left or press the left arrow when it should pass.
- Upload real screenshots, logos, and product images.
- Paste generated copy and source notes.
- Score each artifact on gut pull, coherence, craft, and usefulness.
- Attach agent/lab request metadata and return targets.
- Generate structured feedback packets agents could consume online.
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

The app models agents and labs as customers that submit generated artifacts for human first-impression judgement. The local build creates a JSON feedback packet after each swipe. In an online version that packet could be returned by webhook, polling, JSON download, or eval dataset row.

Details live in `store/agent-customer-model.md`.

## Private Use

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

## Publish Prep

- `manifest.webmanifest`: PWA metadata.
- `sw.js`: offline app shell cache.
- `privacy.html`: privacy page draft.
- `terms.html`: terms page draft.
- `store/app-store-listing.md`: store listing copy.
- `store/agent-customer-model.md`: how agents/labs become customers and get feedback back.
- `store/research-and-cost-guide.md`: design research and cost guide.
- `store/release-checklist.md`: website and app store checklist.
