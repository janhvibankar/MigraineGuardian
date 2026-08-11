import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { MOCK_USER } from '../data/mockUser';
import { ROUTES } from '../utils/constants';
import {
  User,
  Activity,
  ClipboardList,
  CheckCircle2,
  Calendar,
  Clock,
  Pill,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Moon,
  Brain,
  SunMedium,
  Droplets,
  CloudSun,
  Coffee,
  Dumbbell,
  Utensils,
  Edit2,
  Check,
} from 'lucide-react';
import { cn } from '../utils/cn';

import { authService } from '../services/authService';
import { useCurrentUser } from '../hooks/useCurrentUser';

export function ProfilePage() {
  const currentUser = useCurrentUser();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(() => currentUser?.name || 'Sakshi');
  const [age, setAge] = useState(() => currentUser?.age || '32');
  const [gender, setGender] = useState(() => currentUser?.gender || 'Female');

  // Keep in sync when currentUser updates
  React.useEffect(() => {
    if (currentUser?.name) setName(currentUser.name);
    if (currentUser?.age) setAge(currentUser.age);
    if (currentUser?.gender) setGender(currentUser.gender);
  }, [currentUser]);

  const handleToggleEdit = () => {
    if (isEditing) {
      // Save changes
      authService.updateUserProfile({
        name: name.trim() || currentUser?.name,
        age,
        gender,
      });
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  // Tracking factors toggle state
  const [activeFactors, setActiveFactors] = useState([
    { id: 'sleep', label: 'Sleep & Circadian Rhythm', active: true, icon: Moon },
    { id: 'stress', label: 'Daily Stress & Strain', active: true, icon: Brain },
    { id: 'screen', label: 'Screen & Optical Exposure', active: true, icon: SunMedium },
    { id: 'hydration', label: 'Fluid Intake & Hydration', active: true, icon: Droplets },
    { id: 'weather', label: 'Barometric & Weather Fronts', active: true, icon: CloudSun },
    { id: 'caffeine', label: 'Caffeine Timing', active: true, icon: Coffee },
    { id: 'exercise', label: 'Physical Activity & Movement', active: true, icon: Dumbbell },
    { id: 'meals', label: 'Blood Sugar & Skipped Meals', active: true, icon: Utensils },
  ]);

  const toggleFactor = (id) => {
    setActiveFactors(
      activeFactors.map((f) => (f.id === id ? { ...f, active: !f.active } : f))
    );
  };

  const pssHistory = [
    { date: 'Oct 10, 2024', score: 14, label: 'Low Perceived Stress', note: 'Consistent sleep buffer' },
    { date: 'Sept 12, 2024', score: 18, label: 'Moderate Baseline', note: 'Work transition window' },
    { date: 'Aug 14, 2024', score: 22, label: 'Elevated Baseline', note: 'Higher fatigue logged' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* HEADER */}
      <PageHeader
        title="Health Profile & Preferences"
        subtitle="Manage your personal information, clinical migraine background, PSS evaluation history, and active tracking parameters."
        badge="Health Profile"
        actions={
          <Link to={ROUTES.SETTINGS}>
            <Button variant="secondary" size="md">
              Account Settings
            </Button>
          </Link>
        }
      />

      {/* =========================================================================
          SECTION 1: PERSONAL INFORMATION
         ========================================================================= */}
      <Card variant="warm" className="p-6 sm:p-8 space-y-6 border-card-warm-border shadow-soft">
        <div className="flex items-center justify-between pb-3 border-b border-muted-border/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-dark text-[#F7F6F2] flex items-center justify-center shadow-soft">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-section-lg font-semibold text-brand-dark">
                Personal Information
              </h2>
              <span className="text-meta-sm text-muted-text">Basic details for localized health personalization</span>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleEdit}
            icon={isEditing ? Check : Edit2}
          >
            {isEditing ? 'Save Changes' : 'Edit Info'}
          </Button>
        </div>

        {isEditing ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-meta-sm font-semibold text-brand-dark">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-input bg-white border border-muted-border text-body-md"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-meta-sm font-semibold text-brand-dark">Age</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full px-3.5 py-2 rounded-input bg-white border border-muted-border text-body-md"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-meta-sm font-semibold text-brand-dark">Optional Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3.5 py-2 rounded-input bg-white border border-muted-border text-body-md"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-meta-md">
            <div className="p-4 rounded-card-sm bg-white border border-muted-border space-y-1">
              <span className="text-meta-sm text-muted-text block">Full Name</span>
              <span className="text-section-md font-bold text-brand-dark block">{name}</span>
            </div>
            <div className="p-4 rounded-card-sm bg-white border border-muted-border space-y-1">
              <span className="text-meta-sm text-muted-text block">Age</span>
              <span className="text-section-md font-bold text-brand-dark block">{age} years</span>
            </div>
            <div className="p-4 rounded-card-sm bg-white border border-muted-border space-y-1">
              <span className="text-meta-sm text-muted-text block">Gender (Optional)</span>
              <span className="text-section-md font-bold text-brand-dark block">{gender}</span>
            </div>
          </div>
        )}
      </Card>

      {/* =========================================================================
          SECTION 2: MIGRAINE TRACKING PREFERENCES
         ========================================================================= */}
      <Card variant="warm" className="p-6 sm:p-8 space-y-6 border-card-warm-border shadow-soft">
        <div className="flex items-center justify-between pb-3 border-b border-muted-border/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-teal/20 text-brand-dark flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-section-lg font-semibold text-brand-dark">
                Migraine Tracking Baseline & History
              </h2>
              <span className="text-meta-sm text-muted-text">Self-reported history configured during onboarding</span>
            </div>
          </div>
          <Badge variant="teal" size="sm">
            Configured
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-meta-md">
          <div className="p-4 rounded-card-sm bg-white border border-muted-border space-y-1">
            <div className="flex items-center gap-1.5 text-muted-text text-meta-sm">
              <Calendar className="w-3.5 h-3.5 text-brand-teal" />
              <span>Typical Frequency</span>
            </div>
            <div className="text-section-md font-bold text-brand-dark">{currentUser?.frequency || '1–3 times a month'}</div>
            <div className="text-[11px] text-muted-text">Self-calibrated pattern</div>
          </div>

          <div className="p-4 rounded-card-sm bg-white border border-muted-border space-y-1">
            <div className="flex items-center gap-1.5 text-muted-text text-meta-sm">
              <Activity className="w-3.5 h-3.5 text-brand-teal" />
              <span>Typical Severity</span>
            </div>
            <div className="text-section-md font-bold text-brand-dark">{currentUser?.severity !== undefined ? `${currentUser.severity} / 10` : '6 / 10'}</div>
            <div className="text-[11px] text-muted-text">Baseline discomfort index</div>
          </div>

          <div className="p-4 rounded-card-sm bg-white border border-muted-border space-y-1">
            <div className="flex items-center gap-1.5 text-muted-text text-meta-sm">
              <Clock className="w-3.5 h-3.5 text-brand-teal" />
              <span>Typical Duration</span>
            </div>
            <div className="text-section-md font-bold text-brand-dark">{currentUser?.duration || '4–12 hours'}</div>
            <div className="text-[11px] text-muted-text">Standard window length</div>
          </div>

          <div className="p-4 rounded-card-sm bg-white border border-muted-border space-y-1">
            <div className="flex items-center gap-1.5 text-muted-text text-meta-sm">
              <Pill className="w-3.5 h-3.5 text-brand-teal" />
              <span>Medication Status</span>
            </div>
            <div className="text-section-md font-bold text-brand-dark">{currentUser?.usesMedication === 'Yes' ? 'Active Prescribed' : (currentUser?.usesMedication || 'None / Lifestyle')}</div>
            <div className="text-[11px] text-muted-text">Acute / Preventive</div>
          </div>
        </div>
      </Card>

      {/* =========================================================================
          SECTION 3: PSS ASSESSMENT HISTORY
         ========================================================================= */}
      <Card variant="warm" className="p-6 sm:p-8 space-y-6 border-card-warm-border shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-muted-border/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-sage/20 text-brand-dark flex items-center justify-center">
              <ClipboardList className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-section-lg font-semibold text-brand-dark">
                PSS-10 Assessment History
              </h2>
              <span className="text-meta-sm text-muted-text">Validated Perceived Stress Scale (0–40 score range)</span>
            </div>
          </div>

          <Link to={ROUTES.PSS_ASSESSMENT}>
            <Button variant="secondary" size="sm" iconRight={ArrowRight}>
              Take New PSS Assessment
            </Button>
          </Link>
        </div>

        <div className="space-y-3">
          {pssHistory.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-card-sm bg-white border border-muted-border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-brand-dark text-body-md">{item.date}</span>
                  <Badge variant={item.score > 20 ? 'alert' : item.score > 15 ? 'teal' : 'sage'} size="sm">
                    {item.label}
                  </Badge>
                </div>
                <p className="text-meta-sm text-muted-text">{item.note}</p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-section-lg font-bold text-brand-dark">{item.score} / 40</span>
                <span className="text-[11px] text-muted-text block">Perceived Stress Index</span>
              </div>
            </div>
          ))}
        </div>

        <div className="p-3.5 rounded-card-sm bg-white/60 border border-muted-border/70 text-meta-sm text-muted-text">
          Higher scores indicate greater perceived stress over the preceding month. This score is an awareness metric, not a clinical diagnosis.
        </div>
      </Card>

      {/* =========================================================================
          SECTION 4: CURRENT TRACKING FACTORS
         ========================================================================= */}
      <Card variant="warm" className="p-6 sm:p-8 space-y-6 border-card-warm-border shadow-soft">
        <div className="space-y-1 pb-3 border-b border-muted-border/60">
          <h2 className="text-section-lg font-semibold text-brand-dark">
            Current Tracking Factors
          </h2>
          <p className="text-body-md text-muted-text">
            Parameters actively monitored during your daily micro check-in.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {activeFactors.map((factor) => {
            const Icon = factor.icon;
            return (
              <button
                key={factor.id}
                type="button"
                onClick={() => toggleFactor(factor.id)}
                className={cn(
                  'p-3.5 rounded-card-sm border text-left transition-all flex items-center justify-between',
                  factor.active
                    ? 'bg-white border-brand-teal/60 text-brand-dark shadow-soft'
                    : 'bg-card-warm/50 border-muted-border text-muted-text opacity-70'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn('p-1.5 rounded-md', factor.active ? 'bg-brand-teal/15 text-brand-teal-dark' : 'bg-muted-border/40 text-muted-text')}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="font-semibold text-meta-md">{factor.label}</span>
                </div>

                <Badge variant={factor.active ? 'sage' : 'neutral'} size="sm">
                  {factor.active ? 'Active' : 'Paused'}
                </Badge>
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
