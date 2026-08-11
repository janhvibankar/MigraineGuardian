import React from 'react';
import { cn } from '../../utils/cn';

export function Card({
  children,
  className,
  variant = 'warm', // 'warm', 'white', 'subtle', 'ghost', 'green'
  as: Component = 'div',
  ...props
}) {
  const variantStyles = {
    warm: 'bg-gradient-to-b from-[#FAF9F5] to-[#F2EFE9] border-2 border-brand-sage/55 hover:border-brand-teal shadow-[0_4px_20px_-4px_rgba(38,53,47,0.05)] hover:shadow-[0_10px_30px_-6px_rgba(111,153,144,0.18)] hover:-translate-y-0.5',
    white: 'bg-white/95 border-2 border-brand-sage/55 hover:border-brand-teal shadow-[0_4px_20px_-4px_rgba(38,53,47,0.05)] hover:shadow-[0_10px_30px_-6px_rgba(111,153,144,0.18)] hover:-translate-y-0.5',
    subtle: 'bg-[#F5F4EE]/90 border border-brand-sage/45 hover:border-brand-teal/80 shadow-none',
    green: 'bg-[#F2F6F3] border-2 border-brand-teal/50 hover:border-brand-teal-dark shadow-soft',
    ghost: 'bg-transparent border border-brand-sage/40 hover:border-brand-teal',
  };

  return (
    <Component
      className={cn(
        'rounded-[20px] p-6 transition-all duration-300 relative',
        variantStyles[variant] || variantStyles.warm,
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

export function CardHeader({ children, className, ...props }) {
  return (
    <div className={cn('flex flex-col space-y-1.5 pb-4 border-b border-brand-sage/30', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className, as: Component = 'h3', ...props }) {
  return (
    <Component
      className={cn('text-section-lg font-bold text-brand-dark tracking-tight leading-snug', className)}
      {...props}
    >
      {children}
    </Component>
  );
}

export function CardDescription({ children, className, ...props }) {
  return (
    <p className={cn('text-body-md text-[#555B55] leading-relaxed', className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ children, className, ...props }) {
  return (
    <div className={cn('pt-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className, ...props }) {
  return (
    <div className={cn('pt-4 flex items-center justify-between border-t border-brand-sage/30 mt-4', className)} {...props}>
      {children}
    </div>
  );
}

