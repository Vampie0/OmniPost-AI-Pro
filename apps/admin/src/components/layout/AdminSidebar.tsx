'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Activity,
  Users,
  FileText,
  Sparkles,
  CreditCard,
  BarChart3,
  Palette,
  Bot,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export const NAV_ITEMS = [
  { label: 'Overview', href: '/', icon: Activity },
  { label: 'Users Directory', href: '/users', icon: Users },
  { label: 'Content Moderation', href: '/posts', icon: FileText },
  { label: 'Templates CRUD', href: '/templates', icon: Sparkles },
  { label: 'Subscriptions', href: '/subscriptions', icon: CreditCard },
  { label: 'Analytics & Revenue', href: '/analytics', icon: BarChart3 },
  { label: 'White-Label Engine', href: '/white-label', icon: Palette },
  { label: 'AI Configuration', href: '/ai-settings', icon: Bot },
  { label: 'Push Notifications', href: '/notifications', icon: Bell },
  { label: 'System & Audit Logs', href: '/settings', icon: Settings },
];

interface AdminSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export function AdminSidebar({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Signed out successfully');
      router.replace('/login');
    } catch {
      router.replace('/login');
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-surface border-r border-border backdrop-blur-xl relative">
      {/* Brand Header */}
      <div className={`h-16 border-b border-border flex items-center px-4 justify-between transition-all ${
        isCollapsed ? 'justify-center' : ''
      }`}>
        <Link href="/" className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shrink-0 shadow-md shadow-glow/20">
            <Sparkles className="w-5 h-5 text-btn-text" />
          </div>
          {!isCollapsed && (
            <div className="truncate">
              <h2 className="text-sm font-extrabold text-text-primary tracking-tight truncate">
                SocialPilot<span className="text-primary font-bold">.AI</span>
              </h2>
              <span className="text-[9.5px] font-bold uppercase tracking-wider text-badge-text bg-badge-bg px-1.5 py-0.5 rounded border border-badge-border">
                ADMIN SUITE
              </span>
            </div>
          )}
        </Link>

        {/* Mobile close button */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-subtle"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-4 space-y-1 scrollbar-none">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/' || pathname === '/dashboard'
              : pathname?.startsWith(item.href) ?? false;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              title={isCollapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition group relative ${
                isActive
                  ? 'bg-surface-subtle text-text-primary border border-active shadow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle/70'
              } ${isCollapsed ? 'justify-center px-2' : ''}`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition ${
                  isActive ? 'text-primary' : 'text-text-muted group-hover:text-text-primary'
                }`}
              />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
              {isActive && !isCollapsed && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary ml-auto shadow-[0_0_8px_var(--color-primary)]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Desktop Toggle Button */}
      <div className="hidden md:flex px-3 py-2 border-t border-border items-center justify-between">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center gap-2 p-2 rounded-xl text-xs font-semibold text-text-muted hover:text-text-primary hover:bg-surface-subtle transition"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse Sidebar</span>
            </>
          )}
        </button>
      </div>

      {/* Footer Profile & Logout */}
      <div className="p-3 border-t border-border space-y-2">
        {!isCollapsed && (
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-surface-subtle/50 border border-border/60">
            <div className="w-7 h-7 rounded-lg bg-primary-10 text-primary flex items-center justify-center shrink-0 font-black text-xs">
              SA
            </div>
            <div className="truncate text-left flex-1">
              <div className="text-xs font-bold text-text-primary truncate">Super Admin</div>
              <div className="text-[10px] text-text-muted truncate">admin@socialpilot.ai</div>
            </div>
            <ShieldCheck className="w-4 h-4 text-success shrink-0" />
          </div>
        )}

        <button
          onClick={handleSignOut}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-danger hover:bg-danger-10 hover:border-danger-30 border border-transparent transition ${
            isCollapsed ? 'justify-center px-2' : ''
          }`}
          title={isCollapsed ? 'Sign Out' : undefined}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside
        className={`hidden md:block fixed left-0 top-0 h-screen z-30 transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop & Drawer */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        >
          <div
            className="w-72 h-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
