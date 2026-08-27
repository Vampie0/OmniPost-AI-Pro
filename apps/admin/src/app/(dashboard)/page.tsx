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
import { supabase, isPlaceholderUrl } from '@/lib/supabase';
import { StatCardSkeleton } from '@/components/ui/Skeleton';
import { toast } from 'sonner';

const REVENUE_CHART_DATA = [
  { month: 'Jan', mrr: 1200, users: 140 },
  { month: 'Feb', mrr: 1550, users: 190 },
  { month: 'Mar', mrr: 1900, users: 230 },
  { month: 'Apr', mrr: 2150, users: 270 },
  { month: 'May', mrr: 2480, users: 310 },
  { month: 'Jun', mrr: 2840, users: 342 },
];

const PLATFORM_POST_DATA = [
  { platform: 'Instagram', posts: 1840, color: '#E1306C' },
  { platform: 'Twitter/X', posts: 1420, color: '#1DA1F2' },
  { platform: 'LinkedIn', posts: 950, color: '#0A66C2' },
  { platform: 'TikTok', posts: 610, color: '#FF0050' },
];

export default function DashboardOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 342,
    totalPosts: 4820,
    mrr: '$2,840',
    tokensBurned: '1.84M',
  });

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      if (isPlaceholderUrl) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        setLoading(false);
        return;
      }

      const [usersRes, postsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('posts').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        totalUsers: usersRes.count ?? 342,
        totalPosts: postsRes.count ?? 4820,
        mrr: '$2,840',
        tokensBurned: '1.84M',
      });
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
            <div className="text-xs text-success font-semibold mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> +12% this week
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
            <div className="text-xs text-success font-semibold mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> +18.4% growth
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
              Gemini 1.5 Pro & SDXL
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
              +18.4% MoM
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={REVENUE_CHART_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary, #4F46E5)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--color-primary, #4F46E5)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--color-text-muted)" fontSize={12} tickLine={false} />
                <YAxis stroke="var(--color-text-muted)" fontSize={12} tickLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-surface, #0F172A)',
                    borderColor: 'var(--color-border, #334155)',
                    borderRadius: '0.75rem',
                    color: 'var(--color-text-primary, #FFFFFF)',
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: 'var(--color-text-primary, #FFFFFF)', fontWeight: 600 }}
                  itemStyle={{ color: 'var(--color-text-primary, #FFFFFF)' }}
                />
                <Area type="monotone" dataKey="mrr" stroke="var(--color-primary, #4F46E5)" strokeWidth={3} fillOpacity={1} fill="url(#colorMrr)" name="MRR ($)" />
              </AreaChart>
            </ResponsiveContainer>
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
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={PLATFORM_POST_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="platform" stroke="var(--color-text-muted)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--color-text-muted)" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-surface, #0F172A)',
                    borderColor: 'var(--color-border, #334155)',
                    borderRadius: '0.75rem',
                    color: 'var(--color-text-primary, #FFFFFF)',
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: 'var(--color-text-primary, #FFFFFF)', fontWeight: 600 }}
                  itemStyle={{ color: 'var(--color-text-primary, #FFFFFF)' }}
                />
                <Bar dataKey="posts" fill="var(--color-primary, #4F46E5)" radius={[6, 6, 0, 0]} name="Posts" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-text-secondary">
            <span>Total: 4,820 posts</span>
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
              Gemini 1.5 Pro
            </span>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            Copywriting Engine: <strong>Gemini 1.5 Pro</strong>. Visual Synthesis: <strong>Stability SDXL</strong>.
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
