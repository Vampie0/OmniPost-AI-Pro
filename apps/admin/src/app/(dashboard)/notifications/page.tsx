'use client';

import React, { useEffect, useState } from 'react';
import {
  Bell,
  Send,
  Trash2,
  Smartphone,
  Sparkles,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { supabase, isPlaceholderUrl } from '@/lib/supabase';
import { toast } from 'sonner';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

interface AdminNotification {
  id: string;
  user_id?: string;
  title: string;
  message: string;
  target_audience?: string;
  is_read: boolean;
  data?: Record<string, unknown>;
  created_at: string;
}

const MOCK_NOTIFICATIONS: AdminNotification[] = [
  {
    id: 'notif_1',
    title: '🚀 Gemini 1.5 Pro Upgrade Live!',
    message: 'We have upgraded all AI copywriting models to Gemini 1.5 Pro. Enjoy 3x faster caption generation.',
    target_audience: 'All Users',
    is_read: true,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif_2',
    title: '⚡ Weekend Pro Bonus Credits Granted',
    message: 'Your account has been credited with +500 bonus AI tokens for the weekend publishing sprint.',
    target_audience: 'Pro & Agency Tiers',
    is_read: true,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif_3',
    title: '📱 Mobile App Version 3.2 Available',
    message: 'Please update your mobile app via TestFlight or Play Store for the new white-label live preview.',
    target_audience: 'All Users',
    is_read: false,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetAudience, setTargetAudience] = useState('All Users');
  const [payloadJson, setPayloadJson] = useState('{\n  "action": "open_tab",\n  "tab": "generate"\n}');

  const loadNotifications = async () => {
    try {
      setLoading(true);
      if (isPlaceholderUrl) {
        setNotifications(MOCK_NOTIFICATIONS);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications((data as AdminNotification[]) || []);
    } catch {
      toast.error('Failed to load notification history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();

    if (!isPlaceholderUrl) {
      const channel = supabase
        .channel('notifications-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
          loadNotifications();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
    return undefined;
  }, []);

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error('Title and message body are required');
      return;
    }

    let parsedData = {};
    try {
      if (payloadJson.trim()) {
        parsedData = JSON.parse(payloadJson);
      }
    } catch {
      toast.error('Invalid JSON in payload field');
      return;
    }

    try {
      setIsSending(true);

      if (isPlaceholderUrl) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const newNotif: AdminNotification = {
          id: `notif_${Date.now()}`,
          title: title.trim(),
          message: message.trim(),
          target_audience: targetAudience,
          is_read: false,
          data: parsedData,
          created_at: new Date().toISOString(),
        };
        setNotifications([newNotif, ...notifications]);
        setTitle('');
        setMessage('');
        toast.success(`Broadcast push sent to ${targetAudience} (Mock)`);
        setIsSending(false);
        return;
      }

      // Fetch user profile IDs based on target audience segment
      let query = supabase.from('profiles').select('id');
      if (targetAudience === 'Pro & Agency Tiers') {
        query = query.in('subscription_tier', ['pro', 'agency']);
      } else if (targetAudience === 'Free Tier Only') {
        query = query.eq('subscription_tier', 'free');
      }

      const { data: users, error: userError } = await query;
      if (userError) throw userError;

      if (users && users.length > 0) {
        const records = users.map((u) => ({
          user_id: u.id,
          title: title.trim(),
          message: message.trim(),
          data: parsedData,
          is_read: false,
        }));

        const { error: insertError } = await supabase.from('notifications').insert(records);
        if (insertError) throw insertError;
      }

      toast.success(`Push notification dispatched to ${users?.length || 0} creators`);
      setTitle('');
      setMessage('');
      await loadNotifications();
    } catch {
      toast.error('Failed to send broadcast push notification');
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      if (isPlaceholderUrl) {
        setNotifications(notifications.filter((n) => n.id !== id));
        toast.success('Notification record removed');
        return;
      }

      const { error } = await supabase.from('notifications').delete().eq('id', id);
      if (error) throw error;
      setNotifications(notifications.filter((n) => n.id !== id));
      toast.success('Notification deleted');
    } catch {
      toast.error('Failed to delete notification');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-text-primary flex items-center gap-3">
            <Bell className="w-7 h-7 text-primary" />
            <span>Push Notifications & Broadcast Studio</span>
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Dispatch segmented in-app announcements and push notifications to mobile devices
          </p>
        </div>

        <button
          onClick={loadNotifications}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-subtle border border-border text-xs font-bold text-text-secondary hover:text-text-primary transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Sync</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Compose Form */}
        <form onSubmit={handleSendNotification} className="lg:col-span-7 space-y-6">
          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                  Compose Announcement
                </h2>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">
                Target Audience Cohort
              </label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full bg-input-bg border border-border rounded-xl px-3 py-2.5 text-xs sm:text-sm text-text-primary focus:outline-none focus:border-active transition"
              >
                <option value="All Users">All Registered Users (Broadcast)</option>
                <option value="Pro & Agency Tiers">Pro & Agency Tiers Only (VIP)</option>
                <option value="Free Tier Only">Free Tier Only (Conversion Push)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">
                Notification Headline *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., 🚀 New AI Feature Available!"
                className="w-full bg-input-bg border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-active transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">
                Message Body *
              </label>
              <textarea
                required
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter compelling announcement copy..."
                className="w-full bg-input-bg border border-border rounded-xl p-3.5 text-xs sm:text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-active transition resize-none leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">
                Custom JSON Data Payload (Optional)
              </label>
              <textarea
                rows={3}
                value={payloadJson}
                onChange={(e) => setPayloadJson(e.target.value)}
                className="w-full bg-input-bg border border-border rounded-xl p-3 text-xs font-mono text-text-primary focus:outline-none focus:border-active transition resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSending}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-primary text-btn-text font-black text-sm rounded-xl shadow-xl shadow-glow/25 hover:opacity-95 transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSending ? 'Dispatching Push...' : `Send Notification to ${targetAudience}`}</span>
            </button>
          </div>
        </form>

        {/* Right: Live Mobile Push Notification Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="text-xs font-bold uppercase tracking-widest text-text-secondary flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-primary" />
            <span>Mobile Push Banner Preview</span>
          </div>

          {/* iOS / Android Style Notification Banner */}
          <div className="p-4 rounded-2xl bg-surface/90 border border-border/80 shadow-2xl backdrop-blur-2xl space-y-2">
            <div className="flex items-center justify-between text-[11px] text-text-muted">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-md bg-primary flex items-center justify-center text-white">
                  <Sparkles className="w-2.5 h-2.5" />
                </div>
                <span className="font-bold text-text-primary">SOCIALPILOT AI</span>
              </div>
              <span>now</span>
            </div>

            <div>
              <div className="text-xs font-bold text-text-primary">
                {title || 'Headline Preview...'}
              </div>
              <p className="text-xs text-text-secondary mt-0.5 leading-relaxed line-clamp-3">
                {message || 'Your push notification message preview will render here in real-time.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sent Notifications History */}
      <div className="glass-panel rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-warning" />
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
              Recent Push Dispatch History
            </h2>
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={3} cols={3} />
        ) : notifications.length === 0 ? (
          <EmptyState
            title="No Notifications Dispatched"
            description="Broadcast your first announcement using the form above."
            icon={Bell}
          />
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className="p-4 rounded-xl bg-surface-subtle/70 border border-border flex items-start justify-between gap-4 hover:border-active-50 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-bold text-text-primary">
                      {notif.title}
                    </h3>
                    {notif.target_audience && (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-primary-10 text-primary border border-border-active-30">
                        {notif.target_audience}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">{notif.message}</p>
                  <span className="text-[10px] text-text-muted block pt-1">
                    {new Date(notif.created_at).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <button
                  onClick={() => handleDeleteNotification(notif.id)}
                  title="Remove record"
                  className="p-2 rounded-lg text-danger hover:bg-danger-10 transition shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
