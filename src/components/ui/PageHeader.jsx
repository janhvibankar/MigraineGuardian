import React from 'react';
import { cn } from '../../utils/cn';

export function PageHeader({
  title,
  subtitle,
  badge,
  badgeVariant = 'sage',
  actions,
  breadcrumbs,
  className,
}) {
  return (
    <div className={cn('flex flex-col space-y-3 md:space-y-4 pb-6 pt-2', className)}>
      {breadcrumbs && (
        <div className="flex items-center space-x-2 text-meta-sm text-muted-text">
          {breadcrumbs}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-app-xl md:text-[32px] font-semibold text-brand-dark tracking-tight leading-tight">
              {title}
            </h1>
            {badge && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-meta-sm font-medium bg-brand-sage/20 text-brand-dark border border-brand-sage/40">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-body-md text-muted-text max-w-2xl leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2.5 flex-wrap flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
