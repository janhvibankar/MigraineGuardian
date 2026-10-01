import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from './Logo';
import { ROUTES } from '../../utils/constants';
import { useTranslation } from '../../hooks/useTranslation';

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="w-full bg-card-warm border-t border-card-warm-border py-12 md:py-16 text-brand-dark transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-10 pb-8 border-b border-muted-border/60">
          <div className="space-y-3 max-w-md">
            <Logo />
            <p className="text-body-md text-muted-text leading-relaxed">
              {t('footer.tagline')}
            </p>
          </div>

          <nav className="flex flex-wrap items-center gap-6 sm:gap-8 text-body-md text-muted-text font-medium" aria-label="Footer navigation">
            <Link to={ROUTES.HOW_IT_WORKS} className="hover:text-brand-dark transition-colors">
              {t('footer.howItWorks')}
            </Link>
            <Link to={ROUTES.PRIVACY} className="hover:text-brand-dark transition-colors">
              {t('footer.privacy')}
            </Link>
            <Link to={ROUTES.TERMS} className="hover:text-brand-dark transition-colors">
              {t('footer.terms')}
            </Link>
            <Link to={ROUTES.CONTACT} className="hover:text-brand-dark transition-colors">
              {t('footer.contact')}
            </Link>
          </nav>
        </div>

        {/* Bottom medical disclaimer & copyright */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-meta-sm text-muted-text">
          <p className="text-center md:text-left leading-relaxed max-w-2xl">
            {t('footer.medicalDisclaimer')}
          </p>
          <div className="flex items-center gap-1 text-meta-sm text-muted-text-dark font-medium flex-shrink-0">
            <span>{t('footer.copyright', { year: new Date().getFullYear() })}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
