'use client';

import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  DollarSign,
  FileText,
  Users,
  Image,
  ArrowUpRight,
  ArrowDownRight,
  Bot,
  Download,
  Layers,
  PieChart as PieIcon,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { supabase, isPlaceholderUrl } from '@/lib/supabase';
import { exportToCsv } from '@/lib/csv';
import { toast } from 'sonner';
import { useTheme } from '@/theme/useTheme';

// Tier → monthly price mapping (mirrors the Subscriptions page MRR model)
const TIER_MRR: Record<string, number> = { free: 0, starter: 19, pro: 49, agency: 199 };

// Demo series only used in placeholder/mock mode (NEXT_PUBLIC_USE_MOCK=true)
const DEMO_REVENUE_ANALYTICS = [
  { date: 'Jan 01', revenue: 1200, mrr: 1200, arpu: 8.5 },
  { date: 'Jan 15', revenue: 1450, mrr: 1380, arpu: 8.8 },
  { date: 'Feb 01', revenue: 1680, mrr: 1550, arpu: 9.1 },
  { date: 'Feb 15', revenue: 1890, mrr: 1720, arpu: 9.3 },
  { date: 'Mar 01', revenue: 2150, mrr: 1900, arpu: 9.5 },
  { date: 'Mar 15', revenue: 2420, mrr: 2100, arpu: 9.7 },
  { date: 'Apr 01', revenue: 2780, mrr: 2350, arpu: 9.9 },
  { date: 'Apr 15', revenue: 3100, mrr: 2580, arpu: 10.1 },
  { date: 'May 01', revenue: 3450, mrr: 2840, arpu: 10.4 },
];

const DEMO_USER_GROWTH = [
  { month: 'Nov', free: 80, starter: 20, pro: 15, agency: 4 },
  { month: 'Dec', free: 110, starter: 32, pro: 28, agency: 7 },
  { month: 'Jan', free: 140, starter: 45, pro: 42, agency: 10 },
  { month: 'Feb', free: 175, starter: 54, pro: 58, agency: 14 },
  { month: 'Mar', free: 210, starter: 64, pro: 78, agency: 18 },
];

const DEMO_TOKEN_UTILIZATION = [
  { day: 'Mon', tokensK: 14.5, generations: 42 },
  { day: 'Tue', tokensK: 19.0, generations: 58 },
  { day: 'Wed', tokensK: 24.0, generations: 74 },
  { day: 'Thu', tokensK: 21.0, generations: 65 },
  { day: 'Fri', tokensK: 28.0, generations: 92 },
  { day: 'Sat', tokensK: 32.0, generations: 110 },
  { day: 'Sun', tokensK: 29.0, generations: 98 },
];

interface RevenuePoint { date: string; revenue: number; mrr: number; arpu: number }
interface GrowthPoint { month: string; free: number; starter: number; pro: number; agency: number }
interface TokenPoint { day: string; tokensK: number; generations: number }

export default function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState<'7D' | '30D' | '90D' | '1Y'>('30D');
  const { colors } = useTheme();
  const [liveStats, setLiveStats] = useState({
    totalPosts: 0,
    totalUsers: 0,
    totalAiGenerations: 0,
    mrr: 0,
    mrrChange: null as number | null,
    usersChange: null as number | null,
  });
  const [platformCounts, setPlatformCounts] = useState<Record<string, number>>({});
  const [revenueData, setRevenueData] = useState<RevenuePoint[]>(
    isPlaceholderUrl ? DEMO_REVENUE_ANALYTICS : []
  );
  const [userGrowthData, setUserGrowthData] = useState<GrowthPoint[]>(
    isPlaceholderUrl ? DEMO_USER_GROWTH : []
  );
  const [tokenData, setTokenData] = useState<TokenPoint[]>(
    isPlaceholderUrl ? DEMO_TOKEN_UTILIZATION : []
  );
  const [arpu, setArpu] = useState<number | null>(null);

  useEffect(() => {
    if (isPlaceholderUrl) return;
    async function loadAnalytics() {
      const [postsRes, usersRes, analyticsRes, platformsRes, profilesRes, logsRes] = await Promise.all([
        supabase.from('posts').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('analytics').select('total_ai_generations, credits_used'),
        supabase.from('posts').select('platforms'),
        supabase.from('profiles').select('subscription_tier, created_at'),
        supabase.from('ai_logs').select('tokens_used, created_at'),
      ]);
      const totalAi = (analyticsRes.data || []).reduce((s: number, a: any) => s + (a.total_ai_generations || 0), 0);
      const profiles = (profilesRes.data || []) as { subscription_tier: string | null; created_at: string | null }[];

      // Real MRR = sum of tier prices across all profiles (same model as Subscriptions page)
      const mrrNow = profiles.reduce((s, p) => s + (TIER_MRR[p.subscription_tier || 'free'] ?? 0), 0);
      const paidNow = profiles.filter((p) => (TIER_MRR[p.subscription_tier || 'free'] ?? 0) > 0).length;
      setArpu(paidNow > 0 ? Math.round((mrrNow / paidNow) * 10) / 10 : null);

      // Cumulative revenue & tier cohorts over the last 6 months (signup-dated)
      const now = new Date();
      const revSeries: RevenuePoint[] = [];
      const growthSeries: GrowthPoint[] = [];
      for (let i = 5; i >= 0; i--) {
        const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        const upto = profiles.filter((p) => p.created_at && new Date(p.created_at) <= end);
        const mrr = upto.reduce((s, p) => s + (TIER_MRR[p.subscription_tier || 'free'] ?? 0), 0);
        const paid = upto.filter((p) => (TIER_MRR[p.subscription_tier || 'free'] ?? 0) > 0).length;
        const label = end.toLocaleString('en-US', { month: 'short' });
        revSeries.push({
          date: `${label} 01`,
          revenue: mrr,
          mrr,
          arpu: paid > 0 ? Math.round((mrr / paid) * 10) / 10 : 0,
        });
        const tierCount = (tier: string) => upto.filter((p) => (p.subscription_tier || 'free') === tier).length;
        growthSeries.push({
          month: label,
          free: tierCount('free'),
          starter: tierCount('starter'),
          pro: tierCount('pro'),
          agency: tierCount('agency'),
        });
      }
      setRevenueData(revSeries);
      setUserGrowthData(growthSeries);

      const pct = (prev: number, cur: number) =>
        prev > 0 ? Math.round(((cur - prev) / prev) * 1000) / 10 : null;
      const growthTotal = (g: GrowthPoint) => g.free + g.starter + g.pro + g.agency;
      const mrrChange = pct(revSeries[4]?.mrr ?? 0, revSeries[5]?.mrr ?? 0);
      const usersChange = pct(
        growthSeries[4] ? growthTotal(growthSeries[4]) : 0,
        growthSeries[5] ? growthTotal(growthSeries[5]) : 0
      );

      // Daily AI tokens (k) & generation count from ai_logs, last 7 days
      const logs = (logsRes.data || []) as { tokens_used: number | null; created_at: string | null }[];
      const tokenSeries: TokenPoint[] = [];
      for (let d = 6; d >= 0; d--) {
        const day = new Date(Date.now() - d * 24 * 60 * 60 * 1000);
        const key = day.toISOString().slice(0, 10);
        const dayLogs = logs.filter((l) => l.created_at && l.created_at.slice(0, 10) === key);
        tokenSeries.push({
          day: day.toLocaleString('en-US', { weekday: 'short' }),
          tokensK: Math.round(dayLogs.reduce((s, l) => s + (l.tokens_used || 0), 0) / 100) / 10,
          generations: dayLogs.length,
        });
      }
      setTokenData(tokenSeries);

      setLiveStats({
        totalPosts: postsRes.count ?? 0,
        totalUsers: usersRes.count ?? 0,
        totalAiGenerations: totalAi,
        mrr: mrrNow,
        mrrChange,
        usersChange,
      });
      const counts: Record<string, number> = {};
      for (const row of platformsRes.data || []) {
        for (const p of (row.platforms || []) as string[]) {
          counts[p] = (counts[p] || 0) + 1;
        }
      }
      setPlatformCounts(counts);
    }
    loadAnalytics();
  }, []);

  // Demo-only fabricated numbers when no backend; real (including 0) otherwise.
  const shareTotal = Object.values(platformCounts).reduce((s, n) => s + n, 0);
  const sharePct = (key: string) => (shareTotal ? Math.round(((platformCounts[key] || 0) / shareTotal) * 100) : 0);
  const PLATFORM_SHARE = isPlaceholderUrl
    ? [
        { name: 'Instagram', value: 38, color: colors.primary },
        { name: 'Twitter / X', value: 29, color: colors.secondaryGradient[0] },
        { name: 'LinkedIn', value: 20, color: colors.accentGradient[0] },
        { name: 'TikTok', value: 13, color: colors.glowColor },
      ]
    : [
        { name: 'Instagram', value: sharePct('instagram'), color: colors.primary },
        { name: 'Twitter / X', value: sharePct('twitter'), color: colors.secondaryGradient[0] },
        { name: 'LinkedIn', value: sharePct('linkedin'), color: colors.accentGradient[0] },
        { name: 'TikTok', value: sharePct('tiktok'), color: colors.glowColor },
      ];

  const stats = [
    { label: 'Total Post Volume', value: isPlaceholderUrl ? '4,820' : liveStats.totalPosts.toLocaleString(), change: isPlaceholderUrl ? 12.5 : null, icon: FileText, color: 'text-primary' },
    { label: 'Monthly Recurring (MRR)', value: isPlaceholderUrl ? '$2,840' : `$${liveStats.mrr.toLocaleString()}`, change: isPlaceholderUrl ? 18.4 : liveStats.mrrChange, icon: DollarSign, color: 'text-success' },
    { label: 'Active Creators', value: isPlaceholderUrl ? '342' : liveStats.totalUsers.toLocaleString(), change: isPlaceholderUrl ? 8.2 : liveStats.usersChange, icon: Users, color: 'text-primary' },
    { label: 'AI Media Synthesized', value: isPlaceholderUrl ? '2,891' : liveStats.totalAiGenerations.toLocaleString(), change: isPlaceholderUrl ? 24.1 : null, icon: Image, color: 'text-warning' },
  ];

  const handleExportAnalyticsCsv = () => {
    exportToCsv('socialpilot_analytics_report', revenueData, {
      date: 'Reporting Date',
      revenue: 'Cumulative Revenue ($)',
      mrr: 'MRR ($)',
      arpu: 'ARPU ($)',
    });
    toast.success('Analytics CSV report exported');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-text-primary flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-primary" />
            <span>Platform Analytics & Telemetry</span>
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Revenue trajectory, customer cohort acquisition, and AI token consumption
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Timeframe selector */}
          <div className="flex p-1 rounded-xl bg-surface-subtle border border-border">
            {(['7D', '30D', '90D', '1Y'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                  timeframe === t
                    ? 'bg-surface text-text-primary shadow-sm border border-border'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportAnalyticsCsv}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-primary text-btn-text text-xs font-bold shadow-md shadow-glow-20 hover:opacity-95 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const isPositive = (stat.change ?? 0) >= 0;
          return (
            <div key={stat.label} className="glass-panel rounded-2xl p-5 hover:border-active-50 transition">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                  {stat.label}
                </span>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-text-primary">{stat.value}</div>
              {stat.change !== null ? (
                <div
                  className={`text-xs font-semibold mt-1.5 flex items-center gap-1 ${
                    isPositive ? 'text-success' : 'text-danger'
                  }`}
                >
                  {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  <span>{Math.abs(stat.change)}% vs prior period</span>
                </div>
              ) : (
                <div className="text-xs font-semibold mt-1.5 text-text-muted">Live total from database</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Primary Charts: Revenue Acceleration & User Acquisition */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Revenue Acceleration Area Chart */}
        <div className="lg:col-span-8 glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Revenue & MRR Progression
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Cumulative MRR from signup-dated subscriptions
              </p>
            </div>
            <span className="text-xs font-black text-success bg-success-10 border border-success-30 px-2.5 py-1 rounded-lg">
              {isPlaceholderUrl ? 'ARPU: $10.40' : arpu !== null ? `ARPU: $${arpu.toFixed(2)}` : 'ARPU: —'}
            </span>
          </div>

          <div className="h-72 w-full">
            {revenueData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-text-muted px-4 text-center">
                No subscription history yet — this chart populates as users sign up.
              </div>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors.primary} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={colors.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--color-text-muted)" fontSize={12} tickLine={false} />
                <YAxis stroke="var(--color-text-muted)" fontSize={12} tickLine={false} tickFormatter={(v) => `$${v}`} />
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
                <Area type="monotone" dataKey="revenue" stroke={colors.primary} strokeWidth={3} fillOpacity={1} fill="url(#revenueGrad)" name="Cumulative Revenue ($)" />
                <Area type="monotone" dataKey="mrr" stroke={colors.secondaryGradient[0]} strokeWidth={2} fillOpacity={0} name="MRR ($)" />
              </AreaChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Platform Share Donut Chart */}
        <div className="lg:col-span-4 glass-panel rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-warning" />
              Platform Share %
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Active publishing channels distribution
            </p>
          </div>

          <div className="h-56 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={PLATFORM_SHARE}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  cursor="default"
                >
                  {PLATFORM_SHARE.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke="transparent"
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderRadius: '0.75rem',
                    color: colors.textPrimary,
                    fontSize: '12px',
                    padding: '10px 14px',
                  }}
                  labelStyle={{
                    color: colors.textPrimary,
                    fontWeight: 700,
                    marginBottom: '4px',
                  }}
                  itemStyle={{
                    color: colors.textPrimary,
                    fontWeight: 500,
                  }}
                  formatter={(value: number) => [`${value}%`, 'Share']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border text-[11px]">
            {PLATFORM_SHARE.map((p) => (
              <div key={p.name} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                <span className="text-text-secondary">{p.name}:</span>
                <span className="font-bold text-text-primary">{p.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary Charts: User Tier Growth & AI Token Consumption */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* User Tier Growth Stacked Bar Chart */}
        <div className="lg:col-span-6 glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                Subscriber Cohort Growth
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Tier expansion breakdown month-over-month
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            {userGrowthData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-text-muted px-4 text-center">
                No user cohorts yet — chart populates as sign-ups arrive.
              </div>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userGrowthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--color-text-muted)" fontSize={12} tickLine={false} />
                <YAxis stroke="var(--color-text-muted)" fontSize={12} tickLine={false} />
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
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="starter" stackId="a" fill={colors.secondaryGradient[0]} name="Starter" />
                <Bar dataKey="pro" stackId="a" fill={colors.primary} name="Pro" />
                <Bar dataKey="agency" stackId="a" fill={colors.accentGradient[0]} name="Agency" />
              </BarChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* AI Model Token & Image Generation Line Chart */}
        <div className="lg:col-span-6 glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                <Bot className="w-4 h-4 text-warning" />
                Daily AI Compute Utilization
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                AI tokens consumed (k) &amp; generations logged per day, last 7 days
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            {tokenData.every((t) => t.generations === 0) ? (
              <div className="h-full flex items-center justify-center text-xs text-text-muted px-4 text-center">
                No AI generations logged yet — this chart fills as the content function runs.
              </div>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tokenData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--color-text-muted)" fontSize={12} tickLine={false} />
                <YAxis stroke="var(--color-text-muted)" fontSize={12} tickLine={false} />
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
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="tokensK" stroke={colors.primary} strokeWidth={2.5} name="AI Tokens (k)" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="generations" stroke={colors.accentGradient[0]} strokeWidth={2.5} name="Generations" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
