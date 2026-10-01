import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Logo } from './Logo';
import { Button } from '../ui/Button';
import { LanguageSelector } from './LanguageSelector';
import { useTranslation } from '../../hooks/useTranslation';
import { ROUTES } from '../../utils/constants';
import { Menu, X, ArrowRight } from 'lucide-react';
import { cn } from '../../utils/cn';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { t } = useTranslation();

  const publicNavItems = [
    { label: t('nav.overview'), href: ROUTES.HOME },
    { label: t('nav.howItWorks'), href: ROUTES.HOW_IT_WORKS },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-canvas/90 backdrop-blur-md border-b border-muted-border/70 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Logo />

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
          {publicNavItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'px-3.5 py-2 text-body-md font-medium rounded-btn transition-colors duration-150',
                  isActive
                    ? 'text-brand-dark bg-card-warm border border-card-warm-border'
                    : 'text-muted-text hover:text-brand-dark hover:bg-card-warm/50'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Controls (Language Selector, CTA actions) */}
        <div className="hidden md:flex items-center space-x-2.5">
          <LanguageSelector />

          <div className="h-5 w-px bg-muted-border mx-1" />

          <Link to={ROUTES.LOGIN}>
            <Button variant="ghost" size="md">
              {t('nav.signIn')}
            </Button>
          </Link>
          <Link to={ROUTES.ONBOARDING}>
            <Button variant="primary" size="md" iconRight={ArrowRight}>
              {t('nav.beginJourney')}
            </Button>
          </Link>
        </div>

        {/* Mobile menu toggle & controls */}
        <div className="flex md:hidden items-center space-x-1 sm:space-x-2">
          <LanguageSelector variant="compact" />

          <Link to={ROUTES.LOGIN}>
            <Button variant="ghost" size="sm">
              {t('nav.signIn')}
            </Button>
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-btn text-brand-dark hover:bg-card-warm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown sheet */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-muted-border bg-canvas px-4 pt-3 pb-6 space-y-3 shadow-soft-md animate-in fade-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col space-y-1">
            {publicNavItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'px-4 py-3 text-body-md font-medium rounded-card-sm transition-colors',
                    isActive
                      ? 'text-brand-dark bg-card-warm font-semibold'
                      : 'text-muted-text hover:text-brand-dark hover:bg-card-warm/50'
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-muted-border/60 flex flex-col gap-2.5">
            <Link to={ROUTES.ONBOARDING} onClick={() => setMobileMenuOpen(false)}>
              <Button variant="primary" size="lg" className="w-full" iconRight={ArrowRight}>
                {t('nav.beginJourney')}
              </Button>
            </Link>
            <Link to={ROUTES.LOGIN} onClick={() => setMobileMenuOpen(false)}>
              <Button variant="secondary" size="md" className="w-full">
                {t('nav.signIn')}
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
