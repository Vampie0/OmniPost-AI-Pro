import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StyleSheet, View, Text } from 'react-native';

import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import { useAuthStore } from '@/store/useAuthStore';
import { useConfigStore } from '@/store/useConfigStore';
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

function RootNavigationStack() {
  const { theme } = useTheme();

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
      <Text style={styles.offlineText}>No internet connection — reconnecting...</Text>
    </View>
  );
}

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

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
          <View style={styles.container} />
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
    backgroundColor: '#07080B',
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
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
