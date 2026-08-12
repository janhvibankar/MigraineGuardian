import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Logo } from './Logo';
import { Badge } from '../ui/Badge';
import { PRIMARY_NAV_ITEMS, SECONDARY_NAV_ITEMS } from '../../data/navigation';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { ROUTES } from '../../utils/constants';
import { cn } from '../../utils/cn';
import { LogOut, Shield } from 'lucide-react';

export function Sidebar({ className }) {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const currentUser = useCurrentUser();

  const handleLogout = () => {
    setShowLogoutModal(false);
    navigate(ROUTES.LOGIN);
  };

  return (
    <>
      <aside
        className={cn(
          'w-64 lg:w-72 bg-canvas border-r border-muted-border flex flex-col justify-between h-screen sticky top-0 select-none z-30',
          className
        )}
        aria-label="Application sidebar"
      >
        {/* Top Brand & Status */}
        <div className="p-5 lg:p-6 pb-4 border-b border-muted-border/60">
          <Logo linkTo={ROUTES.DASHBOARD} />

          {/* Minimal Status Pill */}
          <div className="mt-4 px-3 py-2 rounded-card-sm bg-card-warm border border-card-warm-border flex items-center justify-between shadow-soft">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-sage animate-pulse" />
              <span className="text-meta-sm font-medium text-brand-dark">Active Monitoring</span>
            </div>
            <span className="text-[11px] text-brand-teal-dark uppercase font-semibold">
              {currentUser?.currentRiskScore !== null && currentUser?.currentRiskScore !== undefined
                ? `${currentUser.currentRiskScore}% Risk`
                : 'NO DATA'}
            </span>
          </div>
        </div>

        {/* Primary Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6">
          <div className="space-y-1">
            <div className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-text-light mb-2">
              Primary Navigation
            </div>

            <nav className="space-y-1" aria-label="Main menu">
              {PRIMARY_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center justify-between px-3.5 py-2.5 rounded-btn text-body-md font-medium transition-all duration-150 group',
                        isActive
                          ? 'bg-brand-sage/20 text-brand-dark font-semibold shadow-soft border border-brand-sage/40'
                          : 'text-muted-text hover:text-brand-dark hover:bg-card-warm/60 border border-transparent'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center gap-3">
                          <Icon
                            className={cn(
                              'w-4 h-4 transition-colors flex-shrink-0',
                              isActive ? 'text-brand-dark' : 'text-muted-text group-hover:text-brand-dark'
                            )}
                          />
                          <span className="truncate">{item.label}</span>
                        </div>

                        {item.badge && (
                          <Badge
                            variant={item.badgeColor || (isActive ? 'sage' : 'neutral')}
                            size="sm"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Secondary Navigation (Profile, Settings, Logout) */}
          <div className="space-y-1 pt-4 border-t border-muted-border/60">
            <div className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-text-light mb-2">
              Preferences
            </div>

            <nav className="space-y-1" aria-label="Secondary menu">
              {SECONDARY_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center justify-between px-3.5 py-2.5 rounded-btn text-body-md font-medium transition-all duration-150 group',
                        isActive
                          ? 'bg-brand-sage/20 text-brand-dark font-semibold shadow-soft border border-brand-sage/40'
                          : 'text-muted-text hover:text-brand-dark hover:bg-card-warm/60 border border-transparent'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <div className="flex items-center gap-3">
                        <Icon
                          className={cn(
                            'w-4 h-4 transition-colors flex-shrink-0',
                            isActive ? 'text-brand-dark' : 'text-muted-text group-hover:text-brand-dark'
                          )}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>
                    )}
                  </NavLink>
                );
              })}

              {/* Logout Button */}
              <button
                type="button"
                onClick={() => setShowLogoutModal(true)}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-btn text-body-md font-medium text-muted-text hover:text-alert-muted hover:bg-alert-muted/10 transition-colors group cursor-pointer text-left"
              >
                <LogOut className="w-4 h-4 text-muted-text group-hover:text-alert-muted transition-colors flex-shrink-0" />
                <span>Sign Out</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Bottom User Profile Section */}
        <div className="p-3.5 border-t border-brand-sage/40 bg-card-warm/60">
          <NavLink
            to={ROUTES.PROFILE}
            className="flex items-center justify-between p-2 rounded-btn hover:bg-white transition-colors group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-brand-dark text-white font-bold text-meta-md flex items-center justify-center flex-shrink-0 shadow-soft">
                {currentUser?.initials || 'SA'}
              </div>
              <div className="flex flex-col text-left overflow-hidden">
                <span className="text-body-md font-bold text-brand-dark truncate">
                  {currentUser?.name || 'Sakshi'}
                </span>
                <span className="text-meta-sm text-muted-text truncate">
                  {currentUser?.diagnosis?.split('(')[0] || 'Migraine baseline'}
                </span>
              </div>
            </div>
            <Shield className="w-4 h-4 text-muted-text-light group-hover:text-brand-teal transition-colors flex-shrink-0 ml-2" />
          </NavLink>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-muted-border rounded-card p-6 sm:p-8 max-w-sm w-full space-y-4 shadow-soft-lg">
            <div className="space-y-1.5 text-center">
              <div className="w-10 h-10 rounded-xl bg-alert-muted/15 text-alert-muted flex items-center justify-center mx-auto mb-2">
                <LogOut className="w-5 h-5" />
              </div>
              <h3 className="text-section-lg font-semibold text-brand-dark">
                Sign out of your account?
              </h3>
              <p className="text-meta-md text-muted-text leading-relaxed">
                Your tracking data will remain safely stored on this device.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-2.5 rounded-btn border border-[#DFDCD1] bg-[#F4F3EE] text-brand-dark font-medium hover:bg-card-warm-hover text-body-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 px-4 py-2.5 rounded-btn bg-brand-dark text-white font-medium hover:bg-[#1C2822] active:bg-[#141E19] text-body-md transition-colors shadow-soft"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
