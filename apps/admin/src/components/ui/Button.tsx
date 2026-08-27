'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Reusable Button with built-in double-click / multi-submission prevention.
 * Automatically shows a spinner and disables the button while `isLoading` is true.
 */
export function Button({
  children,
  isLoading = false,
  loadingText,
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  onClick,
  ...props
}: ButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isLoading || disabled) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  const variantClasses = {
    primary:
      'bg-gradient-primary text-btn-text shadow-lg shadow-glow/25 hover:opacity-95',
    secondary:
      'bg-surface-subtle border border-border text-text-primary hover:border-active-50 hover:text-text-primary',
    ghost:
      'bg-transparent text-text-secondary hover:text-text-primary hover:bg-surface-subtle',
    danger:
      'bg-danger/10 border border-danger/30 text-danger hover:bg-danger/20',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
    md: 'px-4 py-2.5 text-sm rounded-xl gap-2',
    lg: 'px-6 py-3.5 text-sm rounded-xl gap-2',
  };

  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      onClick={handleClick}
      className={clsx(
        'inline-flex items-center justify-center font-bold transition disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {isLoading && loadingText ? loadingText : children}
    </button>
  );
}
