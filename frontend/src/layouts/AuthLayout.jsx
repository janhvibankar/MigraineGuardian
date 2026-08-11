import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Logo } from '../components/common/Logo';
import { ScrollToTop } from '../components/common/ScrollToTop';
import { ShieldCheck, Heart } from 'lucide-react';
import { ROUTES } from '../utils/constants';

export function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-canvas text-brand-dark px-4 py-8 md:py-12 selection:bg-brand-sage/30">
      <ScrollToTop />
      
      {/* Top Header */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between">
        <Logo />
        <Link
          to={ROUTES.HOME}
          className="text-body-md text-muted-text hover:text-brand-dark transition-colors"
        >
          Back to Overview
        </Link>
      </div>

      {/* Main Form Center Slot */}
      <div className="my-auto py-8 w-full max-w-5xl mx-auto">
        <Outlet />
      </div>

      {/* Bottom Quiet Footnote */}
      <div className="max-w-md mx-auto text-center space-y-2 pt-6">
        <div className="flex items-center justify-center gap-1.5 text-meta-sm text-muted-text">
          <ShieldCheck className="w-4 h-4 text-brand-teal" />
          <span>Encrypted client-side storage • No intrusive tracking</span>
        </div>
        <p className="text-[12px] text-muted-text-light">
          MigraineGuardian is designed for peaceful, privacy-preserving wellness.
        </p>
      </div>
    </div>
  );
}
