'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Cpu, Users } from 'lucide-react';
import ProgressBar from '@/components/ProgressBar';
import { SkillChip, SkillInput } from '@/components/SkillChip';
import { useStore } from '@/lib/store';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ShakeState {
  [skill: string]: boolean;
}

// ─── Skills Group ────────────────────────────────────────────────────────────

interface SkillGroupProps {
  title: string;
  icon: React.ReactNode;
  skills: string[];
  shakeMap: ShakeState;
  onRemove: (skill: string) => void;
  onAdd: (skill: string) => void;
  inputPlaceholder: string;
}

function SkillGroup({
  title,
  icon,
  skills,
  shakeMap,
  onRemove,
  onAdd,
  inputPlaceholder,
}: SkillGroupProps) {
  return (
    <section className="bg-white border border-[#E2E8F0] rounded-2xl p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-[#1E90FF]">{icon}</span>
        <h2 className="text-base font-semibold text-[#0A0F1E]">{title}</h2>
        <span className="ml-auto text-xs text-[#A8B4C8] font-medium tabular-nums">
          {skills.length} skill{skills.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Chips */}
      <div className="flex flex-wrap gap-2 min-h-[36px]">
        {skills.length === 0 && (
          <span className="text-xs text-[#A8B4C8] italic self-center">
            No skills extracted. Add some below.
          </span>
        )}
        {skills.map((skill) => (
          <SkillChip
            key={skill}
            label={skill}
            variant="default"
            shake={shakeMap[skill] ?? false}
            onRemove={() => onRemove(skill)}
          />
        ))}
        <SkillInput onAdd={onAdd} placeholder={inputPlaceholder} />
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SkillsPage() {
  const router = useRouter();
  const {
    cvText,
    hardSkills: storeHard,
    softSkills: storeSoft,
    setHardSkills,
    setSoftSkills,
    setStep,
  } = useStore();

  // Local editable copies
  const [hardSkills, setLocalHard] = useState<string[]>(storeHard);
  const [softSkills, setLocalSoft] = useState<string[]>(storeSoft);

  // Shake state: maps skill label → shake boolean
  const [hardShake, setHardShake] = useState<ShakeState>({});
  const [softShake, setSoftShake] = useState<ShakeState>({});

  const shakeTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Guard: if no CV text, send user back to start
  useEffect(() => {
    if (!cvText || cvText.trim().length === 0) {
      router.replace('/');
    }
  }, [cvText, router]);

  // Cleanup timers on unmount
  useEffect(() => {
    const timers = shakeTimers.current;
    return () => {
      Object.values(timers).forEach(clearTimeout);
    };
  }, []);

  // ── Trigger shake ──────────────────────────────────────────────────────────

  const triggerShake = useCallback(
    (skill: string, setter: React.Dispatch<React.SetStateAction<ShakeState>>) => {
      setter((prev) => ({ ...prev, [skill]: true }));
      if (shakeTimers.current[skill]) clearTimeout(shakeTimers.current[skill]);
      shakeTimers.current[skill] = setTimeout(() => {
        setter((prev) => ({ ...prev, [skill]: false }));
      }, 650);
    },
    []
  );

  // ── Hard skills handlers ───────────────────────────────────────────────────

  const handleAddHard = useCallback(
    (skill: string) => {
      const normalised = skill.trim();
      if (!normalised) return;
      if (hardSkills.some((s) => s.toLowerCase() === normalised.toLowerCase())) {
        triggerShake(normalised, setHardShake);
        return;
      }
      setLocalHard((prev) => [...prev, normalised]);
    },
    [hardSkills, triggerShake]
  );

  const handleRemoveHard = useCallback((skill: string) => {
    setLocalHard((prev) => prev.filter((s) => s !== skill));
  }, []);

  // ── Soft skills handlers ───────────────────────────────────────────────────

  const handleAddSoft = useCallback(
    (skill: string) => {
      const normalised = skill.trim();
      if (!normalised) return;
      if (softSkills.some((s) => s.toLowerCase() === normalised.toLowerCase())) {
        triggerShake(normalised, setSoftShake);
        return;
      }
      setLocalSoft((prev) => [...prev, normalised]);
    },
    [softSkills, triggerShake]
  );

  const handleRemoveSoft = useCallback((skill: string) => {
    setLocalSoft((prev) => prev.filter((s) => s !== skill));
  }, []);

  // ── Continue ───────────────────────────────────────────────────────────────

  const handleContinue = useCallback(() => {
    setHardSkills(hardSkills);
    setSoftSkills(softSkills);
    setStep(3);
    router.push('/assessment');
  }, [hardSkills, softSkills, setHardSkills, setSoftSkills, setStep, router]);

  const totalSkills = hardSkills.length + softSkills.length;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <ProgressBar step={2} progress={20} />

      <main className="max-w-2xl mx-auto px-6 pt-20 pb-16 flex flex-col gap-8">

        {/* Page header */}
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-[#0A0F1E] tracking-tight">
            Validate Your Skills
          </h1>
          <p className="text-sm text-[#64748B] leading-relaxed">
            We extracted the following skills from your CV. Remove any that don&apos;t apply,
            and add anything we missed.
          </p>
        </header>

        {/* Skill groups */}
        <SkillGroup
          title="Technical Skills"
          icon={<Cpu size={16} aria-hidden="true" />}
          skills={hardSkills}
          shakeMap={hardShake}
          onRemove={handleRemoveHard}
          onAdd={handleAddHard}
          inputPlaceholder="Add a technical skill..."
        />

        <SkillGroup
          title="Soft Skills"
          icon={<Users size={16} aria-hidden="true" />}
          skills={softSkills}
          shakeMap={softShake}
          onRemove={handleRemoveSoft}
          onAdd={handleAddSoft}
          inputPlaceholder="Add a soft skill..."
        />

        {/* Footer actions */}
        <div className="flex flex-col gap-3">
          {totalSkills === 0 && (
            <p className="text-xs text-[#F59E0B] text-center">
              Add at least one skill before continuing.
            </p>
          )}
          <button
            type="button"
            onClick={handleContinue}
            disabled={totalSkills === 0}
            className={[
              'w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-semibold transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E90FF] focus-visible:ring-offset-2',
              totalSkills > 0
                ? 'bg-[#1E90FF] text-white hover:bg-[#1578d4] shadow-sm hover:shadow-md cursor-pointer'
                : 'bg-[#F1F5F9] text-[#A8B4C8] cursor-not-allowed',
            ].join(' ')}
          >
            Continue
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </main>
    </div>
  );
}
