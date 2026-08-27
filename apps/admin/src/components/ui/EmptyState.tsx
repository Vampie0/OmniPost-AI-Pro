import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  title = 'No records found',
  description = 'There are no items matching your current filters or criteria.',
  icon: Icon = Inbox,
  actionLabel,
  onAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-12 text-center glass-panel rounded-2xl border border-dashed border-border ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-surface-subtle border border-border flex items-center justify-center text-text-muted mb-4 shadow-sm">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base font-bold text-text-primary mb-1">{title}</h3>
      <p className="text-xs sm:text-sm text-text-secondary max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-primary text-btn-text rounded-xl font-bold text-xs shadow-md shadow-glow/20 hover:opacity-95 transition"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
