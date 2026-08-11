import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from './Logo';
import { ShieldCheck, Heart } from 'lucide-react';
import { ROUTES } from '../../utils/constants';

export function Footer() {
  return (
    <footer className="w-full bg-card-warm border-t border-card-warm-border py-12 md:py-16 text-brand-dark transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-10 pb-8 border-b border-muted-border/60">
          <div className="space-y-3 max-w-md">
            <Logo />
            <p className="text-body-md text-muted-text leading-relaxed">
              Track everyday factors, understand your personal patterns, and receive proactive risk insights and guidance.
            </p>
          </div>

          <nav className="flex flex-wrap items-center gap-6 sm:gap-8 text-body-md text-muted-text font-medium" aria-label="Footer navigation">
            <Link to={ROUTES.HOW_IT_WORKS} className="hover:text-brand-dark transition-colors">
              How It Works
            </Link>
            <Link to={ROUTES.SETTINGS} className="hover:text-brand-dark transition-colors">
              Privacy
            </Link>
            <Link to={ROUTES.HOW_IT_WORKS} className="hover:text-brand-dark transition-colors">
              Terms
            </Link>
            <Link to={ROUTES.CHAT} className="hover:text-brand-dark transition-colors">
              Contact
            </Link>
          </nav>
        </div>

        {/* Bottom medical disclaimer & copyright */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-meta-sm text-muted-text">
          <p className="text-center md:text-left leading-relaxed max-w-2xl">
            MigraineGuardian is intended for wellness, tracking, and educational support. It does not diagnose medical conditions or replace professional medical advice.
          </p>
          <div className="flex items-center gap-1 text-meta-sm text-muted-text-dark font-medium flex-shrink-0">
            <span>© {new Date().getFullYear()} MigraineGuardian. Track. Understand. Prevent.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

