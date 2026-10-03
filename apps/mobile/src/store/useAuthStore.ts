import { create } from 'zustand';
import { UserProfile } from '@socialpilot/types';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, isPlaceholderUrl } from '@/services/supabase';
import * as SecureStore from '@/utils/secureStorage';
import { STORAGE_KEYS } from '@/constants';

interface AuthState {
  user: UserProfile | null;
  sessionChecked: boolean;
  isOnboarded: boolean;
  isLoading: boolean;
  passwordRecovery: boolean;
  clearPasswordRecovery: () => void;
  initializeAuth: () => Promise<void>;
  setOnboardingCompleted: () => Promise<void>;
  fetchProfile: (userId: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// Single live subscription handle: prevents duplicate channels on repeated
// initializeAuth() and allows teardown on sign-out.
let profileWatchChannel: RealtimeChannel | null = null;

export const useAuthStore = create<AuthState>((set, get) => {
  const watchProfile = (userId: string) => {
    if (isPlaceholderUrl || profileWatchChannel) return;
    // Sweep stale watch channels: module reloads (HMR) and re-sign-ins reset
    // the handle below, but the shared client keeps old postgres_changes
    // subscriptions alive until the server rejects new ones
    // ("cannot add `postgres_changes` channel").
    supabase
      .getChannels()
      .filter((ch) => ch.topic.includes('profiles-watch-'))
      .forEach((ch) => supabase.removeChannel(ch));
    profileWatchChannel = supabase
      .channel(`profiles-watch-${userId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
        (payload) => {
          set({ user: payload.new as UserProfile });
        }
      )
      .subscribe((status) => {
        // Realtime is an enhancement here; never surface channel failures
        // as an unhandled rejection
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          profileWatchChannel = null;
        }
      });
  };

  const stopWatchingProfile = () => {
    if (profileWatchChannel) {
      supabase.removeChannel(profileWatchChannel);
      profileWatchChannel = null;
    }
  };

  // Subscribe at store-load time so a PASSWORD_RECOVERY event (fired when the
  // web client consumes the email-link redirect) is never missed by the later
  // initializeAuth() subscription.
  if (!isPlaceholderUrl) {
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') set({ passwordRecovery: true });
    });
  }

  return {
  user: null,
  sessionChecked: false,
  isOnboarded: false,
  isLoading: false,
  passwordRecovery: false,

  clearPasswordRecovery: () => set({ passwordRecovery: false }),

  initializeAuth: async () => {
    try {
      const onboardedFlag = await SecureStore.getItemAsync(STORAGE_KEYS.ONBOARDING_COMPLETED);
      const isOnboarded = onboardedFlag === 'true';

      if (isPlaceholderUrl) {
        set({
          sessionChecked: true,
          isOnboarded,
          isLoading: false,
        });
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        await get().fetchProfile(session.user.id);
        watchProfile(session.user.id);
      }

      set({
        sessionChecked: true,
        isOnboarded,
        isLoading: false,
      });

      supabase.auth.onAuthStateChange(async (event, newSession) => {
        if (event === 'PASSWORD_RECOVERY') set({ passwordRecovery: true });
        if (newSession?.user) {
          await get().fetchProfile(newSession.user.id);
          watchProfile(newSession.user.id);
        } else {
          stopWatchingProfile();
          set({ user: null });
        }
      });
    } catch {
      set({ sessionChecked: true, isLoading: false });
    }
  },

  setOnboardingCompleted: async () => {
    await SecureStore.setItemAsync(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
    set({ isOnboarded: true });
  },

  fetchProfile: async (userId: string) => {
    if (isPlaceholderUrl) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data && !error) {
        set({ user: data as UserProfile });
      }
    } catch {}
  },

  signOut: async () => {
    stopWatchingProfile();
    if (!isPlaceholderUrl) {
      await supabase.auth.signOut();
    }
    set({ user: null, passwordRecovery: false });
  },
  };
});
