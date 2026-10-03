'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  FileText,
  DollarSign,
  ArrowUpRight,
  Sparkles,
  Bot,
  Activity,
  Palette,
  Bell,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useTheme } from '@/theme/useTheme';
import { supabase, isPlaceholderUrl } from '@/lib/supabase';
import { StatCardSkeleton } from '@/components/ui/Skeleton';
import { toast } from 'sonner';

// Tier → monthly price mapping (mirrors the Subscriptions page MRR model)
const TIER_MRR: Record<string, number> = { free: 0, starter: 19, pro: 49, agency: 199 };

const PLATFORM_META: { key: string; label: string; color: string }[] = [
  { key: 'instagram', label: 'Instagram', color: '#E1306C' },
  { key: 'twitter', label: 'Twitter/X', color: '#1DA1F2' },
  { key: 'linkedin', label: 'LinkedIn', color: '#0A66C2' },
  { key: 'facebook', label: 'Facebook', color: '#1877F2' },
  { key: 'tiktok', label: 'TikTok', color: '#FF0050' },
  { key: 'threads', label: 'Threads', color: '#8E95A5' },
];

// Demo series only used in placeholder/mock mode (NEXT_PUBLIC_USE_MOCK=true)
const DEMO_REVENUE_CHART_DATA = [
  { month: 'Jan', mrr: 1200, users: 140 },
  { month: 'Feb', mrr: 1550, users: 190 },
  { month: 'Mar', mrr: 1900, users: 230 },
  { month: 'Apr', mrr: 2150, users: 270 },
  { month: 'May', mrr: 2480, users: 310 },
  { month: 'Jun', mrr: 2840, users: 342 },
];

const DEMO_PLATFORM_POST_DATA = [
  { platform: 'Instagram', posts: 1840, color: '#E1306C' },
  { platform: 'Twitter/X', posts: 1420, color: '#1DA1F2' },
  { platform: 'LinkedIn', posts: 950, color: '#0A66C2' },
  { platform: 'TikTok', posts: 610, color: '#FF0050' },
];

interface RevenuePoint { month: string; mrr: number; users: number }
interface PlatformPoint { platform: string; posts: number; color: string }

export default function DashboardOverviewPage() {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    newThisWeek: 0,
    mrr: '$0',
    tokensBurned: '0',
  });
  const [revenueData, setRevenueData] = useState<RevenuePoint[]>(
    isPlaceholderUrl ? DEMO_REVENUE_CHART_DATA : []
  );
  const [platformData, setPlatformData] = useState<PlatformPoint[]>(
    isPlaceholderUrl ? DEMO_PLATFORM_POST_DATA : []
  );
  const [momGrowth, setMomGrowth] = useState<number | null>(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      if (isPlaceholderUrl) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        setLoading(false);
        return;
      }

      const [usersRes, postsRes, profilesRes, logsRes, postsPlatRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('posts').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('subscription_tier, created_at'),
        supabase.from('ai_logs').select('tokens_used'),
        supabase.from('posts').select('platforms'),
      ]);

      const profiles = (profilesRes.data || []) as { subscription_tier: string | null; created_at: string | null }[];

      const mrrSum = profiles.reduce((s, p) => s + (TIER_MRR[p.subscription_tier || 'free'] ?? 0), 0);
      // Tokens across logged generations (fetched rows are real, capped by PostgREST page size)
      const tokensSum = ((logsRes.data || []) as { tokens_used: number | null }[])
        .reduce((s, l) => s + (l.tokens_used || 0), 0);

      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const newThisWeek = profiles.filter((p) => p.created_at && new Date(p.created_at).getTime() >= weekAgo).length;

      setStats({
        totalUsers: usersRes.count ?? 0,
        totalPosts: postsRes.count ?? 0,
        newThisWeek,
        mrr: `$${mrrSum.toLocaleString()}`,
        tokensBurned: tokensSum.toLocaleString(),
      });

      // Real MRR/user acceleration over the last 6 months (cumulative sign-ups)
      const now = new Date();
      const series: RevenuePoint[] = [];
      for (let i = 5; i >= 0; i--) {
        const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        const upto = profiles.filter((p) => p.created_at && new Date(p.created_at) <= end);
        series.push({
          month: end.toLocaleString('en-US', { month: 'short' }),
          mrr: upto.reduce((s, p) => s + (TIER_MRR[p.subscription_tier || 'free'] ?? 0), 0),
          users: upto.length,
        });
      }
      setRevenueData(series);
      const prev = series[4]?.mrr ?? 0;
      const cur = series[5]?.mrr ?? 0;
      setMomGrowth(prev > 0 ? Math.round(((cur - prev) / prev) * 1000) / 10 : null);

      // Real per-platform post volume from posts.platforms arrays
      const counts: Record<string, number> = {};
      for (const row of (postsPlatRes.data || []) as { platforms: string[] | null }[]) {
        for (const p of row.platforms || []) {
          counts[p] = (counts[p] || 0) + 1;
        }
      }
      setPlatformData(
        PLATFORM_META
          .map((m) => ({ platform: m.label, posts: counts[m.key] || 0, color: m.color }))
          .filter((row) => row.posts > 0)
      );
    } catch {
      toast.error('Failed to refresh dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-text-primary flex items-center gap-3">
            <Activity className="w-7 h-7 text-primary" />
            <span>Master Control Overview</span>
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Real-time platform KPIs, AI generation volume, and active customer subscriptions
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadDashboardData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-subtle border border-border hover:border-active-50 text-xs font-bold text-text-secondary hover:text-text-primary transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-success-10 text-success border border-success-30 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            System Healthy (v3.0)
          </span>
        </div>
      </div>

      {/* 4-Column KPI Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-panel rounded-2xl p-5 hover:border-active-50 transition">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                Total Users
              </span>
              <div className="w-9 h-9 rounded-xl bg-surface-subtle border border-border flex items-center justify-center text-primary">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-text-primary">
              {stats.totalUsers}
            </div>
            <div className={`text-xs font-semibold mt-1 flex items-center gap-1 ${stats.newThisWeek > 0 ? 'text-success' : 'text-text-muted'}`}>
              {stats.newThisWeek > 0 && <ArrowUpRight className="w-3.5 h-3.5" />}
              {stats.newThisWeek > 0 ? `+${stats.newThisWeek} new this week` : 'No new sign-ups this week'}
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-5 hover:border-active-50 transition">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                Monthly Revenue (MRR)
              </span>
              <div className="w-9 h-9 rounded-xl bg-surface-subtle border border-border flex items-center justify-center text-success">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-text-primary">
              {stats.mrr}
            </div>
            <div className={`text-xs font-semibold mt-1 flex items-center gap-1 ${momGrowth !== null && momGrowth >= 0 ? 'text-success' : 'text-text-muted'}`}>
              {momGrowth !== null && momGrowth >= 0 && <ArrowUpRight className="w-3.5 h-3.5" />}
              {momGrowth !== null
                ? `${momGrowth >= 0 ? '+' : ''}${momGrowth}% MoM growth`
                : stats.mrr !== '$0' ? 'New revenue this month' : 'No paid subscriptions yet'}
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-5 hover:border-active-50 transition">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                Generated Posts
              </span>
              <div className="w-9 h-9 rounded-xl bg-surface-subtle border border-border flex items-center justify-center text-primary">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-text-primary">
              {stats.totalPosts}
            </div>
            <div className="text-xs text-text-muted font-semibold mt-1">
              Multi-Platform Queue
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-5 hover:border-active-50 transition">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                AI Tokens Burned
              </span>
              <div className="w-9 h-9 rounded-xl bg-surface-subtle border border-border flex items-center justify-center text-warning">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-warning">
              {stats.tokensBurned}
            </div>
            <div className="text-xs text-text-muted font-semibold mt-1">
              All logged AI generations
            </div>
          </div>
        </div>
      )}

      {/* Real Recharts Interactive Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* MRR Growth Area Chart */}
        <div className="lg:col-span-8 glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Revenue & MRR Acceleration
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Monthly recurring revenue trajectory across all tiers
              </p>
            </div>
            <span className="text-xs font-bold text-primary bg-primary-10 border border-border-active-30 px-2.5 py-1 rounded-lg">
              {momGrowth !== null ? `${momGrowth >= 0 ? '+' : ''}${momGrowth}% MoM` : 'No MoM change yet'}
            </span>
          </div>

          <div className="h-72 w-full">
            {revenueData.length === 0 ? (
              <p className="text-xs text-text-muted py-10 text-center">No subscription history recorded yet.</p>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors.primary} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={colors.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--color-text-muted)" fontSize={12} tickLine={false} />
                <YAxis stroke="var(--color-text-muted)" fontSize={12} tickLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderRadius: '0.75rem',
                    color: colors.textPrimary,
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: colors.textPrimary, fontWeight: 600 }}
                  itemStyle={{ color: colors.textPrimary }}
                />
                <Area type="monotone" dataKey="mrr" stroke={colors.primary} strokeWidth={3} fillOpacity={1} fill="url(#colorMrr)" name="MRR ($)" />
              </AreaChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Platform Breakdown Bar Chart */}
        <div className="lg:col-span-4 glass-panel rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <FileText className="w-4 h-4 text-warning" />
              Volume by Platform
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Distribution of posts created this month
            </p>
          </div>

          <div className="h-56 w-full my-4">
            {platformData.length === 0 ? (
              <p className="text-xs text-text-muted py-10 text-center">No posts generated yet.</p>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="platform" stroke="var(--color-text-muted)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--color-text-muted)" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderRadius: '0.75rem',
                    color: colors.textPrimary,
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: colors.textPrimary, fontWeight: 600 }}
                  itemStyle={{ color: colors.textPrimary }}
                />
                <Bar dataKey="posts" fill={colors.primary} radius={[6, 6, 0, 0]} name="Posts" />
              </BarChart>
            </ResponsiveContainer>
            )}
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-text-secondary">
            <span>Total: {stats.totalPosts.toLocaleString()} posts</span>
            <Link href="/posts" className="text-primary font-bold hover:underline flex items-center gap-1">
              <span>Moderate</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Action Matrix & System Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-panel rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                White-Label Status
              </h2>
            </div>
            <span className="text-xs font-bold text-success bg-success-10 px-2.5 py-0.5 rounded-full border border-success-30">
              Realtime Active
            </span>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            Mobile branding, colors, and logos synchronize dynamically over Supabase Realtime WebSockets.
          </p>
          <Link
            href="/white-label"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
          >
            <span>Open White-Label Suite</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="glass-panel rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-warning" />
              <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                Active AI Models
              </h2>
            </div>
            <span className="text-xs font-bold text-success bg-success-10 px-2.5 py-0.5 rounded-full border border-success-30">
              Configurable
            </span>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            Text &amp; image models are set centrally in AI Settings (default: Gemini 2.0 Flash + SDXL via Replicate).
          </p>
          <Link
            href="/ai-settings"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
          >
            <span>Configure AI Parameters</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="glass-panel rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-success" />
              <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                Push Broadcast
              </h2>
            </div>
            <span className="text-xs font-bold text-badge-text bg-badge-bg px-2.5 py-0.5 rounded-full border border-badge-border">
              Ready
            </span>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            Dispatch segmented push notifications to all users, pro subscribers, or inactive cohorts.
          </p>
          <Link
            href="/notifications"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
          >
            <span>Create Notification</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
