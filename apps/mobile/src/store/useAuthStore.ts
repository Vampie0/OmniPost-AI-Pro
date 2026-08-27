import { create } from 'zustand';
import { UserProfile } from '@socialpilot/types';
import { supabase, isPlaceholderUrl } from '@/services/supabase';
import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '@/constants';

interface AuthState {
  user: UserProfile | null;
  sessionChecked: boolean;
  isOnboarded: boolean;
  isLoading: boolean;
  initializeAuth: () => Promise<void>;
  setOnboardingCompleted: () => Promise<void>;
  fetchProfile: (userId: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  sessionChecked: false,
  isOnboarded: false,
  isLoading: false,

  initializeAuth: async () => {
    try {
      const onboardedFlag = await SecureStore.getItemAsync(STORAGE_KEYS.ONBOARDING_COMPLETED);
      const isOnboarded = onboardedFlag === 'true';

      // Instant bypass on placeholder to prevent 40s network block
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
      }

      set({
        sessionChecked: true,
        isOnboarded,
        isLoading: false,
      });

      supabase.auth.onAuthStateChange(async (_event, newSession) => {
        if (newSession?.user) {
          await get().fetchProfile(newSession.user.id);
        } else {
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
    if (!isPlaceholderUrl) {
      await supabase.auth.signOut();
    }
    set({ user: null });
  },
}));
