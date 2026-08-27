'use client';

import React, { useState } from 'react';
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
import { exportToCsv } from '@/lib/csv';
import { toast } from 'sonner';

const REVENUE_ANALYTICS = [
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

const USER_GROWTH = [
  { month: 'Nov', free: 80, starter: 20, pro: 15, agency: 4 },
  { month: 'Dec', free: 110, starter: 32, pro: 28, agency: 7 },
  { month: 'Jan', free: 140, starter: 45, pro: 42, agency: 10 },
  { month: 'Feb', free: 175, starter: 54, pro: 58, agency: 14 },
  { month: 'Mar', free: 210, starter: 64, pro: 78, agency: 18 },
];

const TOKEN_UTILIZATION = [
  { day: 'Mon', geminiTokens: 145, sdxlImages: 42 },
  { day: 'Tue', geminiTokens: 190, sdxlImages: 58 },
  { day: 'Wed', geminiTokens: 240, sdxlImages: 74 },
  { day: 'Thu', geminiTokens: 210, sdxlImages: 65 },
  { day: 'Fri', geminiTokens: 280, sdxlImages: 92 },
  { day: 'Sat', geminiTokens: 320, sdxlImages: 110 },
  { day: 'Sun', geminiTokens: 290, sdxlImages: 98 },
];

const PLATFORM_SHARE = [
  { name: 'Instagram', value: 38, color: '#E1306C' },
  { name: 'Twitter / X', value: 29, color: '#1DA1F2' },
  { name: 'LinkedIn', value: 20, color: '#0A66C2' },
  { name: 'TikTok', value: 13, color: '#FF0050' },
];

export default function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState<'7D' | '30D' | '90D' | '1Y'>('30D');

  const stats = [
    { label: 'Total Post Volume', value: '4,820', change: 12.5, icon: FileText, color: 'text-primary' },
    { label: 'Monthly Recurring (MRR)', value: '$2,840', change: 18.4, icon: DollarSign, color: 'text-success' },
    { label: 'Active Creators', value: '342', change: 8.2, icon: Users, color: 'text-primary' },
    { label: 'AI Media Synthesized', value: '2,891', change: 24.1, icon: Image, color: 'text-warning' },
  ];

  const handleExportAnalyticsCsv = () => {
    exportToCsv('socialpilot_analytics_report', REVENUE_ANALYTICS, {
      date: 'Reporting Date',
      revenue: 'Gross Revenue ($)',
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
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-primary text-btn-text text-xs font-bold shadow-md shadow-glow/20 hover:opacity-95 transition"
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
          const isPositive = stat.change >= 0;
          return (
            <div key={stat.label} className="glass-panel rounded-2xl p-5 hover:border-active-50 transition">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                  {stat.label}
                </span>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-text-primary">{stat.value}</div>
              <div
                className={`text-xs font-semibold mt-1.5 flex items-center gap-1 ${
                  isPositive ? 'text-success' : 'text-danger'
                }`}
              >
                {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                <span>{Math.abs(stat.change)}% vs prior period</span>
              </div>
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
                Gross transaction volume and monthly recurring revenue
              </p>
            </div>
            <span className="text-xs font-black text-success bg-success-10 border border-success-30 px-2.5 py-1 rounded-lg">
              ARPU: $10.40
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={REVENUE_ANALYTICS} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary, #4F46E5)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--color-primary, #4F46E5)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--color-text-muted)" fontSize={12} tickLine={false} />
                <YAxis stroke="var(--color-text-muted)" fontSize={12} tickLine={false} tickFormatter={(v) => `$${v}`} />
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
                <Area type="monotone" dataKey="revenue" stroke="var(--color-primary, #4F46E5)" strokeWidth={3} fillOpacity={1} fill="url(#revenueGrad)" name="Gross Revenue ($)" />
                <Area type="monotone" dataKey="mrr" stroke="var(--color-success, #10B981)" strokeWidth={2} fillOpacity={0} name="MRR ($)" />
              </AreaChart>
            </ResponsiveContainer>
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
                >
                  {PLATFORM_SHARE.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
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
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={USER_GROWTH} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--color-text-muted)" fontSize={12} tickLine={false} />
                <YAxis stroke="var(--color-text-muted)" fontSize={12} tickLine={false} />
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
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="starter" stackId="a" fill="#4F46E5" name="Starter" />
                <Bar dataKey="pro" stackId="a" fill="#10B981" name="Pro" />
                <Bar dataKey="agency" stackId="a" fill="#F59E0B" name="Agency" />
              </BarChart>
            </ResponsiveContainer>
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
                Gemini 1.5 Tokens (k) & SDXL Image Renderings
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={TOKEN_UTILIZATION} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--color-text-muted)" fontSize={12} tickLine={false} />
                <YAxis stroke="var(--color-text-muted)" fontSize={12} tickLine={false} />
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
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="geminiTokens" stroke="#38BDF8" strokeWidth={2.5} name="Gemini Tokens (k)" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="sdxlImages" stroke="#F43F5E" strokeWidth={2.5} name="SDXL Images Generated" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
