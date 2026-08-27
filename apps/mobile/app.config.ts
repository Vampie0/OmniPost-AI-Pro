import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: process.env.EXPO_PUBLIC_APP_NAME || 'SocialPilot AI Pro',
  slug: 'socialpilot-ai-pro',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './src/assets/images/icon.png',
  scheme: 'socialpilot',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
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
});
