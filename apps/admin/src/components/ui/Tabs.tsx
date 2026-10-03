'use client';

import React, { useId } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TabItem<T extends string> {
  value: T;
  label: string;
  icon?: LucideIcon;
  count?: number | string;
}

interface TabsProps<T extends string> {
  tabs: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/**
 * Tab bar with an indicator that slides between items instead of teleporting,
 * so switching sections reads as moving along one surface rather than reloading it.
 */
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: TabsProps<T>) {
  const inkId = useId();

  return (
    <div
      role="tablist"
      className={cn('flex items-center gap-1 border-b border-border overflow-x-auto', className)}
    >
      {tabs.map((tab) => {
        const isActive = tab.value === value;
        const Icon = tab.icon;

        return (
          <button
            key={tab.value}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onChange(tab.value)}
            className={cn(
              'relative inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold whitespace-nowrap rounded-t-xl',
              'transition-all duration-200 ease-quint-out shrink-0',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-30',
              isActive
                ? 'text-text-primary bg-surface-subtle-40'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle-30'
            )}
          >
            {Icon && (
              <Icon
                className={cn(
                  'w-3.5 h-3.5 transition-colors duration-200',
                  isActive ? 'text-primary' : 'text-text-muted'
                )}
              />
            )}
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  'px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums',
                  isActive
                    ? 'bg-badge-bg text-badge-text border border-badge-border'
                    : 'bg-surface-subtle-60 text-text-muted'
                )}
              >
                {tab.count}
              </span>
            )}
            {isActive && (
              <motion.span
                layoutId={inkId}
                className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-gradient-primary"
                transition={{ type: 'spring', damping: 28, stiffness: 380 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
