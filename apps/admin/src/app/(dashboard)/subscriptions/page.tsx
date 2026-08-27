'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  ColumnDef,
  flexRender,
  SortingState,
} from '@tanstack/react-table';
import {
  CreditCard,
  Coins,
  Search,
  Download,
  CheckCircle2,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { supabase, isPlaceholderUrl } from '@/lib/supabase';
import { toast } from 'sonner';
import { exportToCsv } from '@/lib/csv';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

interface SubscriberRow {
  id: string;
  email: string;
  full_name: string | null;
  tier: 'free' | 'starter' | 'pro' | 'agency';
  mrr: number;
  credits_remaining: number;
  credits_limit: number;
  status: 'active' | 'past_due' | 'canceled';
  current_period_end: string;
}

const MOCK_SUBSCRIBERS: SubscriberRow[] = [
  {
    id: 'sub_1',
    email: 'sarah.agency@growthlab.io',
    full_name: 'Sarah Jenkins',
    tier: 'agency',
    mrr: 199,
    credits_remaining: 8500,
    credits_limit: 10000,
    status: 'active',
    current_period_end: new Date(Date.now() + 24 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'sub_2',
    email: 'alex.creator@example.com',
    full_name: 'Alex Rivera',
    tier: 'pro',
    mrr: 49,
    credits_remaining: 1850,
    credits_limit: 2500,
    status: 'active',
    current_period_end: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'sub_3',
    email: 'david.photo@lenscraft.co',
    full_name: 'David Kim',
    tier: 'starter',
    mrr: 19,
    credits_remaining: 320,
    credits_limit: 500,
    status: 'active',
    current_period_end: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'sub_4',
    email: 'marcus.media@trendflow.agency',
    full_name: 'Marcus Vance',
    tier: 'agency',
    mrr: 199,
    credits_remaining: 9200,
    credits_limit: 10000,
    status: 'active',
    current_period_end: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'sub_5',
    email: 'elena.marketing@vibe.io',
    full_name: 'Elena Rostova',
    tier: 'pro',
    mrr: 49,
    credits_remaining: 2100,
    credits_limit: 2500,
    status: 'active',
    current_period_end: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const TIER_CARDS = [
  { name: 'Free', price: '$0', limit: '50 Credits/mo', activeCount: 182, color: 'text-text-muted', badge: 'bg-surface-subtle border-border' },
  { name: 'Starter', price: '$19', limit: '500 Credits/mo', activeCount: 64, color: 'text-primary', badge: 'bg-primary-10 border-border-active-30' },
  { name: 'Pro', price: '$49', limit: '2,500 Credits/mo', activeCount: 78, color: 'text-success', badge: 'bg-success-10 border-success-30' },
  { name: 'Agency', price: '$199', limit: '10,000 Credits/mo', activeCount: 18, color: 'text-warning', badge: 'bg-warning-10 border-warning-30' },
];

export default function SubscriptionsPage() {
  const [subscribers, setSubscribers] = useState<SubscriberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [sorting, setSorting] = useState<SortingState>([]);

  // Manual Add Credits Modal
  const [selectedSub, setSelectedSub] = useState<SubscriberRow | null>(null);
  const [creditModalOpen, setCreditModalOpen] = useState(false);
  const [creditAmount, setCreditAmount] = useState<number>(1000);
  const [isUpdating, setIsUpdating] = useState(false);

  const loadSubscribers = async () => {
    try {
      setLoading(true);
      if (isPlaceholderUrl) {
        setSubscribers(MOCK_SUBSCRIBERS);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, subscription_tier, credits_remaining, credits_limit, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formatted: SubscriberRow[] = (data || []).map((p) => {
        const tier = (p.subscription_tier || 'free') as 'free' | 'starter' | 'pro' | 'agency';
        const mrrMap = { free: 0, starter: 19, pro: 49, agency: 199 };
        return {
          id: p.id,
          email: p.email,
          full_name: p.full_name,
          tier,
          mrr: mrrMap[tier] || 0,
          credits_remaining: p.credits_remaining ?? 50,
          credits_limit: p.credits_limit ?? 50,
          status: 'active',
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        };
      });

      setSubscribers(formatted);
    } catch {
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscribers();
  }, []);

  const filteredData = useMemo(() => {
    return subscribers.filter((s) => {
      if (tierFilter !== 'all' && s.tier !== tierFilter) return false;
      return true;
    });
  }, [subscribers, tierFilter]);

  const handleGrantCredits = async () => {
    if (!selectedSub) return;
    try {
      setIsUpdating(true);
      const newCredits = selectedSub.credits_remaining + Number(creditAmount);

      if (isPlaceholderUrl) {
        setSubscribers(
          subscribers.map((s) =>
            s.id === selectedSub.id ? { ...s, credits_remaining: newCredits } : s
          )
        );
        toast.success(`Granted ${creditAmount} credits to ${selectedSub.email}`);
        setCreditModalOpen(false);
        setIsUpdating(false);
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ credits_remaining: newCredits })
        .eq('id', selectedSub.id);

      if (error) throw error;

      setSubscribers(
        subscribers.map((s) =>
          s.id === selectedSub.id ? { ...s, credits_remaining: newCredits } : s
        )
      );
      toast.success(`Granted ${creditAmount} credits to ${selectedSub.email}`);
      setCreditModalOpen(false);
    } catch {
      toast.error('Failed to grant credits');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExportCsv = () => {
    exportToCsv('subscribers_report', filteredData, {
      id: 'Customer ID',
      email: 'Email',
      full_name: 'Name',
      tier: 'Plan Tier',
      mrr: 'MRR Contribution ($)',
      credits_remaining: 'Remaining Credits',
      credits_limit: 'Total Credit Limit',
      status: 'Status',
    });
    toast.success('Subscribers exported to CSV');
  };

  const columns = useMemo<ColumnDef<SubscriberRow>[]>(
    () => [
      {
        accessorKey: 'email',
        header: 'Customer',
        cell: ({ row }) => {
          const s = row.original;
          return (
            <div>
              <div className="text-xs font-bold text-text-primary">
                {s.full_name || 'Anonymous User'}
              </div>
              <div className="text-[11px] text-text-muted">{s.email}</div>
            </div>
          );
        },
      },
      {
        accessorKey: 'tier',
        header: 'Subscription Tier',
        cell: ({ getValue }) => {
          const tier = getValue() as string;
          const colors: Record<string, string> = {
            free: 'bg-surface-subtle text-text-muted border-border',
            starter: 'bg-primary-10 text-primary border-border-active-30',
            pro: 'bg-success-10 text-success border-success-30',
            agency: 'bg-warning-10 text-warning border-warning-30',
          };
          return (
            <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${colors[tier] || colors.free}`}>
              {tier}
            </span>
          );
        },
      },
      {
        accessorKey: 'mrr',
        header: 'MRR Value',
        cell: ({ getValue }) => {
          const mrr = getValue() as number;
          return <span className="text-xs font-black text-text-primary">${mrr}/mo</span>;
        },
      },
      {
        accessorKey: 'credits_remaining',
        header: 'Credits Remaining',
        cell: ({ row }) => {
          const s = row.original;
          return (
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-warning">{s.credits_remaining}</span>
              <span className="text-[10px] text-text-muted">/ {s.credits_limit}</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Billing Status',
        cell: () => (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-success bg-success-10 border border-success-30 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            <span>Active</span>
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const s = row.original;
          return (
            <div className="text-right">
              <button
                onClick={() => {
                  setSelectedSub(s);
                  setCreditAmount(1000);
                  setCreditModalOpen(true);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-subtle hover:bg-surface border border-border hover:border-active-50 text-xs font-bold text-text-primary transition"
              >
                <Coins className="w-3.5 h-3.5 text-warning" />
                <span>Add Credits</span>
              </button>
            </div>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      globalFilter,
      sorting,
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-text-primary flex items-center gap-3">
            <CreditCard className="w-7 h-7 text-primary" />
            <span>Subscriptions & Revenue Command</span>
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Manage customer tier allocations, credit limits, and RevenueCat automated billing
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadSubscribers}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-subtle border border-border text-xs font-bold text-text-secondary hover:text-text-primary transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-primary text-btn-text text-xs font-bold shadow-md shadow-glow/20 hover:opacity-95 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Plan Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {TIER_CARDS.map((tier) => (
          <div key={tier.name} className="glass-panel rounded-2xl p-5 hover:border-active-50 transition flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${tier.badge}`}>
                  {tier.name}
                </span>
                <span className="text-xs font-bold text-text-secondary">
                  {tier.activeCount} active
                </span>
              </div>
              <div className="text-2xl font-black text-text-primary mt-1">{tier.price}<span className="text-xs text-text-muted">/mo</span></div>
              <p className="text-xs text-text-muted mt-1">{tier.limit}</p>
            </div>
            <div className="pt-3 mt-3 border-t border-border flex items-center justify-between text-[11px] text-text-secondary">
              <span>Auto Token Refresh</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
            </div>
          </div>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search customer email..."
            className="w-full bg-input-bg border border-border rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-active transition"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="bg-input-bg border border-border rounded-xl px-3 py-2 text-xs font-semibold text-text-primary focus:outline-none focus:border-active transition"
          >
            <option value="all">All Tiers</option>
            <option value="free">Free Tier</option>
            <option value="starter">Starter Plan</option>
            <option value="pro">Pro Plan</option>
            <option value="agency">Agency Plan</option>
          </select>
        </div>
      </div>

      {/* TanStack Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-border">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={5} cols={6} />
          </div>
        ) : filteredData.length === 0 ? (
          <EmptyState
            title="No Subscribers Found"
            description="There are no subscribers matching your current filter criteria."
            icon={CreditCard}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-surface-subtle/70">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-6 py-3.5 text-left text-xs font-black uppercase tracking-wider text-text-secondary select-none"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-border/60">
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-surface-subtle/40 transition">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && filteredData.length > 0 && (
          <div className="p-4 border-t border-border flex items-center justify-between text-xs text-text-secondary">
            <span>
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()} (
              {filteredData.length} subscribers)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="p-1.5 rounded-lg border border-border bg-surface-subtle hover:bg-surface disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="p-1.5 rounded-lg border border-border bg-surface-subtle hover:bg-surface disabled:opacity-40 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Manual Add Credits */}
      {creditModalOpen && selectedSub && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel rounded-3xl p-6 max-w-md w-full shadow-2xl border border-border space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-warning" />
                <h2 className="text-base font-bold text-text-primary">Grant AI Credits</h2>
              </div>
              <button
                onClick={() => setCreditModalOpen(false)}
                className="p-1 rounded-lg text-text-muted hover:text-text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-text-secondary">
              Granting immediate AI generation tokens to <strong className="text-text-primary">{selectedSub.email}</strong>.
            </p>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                Amount to Add
              </label>
              <input
                type="number"
                value={creditAmount}
                onChange={(e) => setCreditAmount(parseInt(e.target.value) || 0)}
                className="w-full bg-input-bg border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-active transition"
              />
            </div>

            <div className="flex gap-2">
              {[500, 1000, 2500, 5000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setCreditAmount(preset)}
                  className="flex-1 py-1.5 rounded-lg bg-surface-subtle border border-border hover:border-active-50 text-xs font-bold text-text-primary transition"
                >
                  +{preset}
                </button>
              ))}
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCreditModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-surface-subtle border border-border text-xs font-bold text-text-secondary hover:text-text-primary"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={handleGrantCredits}
                className="px-5 py-2 rounded-xl bg-gradient-primary text-btn-text text-xs font-bold hover:opacity-95 transition disabled:opacity-50"
              >
                {isUpdating ? 'Adding...' : 'Grant Credits Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
