'use client';

import React from 'react';
import { Menu, ShieldCheck } from 'lucide-react';
import { ThemeModeToggle } from '@/components/ThemePicker';

interface AdminHeaderProps {
  onMenuClick: () => void;
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  return (
    <header className="h-16 border-b border-border bg-surface/80 sticky top-0 z-20 flex items-center justify-between px-4 sm:px-8 backdrop-blur-xl transition-colors">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-xl border border-border bg-surface-subtle text-text-primary hover:bg-surface transition"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-success-10/40 border border-success-30 text-success">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
          </span>
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">
            Realtime Live
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <ThemeModeToggle />
        <div className="hidden sm:flex items-center gap-2 bg-surface-subtle border border-border px-3 py-1.5 rounded-xl text-xs font-semibold text-text-secondary">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span>Super Admin</span>
        </div>
      </div>
    </header>
  );
}
