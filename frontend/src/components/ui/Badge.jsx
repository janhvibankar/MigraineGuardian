import React from 'react';
import { cn } from '../../utils/cn';

const variantClasses = {
  sage: 'bg-brand-sage/20 text-brand-dark border-brand-sage/40',
  teal: 'bg-brand-teal/15 text-[#375A53] border-brand-teal/35',
  alert: 'bg-alert-muted/15 text-[#8F443B] border-alert-muted/30',
  neutral: 'bg-card-warm text-muted-text-dark border-card-warm-border',
  dark: 'bg-brand-dark text-white border-transparent',
  subtle: 'bg-white/80 text-muted-text border-muted-border/70',
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-meta-sm font-medium rounded-full',
  md: 'px-2.5 py-1 text-meta-md font-medium rounded-full',
  lg: 'px-3 py-1.5 text-body-md font-medium rounded-full',
};

export function Badge({
  children,
  variant = 'neutral',
  size = 'sm',
  dot = false,
  dotColor,
  className,
  ...props
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 border select-none tracking-tight',
        variantClasses[variant] || variantClasses.neutral,
        sizeClasses[size] || sizeClasses.sm,
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            dotColor || (variant === 'alert' ? 'bg-alert-muted' : variant === 'teal' ? 'bg-brand-teal' : 'bg-brand-sage')
          )}
        />
      )}
      {children}
    </span>
  );
}
