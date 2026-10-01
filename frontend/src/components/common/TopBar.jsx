import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Logo } from './Logo';
import { Badge } from '../ui/Badge';
import { LanguageSelector } from './LanguageSelector';
import { useTranslation } from '../../hooks/useTranslation';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { trackingService } from '../../services/trackingService';
import { predictionService } from '../../services/predictionService';
import { storageService } from '../../services/storageService';
import { ROUTES } from '../../utils/constants';
import { Bell, X, CheckCircle2, ArrowRight } from 'lucide-react';
import { cn } from '../../utils/cn';
import { localizeFocusArea } from '../../utils/baselineHelper';

export function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const { t } = useTranslation();
  const [showNotifications, setShowNotifications] = useState(false);

  // Dynamic application state for notifications
  const [todayLog, setTodayLog] = useState(() => trackingService.getTodayLog());
  const [todayForecast, setTodayForecast] = useState(() =>
    storageService.getItem('migraineguardian_today_forecast', null)
  );
  const [readIds, setReadIds] = useState(() =>
    storageService.getItem('migraineguardian_read_notifications', [])
  );

  useEffect(() => {
    let isMounted = true;

    // Fetch latest check-in and forecast
    trackingService.fetchTodayLog().then((log) => {
      if (isMounted) setTodayLog(log);
    });

    predictionService.getTodayPrediction().then((forecast) => {
      if (isMounted) setTodayForecast(forecast);
    });

    const handleForecastUpdate = (e) => {
      if (isMounted) {
        setTodayForecast(e.detail || null);
      }
    };

    const handleUserUpdate = () => {
      if (isMounted) {
        setTodayLog(trackingService.getTodayLog());
      }
    };

    window.addEventListener('migraineguardian_forecast_updated', handleForecastUpdate);
    window.addEventListener('migraineguardian_user_updated', handleUserUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('migraineguardian_forecast_updated', handleForecastUpdate);
      window.removeEventListener('migraineguardian_user_updated', handleUserUpdate);
    };
  }, []);

  // Generate dynamic advisories strictly from real application state
  const todayDate = new Date().toISOString().split('T')[0];
  const advisories = [];

  // 1. Daily Check-in reminder if not completed today
  if (!todayLog) {
    advisories.push({
      id: `checkin_reminder_${todayDate}`,
      title: t('advisories.checkinReminderTitle'),
      desc: t('advisories.checkinReminderDesc'),
      time: t('advisories.actionRequired'),
      type: 'sage',
      route: ROUTES.DAILY_CHECKIN,
    });
  }

  // 2. Risk Forecast Available & High-Risk Advisories
  if (todayForecast && todayForecast.score !== undefined && todayForecast.score !== null) {
    const isHigh = todayForecast.level === 'High' || todayForecast.score > 60;
    advisories.push({
      id: `forecast_${todayDate}_${todayForecast.score}`,
      title: isHigh ? t('advisories.elevatedRiskTitle') : t('advisories.riskForecastTitle'),
      desc: t('advisories.forecastDesc', {
        score: todayForecast.score,
        level: todayForecast.level || 'Estimated',
      }),
      time: t('common.today'),
      type: isHigh ? 'alert' : 'teal',
      route: ROUTES.RISK_ANALYSIS,
    });

    // 3. Actionable Focus Area from SHAP / Recommendations
    if (todayForecast.focusAreas && Array.isArray(todayForecast.focusAreas) && todayForecast.focusAreas.length > 0) {
      const topFocus = todayForecast.focusAreas[0];
      if (topFocus && topFocus.title) {
        const localizedFocus = localizeFocusArea(topFocus, t);
        advisories.push({
          id: `focus_${todayDate}_${topFocus.title}`,
          title: t('advisories.todaysFocusTitle', { title: localizedFocus.title }),
          desc: localizedFocus.description || topFocus.action || 'Targeted behavioral recommendation.',
          time: t('common.today'),
          type: 'sage',
          route: ROUTES.RISK_ANALYSIS,
        });
      }
    }
  }

  // Calculate unread count dynamically
  const unreadCount = advisories.filter((a) => !readIds.includes(a.id)).length;

  const markAllAsRead = () => {
    const allIds = Array.from(new Set([...readIds, ...advisories.map((a) => a.id)]));
    setReadIds(allIds);
    storageService.setItem('migraineguardian_read_notifications', allIds);
  };

  const handleNotificationClick = (item) => {
    const updatedIds = Array.from(new Set([...readIds, item.id]));
    setReadIds(updatedIds);
    storageService.setItem('migraineguardian_read_notifications', updatedIds);
    setShowNotifications(false);
    navigate(item.route);
  };

  // Dynamic localized page title
  const getPageTitle = (pathname) => {
    switch (pathname) {
      case ROUTES.DASHBOARD:
        return t('pageTitles.dashboard');
      case ROUTES.DAILY_CHECKIN:
        return t('pageTitles.dailyCheckin');
      case ROUTES.INSIGHTS:
        return t('pageTitles.insights');
      case ROUTES.ANALYTICS:
        return t('pageTitles.analytics');
      case ROUTES.REPORTS:
        return t('pageTitles.reports');
      case ROUTES.CHAT:
        return t('pageTitles.chat');
      case ROUTES.RISK_ANALYSIS:
        return t('pageTitles.riskForecast');
      case ROUTES.PSS_ASSESSMENT:
        return t('pageTitles.pssAssessment');
      case ROUTES.PROFILE:
        return t('pageTitles.profile');
      case ROUTES.SETTINGS:
        return t('pageTitles.settings');
      default:
        return t('pageTitles.dashboard');
    }
  };

  const currentTitle = getPageTitle(location.pathname);

  return (
    <header className="sticky top-0 z-30 w-full bg-canvas/90 backdrop-blur-md border-b border-muted-border/60 select-none">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-4">
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

        {/* Right: Language Selector, Notification Bell, User Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
          {/* Language Selector */}
          <LanguageSelector variant="compact" />

          {/* Notification Icon & Dynamic Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className={cn(
                'p-2 sm:p-2.5 rounded-btn text-muted-text hover:text-brand-dark hover:bg-card-warm transition-colors relative cursor-pointer',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal',
                showNotifications && 'bg-card-warm text-brand-dark'
              )}
              aria-label={t('advisories.title')}
              aria-expanded={showNotifications}
            >
              <Bell className="w-4 h-4" />
              {/* Dynamic unread dot only if unread advisories exist */}
              {unreadCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-brand-teal absolute top-2 right-2 ring-2 ring-canvas" />
              )}
            </button>

            {/* Notification Dropdown Popover */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-muted-border rounded-card p-4 shadow-soft-lg z-50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-muted-border/60">
                  <div className="flex items-center gap-2">
                    <span className="text-body-md font-semibold text-brand-dark">
                      {t('advisories.title')}
                    </span>
                    {unreadCount > 0 ? (
                      <Badge variant="sage" size="sm">
                        {t('advisories.newBadge', { count: unreadCount })}
                      </Badge>
                    ) : (
                      <Badge variant="neutral" size="sm">
                        {t('advisories.upToDate')}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllAsRead}
                        className="text-[11px] text-brand-teal font-medium hover:underline px-1.5 py-0.5 rounded cursor-pointer"
                      >
                        {t('advisories.markAllRead')}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowNotifications(false)}
                      className="p-1 text-muted-text hover:text-brand-dark rounded cursor-pointer"
                      aria-label="Close advisories"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {advisories.length === 0 ? (
                    <div className="py-6 text-center space-y-1.5">
                      <CheckCircle2 className="w-6 h-6 text-brand-teal mx-auto" />
                      <span className="text-body-md font-semibold text-brand-dark block">
                        {t('advisories.noActive')}
                      </span>
                      <p className="text-meta-sm text-muted-text">
                        {t('advisories.noActiveDesc')}
                      </p>
                    </div>
                  ) : (
                    advisories.map((n) => {
                      const isUnread = !readIds.includes(n.id);
                      return (
                        <div
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={cn(
                            'p-3 rounded-card-sm border space-y-1 transition-all cursor-pointer text-left',
                            isUnread
                              ? 'bg-card-warm/80 border-brand-sage/60 hover:bg-card-warm shadow-soft'
                              : 'bg-white border-muted-border/70 hover:bg-card-warm/40 opacity-85'
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-meta-md font-semibold text-brand-dark flex items-center gap-1.5">
                              {isUnread && (
                                <span className="w-1.5 h-1.5 rounded-full bg-brand-teal flex-shrink-0" />
                              )}
                              {n.title}
                            </span>
                            <span className="text-[11px] text-muted-text">{n.time}</span>
                          </div>
                          <p className="text-meta-sm text-muted-text leading-relaxed">
                            {n.desc}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="pt-2 border-t border-muted-border/50 text-center">
                  <Link
                    to={ROUTES.INSIGHTS}
                    onClick={() => setShowNotifications(false)}
                    className="text-meta-sm font-semibold text-brand-dark hover:underline flex items-center justify-center gap-1"
                  >
                    <span>{t('advisories.viewAllInsights')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Avatar & Name */}
          <Link
            to={ROUTES.PROFILE}
            className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-btn hover:bg-card-warm transition-colors group"
            aria-label="User Profile"
          >
            <div className="w-8 h-8 rounded-full bg-brand-dark text-white font-bold text-meta-sm flex items-center justify-center shadow-soft">
              {currentUser?.initials || 'MG'}
            </div>
            <span className="hidden sm:inline text-body-md font-bold text-brand-dark group-hover:text-brand-teal transition-colors">
              {currentUser?.name || 'Janhvi'}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}

// Backwards compatibility alias
export { TopBar as AppTopbar };
export default TopBar;
