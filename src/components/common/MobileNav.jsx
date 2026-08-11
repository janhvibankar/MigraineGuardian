import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { MOBILE_PRIMARY_NAV } from '../../data/navigation';
import { ROUTES } from '../../utils/constants';
import { Badge } from '../ui/Badge';
import {
  MoreHorizontal,
  BarChart3,
  FileText,
  Activity,
  ClipboardList,
  User,
  Settings,
  LogOut,
  X,
  Shield,
} from 'lucide-react';
import { cn } from '../../utils/cn';

export function MobileNav() {
  const navigate = useNavigate();
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  const moreItems = [
    { label: 'Analytics & Trends', path: ROUTES.ANALYTICS, icon: BarChart3 },
    { label: 'Clinical Reports', path: ROUTES.REPORTS, icon: FileText },
    { label: 'Risk Forecast', path: ROUTES.RISK_ANALYSIS, icon: Activity },
    { label: 'PSS Stress Scale', path: ROUTES.PSS_ASSESSMENT, icon: ClipboardList },
    { label: 'Health Profile', path: ROUTES.PROFILE, icon: User },
    { label: 'Preferences & Privacy', path: ROUTES.SETTINGS, icon: Settings },
  ];

  const handleLogout = () => {
    setMoreMenuOpen(false);
    navigate(ROUTES.LOGIN);
  };

  return (
    <>
      {/* Fixed Bottom Bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-canvas/95 backdrop-blur-lg border-t border-muted-border px-2 py-1.5 flex items-center justify-around select-none shadow-soft-lg"
        aria-label="Mobile primary navigation"
      >
        {/* 4 Prioritized Items */}
        {MOBILE_PRIMARY_NAV.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-150 min-w-[54px] min-h-[48px]',
                  isActive
                    ? 'text-brand-dark font-semibold bg-card-warm border border-card-warm-border'
                    : 'text-muted-text hover:text-brand-dark'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={cn(
                      'w-5 h-5 transition-transform',
                      isActive ? 'text-brand-dark scale-105' : 'text-muted-text'
                    )}
                  />
                  <span className="text-[11px] mt-1 tracking-tight">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}

        {/* 5th Item: More Button */}
        <button
          type="button"
          onClick={() => setMoreMenuOpen(true)}
          className={cn(
            'flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-150 min-w-[54px] min-h-[48px]',
            moreMenuOpen
              ? 'text-brand-dark font-semibold bg-card-warm border border-card-warm-border'
              : 'text-muted-text hover:text-brand-dark'
          )}
          aria-expanded={moreMenuOpen}
          aria-label="More navigation options"
        >
          <MoreHorizontal className="w-5 h-5 text-muted-text" />
          <span className="text-[11px] mt-1 tracking-tight">More</span>
        </button>
      </nav>

      {/* Slide-Up Sheet for "More" Menu */}
      {moreMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex flex-col justify-end animate-in fade-in duration-200">
          <div className="bg-canvas border-t border-muted-border rounded-t-card-lg p-5 pb-8 space-y-4 shadow-soft-lg max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-250">
            {/* Sheet Top Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-muted-border/60">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-teal" />
                <span className="text-section-md font-semibold text-brand-dark">
                  Navigation Menu
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMoreMenuOpen(false)}
                className="p-1.5 rounded-full hover:bg-card-warm text-muted-text hover:text-brand-dark transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Menu List */}
            <div className="space-y-1.5 pt-1">
              {moreItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMoreMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center justify-between p-3.5 rounded-card-sm text-body-md font-medium transition-colors',
                        isActive
                          ? 'bg-card-warm text-brand-dark font-semibold border border-card-warm-border'
                          : 'bg-card-warm/50 text-brand-dark hover:bg-card-warm border border-muted-border/60'
                      )
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-brand-dark" />
                      <span>{item.label}</span>
                    </div>
                  </NavLink>
                );
              })}

              {/* Logout Option */}
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 p-3.5 rounded-card-sm text-body-md font-medium text-alert-muted bg-alert-muted/10 hover:bg-alert-muted/20 border border-alert-muted/30 transition-colors mt-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
