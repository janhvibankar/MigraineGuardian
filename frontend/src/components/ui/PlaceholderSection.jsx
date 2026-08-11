import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './Card';
import { Badge } from './Badge';
import { Button } from './Button';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, ShieldCheck, Compass } from 'lucide-react';

export function PlaceholderSection({
  title,
  subtitle,
  icon: Icon = Compass,
  badge = 'Foundation Ready',
  features = [],
  dataPoints = [],
  nextRoutes = [],
}) {
  return (
    <div className="space-y-6">
      {/* Top calm advisory banner */}
      <div className="bg-card-warm/80 border border-card-warm-border rounded-card p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-sage/20 border border-brand-sage/40 flex items-center justify-center text-brand-dark flex-shrink-0 mt-0.5">
            <Icon className="w-6 h-6 text-brand-dark" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <h2 className="text-section-lg font-medium text-brand-dark">{title}</h2>
              <Badge variant="sage" size="sm" dot>
                {badge}
              </Badge>
            </div>
            <p className="text-body-md text-muted-text max-w-2xl leading-relaxed">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <Link to="/dashboard">
            <Button variant="secondary" size="md">
              Return to Dashboard
            </Button>
          </Link>
          <Link to="/daily-checkin">
            <Button variant="primary" size="md" iconRight={ArrowRight}>
              Daily Check-in
            </Button>
          </Link>
        </div>
      </div>

      {/* Grid of structured placeholders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Key Planned Modules */}
        <Card className="md:col-span-2 space-y-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-teal" />
              <CardTitle>Planned Capabilities & Modules</CardTitle>
            </div>
            <CardDescription>
              Architectural foundation established for this page view.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-1">
            {features.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {features.map((feature, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-card-sm bg-white/70 border border-muted-border/80 flex items-start gap-2.5"
                  >
                    <div className="w-2 h-2 rounded-full bg-brand-teal/80 mt-1.5 flex-shrink-0" />
                    <div>
                      <div className="text-meta-md font-medium text-brand-dark">
                        {feature.title || feature}
                      </div>
                      {feature.desc && (
                        <div className="text-meta-sm text-muted-text mt-0.5">
                          {feature.desc}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-card-sm bg-white/50 text-muted-text text-body-md">
                Component slots and data interfaces ready for connection.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Data Contracts & Navigation Quick Jump */}
        <Card className="space-y-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-sage-dark" />
              <CardTitle>Connected Architecture</CardTitle>
            </div>
            <CardDescription>
              Integrated with the central navigation & data store.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-1">
            {dataPoints.length > 0 && (
              <div className="space-y-2">
                <div className="text-meta-sm font-medium text-brand-dark uppercase tracking-wider">
                  Associated Data Feeds
                </div>
                <div className="space-y-1.5">
                  {dataPoints.map((dp, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-meta-md px-2.5 py-1.5 rounded-lg bg-white/60 border border-muted-border/50"
                    >
                      <span className="text-muted-text">{dp.name}</span>
                      <span className="font-medium text-brand-dark">{dp.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {nextRoutes.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="text-meta-sm font-medium text-brand-dark uppercase tracking-wider">
                  Related Views
                </div>
                <div className="flex flex-wrap gap-2">
                  {nextRoutes.map((route, i) => (
                    <Link key={i} to={route.path}>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-meta-sm bg-white/80 hover:bg-white text-brand-dark border border-muted-border transition-colors">
                        {route.label}
                        <ArrowRight className="w-3 h-3 text-muted-text" />
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
