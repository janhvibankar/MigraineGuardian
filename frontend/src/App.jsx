import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Layouts
import { PublicLayout } from './layouts/PublicLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { AppLayout } from './layouts/AppLayout';

// Public Pages
import { LandingPage } from './pages/LandingPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Auth Pages
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { OnboardingPage } from './pages/OnboardingPage';

// Application Workspace Pages
import { DashboardPage } from './pages/DashboardPage';
import { DailyCheckinPage } from './pages/DailyCheckinPage';
import { RiskAnalysisPage } from './pages/RiskAnalysisPage';
import { InsightsPage } from './pages/InsightsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ReportsPage } from './pages/ReportsPage';
import { ChatPage } from './pages/ChatPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { PssAssessmentPage } from './pages/PssAssessmentPage';

import { ROUTES } from './utils/constants';

export function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Public Informational Routes */}
          <Route element={<PublicLayout />}>
            <Route path={ROUTES.HOME} element={<LandingPage />} />
            <Route path={ROUTES.HOW_IT_WORKS} element={<HowItWorksPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          {/* Auth & Onboarding Flow */}
          <Route element={<AuthLayout />}>
            <Route path={ROUTES.LOGIN} element={<LoginPage />} />
            <Route path={ROUTES.SIGNUP} element={<SignupPage />} />
            <Route path={ROUTES.ONBOARDING} element={<OnboardingPage />} />
          </Route>

          {/* Protected App Workspace Routes */}
          <Route element={<AppLayout />}>
            <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
            <Route path={ROUTES.DAILY_CHECKIN} element={<DailyCheckinPage />} />
            <Route path={ROUTES.RISK_ANALYSIS} element={<RiskAnalysisPage />} />
            <Route path={ROUTES.INSIGHTS} element={<InsightsPage />} />
            <Route path={ROUTES.ANALYTICS} element={<AnalyticsPage />} />
            <Route path={ROUTES.REPORTS} element={<ReportsPage />} />
            <Route path={ROUTES.CHAT} element={<ChatPage />} />
            <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
            <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
            <Route path={ROUTES.PSS_ASSESSMENT} element={<PssAssessmentPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
