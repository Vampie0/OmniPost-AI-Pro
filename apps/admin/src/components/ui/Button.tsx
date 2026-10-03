'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Reusable Button with built-in double-click / multi-submission prevention.
 * Automatically shows a spinner and disables the button while `isLoading` is true.
 *
 * Every colour here is a palette token, so hover, pressed and focused states all
 * re-tint themselves when the palette or the light/dark mode changes.
 */
const VARIANTS: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-gradient-primary text-btn-text shadow-glow-sm hover:shadow-glow-md active:shadow-glow-sm',
  secondary:
    'bg-surface-subtle-70 border border-border text-text-primary hover:border-active-50 hover:bg-surface-subtle hover:shadow-glow-sm',
  outline:
    'bg-transparent border border-border text-text-primary hover:border-active-50 hover:text-primary hover:bg-primary-10',
  ghost:
    'bg-transparent text-text-secondary hover:text-text-primary hover:bg-surface-subtle-70',
  danger:
    'bg-danger-10 border border-danger-30 text-danger hover:bg-danger-20 hover:border-danger-40',
};

const SIZES: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-4 py-2.5 text-sm rounded-xl gap-2',
  lg: 'px-6 py-3.5 text-sm rounded-xl gap-2',
};

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

  const isDisabled = disabled || isLoading;

  return (
    <button
      {...props}
      disabled={isDisabled}
      aria-busy={isLoading}
      onClick={handleClick}
      className={cn(
        'group relative inline-flex items-center justify-center overflow-hidden font-bold select-none',
        'transition-all duration-200 ease-quint-out',
        'hover:-translate-y-px active:translate-y-0 active:scale-[0.975]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-30 focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        'disabled:pointer-events-none disabled:opacity-45 disabled:shadow-none',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
    >
      {/* Sheen sweep, filled brand variant only. */}
      {variant === 'primary' && !isDisabled && (
        <span aria-hidden className="pointer-events-none absolute inset-0">
          <span className="sheen-band absolute inset-y-0 -left-1/3 w-1/3 opacity-0 group-hover:animate-sheen" />
        </span>
      )}

      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      <span className="relative inline-flex items-center gap-2">
        {isLoading && loadingText ? loadingText : children}
      </span>
    </button>
  );
}
