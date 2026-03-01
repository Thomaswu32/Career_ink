'use client';

import React, { useState, useRef, KeyboardEvent } from 'react';
import { XCircle } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

type Variant = 'default' | 'matched' | 'gap';

interface SkillChipProps {
  label: string;
  variant?: Variant;
  onRemove?: () => void;
  /** Triggers the "shake" animation from parent (controlled externally via key) */
  shake?: boolean;
}

interface SkillInputProps {
  onAdd: (skill: string) => void;
  placeholder?: string;
}

// ─── Variant Styles ─────────────────────────────────────────────────────────

const VARIANT_STYLES: Record<Variant, string> = {
  default: 'bg-white border border-[#E2E8F0] text-[#64748B]',
  matched: 'bg-[#DCFCE7] border border-[#86EFAC] text-[#15803D]',
  gap: 'bg-[#FEF3C7] border border-[#FCD34D] text-[#B45309]',
};

// ─── SkillChip ───────────────────────────────────────────────────────────────

export function SkillChip({ label, variant = 'default', onRemove, shake = false }: SkillChipProps) {
  const [hovered, setHovered] = useState(false);
  const [shaking, setShaking] = useState(false);

  // React to external shake trigger
  React.useEffect(() => {
    if (shake) {
      setShaking(true);
      const t = setTimeout(() => setShaking(false), 600);
      return () => clearTimeout(t);
    }
  }, [shake]);

  return (
    <span
      className={[
        'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium select-none transition-all duration-150',
        VARIANT_STYLES[variant],
        shaking ? 'animate-shake' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {label}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label={`Remove ${label}`}
          className={[
            'ml-0.5 rounded-full transition-opacity duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E90FF]',
            hovered ? 'opacity-100' : 'opacity-0',
          ].join(' ')}
        >
          <XCircle
            size={14}
            className="stroke-current"
            aria-hidden="true"
          />
        </button>
      )}
    </span>
  );
}

// ─── SkillInput ──────────────────────────────────────────────────────────────

export function SkillInput({ onAdd, placeholder = 'Add a skill...' }: SkillInputProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = (raw: string) => {
    const trimmed = raw.trim().replace(/,$/, '').trim();
    if (trimmed.length > 0) {
      onAdd(trimmed);
    }
    setValue('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit(value);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    // Auto-commit on comma
    if (v.endsWith(',')) {
      commit(v);
    } else {
      setValue(v);
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border border-dashed border-[#A8B4C8] bg-transparent text-[#64748B] placeholder:text-[#A8B4C8] focus:outline-none focus:border-[#1E90FF] focus:text-[#0A0F1E] transition-colors duration-150 min-w-[120px]"
      aria-label="Add new skill"
    />
  );
}

// Default export for convenience
export default SkillChip;
