# 📱 Mobile Customization & Store Deployment Guide

---

## 1. App Name & Bundle Identifiers
Open `apps/mobile/app.config.ts`:
- Change `name` to your desired app name.
- Update `ios.bundleIdentifier` (e.g. `com.yourcompany.socialpilot`).
- Update `android.package` (e.g. `com.yourcompany.socialpilot`).

---

## 2. App Icons & Splash Screen
Replace the image assets in `apps/mobile/src/assets/images/`:
- `icon.png` (1024x1024 px) — Main App Store icon
- `adaptive-icon.png` (1024x1024 px) — Android Adaptive foreground
- `splash-icon.png` (400x400 px) — Centered splash logo

---

## 3. Production Cloud Builds (EAS)
1. Install EAS CLI: `npm install -g eas-cli`
2. Login to your Expo account: `eas login`
3. Configure build project: `eas build:configure`
4. Build Android APK/AAB: `eas build --platform android --profile production`
5. Build iOS IPA: `eas build --platform ios --profile production`
