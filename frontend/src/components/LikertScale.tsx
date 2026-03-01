'use client';

import React from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface LikertScaleProps {
  value: 1 | 2 | 3 | 4 | 5 | null;
  onChange: (v: 1 | 2 | 3 | 4 | 5) => void;
  disabled?: boolean;
}

// ─── Label Sets ──────────────────────────────────────────────────────────────

const FULL_LABELS = [
  'Strongly Disagree',
  'Disagree',
  'Neutral',
  'Agree',
  'Strongly Agree',
] as const;

const SHORT_LABELS = ['SD', 'D', 'N', 'A', 'SA'] as const;

// ─── Component ───────────────────────────────────────────────────────────────

export default function LikertScale({ value, onChange, disabled = false }: LikertScaleProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Likert scale"
      className="flex flex-wrap sm:flex-nowrap gap-2 w-full"
    >
      {FULL_LABELS.map((fullLabel, idx) => {
        const numVal = (idx + 1) as 1 | 2 | 3 | 4 | 5;
        const isSelected = value === numVal;
        const shortLabel = SHORT_LABELS[idx];

        return (
          <button
            key={numVal}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={fullLabel}
            disabled={disabled}
            onClick={() => !disabled && onChange(numVal)}
            className={[
              // Base layout
              'flex-1 min-h-[44px] px-3 py-2 rounded-full border font-medium text-sm',
              'transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E90FF] focus-visible:ring-offset-2',
              // State styles
              isSelected
                ? 'bg-[#1E90FF] border-[#1E90FF] text-white shadow-sm'
                : disabled
                ? 'bg-transparent border-[#A8B4C8] text-[#64748B] opacity-50 cursor-not-allowed'
                : 'bg-transparent border-[#A8B4C8] text-[#64748B] hover:bg-[#EFF6FF] hover:border-[#1E90FF] hover:text-[#1E90FF] cursor-pointer',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {/* Full label on sm+ screens, short on mobile */}
            <span className="hidden sm:inline">{fullLabel}</span>
            <span className="inline sm:hidden">{shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
}
