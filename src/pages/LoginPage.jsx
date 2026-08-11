import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { ROUTES } from '../utils/constants';
import {
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Heart,
  AlertCircle,
} from 'lucide-react';

import { authService } from '../services/authService';

export function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotMsg, setShowForgotMsg] = useState(false);

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Please enter your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      newErrors.password = 'Please enter your password.';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await authService.login(email.trim(), password);
      navigate(ROUTES.DASHBOARD);
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
          <span className="w-2 h-2 rounded-full bg-brand-sage animate-pulse" />
          <span className="font-semibold uppercase tracking-wider text-[11px]">Calm Digital Health</span>
        </div>

        <div className="space-y-3.5">
          <h1 className="text-app-xl sm:text-[34px] font-bold text-brand-dark tracking-tight leading-[1.2]">
            A calm digital space for your well-being.
          </h1>
          <p className="text-body-lg text-[#555B55] leading-relaxed">
            Sign in to check today's risk estimate, review longitudinal pattern insights, and record your 60-second micro-log.
          </p>
        </div>

        {/* Feature Highlights with Green Borders */}
        <div className="space-y-3">
          <div className="p-4 rounded-[16px] bg-gradient-to-r from-[#FAF9F5] to-[#F1EFEA] border-2 border-brand-sage/45 flex items-start gap-3.5 shadow-sm transition-all hover:border-brand-teal">
            <div className="w-8 h-8 rounded-lg bg-brand-teal/20 border border-brand-teal/45 flex items-center justify-center text-brand-dark flex-shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4 text-brand-teal" />
            </div>
            <div>
              <h4 className="text-meta-md font-bold text-brand-dark">Gentle Sensitivity Forecasting</h4>
              <p className="text-meta-sm text-[#666C66] mt-0.5">Non-alarmist early likelihood windows based on empirical habits.</p>
            </div>
          </div>

          <div className="p-4 rounded-[16px] bg-gradient-to-r from-[#FAF9F5] to-[#F1EFEA] border-2 border-brand-sage/45 flex items-start gap-3.5 shadow-sm transition-all hover:border-brand-teal">
            <div className="w-8 h-8 rounded-lg bg-brand-sage/25 border border-brand-sage/50 flex items-center justify-center text-brand-dark flex-shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4 text-brand-teal" />
            </div>
            <div>
              <h4 className="text-meta-md font-bold text-brand-dark">Zero 3rd-Party Trackers</h4>
              <p className="text-meta-sm text-[#666C66] mt-0.5">Your daily entries remain completely confidential and local.</p>
            </div>
          </div>

          <div className="p-4 rounded-[16px] bg-gradient-to-r from-[#FAF9F5] to-[#F1EFEA] border-2 border-brand-sage/45 flex items-start gap-3.5 shadow-sm transition-all hover:border-brand-teal">
            <div className="w-8 h-8 rounded-lg bg-brand-teal/20 border border-brand-teal/45 flex items-center justify-center text-brand-dark flex-shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4 text-brand-teal" />
            </div>
            <div>
              <h4 className="text-meta-md font-bold text-brand-dark">Sensory Ergonomics</h4>
              <p className="text-meta-sm text-[#666C66] mt-0.5">Low-contrast, warm canvas palette tailored for photophobia.</p>
            </div>
          </div>
        </div>

        {/* Highlighted copy */}
        <div className="p-4 rounded-[18px] bg-white/80 border-2 border-brand-sage/40 space-y-1.5 shadow-sm">
          <div className="flex items-center gap-2 text-meta-sm font-bold text-brand-dark">
            <ShieldCheck className="w-4 h-4 text-brand-teal" />
            <span>Privacy Promise</span>
          </div>
          <p className="text-meta-sm text-[#666C66] leading-relaxed">
            "Your health information deserves thoughtful handling. Protected by clinical-grade privacy."
          </p>
        </div>
      </div>

      {/* Right Column (Login Card) */}
      <div className="lg:col-span-7">
        <Card variant="warm" className="p-7 sm:p-9 md:p-10 space-y-6 shadow-[0_12px_40px_-10px_rgba(38,53,47,0.08)] border-2 border-brand-sage/60 hover:border-brand-teal rounded-[24px]">
          <CardHeader className="text-left pb-3 border-b border-brand-sage/30 space-y-1">
            <div className="flex items-center justify-between">
              <CardTitle as="h2" className="text-app-lg font-bold text-brand-dark">
                Sign in to your account
              </CardTitle>
              <Badge variant="sage" size="sm">
                Account Sign In
              </Badge>
            </div>
            <CardDescription className="text-body-md text-[#555B55]">
              Enter your email and password to access your dashboard.
            </CardDescription>
          </CardHeader>

          {showForgotMsg && (
            <div className="p-3.5 rounded-[14px] bg-brand-teal/15 border border-brand-teal/40 text-brand-dark text-meta-md flex items-center justify-between animate-in fade-in duration-200">
              <span>Password reset instructions simulated. Check your inbox.</span>
              <button
                type="button"
                onClick={() => setShowForgotMsg(false)}
                className="text-meta-sm underline hover:text-brand-dark font-semibold"
              >
                Dismiss
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4 pt-1">
            <Input
              label="Email Address"
              id="login-email"
              name="email"
              type="email"
              icon={Mail}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
              }}
              placeholder="e.g. name@domain.com"
              errorText={errors.email}
              required
            />

            <Input
              label="Password"
              id="login-password"
              name="password"
              type="password"
              icon={Lock}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
              }}
              placeholder="Enter your password"
              errorText={errors.password}
              required
            />

            {/* Actions: Remember me & Forgot Password */}
            <div className="flex items-center justify-between text-meta-sm pt-1">
              <label className="flex items-center gap-2 text-[#555B55] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-brand-teal focus:ring-brand-teal w-4 h-4 cursor-pointer"
                />
                <span className="font-medium">Remember on this device</span>
              </label>

              <button
                type="button"
                onClick={() => setShowForgotMsg(true)}
                className="text-brand-dark hover:text-brand-teal hover:underline font-semibold text-meta-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-teal rounded"
              >
                Forgot password?
              </button>
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
              Sign In to Dashboard
            </Button>
          </form>

          {/* Optional Social Login Placeholder */}
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
              title="Social login placeholder (Disabled)"
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

          {/* Switch to Signup */}
          <div className="pt-3 text-center text-body-md text-muted-text border-t border-brand-sage/30">
            <span>Don't have an account yet? </span>
            <Link to={ROUTES.SIGNUP} className="font-bold text-brand-dark hover:text-brand-teal hover:underline ml-1">
              Create an account
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
