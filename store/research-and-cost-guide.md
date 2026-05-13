# Research And Cost Guide

This guide is based on public documentation checked on May 10, 2026. No accounts were created, nobody was contacted, and no paid action was taken.

## What Makes This App Look Nice

The app should feel like a fast judgement tool, not a dashboard. The center of gravity is the card. Everything else should support the card without competing with it.

Design principles used in the current build:

- One primary object on screen: the swipe card.
- One gesture meaning per card: right means Nice, left means Nope.
- Visible buttons mirror the gesture so the app still works when the swipe is missed.
- Large controls and clear labels, not color alone.
- Immediate drag feedback: the card moves, the stamp appears, and the matching action button changes state before release.
- Thumb controls on the human review screen so the main choice stays reachable on phones.
- A bottom-sheet Refine panel so comments, tags, and scores do not compete with the first-glance decision.
- A restrained palette with green for keep, red for reject, blue for neutral focus, and warm paper backgrounds.
- Dense side panels on desktop, stacked task flow on mobile.
- Uploads render in the card directly so real generated websites, logos, copy, and product images can be judged.

Research notes:

- Apple says good interfaces need clear hierarchy, harmony, and consistency. Source: https://developer.apple.com/design/human-interface-guidelines/
- Apple gesture guidance treats swipe and drag as standard gestures, but they should directly affect the object being manipulated and provide immediate feedback. Source: https://developer.apple.com/design/human-interface-guidelines/gestures
- Apple button guidance says controls need at least a 44 by 44 point hit region and should include a visible press state. Source: https://developer.apple.com/design/human-interface-guidelines/buttons
- Apple color guidance says color should be consistent and not be the only way to communicate state. Source: https://developer.apple.com/design/human-interface-guidelines/color
- Apple accessibility guidance says interfaces should be intuitive, perceivable, and adaptable, with enough contrast and readable text. Source: https://developer.apple.com/design/human-interface-guidelines/accessibility
- Apple typography guidance favors legible sizes, clear hierarchy, and avoiding too many typefaces. Source: https://developer.apple.com/design/human-interface-guidelines/typography
- Apple motion guidance says motion should support the experience, follow the gesture, and not be the only way to communicate important information. Source: https://developer.apple.com/design/human-interface-guidelines/motion
- Material card guidance supports per-card swipe gestures, but warns against overlapping swipe interactions inside the same card. Source: https://m1.material.io/components/cards.html
- Baymard's mobile app UX research emphasizes that small mobile usability issues compound quickly in real app use. Source: https://baymard.com/research/mobile-app

## Current Human UI Direction

The human review screen should feel like a consumer phone app, while avoiding language that suggests this is about romance or partner matching. The design direction is:

- Card first: one artifact gets nearly all visual attention.
- Thumb first: the three decision buttons stay reachable near the bottom of the first viewport.
- Gesture plus buttons: swiping is fast, buttons are explicit, and undo remains available.
- First glance before explanation: the image or mock preview comes before rubrics and notes.
- Optional detail after the swipe: comments, tags, and scoring stay behind Refine so lazy human judgement is not slowed down.
- Stronger feedback: drag tilt, badge state, button state, and light vibration where the device supports it.

## AI Lab And Agent Data Shape Research

The useful customer data is not just "Nice" or "Nope". Agents and labs need enough structure to turn lazy human reactions into eval rows, prompt repair hints, and tool-call feedback later.

Data fields worth preserving:

- Artifact identity: type, title, prompt/source, run ID, requester, submitted time, and image payload when available.
- Review context: signal focus, target audience, decision stage, priority, and notes.
- Human decision: accepted/rejected verdict, score vector, tags, note, first-impression label, and signal strength.
- Agent use: recommended action, likely failure modes, repair instruction, training-use labels, and return format.
- Pairwise preference: winner, loser, score delta, and preference label.
- Validation: JSON Schema for intake, feedback packet, and eval rows.

Why this shape fits agents:

- OpenAI grader docs frame eval/fine-tuning graders as JSON-specified checks that return numeric scores, often 0 to 1, and support model outputs such as text, JSON, and tool calls. That makes `signalStrength`, structured verdicts, and JSONL rows more useful than unstructured comments alone. Source: https://platform.openai.com/docs/guides/graders/
- The current MCP tools spec says tools are exposed through discoverable names and JSON Schema `inputSchema`, can also define `outputSchema`, and should validate inputs, use access controls, rate-limit invocations, sanitize outputs, and ask for human confirmation on sensitive operations. That supports keeping `schemas/intake.v1.json` ready now, while deferring the actual MCP server until auth and deletion policy exist. Source: https://modelcontextprotocol.io/specification/2025-11-25/server/tools

Local product implication:

- The app now accepts an `agentmash.intake.v1` JSON file through local import.
- The same payload can later back `POST /artifacts` or an MCP tool such as `agentmash.submit_artifacts`.
- The public app still does not call an API, expose a server, or send private review data anywhere.

## Things That Could Cost Money

### Website Publishing

Cheapest serious default: use a free static host subdomain first, probably Cloudflare Pages on a `pages.dev` URL. Do not buy a domain until the public web/PWA test feels worth naming permanently.

Why Cloudflare Pages is the stingy default for this app:

- The app is static. Cloudflare Pages says static asset requests are free and unlimited on free and paid plans. Source: https://developers.cloudflare.com/pages/functions/pricing/
- The repo already includes `_headers`, which Cloudflare Pages understands for security headers.
- Cloudflare Pages Free limits are far above this repo's current needs: 500 builds per month, 20,000 files per site, 25 MiB max single asset, and 100 custom domains per project. Source: https://developers.cloudflare.com/pages/platform/limits/
- Cloudflare's product page says Pages plans include unlimited sites, seats, requests, and bandwidth. Source: https://www.cloudflare.com/developer-platform/products/pages/

Vercel and Netlify are still good choices if their workflow feels better. The practical difference is mostly billing model and convenience, not app capability.

| Item | Likely cost | Notes |
| --- | ---: | --- |
| Cloudflare Pages Free | $0 | Best cheap first pick for this static PWA. Needs user action: create/connect the project and deploy `_site` or connect the repo. |
| Vercel Hobby | $0 | Vercel lists Hobby as free, with automatic CI/CD, HTTPS, CDN, 100 GB Fast Data Transfer, and usage limits. Source: https://vercel.com/pricing and https://vercel.com/docs/plans/hobby |
| Vercel Pro | $20/month plus usage | Needs user action. Worth considering only for team collaboration, higher included usage, spend management, or faster builds. Source: https://vercel.com/pricing |
| Netlify Free | $0 | Netlify lists Free at $0 with custom domains and SSL, plus a 300 credit monthly limit. Source: https://www.netlify.com/pricing/ |
| Netlify Personal | $9/month | Needs user action. Worth considering only for more credits, observability, or priority email support. Source: https://www.netlify.com/pricing/ |
| GitHub Pages | $0 possible | Good for a first preview, but weaker for this launch because GitHub Pages will not apply this repo's security header configs and GitHub says Pages is not intended as free hosting for commercial SaaS. Source: https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits |
| Custom domain through Cloudflare Registrar | Varies by TLD | Needs user action. Cloudflare says it charges registry/ICANN cost with no markup and includes DNSSEC/WHOIS redaction. Source: https://developers.cloudflare.com/registrar/ |
| Custom domain through Squarespace | Varies by TLD | Needs user action. Squarespace says domain pricing depends on TLD and must be checked on its domain search page. Source: https://support.squarespace.com/hc/en-us/articles/205812318-Registering-Squarespace-domains |
| Paid monitoring or analytics | $0 to paid | Not needed for the current local-first app. Add only after real public traffic creates a support need. |
| Email for support | $0 to paid | Needs user action. App stores and public users need a reachable support route; a custom-domain mailbox can cost money. |

Cheap decision:

1. Start with Cloudflare Pages Free on a `pages.dev` URL.
2. Run `npm run configure:public -- --url https://YOUR-PAGES-URL --support YOUR-SUPPORT-ROUTE`.
3. Run `npm run ready:public`.
4. Deploy `_site`.
5. Run `npm run verify:public -- https://YOUR-PAGES-URL`.
6. Buy a domain only after the app earns a permanent name and support commitment.

### App Stores

| Item | Likely cost | Notes |
| --- | ---: | --- |
| Apple Developer Program | $99/year | Needs user action. Required to distribute on the App Store. Source: https://developer.apple.com/programs/ |
| Google Play Console | $25 one-time | Required to publish Android apps on Google Play. Source: https://support.google.com/googleplay/android-developer/answer/6112435 |
| Google Play closed testing for new personal accounts | $0 direct platform fee | New personal developer accounts need at least 12 opted-in testers for 14 continuous days before applying for production access. Recruiting testers can still cost time or money. Source: https://support.google.com/googleplay/android-developer/answer/14151465 |
| Apple screenshots | $0 if self-made | App Store Connect accepts 1 to 10 screenshots in JPEG/JPG/PNG at required device sizes. Source: https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications/ |
| Google Play screenshots and feature graphic | $0 if self-made | Google Play requires screenshots and a 1024 by 500 feature graphic for the store listing. Source: https://support.google.com/googleplay/android-developer/answer/9866151 |
| Privacy policy hosting | $0 to paid | You can host `privacy.html` with the app. Legal review would cost money if you choose it. |
| Native wrapper | $0 if you build it yourself | A PWA can be wrapped later for app stores, but native build tooling and signing are separate work. |
| Legal review | Optional paid | Useful before public launch, not performed here. |

## App Store Readiness Checklist

Already prepared locally:

- PWA manifest.
- Manifest screenshots.
- Offline service worker.
- App icon SVG.
- PNG icons.
- Privacy page.
- Terms page.
- Support page.
- Local-only data model.
- Export/import profile.
- Real artifact upload for images and generated copy.
- Screenshot folder for store assets.
- Store listing draft.
- App Store and Google Play submission prep.
- Privacy label and Data safety draft.
- Review rubric documentation.

Still required before actual public submission:

- Choose final app name and support email.
- Buy or connect a domain if you want a public website.
- Host the privacy page at a public URL.
- Produce store-size PNG icons and screenshots.
- Wrap as native iOS/Android app if submitting to App Store or Google Play.
- Create developer accounts, which costs money.
- For a new Google Play personal developer account, run the required closed test with at least 12 opted-in testers for 14 continuous days before production access.
- Complete Apple privacy labels and Google Play Data safety forms.
- Run device testing on real iPhone and Android hardware.
