'use client';

import React, { useEffect, useState } from 'react';
import { Globe } from 'lucide-react';
import { motion } from 'motion/react';
import { useDealerLanguage } from '../context/DealerLanguageContext';

export interface LanguageToggleProps {
  className?: string;
}

export default function LanguageToggle({ className = '' }: LanguageToggleProps) {
  const [mounted, setMounted] = useState(false);
  const { language, setLanguage, toggleLanguage, isTamil } = useDealerLanguage();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={`lang-toggle-skeleton ${className}`}
        style={{ width: 104, height: 28 }}
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      className={`lang-toggle-wrapper ${className}`}
      role="group"
      aria-label="Language selection / மொழி தேர்வு"
    >
      <button
        type="button"
        onClick={toggleLanguage}
        className="lang-toggle-button"
        title={isTamil ? "Switch to English / ஆங்கிலத்திற்கு மாறவும்" : "தமிழில் பார்க்க மாறவும் / Switch to Tamil"}
        aria-label={isTamil ? "Current language is Tamil. Click to switch to English" : "Current language is English. Click to switch to Tamil"}
      >
        <span className="lang-globe-icon-wrap" aria-hidden="true">
          <Globe className="w-3.5 h-3.5 lang-globe-icon" />
        </span>

        <span className="lang-segmented-track" aria-hidden="true">
          {/* Active sliding pill */}
          <motion.span
            className="lang-active-pill"
            layoutId="langPill"
            animate={{
              x: isTamil ? 38 : 0,
            }}
            transition={{ type: 'spring', stiffness: 450, damping: 32 }}
          />

          <span
            className={`lang-option ${!isTamil ? 'selected' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              if (isTamil) setLanguage('en');
            }}
          >
            EN
          </span>

          <span
            className={`lang-option ${isTamil ? 'selected' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              if (!isTamil) setLanguage('ta');
            }}
          >
            தமிழ்
          </span>
        </span>
      </button>
    </div>
  );
}
