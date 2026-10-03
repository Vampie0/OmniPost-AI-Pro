import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const appConfig = {
    ...config,
    name: process.env.EXPO_PUBLIC_APP_NAME || 'SocialPilot AI Pro',
    slug: 'socialpilot-ai-pro',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './src/assets/images/icon.png',
    scheme: 'socialpilot',
    userInterfaceStyle: 'automatic',
    // #06070B is the sunset palette's `background` token — matching it here means
    // the native splash and the JS AnimatedSplashScreen are the same colour, so the
    // handoff shows no step. Regenerate rasters after changing palettes:
    // node scripts/generate-brand-assets.mjs
    splash: {
      image: './src/assets/images/splash-icon.png',
      backgroundColor: '#06070B',
      resizeMode: 'contain'
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.socialpilot.aipro'
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './src/assets/images/adaptive-icon.png',
        backgroundColor: '#06070B'
      },
      package: 'com.socialpilot.aipro'
    },
    // Required by expo-notifications getExpoPushTokenAsync. EAS builds also
    // inject this automatically; the env var covers local/managed flows.
    extra: {
      eas: {
        projectId: process.env.EAS_PROJECT_ID || '',
      },
    },
    plugins: [
      'expo-router',
      'expo-secure-store',
      [
        'expo-font',
        {
          fonts: []
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    }
  };
  // 'splash' is valid in the runtime app-config schema but not declared in this
  // SDK's ExpoConfig type; cast keeps the values untouched.
  return appConfig as unknown as ExpoConfig;
};
