import { create } from 'zustand';
import { AppConfig } from '@socialpilot/types';
import { supabase, isPlaceholderUrl } from '@/services/supabase';

interface ConfigState {
  config: AppConfig | null;
  isLoading: boolean;
  fetchConfig: () => Promise<void>;
  subscribeToRealtimeConfig: () => () => void;
}

export const useConfigStore = create<ConfigState>((set) => ({
  config: null,
  isLoading: false,
  fetchConfig: async () => {
    // Instant bypass on placeholder URL to kill 40s DNS timeout
    if (isPlaceholderUrl) {
      set({ config: null, isLoading: false });
      return;
    }

    try {
      set({ isLoading: true });
      // maybeSingle: an empty app_config table yields null instead of a 406/PGRST116 error
      const { data, error } = await supabase
        .from('app_config')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (data && !error) {
        set({ config: data as AppConfig, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
  subscribeToRealtimeConfig: () => {
    // Never attempt WebSocket connection on dummy placeholder URL
    if (isPlaceholderUrl) {
      return () => {};
    }

    try {
      const channel = supabase
        .channel('public:app_config')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'app_config' },
          (payload) => {
            if (payload.new) {
              set({ config: payload.new as AppConfig });
            }
          }
        )
        .subscribe(() => {
          // Status intentionally unused: a no-op callback prevents channel
          // failures from surfacing as unhandled rejections. One-shot
          // fetchConfig() already covers cold starts.
        });

      return () => {
        supabase.removeChannel(channel);
      };
    } catch {
      return () => {};
    }
  },
}));
