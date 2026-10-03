'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { CornerDownLeft, Search } from 'lucide-react';
import { NAV_ITEMS } from '@/components/layout/AdminSidebar';
import { useDialogA11y } from '@/hooks/useDialogA11y';

interface Command {
  id: string;
  label: string;
  hint: string;
  href: string;
  icon: React.ReactNode;
}

const COMMANDS: Command[] = NAV_ITEMS.map((item) => ({
  id: item.href,
  label: item.label,
  hint: item.href === '/' ? 'Overview' : item.href,
  href: item.href,
  icon: <item.icon className="w-4 h-4" />,
}));

function matches(command: Command, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    command.label.toLowerCase().includes(q) ||
    command.hint.toLowerCase().includes(q) ||
    command.href.toLowerCase().includes(q)
  );
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Keyboard-first navigation. Opens on Cmd/Ctrl+K or from the header search,
 * filters as you type, and moves with the arrow keys — the fastest way around a
 * ten-page admin once you know it is there, without replacing the sidebar for
 * anyone who prefers clicking.
 */
export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);

  const results = useMemo(
    () => COMMANDS.filter((command) => matches(command, query)),
    [query]
  );

  const close = () => onOpenChange(false);
  const panelRef = useDialogA11y<HTMLDivElement>(open, close);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setCursor(0);
    }
  }, [open]);

  useEffect(() => {
    setCursor((prev) => Math.min(prev, Math.max(results.length - 1, 0)));
  }, [results.length]);

  const go = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setCursor((prev) => (results.length ? (prev + 1) % results.length : 0));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setCursor((prev) => (results.length ? (prev - 1 + results.length) % results.length : 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const selected = results[cursor];
      if (selected) go(selected.href);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[110] flex items-start justify-center pt-[14vh] px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={close}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.97, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -6 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-lg glass-panel rounded-2xl border-border shadow-card-hover overflow-hidden outline-none"
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <Search className="w-4 h-4 text-text-muted shrink-0" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Jump to a section..."
                aria-label="Search sections"
                className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
              />
              <kbd className="text-[10px] font-bold text-text-muted bg-surface-subtle-60 border border-border rounded px-1.5 py-0.5">
                ESC
              </kbd>
            </div>

            <ul className="max-h-[50vh] overflow-y-auto p-1.5" role="listbox">
              {results.length === 0 && (
                <li className="px-3 py-6 text-center text-xs text-text-muted">
                  No sections match “{query}”.
                </li>
              )}
              {results.map((command, index) => {
                const isActive = index === cursor;
                return (
                  <li key={command.id} role="option" aria-selected={isActive}>
                    <button
                      type="button"
                      onMouseEnter={() => setCursor(index)}
                      onClick={() => go(command.href)}
                      className={cnRow(isActive)}
                    >
                      <span className={isActive ? 'text-primary' : 'text-text-muted'}>
                        {command.icon}
                      </span>
                      <span className="flex-1 text-left truncate">{command.label}</span>
                      <span className="text-[10px] text-text-muted font-mono truncate">
                        {command.hint}
                      </span>
                      {isActive && <CornerDownLeft className="w-3.5 h-3.5 text-text-muted" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function cnRow(active: boolean) {
  return [
    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors duration-150',
    active ? 'bg-surface-subtle-70 text-text-primary' : 'text-text-secondary',
  ].join(' ');
}
