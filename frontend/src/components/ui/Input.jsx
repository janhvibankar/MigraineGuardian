import React from 'react';
import { cn } from '../../utils/cn';

export const Input = React.forwardRef(
  (
    {
      label,
      id,
      name,
      type = 'text',
      helperText,
      errorText,
      className,
      inputClassName,
      required = false,
      disabled = false,
      icon: Icon,
      ...props
    },
    ref
  ) => {
    const inputId = id || name || `input-${Math.random().toString(36).substring(2, 9)}`;

    return (
      <div className={cn('w-full flex flex-col space-y-1.5', className)}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-meta-md font-medium text-brand-dark flex items-center justify-between"
          >
            <span>
              {label} {required && <span className="text-alert-muted">*</span>}
            </span>
          </label>
        )}

        <div className="relative flex items-center">
          {Icon && (
            <div className="absolute left-3.5 pointer-events-none text-muted-text">
              <Icon className="w-4 h-4" />
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            name={name}
            type={type}
            disabled={disabled}
            required={required}
            className={cn(
              'w-full min-h-[46px] px-4 py-2.5 text-body-md text-brand-dark bg-white border rounded-[14px] transition-all duration-200 placeholder:text-muted-text-light/70 shadow-sm',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal/50 focus-visible:border-brand-teal',
              'disabled:bg-canvas disabled:text-muted-text-light disabled:cursor-not-allowed',
              errorText
                ? 'border-alert-muted ring-1 ring-alert-muted/40'
                : 'border-brand-sage/45 hover:border-brand-sage/80',
              Icon && 'pl-11',
              inputClassName
            )}
            {...props}
          />
        </div>

        {errorText ? (
          <p className="text-meta-sm text-alert-muted font-normal mt-1" role="alert">
            {errorText}
          </p>
        ) : helperText ? (
          <p className="text-meta-sm text-muted-text mt-1">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
