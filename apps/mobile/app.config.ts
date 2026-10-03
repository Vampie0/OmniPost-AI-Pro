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
    splash: {
      backgroundColor: '#07080B',
      resizeMode: 'contain'
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.socialpilot.aipro'
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './src/assets/images/adaptive-icon.png',
        backgroundColor: '#07080B'
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
