# Native Wrapper Handoff

Checked on June 5, 2026. The iOS native wrapper now exists, builds on Simulator, and launches AgentMash from the packaged `_site/` assets. No developer account was opened, no paid account was created, no signed App Store archive was uploaded, no Android wrapper was created, and no store submission was made.

## Current iOS Status

- Native shell: Capacitor.
- App name: AgentMash.
- iOS bundle ID: `com.agentmash.app`.
- Native project: `ios/App/App.xcodeproj`.
- Scheme: `App`.
- Web build directory: `_site`.
- Capacitor config key: `webDir`.
- App entry: `index.html`.
- Capacitor packages: `@capacitor/core`, `@capacitor/ios`, and `@capacitor/cli`.
- iOS minimum deployment target: 15.0.
- Marketing version: `0.3.0`.
- Build number: `3`.
- App icon: sourced from `assets/icons/app-icon-1024.png`.
- Launch image: branded `Splash.imageset`.
- Privacy manifest: `ios/App/App/PrivacyInfo.xcprivacy`.
- Export compliance plist flag: `ITSAppUsesNonExemptEncryption` is set to `false`.

## Commands

Build and sync the web app into the iOS wrapper:

```sh
npm run ios:sync
```

Build the simulator target:

```sh
npm run ios:build:sim
```

Build the unsigned iPhoneOS Release target:

```sh
npm run ios:build:device
```

Create an unsigned local archive as a pre-signing check:

```sh
npm run ios:archive:unsigned
```

Open the project in Xcode when signing, archiving, or capturing store screenshots:

```sh
npx cap open ios
```

## Verification

Local verification on June 5, 2026:

- `npm run ios:sync` passed.
- `npm run ios:build:sim` passed with the generic iOS Simulator destination.
- `npm run ios:build:device` passed with the generic iOS device destination, Release configuration, and signing disabled.
- `npm run ios:archive:unsigned` passed and wrote an ignored local archive to `ios/App/build/AgentMash-unsigned.xcarchive`.
- `xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Debug -sdk iphonesimulator -destination 'platform=iOS Simulator,id=9A45DDB1-3E21-4BE2-B3A5-BB722C734F7F' CODE_SIGNING_ALLOWED=NO build` passed.
- XcodeBuildMCP `build_run_sim` passed on iPhone 17 Pro, iOS 26.5.
- XcodeBuildMCP screenshot confirmed AgentMash renders inside the native wrapper with safe-area spacing around the dynamic island and home indicator.
- `plutil -lint ios/App/App/Info.plist ios/App/App/PrivacyInfo.xcprivacy` passed.
- `npm run check` passed, including syntax checks, launch/config/public/API gates, and 22 Playwright tests.

## Native V1 Rules

- Do not add analytics SDKs.
- Do not add crash reporting until privacy labels are updated.
- Do not add push notifications.
- Do not add sign-in.
- Do not add payments.
- Do not add remote agent queues or webhooks.
- Keep all review data local unless the user exports, copies, imports, downloads, or explicitly uses the API sync controls.
- Re-run `npm run ios:sync` before every native build.
- Use `npm run ios:build:device` only as an unsigned Release compile check. It is not a signed archive.
- Use `npm run ios:archive:unsigned` only as a pre-signing archive check. It is not uploadable to App Store Connect.

## User Action Needed Before App Store Upload

- Create or choose an Apple Developer Program account.
- Set the Xcode signing team and provisioning profile.
- Publish stable `privacy.html` and `support.html` URLs.
- Add real developer identity and support contact details.
- Capture App Store screenshots from the native iOS build.
- Fill App Store privacy labels.
- Add App Review contact name, email, and phone.
- Archive and upload through Xcode or Transporter.

## Android Deferred

Android is still not created. If Android store distribution becomes worth doing, add it from the same Capacitor config:

```sh
npm install @capacitor/android
npx cap add android
npx cap sync android
```

Then verify the Android app in Android Studio or an emulator before replacing any Google Play draft assets.

## Still Not Done

- Signed iOS archive.
- App Store Connect listing.
- Native iOS store screenshots.
- Android project.
- Signed Android app bundle.
- Google Play listing.
- Public privacy URL.
- Public support URL.
- Store review submission.
