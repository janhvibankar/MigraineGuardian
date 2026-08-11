import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../utils/cn';

export function Logo({ className, textClassName, iconSize = 32, linkTo = '/' }) {
  return (
    <Link
      to={linkTo}
      className={cn('inline-flex items-center gap-3 group select-none', className)}
      aria-label="MigraineGuardian Home"
    >
      {/* Bespoke Guardian Shield & Bio-Intelligence Crest */}
      <div className="relative flex items-center justify-center flex-shrink-0">
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_4px_16px_rgba(111,153,144,0.3)] rounded-[10px]"
        >
          <defs>
            {/* Rich Emerald Nightscape Tile Gradient */}
            <linearGradient id="mgLogoBg" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
              <stop stopColor="#1C2C25" />
              <stop offset="1" stopColor="#283C33" />
            </linearGradient>

            {/* Glowing Protective Shield Gradient */}
            <linearGradient id="mgShieldGrad" x1="18" y1="6" x2="18" y2="29" gradientUnits="userSpaceOnUse">
              <stop stopColor="#A8B9A5" />
              <stop offset="0.5" stopColor="#6F9990" />
              <stop offset="1" stopColor="#8A9D87" />
            </linearGradient>

            {/* Radiant Ambient Core Glow */}
            <radialGradient id="mgCoreGlow" cx="18" cy="18" r="8" gradientUnits="userSpaceOnUse">
              <stop stopColor="#6F9990" stopOpacity="0.8" />
              <stop offset="1" stopColor="#6F9990" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Squircle Tile with Subtle Highlight Border */}
          <rect width="36" height="36" rx="10" fill="url(#mgLogoBg)" />
          <rect
            x="0.75"
            y="0.75"
            width="34.5"
            height="34.5"
            rx="9.25"
            stroke="#6F9990"
            strokeOpacity="0.35"
            strokeWidth="1.5"
          />

          {/* Soft Radiant Ambient Glow */}
          <circle cx="18" cy="18" r="9" fill="url(#mgCoreGlow)" />

          {/* Guardian Shield Crest */}
          <path
            d="M18 7.5C18 7.5 12.5 9.5 10 10.2C10 17.5 12.2 24.2 18 28.5C23.8 24.2 26 17.5 26 10.2C23.5 9.5 18 7.5 18 7.5Z"
            stroke="url(#mgShieldGrad)"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="#1E2E27"
            fillOpacity="0.65"
          />

          {/* Neuro-Horizon Wave Curve */}
          <path
            d="M11 18C13 18 14.5 15 16 15C17.5 15 18.5 21 20 21C21.5 21 23 18 25 18"
            stroke="#6F9990"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity="0.85"
          />

          {/* Central Star Spark of Serenity & Clarity */}
          <path
            d="M18 12.5V23.5M12.5 18H23.5"
            stroke="#F7F6F2"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="18" cy="18" r="2.5" fill="#6F9990" stroke="#F7F6F2" strokeWidth="1" />
        </svg>
      </div>

      {/* Brand Name Typography */}
      <div className="flex items-center">
        <span
          className={cn(
            'text-section-md sm:text-app-lg font-bold text-brand-dark tracking-tight leading-none group-hover:text-brand-dark transition-colors',
            textClassName
          )}
        >
          Migraine<span className="text-brand-teal-dark font-medium">Guardian</span>
        </span>
      </div>
    </Link>
  );
}

export default Logo;
