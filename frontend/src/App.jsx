import React, { useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { I18nProvider } from './context/I18nContext';
import { ChatProvider } from './context/ChatContext';
import { triggerBackgroundWarmup } from './services/warmupService';
import { authService } from './services/authService';
import { Loader2 } from 'lucide-react';

// Layouts & Route Guards
import { PublicLayout } from './layouts/PublicLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { AppLayout } from './layouts/AppLayout';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Public & Fast-Path Pages (Eagerly Loaded)
import { LandingPage } from './pages/LandingPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { PssAssessmentPage } from './pages/PssAssessmentPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { ContactPage } from './pages/ContactPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Auth Pages & Guest Onboarding
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { OnboardingPage } from './pages/OnboardingPage';

// Core Dashboard & Daily Tracking (Fast Load)
import { DashboardPage } from './pages/DashboardPage';
import { DailyCheckinPage } from './pages/DailyCheckinPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';

// Heavy Pages (Code-Split via React.lazy to reduce initial bundle and speed up initial page load)
const RiskAnalysisPage = React.lazy(() => import('./pages/RiskAnalysisPage').then((m) => ({ default: m.RiskAnalysisPage })));
const InsightsPage = React.lazy(() => import('./pages/InsightsPage').then((m) => ({ default: m.InsightsPage })));
const AnalyticsPage = React.lazy(() => import('./pages/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })));
const ReportsPage = React.lazy(() => import('./pages/ReportsPage').then((m) => ({ default: m.ReportsPage })));
const ChatPage = React.lazy(() => import('./pages/ChatPage').then((m) => ({ default: m.ChatPage })));

import { ROUTES } from './utils/constants';

function PageLoadingFallback() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3 py-16">
      <Loader2 className="w-8 h-8 text-brand-teal animate-spin" />
      <span className="text-body-sm font-medium text-brand-dark">Loading...</span>
    </div>
  );
}

function AuthRedirectHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    async function checkGlobalRedirect() {
      try {
        const res = await authService.handleRedirectResult();
        if (!isMounted) return;
        if (res && res.success && res.redirectHandled) {
          // If redirect completed and user is on an auth or public page, navigate to dashboard
          const currentPath = window.location.pathname;
          if (
            currentPath === ROUTES.LOGIN ||
            currentPath === ROUTES.SIGNUP ||
            currentPath === ROUTES.HOME ||
            currentPath === '/'
          ) {
            navigate(ROUTES.DASHBOARD, { replace: true });
          }
        }
      } catch (err) {
        console.warn('[AuthRedirectHandler] Error resolving OAuth redirect:', err);
      }
    }
    checkGlobalRedirect();
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  return null;
}

export function App() {
  useEffect(() => {
    // Non-blocking parallel service warmup on app launch
    triggerBackgroundWarmup();
  }, []);

  return (
    <ErrorBoundary>
      <I18nProvider>
        <ChatProvider>
          <BrowserRouter>
            <AuthRedirectHandler />
            <Routes>
              {/* Public Informational Routes */}
              <Route element={<PublicLayout />}>
                <Route path={ROUTES.HOME} element={<LandingPage />} />
                <Route path={ROUTES.HOW_IT_WORKS} element={<HowItWorksPage />} />
                <Route path={ROUTES.PRIVACY} element={<PrivacyPage />} />
                <Route path={ROUTES.TERMS} element={<TermsPage />} />
                <Route path={ROUTES.CONTACT} element={<ContactPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>

              {/* Auth & Guest Onboarding Flow */}
              <Route element={<AuthLayout />}>
                <Route path={ROUTES.LOGIN} element={<LoginPage />} />
                <Route path={ROUTES.SIGNUP} element={<SignupPage />} />
                <Route path={ROUTES.ONBOARDING} element={<OnboardingPage />} />
              </Route>

              {/* Protected App Workspace Routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
                  <Route path={ROUTES.DAILY_CHECKIN} element={<DailyCheckinPage />} />
                  <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
                  <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
                  <Route path={ROUTES.PSS_ASSESSMENT} element={<PssAssessmentPage />} />

                  {/* Heavy routes with Suspense code splitting */}
                  <Route
                    path={ROUTES.RISK_ANALYSIS}
                    element={
                      <Suspense fallback={<PageLoadingFallback />}>
                        <RiskAnalysisPage />
                      </Suspense>
                    }
                  />
                  <Route
                    path={ROUTES.INSIGHTS}
                    element={
                      <Suspense fallback={<PageLoadingFallback />}>
                        <InsightsPage />
                      </Suspense>
                    }
                  />
                  <Route
                    path={ROUTES.ANALYTICS}
                    element={
                      <Suspense fallback={<PageLoadingFallback />}>
                        <AnalyticsPage />
                      </Suspense>
                    }
                  />
                  <Route
                    path={ROUTES.REPORTS}
                    element={
                      <Suspense fallback={<PageLoadingFallback />}>
                        <ReportsPage />
                      </Suspense>
                    }
                  />
                  <Route
                    path={ROUTES.CHAT}
                    element={
                      <Suspense fallback={<PageLoadingFallback />}>
                        <ChatPage />
                      </Suspense>
                    }
                  />
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </ChatProvider>
      </I18nProvider>
    </ErrorBoundary>
  );
}

export default App;
