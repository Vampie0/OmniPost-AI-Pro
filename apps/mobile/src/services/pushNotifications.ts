// Device push registration (Phase 2 of the notification backbone).
// Flow: ask permission → obtain an Expo push token → store it in push_tokens.
// The DB trigger on notifications INSERT fans every new notification row out
// to these tokens via the `send-push` edge function, so the app itself never
// has to send a push — storing the token is the only client-side job.
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { supabase, isPlaceholderUrl } from '@/services/supabase';

let handlerConfigured = false;

// Show incoming pushes as in-app banners while the app is foregrounded.
function ensureHandlerConfigured() {
  if (handlerConfigured) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
  handlerConfigured = true;
}

export async function registerPushNotifications(userId: string): Promise<void> {
  // Web uses the in-app inbox + realtime instead of native push;
  // placeholder (demo) mode has no backend to store tokens against.
  if (Platform.OS === 'web' || isPlaceholderUrl || !userId) return;

  try {
    ensureHandlerConfigured();

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Notifications',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#8B5CF6',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (finalStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return;

    // getExpoPushTokenAsync requires the EAS project id. It is injected at
    // build time by EAS or provided via app.config.ts extra.eas.projectId.
    const projectId =
      (Constants.expoConfig?.extra?.eas as { projectId?: string } | undefined)?.projectId ??
      undefined;
    if (!projectId) {
      console.warn('EAS projectId not configured — device push skipped (inbox still works).');
      return;
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    if (!token) return;

    // RLS on push_tokens is user-own, so the signed-in client can upsert its
    // own device row. onConflict:'token' keeps one row per device across
    // sign-out/sign-in and re-signups on the same phone.
    const { error } = await supabase.from('push_tokens').upsert(
      {
        user_id: userId,
        token: String(token),
        platform: Platform.OS,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'token' }
    );
    if (error) console.warn('push_tokens upsert failed:', error.message);
  } catch (e) {
    // Push is an enhancement over the realtime in-app inbox — never block
    // sign-in on a token failure (e.g. Expo Go restrictions, offline).
    console.warn('Push registration skipped:', e);
  }
}
