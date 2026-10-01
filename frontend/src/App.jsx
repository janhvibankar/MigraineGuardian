import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Layouts & Route Guards
import { PublicLayout } from './layouts/PublicLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { AppLayout } from './layouts/AppLayout';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Public Pages
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

// Application Workspace Pages (Protected)
import { DashboardPage } from './pages/DashboardPage';
import { DailyCheckinPage } from './pages/DailyCheckinPage';
import { RiskAnalysisPage } from './pages/RiskAnalysisPage';
import { InsightsPage } from './pages/InsightsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ReportsPage } from './pages/ReportsPage';
import { ChatPage } from './pages/ChatPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';

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
              <Route path={ROUTES.RISK_ANALYSIS} element={<RiskAnalysisPage />} />
              <Route path={ROUTES.INSIGHTS} element={<InsightsPage />} />
              <Route path={ROUTES.ANALYTICS} element={<AnalyticsPage />} />
              <Route path={ROUTES.REPORTS} element={<ReportsPage />} />
              <Route path={ROUTES.CHAT} element={<ChatPage />} />
              <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
              <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
              <Route path={ROUTES.PSS_ASSESSMENT} element={<PssAssessmentPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
