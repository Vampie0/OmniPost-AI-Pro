import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Failed to load data',
  message = 'An unexpected error occurred while communicating with the Supabase database.',
  onRetry,
  className = '',
}: ErrorStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-12 text-center glass-panel rounded-2xl border border-danger-30 bg-danger-5 ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-danger-10 border border-danger-30 flex items-center justify-center text-danger mb-4 shadow-sm">
        <AlertTriangle className="w-7 h-7" />
      </div>
      <h3 className="text-base font-bold text-text-primary mb-1">{title}</h3>
      <p className="text-xs sm:text-sm text-text-secondary max-w-sm mb-6 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          <RefreshCw className="w-3.5 h-3.5" />
          Retry Connection
        </Button>
      )}
    </div>
  );
}
