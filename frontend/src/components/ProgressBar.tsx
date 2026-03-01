'use client';

import React from 'react';

const STEP_NAMES: Record<number, string> = {
  1: 'CV Input',
  2: 'Skills Validation',
  3: 'Assessment',
  4: 'Processing',
  5: 'Career Discovery',
  6: 'Complete',
};

interface ProgressBarProps {
  step: 1 | 2 | 3 | 4 | 5 | 6;
  progress: number; // 0–100
}

export default function ProgressBar({ step, progress }: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const stepName = STEP_NAMES[step] ?? 'Loading';

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#E2E8F0]">
      {/* Step label row */}
      <div className="flex items-center justify-between px-6 py-2">
        <div className="flex items-center gap-2">
          {/* Dot indicators */}
          <div className="hidden sm:flex items-center gap-1">
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <div
                key={s}
                className="w-1.5 h-1.5 rounded-full transition-colors duration-300"
                style={{
                  backgroundColor:
                    s < step
                      ? '#22C55E'
                      : s === step
                      ? '#1E90FF'
                      : '#E2E8F0',
                }}
              />
            ))}
          </div>
        </div>
        <span className="text-xs font-medium tracking-wide text-[#64748B]">
          Step{' '}
          <span className="text-[#0A0F1E] font-semibold">{step}</span>
          {' '}of 6 —{' '}
          <span className="text-[#0A0F1E] font-semibold">{stepName}</span>
        </span>
      </div>

      {/* Progress fill bar */}
      <div className="h-0.5 w-full bg-[#E2E8F0] overflow-hidden">
        <div
          className="h-full transition-all duration-700 ease-out"
          style={{
            width: `${clampedProgress}%`,
            background: 'linear-gradient(90deg, #1E90FF 0%, #00BFFF 100%)',
          }}
        />
      </div>
    </div>
  );
}
