import React from 'react';
import { Card } from './Card';
import { Badge } from './Badge';
import { cn } from '../../utils/cn';

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  badgeText,
  badgeVariant = 'neutral',
  className,
}) {
  return (
    <Card className={cn('flex flex-col justify-between space-y-3 p-5', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-y-0 gap-2.5">
          {Icon && (
            <div className="w-8 h-8 rounded-lg bg-card-warm-hover flex items-center justify-center text-brand-dark border border-muted-border/60">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <span className="text-meta-md text-muted-text font-medium">{title}</span>
        </div>
        {badgeText && (
          <Badge variant={badgeVariant} size="sm">
            {badgeText}
          </Badge>
        )}
      </div>

      <div className="space-y-1">
        <div className="text-app-xl font-semibold text-brand-dark tracking-tight">
          {value}
        </div>
        {subtitle && (
          <div className="text-meta-sm text-muted-text leading-snug">
            {subtitle}
          </div>
        )}
      </div>
    </Card>
  );
}
