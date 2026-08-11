import React from 'react';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

const variantClasses = {
  // 1. PRIMARY: Reserved strictly for the single most important action on a page
  primary:
    'bg-brand-dark text-white hover:bg-[#1C2822] active:bg-[#141E19] border border-transparent shadow-soft',

  // 2. SECONDARY: Light neutral filled / outlined, quieter than primary (warm ivory / off-white)
  secondary:
    'bg-[#F4F3EE] text-brand-dark border border-[#DFDCD1] hover:bg-[#EAE7DD] hover:border-[#CDC7B8] active:bg-[#E2DFD4] shadow-none',

  // 3. OUTLINE: High visibility without dominating the page (1px muted sage/beige border)
  outline:
    'bg-white/70 text-brand-dark border border-brand-sage/50 hover:bg-card-warm hover:border-brand-sage active:bg-card-warm-hover shadow-none',

  // 4. TERTIARY / GHOST: Text-focused actions with transparent background
  tertiary:
    'bg-transparent text-muted-text-dark hover:text-brand-dark hover:bg-card-warm/50 border border-transparent active:bg-card-warm/70 shadow-none',
  ghost:
    'bg-transparent text-muted-text-dark hover:text-brand-dark hover:bg-card-warm/50 border border-transparent active:bg-card-warm/70 shadow-none',

  // 5. SPECIAL HEALTH / RISK ACTIONS: Calm, muted, non-alarmist health actions
  alert:
    'bg-alert-muted/15 text-[#8F443B] hover:bg-alert-muted/25 border border-alert-muted/30 active:bg-alert-muted/35 shadow-none',
  sage:
    'bg-brand-sage text-white hover:bg-brand-sage-dark border border-brand-sage active:bg-brand-sage-dark shadow-none',
  teal:
    'bg-brand-teal text-white hover:bg-brand-teal-dark border border-brand-teal active:bg-brand-teal-dark shadow-none',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-meta-md rounded-btn gap-1.5 min-h-[36px]',
  md: 'px-4 py-2 text-body-md rounded-btn gap-2 min-h-[40px]',
  lg: 'px-5 py-2.5 text-body-md sm:text-body-lg rounded-btn gap-2.5 min-h-[44px]',
  xl: 'px-6 py-2.5 sm:py-3 text-body-md sm:text-body-lg rounded-btn gap-2.5 font-medium min-h-[46px] sm:min-h-[48px]',
};

export const Button = React.forwardRef(
  (
    {
      children,
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled = false,
      icon: Icon,
      iconRight: IconRight,
      type = 'button',
      style,
      ...props
    },
    ref
  ) => {
    const isDarkOrGreen = variant === 'primary' || variant === 'sage' || variant === 'teal';

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        style={{
          ...(isDarkOrGreen ? { color: '#ffffff' } : {}),
          ...style,
        }}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal/70 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
          variantClasses[variant] || variantClasses.primary,
          sizeClasses[size] || sizeClasses.md,
          isDarkOrGreen && '!text-white text-white',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-white flex-shrink-0" style={{ stroke: '#ffffff' }} />
        ) : Icon ? (
          <Icon className="w-4 h-4 flex-shrink-0" style={isDarkOrGreen ? { stroke: '#ffffff', color: '#ffffff' } : undefined} />
        ) : null}

        <span
          className={cn(isDarkOrGreen && '!text-white text-white')}
          style={isDarkOrGreen ? { color: '#ffffff' } : undefined}
        >
          {children}
        </span>

        {!isLoading && IconRight ? (
          <IconRight className="w-4 h-4 flex-shrink-0" style={isDarkOrGreen ? { stroke: '#ffffff', color: '#ffffff' } : undefined} />
        ) : null}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
