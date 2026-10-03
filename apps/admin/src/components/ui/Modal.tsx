'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDialogA11y } from '@/hooks/useDialogA11y';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
};

/**
 * Centred dialog. Replaces the copy-pasted `fixed inset-0 bg-black/60` blocks that
 * were duplicated across the CRUD pages with no enter/exit motion, Escape handling
 * or focus containment.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  icon,
  children,
  footer,
  size = 'md',
}: ModalProps) {
  const panelRef = useDialogA11y<HTMLDivElement>(open, onClose);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.95, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'relative w-full glass-panel rounded-3xl border-border shadow-card-hover outline-none',
              SIZES[size]
            )}
          >
            <header className="flex items-start justify-between gap-4 p-5 pb-4 border-b border-border">
              <div className="flex items-center gap-3 min-w-0">
                {icon && (
                  <span className="w-9 h-9 rounded-xl bg-primary-10 border border-primary-30 flex items-center justify-center text-primary shrink-0">
                    {icon}
                  </span>
                )}
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-text-primary truncate">{title}</h2>
                  {description && (
                    <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                      {description}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close dialog"
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-subtle-70 transition-all duration-200 ease-quint-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-30 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </header>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">{children}</div>

            {footer && (
              <footer className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border bg-surface-subtle-30 rounded-b-3xl">
                {footer}
              </footer>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
