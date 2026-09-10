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
} from 'lucide-react';
import { useCurrentUser } from '../hooks/useCurrentUser';

const PREFERENCES_STORAGE_KEY = 'migraineguardian_preferences';
const DEFAULT_PREFERENCES = {
  dailyReminder: true,
  weeklyReminder: true,
  weatherAlerts: true,
};

export function SettingsPage() {
  const navigate = useNavigate();
  const currentUser = useCurrentUser();

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
      // 1. Fetch user profile from backend or authService
      const profile = await authService.fetchUserProfile();
      const safeProfile = {
        userId: profile?.userId || profile?.id || currentUser?.userId,
        name: profile?.name || currentUser?.name,
        email: profile?.email || currentUser?.email,
        diagnosis: profile?.diagnosis || 'Migraine with sensory aura (episodic)',
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

      // 2. Fetch daily check-in logs
      let checkinHistory = [];
      try {
        checkinHistory = await trackingService.getDailyLogs(60);
      } catch (e) {
        console.warn('[Settings] Checkin history fetch fallback:', e);
        checkinHistory = storageService.getItem('migraineguardian_daily_logs', []);
      }

      // 3. Fetch today's check-in draft or log
      let todayCheckin = trackingService.getTodayLog();
      if (!todayCheckin) {
        try {
          todayCheckin = await trackingService.fetchTodayLog();
        } catch (e) {
          // fallback
        }
      }

      // 4. Fetch today's risk forecast
      let todayForecast = null;
      try {
        todayForecast = await predictionService.getTodayPrediction();
      } catch (e) {
        todayForecast = storageService.getItem('migraineguardian_today_forecast', null);
      }

      // 5. Fetch PSS-10 assessments
      let pssHistory = [];
      let latestPss = null;
      try {
        pssHistory = await pssService.getPssHistory(20);
        latestPss = await pssService.getLatestAssessment();
      } catch (e) {
        latestPss = storageService.getItem('pss_score_latest', null);
      }

      // 6. User preferences
      const savedPrefs = storageService.getItem(PREFERENCES_STORAGE_KEY, DEFAULT_PREFERENCES);

      // 7. Assemble comprehensive export bundle (strictly authenticated user data, zero secrets)
      const exportPackage = {
        exportMetadata: {
          application: 'MigraineGuardian',
          version: '1.0.0',
          exportedAt: new Date().toISOString(),
          format: 'JSON',
          description: 'Personal MigraineGuardian health tracking data export.',
        },
        userProfile: safeProfile,
        preferences: savedPrefs,
        todayCheckin: todayCheckin || null,
        todayRiskForecast: todayForecast
          ? {
              score: todayForecast.score,
              level: todayForecast.level,
              model_used: todayForecast.model_used,
              headline: todayForecast.headline,
              summary: todayForecast.summary,
              elevatedFactors: todayForecast.elevatedFactors || [],
              focusAreas: todayForecast.focusAreas || [],
              xai: todayForecast.xai || null,
              disclaimer: todayForecast.disclaimer || null,
            }
          : null,
        checkinHistory: Array.isArray(checkinHistory) ? checkinHistory : [],
        pssAssessments: {
          latest: latestPss || null,
          history: Array.isArray(pssHistory) ? pssHistory : [],
        },
      };

      // 8. Generate and trigger download of JSON file
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
    // Clear cached drafts, forecast cache, logs cache, and read notifications from local storage
    storageService.removeItem('daily_checkin_today');
    storageService.removeItem('migraineguardian_today_forecast');
    storageService.removeItem('migraineguardian_daily_logs');
    storageService.removeItem('pss_score_latest');
    storageService.removeItem('migraineguardian_read_notifications');

    // Reset preferences to default
    storageService.setItem(PREFERENCES_STORAGE_KEY, DEFAULT_PREFERENCES);
    setPreferences(DEFAULT_PREFERENCES);

    // Notify components of state reset
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
      setPasswordError('Please enter your current password.');
      return;
    }
    if (!newPassword) {
      setPasswordError('Please enter a new password.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation password do not match.');
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError('New password must be different from your current password.');
      return;
    }

    setPasswordLoading(true);
    const res = await authService.changePassword(currentPassword, newPassword);
    setPasswordLoading(false);

    if (!res.success) {
      setPasswordError(res.error || 'Failed to update password.');
      return;
    }

    // Reset fields & show success state
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordModalOpen(false);
    setPasswordSuccess(true);
    setTimeout(() => setPasswordSuccess(false), 5000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* HEADER */}
      <PageHeader
        title="Settings & Preferences"
        subtitle="Manage reminders, environmental tracking preferences, and personal health data export."
        badge="Preferences"
        actions={
          <Button
            variant="primary"
            size="md"
            onClick={handleSavePreferences}
            icon={savedSettings ? Check : Settings}
          >
            {savedSettings ? 'Preferences Saved' : 'Save Preferences'}
          </Button>
        }
      />

      {savedSettings && (
        <div className="p-3.5 rounded-card-sm bg-brand-sage/20 border border-brand-sage/40 text-brand-dark text-meta-md flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-brand-dark" />
          <span>Your preferences have been safely updated and saved.</span>
        </div>
      )}

      {passwordSuccess && (
        <div className="p-3.5 rounded-card-sm bg-brand-teal/15 border border-brand-teal/30 text-brand-dark text-meta-md flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-brand-teal" />
          <span>Your password has been changed successfully.</span>
        </div>
      )}

      {exportSuccess && (
        <div className="p-3.5 rounded-card-sm bg-brand-teal/15 border border-brand-teal/30 text-brand-dark text-meta-md flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-brand-teal" />
          <span>Data package successfully exported and downloaded as JSON.</span>
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
          <span>Local session cache and temporary drafts cleared. Cloud records remain intact.</span>
        </div>
      )}

      {/* =========================================================================
          SECTION 1: HEALTH & SAFETY
         ========================================================================= */}
      <Card variant="warm" className="p-6 sm:p-8 space-y-4 border-brand-sage/50 shadow-soft">
        <div className="flex items-center gap-2.5 pb-2 border-b border-muted-border/60">
          <ShieldCheck className="w-5 h-5 text-brand-teal" />
          <h2 className="text-section-lg font-semibold text-brand-dark">
            Health & Safety
          </h2>
        </div>

        <div className="p-4 rounded-card-sm bg-white border border-muted-border shadow-soft space-y-2">
          <p className="text-body-md font-medium text-brand-dark leading-relaxed">
            "MigraineGuardian is designed for tracking, awareness and educational support. It does not diagnose migraine or replace professional medical advice."
          </p>
          <span className="text-[11px] text-muted-text block">
            Always consult a licensed neurologist or physician for clinical diagnosis, acute prescription management, and emergency symptoms.
          </span>
        </div>
      </Card>

      {/* =========================================================================
          SECTION 2: NOTIFICATIONS & TRACKING PREFERENCES
         ========================================================================= */}
      <Card variant="warm" className="p-6 sm:p-8 space-y-5 border-card-warm-border shadow-soft">
        <div className="flex items-center gap-2.5 pb-2 border-b border-muted-border/60">
          <Bell className="w-5 h-5 text-brand-teal" />
          <div>
            <h2 className="text-section-lg font-semibold text-brand-dark">
              Notifications & Gentle Reminders
            </h2>
            <span className="text-meta-sm text-muted-text">Non-intrusive alerts to protect autonomic peace</span>
          </div>
        </div>

        <div className="space-y-3">
          {/* Daily check-in reminder */}
          <label className="flex items-center justify-between p-4 rounded-card-sm bg-white border border-muted-border cursor-pointer hover:border-brand-sage/60 transition-all">
            <div className="space-y-0.5">
              <span className="text-body-md font-semibold text-brand-dark block">
                Daily Check-in Reminder
              </span>
              <span className="text-meta-sm text-muted-text">
                Gentle prompt at 8:30 PM to log sleep, hydration, and daily stress.
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
                Weekly Insight Reminder
              </span>
              <span className="text-meta-sm text-muted-text">
                Sunday morning synthesis highlighting newly identified lifestyle patterns.
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
                Environmental Risk Monitoring
              </span>
              <span className="text-meta-sm text-muted-text">
                Include atmospheric pressure changes in your environmental risk monitoring.
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
          SECTION 3: PRIVACY & DATA MANAGEMENT
         ========================================================================= */}
      <Card variant="warm" className="p-6 sm:p-8 space-y-6 border-card-warm-border shadow-soft">
        <div className="flex items-center gap-2.5 pb-2 border-b border-muted-border/60">
          <Database className="w-5 h-5 text-brand-teal" />
          <div>
            <h2 className="text-section-lg font-semibold text-brand-dark">
              Privacy & Data Management
            </h2>
            <span className="text-meta-sm text-muted-text">Complete patient sovereignty over your logs and health data</span>
          </div>
        </div>

        {/* Authenticated Account Storage Status */}
        <div className="space-y-3">
          <div className="p-4 rounded-card-sm bg-white border border-muted-border flex items-center justify-between">
            <div className="space-y-0.5 pr-4">
              <span className="text-body-md font-semibold text-brand-dark block">
                Authenticated Account Storage
              </span>
              <span className="text-meta-sm text-muted-text">
                Your migraine tracking data is associated with your authenticated account and protected by the application's access controls.
              </span>
            </div>
            <Badge variant="sage" size="sm" className="flex-shrink-0">
              Protected
            </Badge>
          </div>
        </div>

        {/* Data Portability & Erasure Action Buttons */}
        <div className="space-y-3 pt-2">
          <span className="text-meta-sm font-semibold uppercase tracking-wider text-muted-text block">
            Data Portability & Storage Management:
          </span>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Button
              variant="secondary"
              size="md"
              onClick={handleExportData}
              disabled={exportLoading}
              icon={exportLoading ? Loader2 : Download}
              className="w-full sm:w-auto"
            >
              {exportLoading ? 'Generating Export...' : 'Export My Data'}
            </Button>

            <Button
              variant="outline"
              size="md"
              onClick={() => setDeleteModalOpen(true)}
              icon={Trash2}
              className="w-full sm:w-auto text-[#8F443B] border-alert-muted/40 hover:bg-alert-muted/10 hover:border-alert-muted/60"
            >
              Clear Local Data
            </Button>
          </div>
          <span className="text-[11px] text-muted-text block">
            Exports your available MigraineGuardian account data as a JSON file.
          </span>
        </div>
      </Card>

      {/* =========================================================================
          SECTION 4: ACCOUNT & LOGOUT
         ========================================================================= */}
      <Card variant="warm" className="p-6 sm:p-8 space-y-6 border-card-warm-border shadow-soft">
        <div className="flex items-center gap-2.5 pb-2 border-b border-muted-border/60">
          <Lock className="w-5 h-5 text-brand-teal" />
          <h2 className="text-section-lg font-semibold text-brand-dark">
            Account & Security
          </h2>
        </div>

        <div className="space-y-3">
          <div className="p-4 rounded-card-sm bg-white border border-muted-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-meta-sm text-muted-text block">Registered Account Email</span>
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
            >
              Change Password
            </Button>
          </div>

          <div className="pt-3 border-t border-muted-border/60 flex items-center justify-between">
            <div>
              <span className="text-body-md font-semibold text-brand-dark block">
                Sign Out of Current Session
              </span>
              <span className="text-meta-sm text-muted-text">
                Securely lock your session on this browser.
              </span>
            </div>

            <Button
              variant="outline"
              size="md"
              onClick={handleLogout}
              icon={LogOut}
              className="text-[#8F443B] border-alert-muted/40 hover:bg-alert-muted/10 hover:border-alert-muted/60 flex-shrink-0"
            >
              Logout
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
                  Change Password
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPasswordModalOpen(false)}
                className="p-1 rounded-md text-muted-text hover:text-brand-dark hover:bg-card-warm cursor-pointer transition-colors"
                aria-label="Close modal"
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
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="Enter your current password"
                    className="w-full px-3.5 py-2.5 rounded-btn border border-muted-border bg-card-warm/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal text-brand-dark text-body-md pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-text hover:text-brand-dark"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-meta-md font-semibold text-brand-dark block">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="At least 8 characters"
                    className="w-full px-3.5 py-2.5 rounded-btn border border-muted-border bg-card-warm/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal text-brand-dark text-body-md pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-text hover:text-brand-dark"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <span className="text-[11px] text-muted-text">
                  Must be at least 8 characters.
                </span>
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1.5">
                <label className="text-meta-md font-semibold text-brand-dark block">
                  Confirm New Password
                </label>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Re-enter new password"
                  className="w-full px-3.5 py-2.5 rounded-btn border border-muted-border bg-card-warm/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal text-brand-dark text-body-md"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-muted-border/60">
                <Button
                  variant="outline"
                  size="md"
                  type="button"
                  onClick={() => setPasswordModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  disabled={passwordLoading}
                  icon={passwordLoading ? Loader2 : Key}
                >
                  {passwordLoading ? 'Updating...' : 'Update Password'}
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
                Clear Local Browser Cache?
              </h3>
              <p className="text-meta-md text-muted-text leading-relaxed">
                This will clear local offline drafts, cached forecast previews, and temporary browser data. Your permanent profile and recorded history stored securely in your cloud account will not be deleted.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-btn border border-[#DFDCD1] bg-[#F4F3EE] text-brand-dark font-medium hover:bg-card-warm-hover text-body-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearLocalData}
                className="flex-1 px-4 py-2.5 rounded-btn bg-alert-muted/20 text-[#8F443B] border border-alert-muted/40 font-medium hover:bg-alert-muted/30 text-body-md transition-colors shadow-none"
              >
                Clear Local Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsPage;
