# Privacy And Data Safety Draft

Checked on May 8, 2026. This draft applies only to the current local-first build with no backend, no analytics, no ads, no payment SDK, no crash reporting SDK, and no third-party API calls.

## Current Data Inventory

- Reviewer name: stored locally in `localStorage`.
- Review decisions: stored locally in `localStorage`.
- Scores, tags, and notes: stored locally in `localStorage`.
- Pasted copy and artifact metadata: stored locally in `localStorage`.
- Uploaded image bytes: stored locally in IndexedDB.
- Agent/lab request metadata: stored locally in `localStorage`.
- Feedback packets and JSONL rows: generated locally and copied or downloaded only when the user chooses.
- Service worker cache: stores static app files for offline use.
- Clipboard use: only when the user clicks copy.
- Device vibration: only a short local gesture response where supported.

No current app code sends user data to a server.

## Apple Privacy Label Draft

Suggested answer for the current build:

- Data collected: No.
- Tracking: No.
- Third-party advertising: No.
- Analytics: No.
- Diagnostics sent to developer: No.
- User content collected by developer: No.
- Contact info collected by developer: No.
- Identifiers collected by developer: No.
- Usage data collected by developer: No.

Important caveat: if the native wrapper adds analytics, crash logs, cloud sync, push notifications, sign-in, billing, or any SDK that sends data off device, this draft is no longer accurate.

## Google Play Data Safety Draft

Suggested answer for the current build:

- Does the app collect or share any required user data types? No.
- Is all user data encrypted in transit? Not applicable for app user data because the app does not transmit user data. The public website must still use HTTPS.
- Can users request deletion? There is no server account. Users can delete local data through Reset profile, browser storage clearing, or app uninstall. Reset profile clears both `localStorage` profile data and IndexedDB image bytes.
- Does the app share data with third parties? No.
- Does the app use advertising ID? No.
- Does the app include ads? No.
- Does the app collect location, contacts, health, financial, messages, photos/videos, audio, files, calendar, or app activity for developer use? No.

Important caveat: Google still requires a public privacy policy link for apps. The hosted `privacy.html` page must include developer information and a privacy point of contact or another inquiry mechanism before public submission.

## Public Privacy Policy Changes Still Needed

Before public web launch or store submission, update `privacy.html` with:

- Final public app URL.
- Public support contact or issue route.
- Developer or company name matching the store listing.
- Data retention and deletion wording for the final distribution model.

The current no-account privacy page already documents local deletion through Reset profile, browser storage settings, or app uninstall. Re-check this wording if the app starts storing data on a server.

## When This Must Change

Update the privacy policy, Apple privacy labels, and Google Data safety answers before adding any of these:

- Accounts.
- Hosted upload queue.
- Server storage.
- Analytics.
- Crash reporting.
- Payment SDK.
- Email collection.
- Webhooks that send feedback automatically.
- AI API calls.
- Public sharing.
- Push notifications.
- Device identifiers.
