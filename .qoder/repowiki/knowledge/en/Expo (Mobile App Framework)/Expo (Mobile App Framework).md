---
kind: external_dependency
name: Expo (Mobile App Framework)
slug: expo
category: external_dependency
category_hints:
    - framework_behavior
scope:
    - '**'
---

The mobile app is built with Expo SDK ~57 using the new architecture (`newArchEnabled: true`). Routing is handled by `expo-router` with typed routes enabled via experiments. Platform bundles use package `com.socialpilot.aipro` on both iOS and Android. Secure storage is provided by `expo-secure-store`, and push notifications via `expo-notifications`. The app config drives splash screen, orientation, and scheme (`socialpilot`). Build and distribution are managed through EAS (`eas.json` present).