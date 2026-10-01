import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ROUTES } from '../utils/constants';
import { authService } from '../services/authService';
import { storageService } from '../services/storageService';
import { trackingService } from '../services/trackingService';
import { predictionService } from '../services/predictionService';
import { pssService } from '../services/pssService';
import { useTranslation } from '../hooks/useTranslation';
import {
  Settings,
  Bell,
  ShieldCheck,
  Database,
  Download,
  Trash2,
  Lock,
  LogOut,
  CheckCircle2,
  Key,
  Eye,
  EyeOff,
  Check,
  Loader2,
  AlertCircle,
  X,
  Languages,
} from 'lucide-react';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { cn } from '../utils/cn';

const PREFERENCES_STORAGE_KEY = 'migraineguardian_preferences';
const DEFAULT_PREFERENCES = {
  dailyReminder: true,
  weeklyReminder: true,
  weatherAlerts: true,
};

export function SettingsPage() {
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const { t, language, setLanguage, languages } = useTranslation();

  // Notification & Environmental Tracking Preferences (Persisted)
  const [preferences, setPreferences] = useState(() => {
    return storageService.getItem(PREFERENCES_STORAGE_KEY, DEFAULT_PREFERENCES);
  });

  const dailyReminder = preferences?.dailyReminder ?? true;
  const weeklyReminder = preferences?.weeklyReminder ?? true;
  const weatherAlerts = preferences?.weatherAlerts ?? true;

  const handleTogglePreference = (key, value) => {
    const updated = {
      ...(preferences || DEFAULT_PREFERENCES),
      [key]: value,
    };
    setPreferences(updated);
    storageService.setItem(PREFERENCES_STORAGE_KEY, updated);
  };

  // Password Update State
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Data Export & Storage Action States
  const [exportLoading, setExportLoading] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportError, setExportError] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [savedSettings, setSavedSettings] = useState(false);

  const handleSavePreferences = () => {
    storageService.setItem(PREFERENCES_STORAGE_KEY, preferences);
    setSavedSettings(true);
    setTimeout(() => setSavedSettings(false), 2500);
  };

  const handleExportData = async () => {
    setExportLoading(true);
    setExportError(null);
    try {
      const profile = await authService.fetchUserProfile();
      const safeProfile = {
        userId: profile?.userId || profile?.id || currentUser?.userId,
        name: profile?.name || currentUser?.name,
        email: profile?.email || currentUser?.email,
        diagnosis: profile?.diagnosis || 'Migraine baseline',
        hasMigraines: profile?.hasMigraines || 'Yes',
        frequency: profile?.frequency || '1–3 times a month',
        severity: profile?.severity ?? 6,
        duration: profile?.duration || '4–12 hours',
        usesMedication: profile?.usesMedication || 'Yes',
        baselineTriggers: profile?.baselineTriggers || [],
        selectedFactors: profile?.selectedFactors || [],
        emergencyProtocol: profile?.emergencyProtocol || null,
        currentRiskScore: profile?.currentRiskScore ?? null,
        riskCategory: profile?.riskCategory ?? null,
        joinedDate: profile?.joinedDate || null,
      };

      let checkinHistory = [];
      try {
        checkinHistory = await trackingService.getDailyLogs(60);
      } catch (e) {
        checkinHistory = storageService.getItem('migraineguardian_daily_logs', []);
      }

      let todayCheckin = trackingService.getTodayLog();
      if (!todayCheckin) {
        try {
          todayCheckin = await trackingService.fetchTodayLog();
        } catch (e) {}
      }

      let todayForecast = null;
      try {
        todayForecast = await predictionService.getTodayPrediction();
      } catch (e) {
        todayForecast = storageService.getItem('migraineguardian_today_forecast', null);
      }

      let pssHistory = [];
      let latestPss = null;
      try {
        pssHistory = await pssService.getPssHistory(20);
        latestPss = await pssService.getLatestAssessment();
      } catch (e) {
        latestPss = storageService.getItem('pss_score_latest', null);
      }

      const savedPrefs = storageService.getItem(PREFERENCES_STORAGE_KEY, DEFAULT_PREFERENCES);

      const exportPackage = {
        exportMetadata: {
          application: 'MigraineGuardian',
          version: '1.0.0',
          exportedAt: new Date().toISOString(),
          selectedLanguage: language,
          format: 'JSON',
          description: 'Personal MigraineGuardian health tracking data export.',
        },
        userProfile: safeProfile,
        preferences: savedPrefs,
        todayCheckin: todayCheckin || null,
        todayRiskForecast: todayForecast,
        checkinHistory: Array.isArray(checkinHistory) ? checkinHistory : [],
        pssAssessments: {
          latest: latestPss || null,
          history: Array.isArray(pssHistory) ? pssHistory : [],
        },
      };

      const jsonString = JSON.stringify(exportPackage, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      link.href = url;
      link.download = `MigraineGuardian_Data_Export_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 5000);
    } catch (err) {
      console.error('[Settings] Data export error:', err);
      setExportError('Failed to generate export file. Please try again.');
      setTimeout(() => setExportError(null), 5000);
    } finally {
      setExportLoading(false);
    }
  };

  const handleClearLocalData = () => {
    storageService.removeItem('daily_checkin_today');
    storageService.removeItem('migraineguardian_today_forecast');
    storageService.removeItem('migraineguardian_daily_logs');
    storageService.removeItem('pss_score_latest');
    storageService.removeItem('migraineguardian_read_notifications');

    storageService.setItem(PREFERENCES_STORAGE_KEY, DEFAULT_PREFERENCES);
    setPreferences(DEFAULT_PREFERENCES);

    window.dispatchEvent(new CustomEvent('migraineguardian_forecast_updated', { detail: null }));

    setDeleteModalOpen(false);
    setDeleteSuccess(true);
    setTimeout(() => setDeleteSuccess(false), 5000);
  };

  const handleLogout = async () => {
    await authService.logout();
    navigate(ROUTES.LOGIN);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError(null);

    if (!currentPassword) {
      setPasswordError(t('settings.enterCurrentPassword', 'Please enter your current password.'));
      return;
    }
    if (!newPassword) {
      setPasswordError(t('settings.enterNewPassword', 'Please enter a new password.'));
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError(t('settings.passwordMin8', 'New password must be at least 8 characters long.'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t('settings.passwordsMismatch', 'New password and confirmation password do not match.'));
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError(t('settings.passwordSameAsCurrent', 'New password must be different from your current password.'));
      return;
    }

    setPasswordLoading(true);
    const res = await authService.changePassword(currentPassword, newPassword);
    setPasswordLoading(false);

    if (!res.success) {
      setPasswordError(res.error || 'Failed to update password.');
      return;
    }

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordModalOpen(false);
    setPasswordSuccess(true);
    setTimeout(() => setPasswordSuccess(false), 5000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200 text-left">
      {/* HEADER */}
      <PageHeader
        title={t('settings.title')}
        subtitle={t('settings.subtitle')}
        badge={t('nav.preferences')}
        actions={
          <Button
            variant="primary"
            size="md"
            onClick={handleSavePreferences}
            icon={savedSettings ? Check : Settings}
            className="cursor-pointer"
          >
            {savedSettings ? t('settings.preferencesSaved') : t('settings.savePreferencesBtn')}
          </Button>
        }
      />

      {savedSettings && (
        <div className="p-3.5 rounded-card-sm bg-brand-sage/20 border border-brand-sage/40 text-brand-dark text-meta-md flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-brand-dark" />
          <span>{t('common.saved')}</span>
        </div>
      )}

      {passwordSuccess && (
        <div className="p-3.5 rounded-card-sm bg-brand-teal/15 border border-brand-teal/30 text-brand-dark text-meta-md flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-brand-teal" />
          <span>{t('settings.passwordChanged')}</span>
        </div>
      )}

      {exportSuccess && (
        <div className="p-3.5 rounded-card-sm bg-brand-teal/15 border border-brand-teal/30 text-brand-dark text-meta-md flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-brand-teal" />
          <span>{t('settings.dataExported')}</span>
        </div>
      )}

      {exportError && (
        <div className="p-3.5 rounded-card-sm bg-alert-muted/15 border border-alert-muted/30 text-[#8F443B] text-meta-md flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-[#8F443B]" />
          <span>{exportError}</span>
        </div>
      )}

      {deleteSuccess && (
        <div className="p-3.5 rounded-card-sm bg-brand-teal/15 border border-brand-teal/30 text-brand-dark text-meta-md flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-brand-teal" />
          <span>{t('settings.cacheCleared')}</span>
        </div>
      )}

      {/* =========================================================================
          SECTION 1: LANGUAGE PREFERENCES
         ========================================================================= */}
      <Card variant="warm" className="p-6 sm:p-8 space-y-6 border-brand-sage/50 shadow-soft">
        <div className="flex items-center gap-2.5 pb-2 border-b border-muted-border/60">
          <Languages className="w-5 h-5 text-brand-teal" />
          <div>
            <h2 className="text-section-lg font-semibold text-brand-dark">
              {t('settings.languageLabel')}
            </h2>
            <span className="text-meta-sm text-muted-text">
              {t('settings.languageDesc')}
            </span>
          </div>
        </div>

        {/* 1.1 Multilingual Selection */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {languages.map((lang) => {
              const isSelected = language === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setLanguage(lang.code)}
                  className={cn(
                    'p-4 rounded-card-sm border text-left transition-all duration-150 flex items-center justify-between cursor-pointer',
                    isSelected
                      ? 'bg-brand-sage/20 border-brand-teal font-bold shadow-soft ring-2 ring-brand-teal/40'
                      : 'bg-white border-muted-border hover:bg-card-warm/60'
                  )}
                  aria-pressed={isSelected}
                >
                  <div className="flex flex-col">
                    <span className="text-section-md text-brand-dark font-bold">
                      {lang.nativeLabel}
                    </span>
                    <span className="text-meta-sm text-muted-text">
                      {lang.label}
                    </span>
                  </div>

                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-brand-teal text-white flex items-center justify-center shadow-soft">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* =========================================================================
          SECTION 2: HEALTH & SAFETY
         ========================================================================= */}
      <Card variant="warm" className="p-6 sm:p-8 space-y-4 border-brand-sage/50 shadow-soft">
        <div className="flex items-center gap-2.5 pb-2 border-b border-muted-border/60">
          <ShieldCheck className="w-5 h-5 text-brand-teal" />
          <h2 className="text-section-lg font-semibold text-brand-dark">
            {t('settings.healthSafetyTitle')}
          </h2>
        </div>

        <div className="p-4 rounded-card-sm bg-white border border-muted-border shadow-soft space-y-2">
          <p className="text-body-md font-medium text-brand-dark leading-relaxed">
            {t('settings.healthSafetyText')}
          </p>
          <span className="text-[11px] text-muted-text block">
            {t('settings.healthSafetySub')}
          </span>
        </div>
      </Card>

      {/* =========================================================================
          SECTION 3: NOTIFICATIONS & TRACKING PREFERENCES
         ========================================================================= */}
      <Card variant="warm" className="p-6 sm:p-8 space-y-5 border-card-warm-border shadow-soft">
        <div className="flex items-center gap-2.5 pb-2 border-b border-muted-border/60">
          <Bell className="w-5 h-5 text-brand-teal" />
          <div>
            <h2 className="text-section-lg font-semibold text-brand-dark">
              {t('settings.notificationsTitle')}
            </h2>
            <span className="text-meta-sm text-muted-text">{t('settings.notificationsSubtitle')}</span>
          </div>
        </div>

        <div className="space-y-3">
          {/* Daily check-in reminder */}
          <label className="flex items-center justify-between p-4 rounded-card-sm bg-white border border-muted-border cursor-pointer hover:border-brand-sage/60 transition-all">
            <div className="space-y-0.5">
              <span className="text-body-md font-semibold text-brand-dark block">
                {t('settings.dailyReminderTitle')}
              </span>
              <span className="text-meta-sm text-muted-text">
                {t('settings.dailyReminderDesc')}
              </span>
            </div>
            <input
              type="checkbox"
              checked={dailyReminder}
              onChange={(e) => handleTogglePreference('dailyReminder', e.target.checked)}
              className="w-5 h-5 rounded text-brand-teal focus:ring-brand-teal accent-brand-dark cursor-pointer"
            />
          </label>

          {/* Weekly insight reminder */}
          <label className="flex items-center justify-between p-4 rounded-card-sm bg-white border border-muted-border cursor-pointer hover:border-brand-sage/60 transition-all">
            <div className="space-y-0.5">
              <span className="text-body-md font-semibold text-brand-dark block">
                {t('settings.weeklyReminderTitle')}
              </span>
              <span className="text-meta-sm text-muted-text">
                {t('settings.weeklyReminderDesc')}
              </span>
            </div>
            <input
              type="checkbox"
              checked={weeklyReminder}
              onChange={(e) => handleTogglePreference('weeklyReminder', e.target.checked)}
              className="w-5 h-5 rounded text-brand-teal focus:ring-brand-teal accent-brand-dark cursor-pointer"
            />
          </label>

          {/* Environmental Risk Monitoring */}
          <label className="flex items-center justify-between p-4 rounded-card-sm bg-white border border-muted-border cursor-pointer hover:border-brand-sage/60 transition-all">
            <div className="space-y-0.5">
              <span className="text-body-md font-semibold text-brand-dark block">
                {t('settings.weatherAlertsTitle')}
              </span>
              <span className="text-meta-sm text-muted-text">
                {t('settings.weatherAlertsDesc')}
              </span>
            </div>
            <input
              type="checkbox"
              checked={weatherAlerts}
              onChange={(e) => handleTogglePreference('weatherAlerts', e.target.checked)}
              className="w-5 h-5 rounded text-brand-teal focus:ring-brand-teal accent-brand-dark cursor-pointer"
            />
          </label>
        </div>
      </Card>

      {/* =========================================================================
          SECTION 4: PRIVACY & DATA MANAGEMENT
         ========================================================================= */}
      <Card variant="warm" className="p-6 sm:p-8 space-y-6 border-card-warm-border shadow-soft">
        <div className="flex items-center gap-2.5 pb-2 border-b border-muted-border/60">
          <Database className="w-5 h-5 text-brand-teal" />
          <div>
            <h2 className="text-section-lg font-semibold text-brand-dark">
              {t('settings.privacyTitle')}
            </h2>
            <span className="text-meta-sm text-muted-text">{t('settings.privacySubtitle')}</span>
          </div>
        </div>

        {/* Authenticated Account Storage Status */}
        <div className="space-y-3">
          <div className="p-4 rounded-card-sm bg-white border border-muted-border flex items-center justify-between">
            <div className="space-y-0.5 pr-4">
              <span className="text-body-md font-semibold text-brand-dark block">
                {t('settings.accountStorageStatus')}
              </span>
              <span className="text-meta-sm text-muted-text">
                {t('settings.accountStorageDesc')}
              </span>
            </div>
            <Badge variant="sage" size="sm" className="flex-shrink-0">
              {t('common.protected')}
            </Badge>
          </div>
        </div>

        {/* Data Portability & Erasure Action Buttons */}
        <div className="space-y-3 pt-2">
          <span className="text-meta-sm font-semibold uppercase tracking-wider text-muted-text block">
            {t('settings.dataPortability')}
          </span>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Button
              variant="secondary"
              size="md"
              onClick={handleExportData}
              disabled={exportLoading}
              icon={exportLoading ? Loader2 : Download}
              className="w-full sm:w-auto cursor-pointer"
            >
              {exportLoading ? 'Generating Export...' : t('settings.exportDataBtn')}
            </Button>

            <Button
              variant="outline"
              size="md"
              onClick={() => setDeleteModalOpen(true)}
              icon={Trash2}
              className="w-full sm:w-auto text-[#8F443B] border-alert-muted/40 hover:bg-alert-muted/10 hover:border-alert-muted/60 cursor-pointer"
            >
              {t('settings.clearLocalDataBtn')}
            </Button>
          </div>
          <span className="text-[11px] text-muted-text block">
            {t('settings.exportDataDesc')}
          </span>
        </div>
      </Card>

      {/* =========================================================================
          SECTION 5: ACCOUNT & SECURITY
         ========================================================================= */}
      <Card variant="warm" className="p-6 sm:p-8 space-y-6 border-card-warm-border shadow-soft">
        <div className="flex items-center gap-2.5 pb-2 border-b border-muted-border/60">
          <Lock className="w-5 h-5 text-brand-teal" />
          <h2 className="text-section-lg font-semibold text-brand-dark">
            {t('settings.accountTitle')}
          </h2>
        </div>

        <div className="space-y-3">
          <div className="p-4 rounded-card-sm bg-white border border-muted-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-meta-sm text-muted-text block">{t('settings.registeredEmail')}</span>
              <span className="font-bold text-brand-dark text-body-md">
                {currentUser?.email || 'janhvi@serene-health.org'}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={Key}
              onClick={() => {
                setPasswordError(null);
                setPasswordModalOpen(true);
              }}
              className="cursor-pointer"
            >
              {t('settings.changePasswordBtn')}
            </Button>
          </div>

          <div className="pt-3 border-t border-muted-border/60 flex items-center justify-between">
            <div>
              <span className="text-body-md font-semibold text-brand-dark block">
                {t('settings.signOutSession')}
              </span>
              <span className="text-meta-sm text-muted-text">
                {t('settings.signOutDesc')}
              </span>
            </div>

            <Button
              variant="outline"
              size="md"
              onClick={handleLogout}
              icon={LogOut}
              className="text-[#8F443B] border-alert-muted/40 hover:bg-alert-muted/10 hover:border-alert-muted/60 flex-shrink-0 cursor-pointer"
            >
              {t('settings.logoutBtn')}
            </Button>
          </div>
        </div>
      </Card>

      {/* CHANGE PASSWORD MODAL */}
      {passwordModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-muted-border rounded-card-lg p-6 sm:p-8 max-w-md w-full space-y-5 shadow-soft-lg text-left">
            <div className="flex items-center justify-between pb-2 border-b border-muted-border/60">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-teal/20 border border-brand-teal/35 flex items-center justify-center text-brand-dark">
                  <Key className="w-4 h-4 text-brand-teal" />
                </div>
                <h3 className="text-section-lg font-bold text-brand-dark">
                  {t('settings.changePasswordBtn')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPasswordModalOpen(false)}
                className="p-1 rounded-md text-muted-text hover:text-brand-dark hover:bg-card-warm cursor-pointer transition-colors"
                aria-label={t('common.close')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {passwordError && (
              <div className="p-3 rounded-card-sm bg-alert-muted/15 border border-alert-muted/40 text-[#8F443B] text-meta-md flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-[#8F443B]" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              {/* Current Password */}
              <div className="space-y-1.5">
                <label className="text-meta-md font-semibold text-brand-dark block">
                  {t('settings.currentPassword', 'Current Password')}
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder={t('settings.currentPasswordPlaceholder', 'Enter current password')}
                    className="w-full px-3.5 py-2.5 rounded-btn border border-muted-border bg-card-warm/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal text-brand-dark text-body-md pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-text hover:text-brand-dark cursor-pointer"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-meta-md font-semibold text-brand-dark block">
                  {t('settings.newPassword', 'New Password')}
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder={t('settings.newPasswordPlaceholder', 'At least 8 characters')}
                    className="w-full px-3.5 py-2.5 rounded-btn border border-muted-border bg-card-warm/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal text-brand-dark text-body-md pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-text hover:text-brand-dark cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <span className="text-[11px] text-muted-text">
                  {t('settings.passwordRequirement', 'Must be at least 8 characters.')}
                </span>
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1.5">
                <label className="text-meta-md font-semibold text-brand-dark block">
                  {t('settings.confirmNewPassword', 'Confirm New Password')}
                </label>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder={t('settings.confirmNewPasswordPlaceholder', 'Re-enter new password')}
                  className="w-full px-3.5 py-2.5 rounded-btn border border-muted-border bg-card-warm/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal text-brand-dark text-body-md"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-muted-border/60">
                <Button
                  variant="outline"
                  size="md"
                  type="button"
                  onClick={() => setPasswordModalOpen(false)}
                  className="cursor-pointer"
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  disabled={passwordLoading}
                  icon={passwordLoading ? Loader2 : Key}
                  className="cursor-pointer"
                >
                  {passwordLoading ? t('common.loading') : t('settings.updatePasswordBtn', 'Update Password')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLEAR LOCAL DATA CONFIRMATION MODAL */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-muted-border rounded-card p-6 sm:p-8 max-w-md w-full space-y-4 shadow-soft-lg text-left">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-alert-muted/15 text-alert-muted flex items-center justify-center mb-1">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-section-lg font-semibold text-brand-dark">
                {t('settings.clearLocalDataBtn')}?
              </h3>
              <p className="text-meta-md text-muted-text leading-relaxed">
                {t('settings.clearLocalDataDesc')}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-btn border border-[#DFDCD1] bg-[#F4F3EE] text-brand-dark font-medium hover:bg-card-warm-hover text-body-md transition-colors cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleClearLocalData}
                className="flex-1 px-4 py-2.5 rounded-btn bg-alert-muted/20 text-[#8F443B] border border-alert-muted/40 font-medium hover:bg-alert-muted/30 text-body-md transition-colors shadow-none cursor-pointer"
              >
                {t('settings.clearLocalDataBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsPage;
