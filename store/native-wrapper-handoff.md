# Native Wrapper Handoff

Checked on May 7, 2026. No native wrapper was created, no packages were installed, no developer account was opened, no build was signed, and no store submission was made.

## Decision

Keep the current app as a zero-runtime-dependency static PWA until public web launch is settled. When store distribution is worth doing, wrap the already-built `_site/` output in a native shell.

Recommended first native shell: Capacitor.

Reason:

- It can package the existing static app without adding a backend.
- It keeps the web app source mostly unchanged.
- It supports iOS and Android from the same `_site/` output.
- It can avoid analytics, push notifications, ads, sign-in, payments, and tracking plugins for v1.

## Store Identity Draft

- App name: AgentMash
- iOS bundle ID: `com.agentmash.app`
- Android application ID: `com.agentmash.app`
- Web build directory: `_site`
- App entry: `index.html`
- Privacy URL placeholder: `https://YOUR-DOMAIN/privacy.html`
- Support URL placeholder: `https://YOUR-DOMAIN/support.html`

These values should match App Store Connect, Google Play Console, the native wrapper config, and public website metadata.

## Files Already Ready

- `index.html`
- `styles.css`
- `app.js`
- `state.js`
- `packet.js`
- `render.js`
- `gestures.js`
- `manifest.webmanifest`
- `sw.js`
- `assets/icons/app-icon-192.png`
- `assets/icons/app-icon-512.png`
- `assets/icons/app-icon-1024.png`
- `assets/icons/apple-touch-icon.png`
- `privacy.html`
- `support.html`
- `terms.html`
- `publishing.html`
- `store/app-icon-1024.png`
- `store/app-store-listing.md`
- `store/app-store-submission.md`
- `store/privacy-data-safety-draft.md`
- `store/submission/`

## User Action Needed Before Running Native Commands

- Choose iOS, Android, or both.
- Confirm Xcode is installed for iOS builds.
- Confirm Android Studio and Android SDK are installed for Android builds.
- Decide whether to create paid Apple or Google developer accounts.
- Publish stable `privacy.html` and `support.html` URLs.
- Add real developer identity and support contact details.

## Capacitor Setup Commands For Later

Run these only when you explicitly decide to add the native shell. They will download packages and create native project files.

```sh
npm run check
npm run build
npm install @capacitor/core
npm install --save-dev @capacitor/cli
npx cap init AgentMash com.agentmash.app --web-dir _site
npm install @capacitor/ios @capacitor/android
npx cap add ios
npx cap add android
npx cap sync
```

Open native projects only after the files exist:

```sh
npx cap open ios
npx cap open android
```

## Capacitor Config Target

The generated config should resolve to this shape:

```json
{
  "appId": "com.agentmash.app",
  "appName": "AgentMash",
  "webDir": "_site",
  "server": {
    "androidScheme": "https"
  }
}
```

## Native V1 Rules

- Do not add analytics SDKs.
- Do not add crash reporting until the privacy labels are updated.
- Do not add push notifications.
- Do not add sign-in.
- Do not add payments.
- Do not add remote agent queues or webhooks.
- Keep all review data local unless the user exports, copies, imports, or downloads it.
- Re-run `npm run check` before every native sync.

## Local Verification After Native Shell Exists

- Run `npm run check`.
- Run `npm run build`.
- Run `npx cap sync`.
- Launch iOS simulator and complete: Nice, Undo, Nope, Refine, Details, Export workspace.
- Launch Android emulator and complete the same flow.
- Confirm no external network calls beyond loading packaged local assets.
- Confirm uploaded images survive app restart.
- Confirm profile export/import works in the wrapper.
- Confirm safe-area spacing around notch and home indicator.
- Recapture store screenshots from the real native build, not from the browser.

## Still Not Done

- Native iOS project.
- Native Android project.
- Signed iOS build.
- Signed Android app bundle.
- App Store Connect listing.
- Google Play listing.
- Public privacy URL.
- Public support URL.
- Store review submission.
