# Family Safety Tracker

A consent-based Android family location-sharing app built with React Native, TypeScript, Expo SDK 57, and Firebase. It stores only the latest location for each authorized member in the initial version.

## Scope and security

The app is designed for private family use, but the repository is public. Never commit `.env.local`, Firebase service-account credentials, `google-services.json`, signing keys, family invitation tokens, or personal data. Firebase client configuration is supplied at build time. Client API keys are identifiers, not authorization; Firestore rules and Firebase Auth enforce access.

The current implementation includes recoverable Admin email/password authentication, anonymous invited-member identity, family creation and one-time invitation Functions, consent-aware foreground/background location publishing, network status, a latest-location map, Firestore rules, and GitHub release checking. The map intentionally shows only the latest location per member; historical trails are not stored.

## Prerequisites

- Node.js 22.13 or newer
- Android Studio with an Android SDK and emulator/device
- JDK compatible with the Expo SDK 57 Android template
- A Firebase project with Anonymous Authentication and Firestore enabled
- A public GitHub repository for releases

## Setup

```bash
cp .env.example .env.local
# edit .env.local with the Firebase project and GitHub repository values
npm install
npx expo prebuild
npm run android
```

Use a physical Android device for reliable background-location testing. The app must be granted precise foreground location and, where needed, Android's separate “Allow all the time” background permission. Android may also require notification permission and battery-optimization exceptions for dependable background behavior.

## Firebase configuration

Create a Firebase project, enable Anonymous Authentication for development, create a Firestore database, and copy the web app configuration into `.env.local`. Enable Email/Password Authentication for Admin accounts, enable Anonymous Authentication for invited members, and deploy the included rules and Functions before real family use. Do not use permissive rules in production.

## Android builds and APKs

```bash
npx expo prebuild
npm run typecheck
npm run build:apk
# APK: android/app/build/outputs/apk/release/app-release.apk
```

For a signed release, configure a local or CI-only keystore and never commit it. Install with `adb install -r path/to/app-release.apk`.

## Release and updates

Create a GitHub release with a semver tag such as `v0.2.0`, attach the signed APK, and update the app version. Settings checks the public GitHub latest-release endpoint and opens the release/download page. APK installation still requires the user to approve installation from the selected source. For production, publish checksums and release notes and verify downloads before installation.

## Troubleshooting

- Missing Firebase configuration: verify `.env.local` names and restart Expo after changes.
- Permission denied: open Android Settings, enable precise location, then grant background location if required.
- No updates found: configure `EXPO_PUBLIC_GITHUB_OWNER` and `EXPO_PUBLIC_GITHUB_REPOSITORY` and create a GitHub release.
- Location appears stale: verify the member is online, sharing is enabled, notifications are allowed, and battery optimization is not restricting the app.
- Build errors after native changes: run `npx expo prebuild --clean` only after reviewing generated native changes, then rebuild.

## App icon and branding

The app icon (`assets/icon.png`) and Android adaptive icon foreground (`assets/adaptive-icon.png`) depict a location pin with a navigation arrow, matching the app's purpose. These are static, non-secret brand assets safe to keep in the public repository. Regenerate them at 1024x1024 and rerun `npx expo prebuild` if you want different artwork.

## Development principles

Location sharing must be explicit, visible, revocable, and limited to authorized family members. The service layer isolates Firebase so a future backend can replace it without rewriting UI features. Historical location trails are intentionally out of scope for the first version.
