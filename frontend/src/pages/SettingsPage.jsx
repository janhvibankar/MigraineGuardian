import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ROUTES } from '../utils/constants';
import {
  Settings,
  Bell,
  ShieldCheck,
  ShieldAlert,
  Database,
  Download,
  Trash2,
  Lock,
  LogOut,
  CheckCircle2,
  Info,
  Key,
  Smartphone,
  Eye,
  Check,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useCurrentUser } from '../hooks/useCurrentUser';

export function SettingsPage() {
  const navigate = useNavigate();
  const currentUser = useCurrentUser();

  // Notification Toggles
  const [dailyReminder, setDailyReminder] = useState(true);
  const [weeklyReminder, setWeeklyReminder] = useState(true);
  const [weatherAlerts, setWeatherAlerts] = useState(true);

  // Privacy Toggles
  const [localStorageOnly, setLocalStorageOnly] = useState(true);
  const [anonymousAnalytics, setAnonymousAnalytics] = useState(false);

  // Feedback states
  const [exportSuccess, setExportSuccess] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [savedSettings, setSavedSettings] = useState(false);

  const handleExportData = () => {
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 4000);
  };

  const handleDeleteData = () => {
    setDeleteModalOpen(false);
    setDeleteSuccess(true);
    setTimeout(() => setDeleteSuccess(false), 4000);
  };

  const handleSavePreferences = () => {
    setSavedSettings(true);
    setTimeout(() => setSavedSettings(false), 2500);
  };

  const handleLogout = () => {
    navigate(ROUTES.LOGIN);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* HEADER */}
      <PageHeader
        title="Settings & Preferences"
        subtitle="Manage reminders, data privacy, health disclaimers, and local client storage."
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
          <span>Your preferences have been safely updated.</span>
        </div>
      )}

      {exportSuccess && (
        <div className="p-3.5 rounded-card-sm bg-brand-teal/15 border border-brand-teal/30 text-brand-dark text-meta-md flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-brand-teal" />
          <span>Data package successfully exported to JSON format.</span>
        </div>
      )}

      {deleteSuccess && (
        <div className="p-3.5 rounded-card-sm bg-alert-muted/15 border border-alert-muted/30 text-[#8F443B] text-meta-md flex items-center gap-2 animate-in fade-in">
          <Info className="w-4 h-4 text-alert-muted" />
          <span>Local test cache cleared (Frontend placeholder).</span>
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
          SECTION 2: NOTIFICATIONS
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
              onChange={(e) => setDailyReminder(e.target.checked)}
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
              onChange={(e) => setWeeklyReminder(e.target.checked)}
              className="w-5 h-5 rounded text-brand-teal focus:ring-brand-teal accent-brand-dark cursor-pointer"
            />
          </label>

          {/* Barometric Shift Advisory */}
          <label className="flex items-center justify-between p-4 rounded-card-sm bg-white border border-muted-border cursor-pointer hover:border-brand-sage/60 transition-all">
            <div className="space-y-0.5">
              <span className="text-body-md font-semibold text-brand-dark block">
                Barometric & Weather Front Alerts
              </span>
              <span className="text-meta-sm text-muted-text">
                Early notification when regional atmospheric pressure variance exceeds 6 hPa.
              </span>
            </div>
            <input
              type="checkbox"
              checked={weatherAlerts}
              onChange={(e) => setWeatherAlerts(e.target.checked)}
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

        {/* Privacy Toggles */}
        <div className="space-y-3">
          <div className="p-4 rounded-card-sm bg-white border border-muted-border flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-body-md font-semibold text-brand-dark block">
                On-Device Storage Engine
              </span>
              <span className="text-meta-sm text-muted-text">
                All daily check-ins and risk models execute directly in your browser without telemetry.
              </span>
            </div>
            <Badge variant="sage" size="sm">
              Active
            </Badge>
          </div>
        </div>

        {/* Data Management Action Buttons */}
        <div className="space-y-3 pt-2">
          <span className="text-meta-sm font-semibold uppercase tracking-wider text-muted-text block">
            Data Portability & Erasure:
          </span>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Button
              variant="secondary"
              size="md"
              onClick={handleExportData}
              icon={Download}
              className="w-full sm:w-auto"
            >
              Export my data
            </Button>

            <Button
              variant="outline"
              size="md"
              onClick={() => setDeleteModalOpen(true)}
              icon={Trash2}
              className="w-full sm:w-auto text-[#8F443B] border-alert-muted/40 hover:bg-alert-muted/10 hover:border-alert-muted/60"
            >
              Delete my data
            </Button>
          </div>
          <span className="text-[11px] text-muted-text block">
            * Frontend placeholder. Exports generate encrypted client-side JSON files.
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
                {currentUser?.email || 'sakshi@serene-health.org'}
              </span>
            </div>
            <Button variant="outline" size="sm" icon={Key}>
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

      {/* DELETE DATA CONFIRMATION MODAL */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-muted-border rounded-card p-6 sm:p-8 max-w-sm w-full space-y-4 shadow-soft-lg">
            <div className="space-y-1.5 text-center">
              <div className="w-10 h-10 rounded-xl bg-alert-muted/15 text-alert-muted flex items-center justify-center mx-auto mb-2">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-section-lg font-semibold text-brand-dark">
                Delete all logged data?
              </h3>
              <p className="text-meta-md text-muted-text leading-relaxed">
                This frontend placeholder action simulates purging your local check-ins and insights archive.
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
                onClick={handleDeleteData}
                className="flex-1 px-4 py-2.5 rounded-btn bg-alert-muted/20 text-[#8F443B] border border-alert-muted/40 font-medium hover:bg-alert-muted/30 text-body-md transition-colors shadow-none"
              >
                Delete Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
