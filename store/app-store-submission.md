# App Store Submission Prep

Checked against official Apple and Google documentation on May 7, 2026. No account was created, no payment was made, nobody was contacted, and no app was submitted.

## Current Verdict

AgentMash is close to public web launch readiness. It is not yet App Store or Google Play ready because store distribution requires user-owned accounts, verified identity/contact details, public support and privacy URLs, a native build, and store review submission.

The local codebase is prepared for that path: product name, icon, manifest, screenshots, privacy copy, terms, support page, store listing copy, launch audit, and launch checks are present.

## Apple App Store Draft

- App name: AgentMash
- Subtitle: Human taste for AI work
- Primary category: Productivity
- Secondary category: Graphics & Design
- Privacy Policy URL: `https://YOUR-DOMAIN/privacy.html`
- Support URL: `https://YOUR-DOMAIN/support.html`
- Marketing URL: `https://YOUR-DOMAIN/`
- Bundle ID draft: `com.agentmash.app`
- SKU draft: `agentmash-2026`
- Copyright draft: `2026 YOUR LEGAL NAME OR ENTITY`
- Price: Free for first launch unless there is a real paid support and billing plan.
- Age rating notes: no ads, purchases, gambling, unrestricted web access, user-to-user messaging, or user-generated public feed in the current local-first build.
- Sign-in required: No, if the native wrapper keeps the current no-account behavior.

Review notes draft:

AgentMash is a local-first review tool for AI-generated websites, logos, copy, and product images. It stores review data on device, does not require an account, does not send data to a server, and does not include analytics, ads, payments, AI API calls, or third-party tracking. Test by opening the app, swiping a demo artifact, editing scores/tags/notes, switching to Agent lab, and downloading a JSON feedback packet or JSONL eval row.

Apple-specific requirements still owned by the user:

- Apple Developer Program membership.
- Seller name or organization identity.
- Public support URL with real contact information.
- Public privacy policy URL.
- App Review contact name, email, and phone.
- Native iOS build uploaded through Xcode or Transporter.
- Required App Store screenshots captured at accepted device sizes.
- Privacy label answers in App Store Connect.

## Google Play Draft

- App name: AgentMash
- Short description: Judge AI-generated work with fast human intuition.
- Full description: use `store/app-store-listing.md`.
- Category: Productivity, or Art & Design if positioned for creative review.
- Privacy Policy URL: `https://YOUR-DOMAIN/privacy.html`
- Developer email: `YOUR SUPPORT EMAIL`
- Website: `https://YOUR-DOMAIN/`
- App access: no login required if the current no-account behavior remains.
- Ads: No.
- In-app purchases: No.
- Content rating notes: creative/productivity tool, no social feed, no gambling, no purchases, no unrestricted user publication.
- App bundle ID draft: `com.agentmash.app`

Google-specific requirements still owned by the user:

- Google Play Console account.
- Verified developer identity and contact details.
- Public developer email shown on the store listing.
- Public privacy policy URL.
- Android app bundle from a native wrapper.
- Minimum two screenshots, with better results from at least four 1080px or larger screenshots.
- 512 by 512 PNG app icon.
- 1024 by 500 feature graphic.
- Data safety answers in Play Console.

## Current Store Assets

- Source app icon: `store/app-icon-1024.png`
- Installable icons: `assets/icons/app-icon-192.png`, `assets/icons/app-icon-512.png`, `assets/icons/app-icon-1024.png`
- PWA/mobile screenshot: `store/screenshots/mobile-review.png` at 390 by 844
- PWA/desktop screenshot: `store/screenshots/desktop-review.png` at 1440 by 1000
- Draft Apple iPhone 6.9 screenshot: `store/submission/apple-iphone-6-9-human-review.png` at 1290 by 2796
- Draft Apple iPhone 6.5 screenshot: `store/submission/apple-iphone-6-5-human-review.png` at 1242 by 2688
- Draft Google phone screenshot: `store/submission/google-phone-human-review.png` at 1080 by 1920
- Draft Google Play feature graphic: `store/submission/google-play-feature-graphic.png` at 1024 by 500

The current screenshots are good for the website, README, PWA manifest, and private store-listing review. For native store submission, recapture from the real native wrapper at store-required sizes so reviewers see exactly what the installable app displays.

## Lowest-Cost Launch Order

1. Keep the app free and local-first.
2. Publish the static website before buying app-store accounts.
3. Use a free host first.
4. Skip analytics until there is a real reason.
5. Skip paid monitoring until users rely on the app.
6. Skip native app stores until the public web app has real usage.
7. Buy the developer accounts only when the support URL, privacy URL, native wrapper, and screenshots are ready.

## Sources

- Apple Developer Program pricing and enrollment: https://developer.apple.com/support/compare-memberships/
- Apple App Store app information and subtitle limit: https://developer.apple.com/help/app-store-connect/reference/app-information/app-information
- Apple platform version information, support URL, and review contact fields: https://developer.apple.com/help/app-store-connect/reference/app-review-information
- Apple privacy details: https://developer.apple.com/app-store/app-privacy-details/
- Apple screenshot specifications: https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications/
- Google Play account setup and registration fee: https://support.google.com/googleplay/android-developer/answer/6112435
- Google Play required developer account information: https://support.google.com/googleplay/android-developer/answer/13628312
- Google Play user data, privacy policy, and Data safety requirements: https://support.google.com/googleplay/android-developer/answer/9888076
- Google Play preview assets and feature graphic requirements: https://support.google.com/googleplay/android-developer/answer/9866151
- PWA manifest installability: https://developer.chrome.com/docs/lighthouse/pwa/installable-manifest/
- PWA manifest screenshots: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/screenshots
