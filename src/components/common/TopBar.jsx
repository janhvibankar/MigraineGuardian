import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Logo } from './Logo';
import { Badge } from '../ui/Badge';
import { ROUTE_PAGE_TITLES } from '../../data/navigation';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { ROUTES } from '../../utils/constants';
import { Bell, ShieldAlert, Sparkles, X, CheckCircle2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export function TopBar() {
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const currentUser = useCurrentUser();

  // Dynamic page title
  const currentTitle = ROUTE_PAGE_TITLES[location.pathname] || 'Dashboard';

  const mockNotifications = [
    {
      id: 1,
      title: 'Stable Barometric Pressure',
      desc: 'Atmospheric pressure is steady (1014 hPa) for the next 24 hours.',
      time: '1h ago',
      type: 'sage',
    },
    {
      id: 2,
      title: 'Hydration Target Reached',
      desc: 'You logged 2.4L before 3:00 PM today. Great job maintaining your buffer.',
      time: '3h ago',
      type: 'teal',
    },
  ];

  return (
    <header className="sticky top-0 z-30 w-full bg-canvas/90 backdrop-blur-md border-b border-muted-border/60 select-none">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile Logo & Current Page Title */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="md:hidden flex-shrink-0">
            <Logo iconSize={26} />
          </div>

          <div className="hidden md:flex flex-col text-left">
            <h1 className="text-section-md lg:text-app-lg font-semibold text-brand-dark truncate tracking-tight">
              {currentTitle}
            </h1>
          </div>
        </div>

        {/* Right: Notifications, Emergency Protocol shortcut, and User Profile */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Relief Protocol Shortcut */}
          <Link to={ROUTES.PROFILE} className="hidden lg:inline-flex">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-btn text-meta-sm font-medium border border-alert-muted/40 text-[#8F443B] bg-alert-muted/10 hover:bg-alert-muted/20 transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Relief Protocol</span>
            </button>
          </Link>

          {/* Notification Icon & Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className={cn(
                'p-2.5 rounded-btn text-muted-text hover:text-brand-dark hover:bg-card-warm transition-colors relative',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal',
                showNotifications && 'bg-card-warm text-brand-dark'
              )}
              aria-label="Notifications"
              aria-expanded={showNotifications}
            >
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-brand-teal absolute top-2 right-2 ring-2 ring-canvas" />
            </button>

            {/* Notification Dropdown Popover */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-muted-border rounded-card p-4 shadow-soft-lg z-50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-muted-border/60">
                  <div className="flex items-center gap-2">
                    <span className="text-body-md font-semibold text-brand-dark">
                      Calm Advisories
                    </span>
                    <Badge variant="sage" size="sm">
                      2 New
                    </Badge>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNotifications(false)}
                    className="p-1 text-muted-text hover:text-brand-dark rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {mockNotifications.map((n) => (
                    <div
                      key={n.id}
                      className="p-3 rounded-card-sm bg-card-warm/50 border border-muted-border/70 space-y-1 hover:bg-card-warm transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-meta-md font-semibold text-brand-dark">
                          {n.title}
                        </span>
                        <span className="text-[11px] text-muted-text">{n.time}</span>
                      </div>
                      <p className="text-meta-sm text-muted-text leading-relaxed">
                        {n.desc}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-muted-border/50 text-center">
                  <Link
                    to={ROUTES.INSIGHTS}
                    onClick={() => setShowNotifications(false)}
                    className="text-meta-sm font-semibold text-brand-dark hover:underline"
                  >
                    View All Insights & Patterns →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Avatar & Name */}
          <Link
            to={ROUTES.PROFILE}
            className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1.5 rounded-btn hover:bg-card-warm transition-colors group"
            aria-label="User Profile"
          >
            <div className="w-8 h-8 rounded-full bg-brand-dark text-white font-bold text-meta-sm flex items-center justify-center shadow-soft">
              {currentUser?.initials || 'SA'}
            </div>
            <span className="hidden sm:inline text-body-md font-bold text-brand-dark group-hover:text-brand-teal transition-colors">
              {currentUser?.name || 'Sakshi'}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}

// Backwards compatibility alias
export { TopBar as AppTopbar };
