import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { ROUTES } from '../utils/constants';
import {
  User,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Heart,
  LockKeyhole,
} from 'lucide-react';

import { authService } from '../services/authService';

export function SignupPage() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [consentAgreed, setConsentAgreed] = useState(false);

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Please enter your full name.';
    }

    if (!email.trim()) {
      newErrors.email = 'Please enter your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address format.';
    }

    if (!password) {
      newErrors.password = 'Please create a password.';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long.';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    if (!consentAgreed) {
      newErrors.consent = 'You must agree to the Terms and Privacy Policy to continue.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await authService.signup({
        name: fullName.trim(),
        email: email.trim(),
        password,
      });
      navigate(ROUTES.ONBOARDING);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center py-4 sm:py-8">
      {/* Left Column (Desktop Brand Message & Reassurance) */}
      <div className="lg:col-span-5 space-y-7 text-left">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-brand-sage/20 to-brand-teal/15 border border-brand-sage/50 text-meta-sm text-brand-dark shadow-sm">
          <span className="w-2 h-2 rounded-full bg-brand-teal animate-pulse" />
          <span className="font-semibold uppercase tracking-wider text-[11px]">Begin Your Journey</span>
        </div>

        <div className="space-y-3.5">
          <h1 className="text-app-xl sm:text-[34px] font-bold text-brand-dark tracking-tight leading-[1.2]">
            Take the first step toward proactive foresight.
          </h1>
          <p className="text-body-lg text-[#555B55] leading-relaxed">
            Create your confidential account in seconds. We do not collect clinical records or sensitive data during registration.
          </p>
        </div>

        {/* Feature Cards with Green Borders */}
        <div className="space-y-3">
          <div className="p-4 rounded-[16px] bg-gradient-to-r from-[#FAF9F5] to-[#F1EFEA] border-2 border-brand-sage/45 flex items-start gap-3.5 shadow-sm transition-all hover:border-brand-teal">
            <div className="w-8 h-8 rounded-lg bg-brand-sage/25 border border-brand-sage/50 flex items-center justify-center text-brand-dark flex-shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4 text-brand-teal" />
            </div>
            <div>
              <h4 className="text-meta-md font-bold text-brand-dark">Fast, Frictionless Account Setup</h4>
              <p className="text-meta-sm text-[#666C66] mt-0.5">Start in under 30 seconds with just your name and email.</p>
            </div>
          </div>

          <div className="p-4 rounded-[16px] bg-gradient-to-r from-[#FAF9F5] to-[#F1EFEA] border-2 border-brand-sage/45 flex items-start gap-3.5 shadow-sm transition-all hover:border-brand-teal">
            <div className="w-8 h-8 rounded-lg bg-brand-teal/20 border border-brand-teal/45 flex items-center justify-center text-brand-dark flex-shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4 text-brand-teal" />
            </div>
            <div>
              <h4 className="text-meta-md font-bold text-brand-dark">3-Minute Baseline Calibration</h4>
              <p className="text-meta-sm text-[#666C66] mt-0.5">Personalize tracking factors and baseline trigger thresholds.</p>
            </div>
          </div>

          <div className="p-4 rounded-[16px] bg-gradient-to-r from-[#FAF9F5] to-[#F1EFEA] border-2 border-brand-sage/45 flex items-start gap-3.5 shadow-sm transition-all hover:border-brand-teal">
            <div className="w-8 h-8 rounded-lg bg-brand-sage/25 border border-brand-sage/50 flex items-center justify-center text-brand-dark flex-shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4 text-brand-teal" />
            </div>
            <div>
              <h4 className="text-meta-md font-bold text-brand-dark">Zero Upfront Clinical Burdens</h4>
              <p className="text-meta-sm text-[#666C66] mt-0.5">No doctor prescriptions or medical records required.</p>
            </div>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="p-4 rounded-[18px] bg-white/80 border-2 border-brand-sage/40 space-y-1.5 shadow-sm">
          <div className="flex items-center gap-2 text-meta-sm font-bold text-brand-dark">
            <LockKeyhole className="w-4 h-4 text-brand-teal" />
            <span>Confidential & Private Promise</span>
          </div>
          <p className="text-meta-sm text-[#666C66] leading-relaxed">
            "Your health information deserves thoughtful handling. Zero third-party advertising or data monetization."
          </p>
        </div>
      </div>

      {/* Right Column (Signup Form Card) */}
      <div className="lg:col-span-7">
        <Card variant="warm" className="p-7 sm:p-9 md:p-10 space-y-6 shadow-[0_12px_40px_-10px_rgba(38,53,47,0.08)] border-2 border-brand-sage/60 hover:border-brand-teal rounded-[24px]">
          <CardHeader className="text-left pb-3 border-b border-brand-sage/30 space-y-1">
            <div className="flex items-center justify-between">
              <CardTitle as="h2" className="text-app-lg font-bold text-brand-dark">
                Create your account
              </CardTitle>
              <Badge variant="teal" size="sm">
                Get Started
              </Badge>
            </div>
            <CardDescription className="text-body-md text-[#555B55]">
              Join MigraineGuardian to begin gentle, evidence-based pattern tracking.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit} noValidate className="space-y-4 pt-1">
            <Input
              label="Full Name"
              id="signup-fullname"
              name="fullName"
              type="text"
              icon={User}
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: null }));
              }}
              placeholder="e.g. Sakshi"
              errorText={errors.fullName}
              required
            />

            <Input
              label="Email Address"
              id="signup-email"
              name="email"
              type="email"
              icon={Mail}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
              }}
              placeholder="name@domain.com"
              errorText={errors.email}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Password"
                id="signup-password"
                name="password"
                type="password"
                icon={Lock}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
                }}
                placeholder="Min 8 characters"
                errorText={errors.password}
                required
              />

              <Input
                label="Confirm Password"
                id="signup-confirm-password"
                name="confirmPassword"
                type="password"
                icon={Lock}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: null }));
                }}
                placeholder="Repeat password"
                errorText={errors.confirmPassword}
                required
              />
            </div>

            {/* Mandatory Consent Checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 text-meta-md text-[#555B55] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={consentAgreed}
                  onChange={(e) => {
                    setConsentAgreed(e.target.checked);
                    if (errors.consent) setErrors((prev) => ({ ...prev, consent: null }));
                  }}
                  className="rounded text-brand-teal focus:ring-brand-teal w-4 h-4 mt-0.5 flex-shrink-0 cursor-pointer"
                />
                <span className="leading-snug">
                  I agree to the <Link to={ROUTES.HOW_IT_WORKS} className="text-brand-dark underline font-semibold hover:text-brand-teal">Terms</Link> and <Link to={ROUTES.SETTINGS} className="text-brand-dark underline font-semibold hover:text-brand-teal">Privacy Policy</Link>.
                </span>
              </label>
              {errors.consent && (
                <p className="text-meta-sm text-alert-muted mt-1.5 font-medium" role="alert">
                  {errors.consent}
                </p>
              )}
            </div>

            {/* Primary Action Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-3 shadow-md"
              isLoading={isLoading}
              iconRight={ArrowRight}
            >
              Create Account & Proceed to Onboarding
            </Button>
          </form>

          {/* Social login placeholder */}
          <div className="pt-2">
            <div className="relative flex items-center justify-center my-3">
              <div className="border-t border-brand-sage/35 w-full" />
              <span className="bg-[#FAF9F5] px-3 text-[12px] uppercase tracking-wider text-muted-text font-semibold absolute">
                or
              </span>
            </div>

            <button
              type="button"
              disabled
              className="w-full py-2.5 px-4 rounded-[14px] border-2 border-brand-sage/40 bg-white/70 text-muted-text-dark text-meta-md font-semibold flex items-center justify-center gap-2.5 cursor-not-allowed opacity-75"
              title="Social login placeholder (Demo only)"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google (Demo only)</span>
            </button>
          </div>

          {/* Switch to Login */}
          <div className="pt-3 text-center text-body-md text-muted-text border-t border-brand-sage/30">
            <span>Already have an account? </span>
            <Link to={ROUTES.LOGIN} className="font-bold text-brand-dark hover:text-brand-teal hover:underline ml-1">
              Sign In
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
