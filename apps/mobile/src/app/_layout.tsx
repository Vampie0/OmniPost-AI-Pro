import { useEffect, useState } from 'react';
import { Stack, Redirect, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StyleSheet, View, Text, Platform } from 'react-native';


import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import { useAuthStore } from '@/store/useAuthStore';
import { useConfigStore } from '@/store/useConfigStore';
import { useNotificationsStore } from '@/store/useNotificationsStore';
import { registerPushNotifications } from '@/services/pushNotifications';
import { isPlaceholderUrl } from '@/services/supabase';
import { ToastProvider } from '@/components/atoms/CustomToast';
import { AnimatedSplashScreen } from '@/components/templates/AnimatedSplashScreen';

// Prevent native splash from auto-hiding — we control it manually
SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex: number) =>
        Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 1000 * 60 * 5,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Screens reachable without a session (auth flow + built-in diagnostics)
const PUBLIC_PATHS = ['/', '/login', '/register', '/forgot-password', '/update-password', '/onboarding', '/test-connection'];

function RootNavigationStack() {
  const { theme } = useTheme();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const sessionChecked = useAuthStore((state) => state.sessionChecked);

  // Expo Router may report grouped paths like "/(tabs)/generate" — strip group
  // segments so the allowlist matches the URL the user actually sees.
  const cleanPath = (pathname || '/')
    .replace(/\/\([^)]*\)/g, '/')
    .replace(/\/{2,}/g, '/');
  const isPublic = PUBLIC_PATHS.includes(cleanPath) || cleanPath.startsWith('/+not-found');

  const userId = user?.id;

  // Notification backbone: inbox fetch + realtime inserts + device push
  // registration. watchProfile (useAuthStore) already streams is_suspended
  // live, so no second profiles subscription is needed here.
  useEffect(() => {
    if (isPlaceholderUrl || !userId) return;
    const store = useNotificationsStore.getState();
    store.fetchNotifications(userId);
    store.subscribeRealtime(userId);
    registerPushNotifications(userId);
    return () => store.unsubscribeRealtime();
  }, [userId]);

  // Global auth gate: no app screen renders without a session.
  // Placeholder (demo) mode stays explorable since it has no backend to auth against.
  if (!isPlaceholderUrl && sessionChecked && !user && !isPublic) {
    return <Redirect href="/(auth)/login" />;
  }

  // Suspended while browsing → force the suspension card on '/' (it shows
  // the admin-provided reason and a sign-out action).
  if (!isPlaceholderUrl && sessionChecked && user?.is_suspended && !isPublic) {
    return <Redirect href="/" />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen
          name="studio-menu"
          options={{
            presentation: 'transparentModal',
            animation: 'slide_from_left',
            headerShown: false,
          }}
        />
        <Stack.Screen name="+not-found" options={{ title: 'Not Found', presentation: 'modal' }} />
        <Stack.Screen name="test-connection" options={{ title: 'Connection Test', presentation: 'modal' }} />
      </Stack>
    </View>
  );
}

/**
 * Global offline banner displayed when the device loses connectivity.
 * Listens to NetInfo for real-time network state changes.
 */
function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupListener = async () => {
      try {
        const NetInfo = await import('@react-native-community/netinfo').then(
          (mod) => mod.default
        );
        // Get initial state
        const initialState = await NetInfo.fetch();
        setIsOffline(initialState.isConnected === false);

        // Subscribe to changes
        unsubscribe = NetInfo.addEventListener((state) => {
          setIsOffline(state.isConnected === false);
        });
      } catch {
        // NetInfo not available — gracefully skip offline detection
      }
    };

    setupListener();
    return () => unsubscribe?.();
  }, []);

  if (!isOffline) return null;

  return (
    <View style={[styles.offlineBanner, { backgroundColor: theme.colors.primary }]}>
      <Text style={[styles.offlineText, { color: theme.colors.btnTextColor }]}>No internet connection — reconnecting...</Text>
    </View>
  );
}

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // Web only: neutralize Chrome's autofill background (white/yellow) which
  // ignores the app's dark theme. Injected at runtime because the Metro web
  // dev server template does not pick up a custom +html.tsx.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    if (document.getElementById('autofill-reset')) return;
    const style = document.createElement('style');
    style.id = 'autofill-reset';
    style.textContent = [
      'input:-webkit-autofill,',
      'input:-webkit-autofill:hover,',
      'input:-webkit-autofill:focus,',
      'input:-webkit-autofill:active {',
      'transition: background-color 9999999s ease-in-out 0s, color 9999999s ease-in-out 0s, -webkit-text-fill-color 9999999s ease-in-out 0s;',
      '}',
    ].join('\n');
    document.head.appendChild(style);
  }, []);

  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const sessionChecked = useAuthStore((state) => state.sessionChecked);
  const fetchConfig = useConfigStore((state) => state.fetchConfig);
  const subscribeToRealtimeConfig = useConfigStore((state) => state.subscribeToRealtimeConfig);

  // Initialize auth + config on mount
  useEffect(() => {
    const bootstrap = async () => {
      await initializeAuth();
      await fetchConfig();
    };
    bootstrap();

    const unsubscribe = subscribeToRealtimeConfig();
    return () => {
      unsubscribe();
    };
  }, []);

  // Hide native splash once session is checked and app is ready
  useEffect(() => {
    if (!sessionChecked) return;

    const hideSplash = async () => {
      await SplashScreen.hideAsync().catch(() => {});
      setIsReady(true);
    };
    // Small delay to let the animated splash take over
    const timer = setTimeout(hideSplash, 100);
    return () => clearTimeout(timer);
  }, [sessionChecked]);

  if (!isReady) {
    return (
      <GestureHandlerRootView style={styles.container}>
        <SafeAreaProvider>
          <View style={[styles.container, { backgroundColor: '#07080B' }]} />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <ToastProvider>
              <RootNavigationStack />
              <OfflineBanner />
              {showSplash && (
                <AnimatedSplashScreen onFinish={() => setShowSplash(false)} />
              )}
            </ToastProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  offlineBanner: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    zIndex: 9999,
  },
  offlineText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
