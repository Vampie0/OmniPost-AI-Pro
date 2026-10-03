import { create } from 'zustand';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, isPlaceholderUrl } from '@/services/supabase';

export type NotificationKind = 'info' | 'success' | 'warning' | 'error' | 'promo' | 'system';

export interface InboxNotification {
  id: string;
  title: string;
  body: string;
  type: NotificationKind;
  is_read: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface NotificationsState {
  items: InboxNotification[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: (userId: string) => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: (userId: string) => Promise<void>;
  subscribeRealtime: (userId: string) => void;
  unsubscribeRealtime: () => void;
}

// Single live inbox subscription, same pattern as watchProfile in useAuthStore:
// HMR reloads reset the handle while the shared client keeps old channels
// alive, so stale channels are swept before re-subscribing.
let inboxChannel: RealtimeChannel | null = null;

const countUnread = (items: InboxNotification[]) => items.filter((i) => !i.is_read).length;

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  items: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async (userId: string) => {
    if (isPlaceholderUrl) return;
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, title, body, type, is_read, metadata, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (!error && data) {
        const items = data as InboxNotification[];
        set({ items, unreadCount: countUnread(items) });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  markRead: async (id: string) => {
    const items = get().items.map((i) => (i.id === id ? { ...i, is_read: true } : i));
    set({ items, unreadCount: countUnread(items) });
    if (!isPlaceholderUrl) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    }
  },

  markAllRead: async (userId: string) => {
    const items = get().items.map((i) => ({ ...i, is_read: true }));
    set({ items, unreadCount: 0 });
    if (!isPlaceholderUrl) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);
    }
  },

  subscribeRealtime: (userId: string) => {
    if (isPlaceholderUrl) return;
    if (inboxChannel) return;
    supabase
      .getChannels()
      .filter((ch) => ch.topic.includes('notifications-inbox-'))
      .forEach((ch) => supabase.removeChannel(ch));
    inboxChannel = supabase
      .channel(`notifications-inbox-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          const row = payload.new as InboxNotification;
          const items = [row, ...get().items].slice(0, 50);
          set({ items, unreadCount: countUnread(items) });
        }
      )
      .subscribe((status) => {
        // The inbox also refreshes on screen focus; never leak channel
        // failures as unhandled rejections.
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          inboxChannel = null;
        }
      });
  },

  unsubscribeRealtime: () => {
    if (inboxChannel) {
      supabase.removeChannel(inboxChannel);
      inboxChannel = null;
    }
  },
}));
