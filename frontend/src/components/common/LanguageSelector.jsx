import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { Languages, Check, ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

export function LanguageSelector({ variant = 'default', className }) {
  const { language, setLanguage, languages } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const currentLangObj = languages.find((l) => l.code === language) || languages[0];

  const handleSelectLanguage = (langCode) => {
    setLanguage(langCode);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={cn('relative inline-block text-left', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-1.5 rounded-btn transition-colors duration-150 cursor-pointer select-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal',
          variant === 'compact'
            ? 'p-2 text-muted-text hover:text-brand-dark hover:bg-card-warm'
            : 'px-2.5 py-1.5 text-body-md font-medium text-brand-dark bg-card-warm/70 hover:bg-card-warm border border-card-warm-border'
        )}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`Select language. Current language is ${currentLangObj.label}`}
      >
        <Languages className="w-4 h-4 text-brand-teal flex-shrink-0" />
        {variant !== 'compact' && (
          <>
            <span className="font-semibold text-meta-md tracking-tight">
              {currentLangObj.nativeLabel}
            </span>
            <ChevronDown
              className={cn(
                'w-3.5 h-3.5 text-muted-text transition-transform duration-200',
                isOpen && 'rotate-180'
              )}
            />
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Language options"
          className={cn(
            'absolute right-0 mt-1.5 w-40 rounded-card-sm bg-white',
            'border border-muted-border shadow-soft-lg z-50 py-1.5 overflow-hidden',
            'animate-in fade-in slide-in-from-top-2 duration-150'
          )}
        >
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-text border-b border-muted-border/50 mb-1">
            Languages / भाषा
          </div>

          {languages.map((lang) => {
            const isSelected = lang.code === language;
            return (
              <button
                key={lang.code}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelectLanguage(lang.code)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 text-left text-meta-md transition-colors cursor-pointer',
                  isSelected
                    ? 'bg-brand-sage/20 text-brand-dark font-bold'
                    : 'text-brand-dark hover:bg-card-warm'
                )}
              >
                <div className="flex flex-col">
                  <span className="font-medium text-body-md leading-tight">
                    {lang.nativeLabel}
                  </span>
                  {lang.nativeLabel !== lang.label && (
                    <span className="text-[11px] text-muted-text">
                      {lang.label}
                    </span>
                  )}
                </div>

                {isSelected && (
                  <Check className="w-4 h-4 text-brand-teal flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default LanguageSelector;
