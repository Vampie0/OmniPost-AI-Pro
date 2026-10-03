'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDialogA11y } from '@/hooks/useDialogA11y';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  avatar?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: 'md' | 'lg';
}

const WIDTHS = { md: 'max-w-md', lg: 'max-w-xl' };

/**
 * Right-hand detail panel.
 *
 * Table rows previously opened a centred modal sized for a form, which cramped
 * anything meant to be *read*. This gives records a surface with room for
 * sections, stats and actions, and keeps the underlying table visible so the
 * user never loses their place in the list.
 */
export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  eyebrow,
  avatar,
  children,
  footer,
  width = 'lg',
}: DrawerProps) {
  const panelRef = useDialogA11y<HTMLDivElement>(open, onClose);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
          />
          <motion.aside
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={cn(
              'absolute right-0 top-0 h-full w-full bg-surface border-l border-border shadow-card-hover flex flex-col outline-none',
              WIDTHS[width]
            )}
          >
            <header className="flex items-start gap-3 p-5 border-b border-border shrink-0">
              {avatar}
              <div className="min-w-0 flex-1">
                {eyebrow && (
                  <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1">
                    {eyebrow}
                  </p>
                )}
                <h2 className="text-lg font-extrabold text-text-primary truncate">{title}</h2>
                {subtitle && (
                  <p className="text-xs text-text-secondary mt-0.5 truncate">{subtitle}</p>
                )}
              </div>
              <button
                onClick={onClose}
                aria-label="Close panel"
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-subtle-70 transition-all duration-200 ease-quint-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-30 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">{children}</div>

            {footer && (
              <footer className="flex items-center gap-2 px-5 py-4 border-t border-border bg-surface-subtle-30 shrink-0">
                {footer}
              </footer>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

/** A titled group of content inside a Drawer. */
export function DrawerSection({
  label,
  action,
  children,
}: {
  label: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2.5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
          {label}
        </h3>
        {action}
      </div>
      <div className="glass-panel rounded-2xl border border-border divide-y divide-border-40">
        {children}
      </div>
    </section>
  );
}

/** A single label/value row — the readable counterpart to a form field. */
export function DetailField({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <span className="text-xs text-text-secondary shrink-0">{label}</span>
      <span
        className={cn(
          'text-xs font-bold text-text-primary text-right min-w-0 break-words',
          mono && 'font-mono text-[11px]'
        )}
      >
        {value}
      </span>
    </div>
  );
}
