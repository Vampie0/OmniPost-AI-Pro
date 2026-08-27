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
  Users,
  Shield,
  UserX,
  UserCheck,
  Trash2,
  Mail,
  Search,
  Download,
  Coins,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
} from 'lucide-react';
import { supabase, isPlaceholderUrl } from '@/lib/supabase';
import { toast } from 'sonner';
import { UserProfile, UserRole, SubscriptionTier } from '@socialpilot/types';
import { exportToCsv } from '@/lib/csv';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

const MOCK_USERS: UserProfile[] = [
  {
    id: 'usr_1',
    email: 'alex.creator@example.com',
    full_name: 'Alex Rivera',
    avatar_url: null,
    role: 'user',
    subscription_tier: 'pro',
    credits_remaining: 1850,
    credits_limit: 2500,
    is_suspended: false,
    onboarding_completed: true,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'usr_2',
    email: 'sarah.agency@growthlab.io',
    full_name: 'Sarah Jenkins',
    avatar_url: null,
    role: 'user',
    subscription_tier: 'agency',
    credits_remaining: 8500,
    credits_limit: 10000,
    is_suspended: false,
    onboarding_completed: true,
    created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'usr_3',
    email: 'superadmin@socialpilot.ai',
    full_name: 'Master Administrator',
    avatar_url: null,
    role: 'super_admin',
    subscription_tier: 'agency',
    credits_remaining: 99999,
    credits_limit: 99999,
    is_suspended: false,
    onboarding_completed: true,
    created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'usr_4',
    email: 'spammer@tempmail.xyz',
    full_name: 'Spam Bot 99',
    avatar_url: null,
    role: 'user',
    subscription_tier: 'free',
    credits_remaining: 0,
    credits_limit: 50,
    is_suspended: true,
    onboarding_completed: false,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'usr_5',
    email: 'david.photo@lenscraft.co',
    full_name: 'David Kim',
    avatar_url: null,
    role: 'user',
    subscription_tier: 'starter',
    credits_remaining: 320,
    credits_limit: 500,
    is_suspended: false,
    onboarding_completed: true,
    created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export default function UsersDirectoryPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [sorting, setSorting] = useState<SortingState>([]);

  // Dialog states
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [creditModalOpen, setCreditModalOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [creditsDelta, setCreditsDelta] = useState<number>(500);
  const [selectedRole, setSelectedRole] = useState<UserRole>('user');
  const [isUpdating, setIsUpdating] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      if (isPlaceholderUrl) {
        setUsers(MOCK_USERS);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers((data as UserProfile[]) || []);
    } catch {
      toast.error('Failed to load users from database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Filtered dataset
  const filteredData = useMemo(() => {
    return users.filter((u) => {
      if (tierFilter !== 'all' && u.subscription_tier !== tierFilter) return false;
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      return true;
    });
  }, [users, tierFilter, roleFilter]);

  // Actions
  const toggleSuspend = async (user: UserProfile) => {
    const nextStatus = !user.is_suspended;
    try {
      if (isPlaceholderUrl) {
        setUsers(users.map((u) => (u.id === user.id ? { ...u, is_suspended: nextStatus } : u)));
        toast.success(`User ${nextStatus ? 'suspended' : 'unsuspended'} successfully`);
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ is_suspended: nextStatus })
        .eq('id', user.id);

      if (error) throw error;
      setUsers(users.map((u) => (u.id === user.id ? { ...u, is_suspended: nextStatus } : u)));
      toast.success(`User ${nextStatus ? 'suspended' : 'reactivated'}`);
    } catch {
      toast.error('Failed to update suspension status');
    }
  };

  const handleUpdateCredits = async () => {
    if (!selectedUser) return;
    try {
      setIsUpdating(true);
      const newCredits = Math.max(0, selectedUser.credits_remaining + Number(creditsDelta));

      if (isPlaceholderUrl) {
        setUsers(
          users.map((u) => (u.id === selectedUser.id ? { ...u, credits_remaining: newCredits } : u))
        );
        toast.success(`Updated credits: ${newCredits} remaining`);
        setCreditModalOpen(false);
        setIsUpdating(false);
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ credits_remaining: newCredits })
        .eq('id', selectedUser.id);

      if (error) throw error;
      setUsers(
        users.map((u) => (u.id === selectedUser.id ? { ...u, credits_remaining: newCredits } : u))
      );
      toast.success(`Credits updated to ${newCredits}`);
      setCreditModalOpen(false);
    } catch {
      toast.error('Failed to modify user credits');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedUser) return;
    try {
      setIsUpdating(true);

      if (isPlaceholderUrl) {
        setUsers(
          users.map((u) => (u.id === selectedUser.id ? { ...u, role: selectedRole } : u))
        );
        toast.success(`Role changed to ${selectedRole}`);
        setRoleModalOpen(false);
        setIsUpdating(false);
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ role: selectedRole })
        .eq('id', selectedUser.id);

      if (error) throw error;
      setUsers(
        users.map((u) => (u.id === selectedUser.id ? { ...u, role: selectedRole } : u))
      );
      toast.success(`Role updated to ${selectedRole}`);
      setRoleModalOpen(false);
    } catch {
      toast.error('Failed to update role');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteUser = async (user: UserProfile) => {
    if (!confirm(`Permanently delete account for ${user.email}? This action cannot be undone.`)) {
      return;
    }

    try {
      if (isPlaceholderUrl) {
        setUsers(users.filter((u) => u.id !== user.id));
        toast.success('User permanently deleted');
        return;
      }

      const { error } = await supabase.from('profiles').delete().eq('id', user.id);
      if (error) throw error;
      setUsers(users.filter((u) => u.id !== user.id));
      toast.success('User account removed');
    } catch {
      toast.error('Failed to delete user');
    }
  };

  const handleExportCsv = () => {
    exportToCsv('users_directory', filteredData, {
      id: 'User ID',
      email: 'Email',
      full_name: 'Full Name',
      role: 'Role',
      subscription_tier: 'Tier',
      credits_remaining: 'Credits Remaining',
      credits_limit: 'Credits Limit',
      is_suspended: 'Suspended',
      created_at: 'Signup Date',
    });
    toast.success('Users exported to CSV');
  };

  // TanStack Table columns
  const columns = useMemo<ColumnDef<UserProfile>[]>(
    () => [
      {
        accessorKey: 'full_name',
        header: 'User Profile',
        cell: ({ row }) => {
          const u = row.original;
          const letter = (u.full_name?.[0] || u.email?.[0] || 'U').toUpperCase();
          return (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-10 text-primary border border-border-active-30 flex items-center justify-center font-bold text-xs shrink-0">
                {letter}
              </div>
              <div className="truncate">
                <div className="text-sm font-bold text-text-primary truncate">
                  {u.full_name || 'Anonymous User'}
                </div>
                <div className="text-xs text-text-muted flex items-center gap-1 truncate">
                  <Mail className="w-3 h-3 shrink-0" />
                  <span className="truncate">{u.email}</span>
                </div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: ({ getValue, row }) => {
          const role = getValue() as UserRole;
          const u = row.original;
          return (
            <button
              onClick={() => {
                setSelectedUser(u);
                setSelectedRole(role);
                setRoleModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-subtle hover:bg-surface border border-border text-xs font-semibold text-text-secondary transition"
            >
              <Shield className={`w-3.5 h-3.5 ${role === 'super_admin' ? 'text-warning' : role === 'admin' ? 'text-primary' : 'text-text-muted'}`} />
              <span className="capitalize">{role.replace('_', ' ')}</span>
            </button>
          );
        },
      },
      {
        accessorKey: 'subscription_tier',
        header: 'Tier',
        cell: ({ getValue }) => {
          const tier = getValue() as SubscriptionTier;
          const tierColors: Record<SubscriptionTier, string> = {
            free: 'bg-surface-subtle text-text-muted border-border',
            starter: 'bg-primary-10 text-primary border-border-active-30',
            pro: 'bg-success-10 text-success border-success-30',
            agency: 'bg-warning-10 text-warning border-warning-30',
          };
          return (
            <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${tierColors[tier] || tierColors.free}`}>
              {tier}
            </span>
          );
        },
      },
      {
        accessorKey: 'credits_remaining',
        header: 'AI Credits',
        cell: ({ row }) => {
          const u = row.original;
          return (
            <button
              onClick={() => {
                setSelectedUser(u);
                setCreditsDelta(500);
                setCreditModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-surface-subtle border border-transparent hover:border-border transition text-left"
            >
              <Coins className="w-3.5 h-3.5 text-warning" />
              <div>
                <span className="text-xs font-black text-text-primary">{u.credits_remaining}</span>
                <span className="text-[10px] text-text-muted"> / {u.credits_limit}</span>
              </div>
            </button>
          );
        },
      },
      {
        accessorKey: 'is_suspended',
        header: 'Status',
        cell: ({ getValue }) => {
          const isSuspended = getValue() as boolean;
          return (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                isSuspended
                  ? 'bg-danger-10 text-danger border border-danger-30'
                  : 'bg-success-10 text-success border border-success-30'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isSuspended ? 'bg-danger' : 'bg-success'}`} />
              {isSuspended ? 'Suspended' : 'Active'}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const u = row.original;
          return (
            <div className="flex items-center justify-end gap-1.5">
              <button
                onClick={() => toggleSuspend(u)}
                title={u.is_suspended ? 'Reactivate account' : 'Suspend user'}
                className={`p-1.5 rounded-lg border text-xs font-bold transition ${
                  u.is_suspended
                    ? 'text-success bg-success-10 border-success-30 hover:bg-success-20'
                    : 'text-warning bg-warning-10 border-warning-30 hover:bg-warning-20'
                }`}
              >
                {u.is_suspended ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => handleDeleteUser(u)}
                title="Delete user"
                className="p-1.5 rounded-lg border border-danger-30 text-danger bg-danger-10 hover:bg-danger-20 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
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
            <Users className="w-7 h-7 text-primary" />
            <span>Users & Access Control</span>
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Directory of registered creators, subscription tiers, and permission controls
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadUsers}
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

      {/* Filter Toolbar */}
      <div className="glass-panel rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search email, name..."
            className="w-full bg-input-bg border border-border rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-active transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="bg-input-bg border border-border rounded-xl px-3 py-2 text-xs font-semibold text-text-primary focus:outline-none focus:border-active transition"
          >
            <option value="all">All Tiers</option>
            <option value="free">Free</option>
            <option value="starter">Starter</option>
            <option value="pro">Pro</option>
            <option value="agency">Agency</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-input-bg border border-border rounded-xl px-3 py-2 text-xs font-semibold text-text-primary focus:outline-none focus:border-active transition"
          >
            <option value="all">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
        </div>
      </div>

      {/* TanStack Table Container */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-border">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={5} cols={6} />
          </div>
        ) : filteredData.length === 0 ? (
          <EmptyState
            title="No Users Found"
            description="There are no user profiles matching your search query or filters."
            icon={Users}
            actionLabel="Reset Filters"
            onAction={() => {
              setGlobalFilter('');
              setTierFilter('all');
              setRoleFilter('all');
            }}
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
              Showing Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()} (
              {filteredData.length} total users)
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

      {/* Modal: Add/Edit Credits */}
      {creditModalOpen && selectedUser && (
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
              Modifying credits for <strong className="text-text-primary">{selectedUser.email}</strong>.
              Current remaining: <strong>{selectedUser.credits_remaining}</strong>.
            </p>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                Credits Adjustment (+ or -)
              </label>
              <input
                type="number"
                value={creditsDelta}
                onChange={(e) => setCreditsDelta(parseInt(e.target.value) || 0)}
                className="w-full bg-input-bg border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-active transition"
              />
            </div>

            <div className="flex gap-2">
              {[100, 500, 1000, 5000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setCreditsDelta(preset)}
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
                onClick={handleUpdateCredits}
                className="px-5 py-2 rounded-xl bg-gradient-primary text-btn-text text-xs font-bold hover:opacity-95 transition disabled:opacity-50"
              >
                {isUpdating ? 'Updating...' : 'Confirm Credit Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Change Role */}
      {roleModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel rounded-3xl p-6 max-w-md w-full shadow-2xl border border-border space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-primary" />
                <h2 className="text-base font-bold text-text-primary">Assign Security Role</h2>
              </div>
              <button
                onClick={() => setRoleModalOpen(false)}
                className="p-1 rounded-lg text-text-muted hover:text-text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-text-secondary">
              Update role for <strong className="text-text-primary">{selectedUser.email}</strong>.
            </p>

            <div className="space-y-2">
              {(['user', 'admin', 'super_admin'] as UserRole[]).map((r) => (
                <label
                  key={r}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                    selectedRole === r
                      ? 'border-active bg-surface-subtle text-text-primary'
                      : 'border-border bg-input-bg text-text-secondary hover:border-active-50'
                  }`}
                >
                  <div className="capitalize text-xs font-bold">{r.replace('_', ' ')}</div>
                  <input
                    type="radio"
                    name="userRole"
                    checked={selectedRole === r}
                    onChange={() => setSelectedRole(r)}
                    className="w-4 h-4 text-primary"
                  />
                </label>
              ))}
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setRoleModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-surface-subtle border border-border text-xs font-bold text-text-secondary hover:text-text-primary"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={handleUpdateRole}
                className="px-5 py-2 rounded-xl bg-gradient-primary text-btn-text text-xs font-bold hover:opacity-95 transition disabled:opacity-50"
              >
                {isUpdating ? 'Saving...' : 'Apply Role'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
