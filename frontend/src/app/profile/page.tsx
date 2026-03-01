'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle,
  ArrowRight,
  Loader2,
  AlertCircle,
  Briefcase,
  GraduationCap,
  Clock,
} from 'lucide-react';
import ProgressBar from '@/components/ProgressBar';
import { SkillChip } from '@/components/SkillChip';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';

// ─── Constants ───────────────────────────────────────────────────────────────

const BIG_FIVE_TRAITS = [
  'openness',
  'conscientiousness',
  'extraversion',
  'agreeableness',
  'neuroticism',
] as const;

const BIG_FIVE_LABELS: Record<string, string> = {
  openness: 'Openness',
  conscientiousness: 'Conscientiousness',
  extraversion: 'Extraversion',
  agreeableness: 'Agreeableness',
  neuroticism: 'Neuroticism',
};

const TRAIT_COLOR: Record<string, string> = {
  openness: '#1E90FF',
  conscientiousness: '#22C55E',
  extraversion: '#F59E0B',
  agreeableness: '#00BFFF',
  neuroticism: '#EF4444',
};

const LEVEL_STYLE: Record<string, { bg: string; text: string }> = {
  Low: { bg: '#FEF3C7', text: '#B45309' },
  Moderate: { bg: '#DBEAFE', text: '#1D4ED8' },
  High: { bg: '#DCFCE7', text: '#15803D' },
};

// RIASEC keys for Holland Code (stored in work_style)
const RIASEC_KEYS = ['realistic', 'investigative', 'artistic', 'social', 'enterprising', 'conventional'];

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white border border-[#E2E8F0] rounded-2xl p-6 flex flex-col gap-4">
      <h2 className="text-base font-semibold text-[#0A0F1E]">{title}</h2>
      {children}
    </section>
  );
}

function LevelBadge({ level }: { level: string }) {
  const style = LEVEL_STYLE[level] ?? { bg: '#F1F5F9', text: '#64748B' };
  return (
    <span
      className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {level}
    </span>
  );
}

function TraitBar({
  label,
  score,
  level,
  color,
  minVal = 4,
  maxVal = 20,
}: {
  label: string;
  score: number;
  level: string;
  color: string;
  minVal?: number;
  maxVal?: number;
}) {
  // Normalize raw score to 0-100% (Big Five: 4-20 scale → 0-100%)
  const range = maxVal - minVal;
  const pct = Math.min(100, Math.max(0, Math.round(((score - minVal) / range) * 100)));

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-[#0A0F1E] capitalize">{label}</span>
        <div className="flex items-center gap-2">
          <LevelBadge level={level} />
          <span className="text-xs text-[#A8B4C8] tabular-nums w-8 text-right">{pct}%</span>
        </div>
      </div>
      <div className="h-2 w-full bg-[#F1F5F9] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${label}: ${level}`}
        />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();
  const {
    userProfile,
    cvMetadata,
    hardSkills,
    softSkills,
    setCareerMatches,
    setStep,
    cvText,
  } = useStore();

  const [matching, setMatching] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);

  // Guard: redirect if no profile
  useEffect(() => {
    if (!cvText || cvText.trim().length === 0) {
      router.replace('/');
      return;
    }
    if (!userProfile) {
      router.replace('/assessment');
    }
  }, [cvText, userProfile, router]);

  const handleDiscoverCareers = useCallback(async () => {
    if (!userProfile || matching) return;
    setMatchError(null);
    setMatching(true);
    try {
      // Build correctly structured profile for Agent 2
      // userProfile contains top-level personality_traits, work_style, work_values
      // but hard_skills / soft_skills are stored separately in the Zustand store
      const profileForMatching = {
        hard_skills: hardSkills,
        soft_skills_confirmed: softSkills,
        experience_years: cvMetadata.experience_years,
        current_role: cvMetadata.current_role,
        education_level: cvMetadata.education_level,
        career_goals: cvMetadata.career_goals,
        personality_traits: userProfile.personality_traits,
        work_style: userProfile.work_style,
        work_values: userProfile.work_values,
      };

      const result = await api.matchCareers(profileForMatching);
      // Backend returns { career_matches: [...] }
      const matches = Array.isArray(result) ? result : result.career_matches ?? [];
      setCareerMatches(matches);
      setStep(5);
      router.push('/careers');
    } catch (err) {
      setMatchError(err instanceof Error ? err.message : 'Failed to match careers. Please try again.');
    } finally {
      setMatching(false);
    }
  }, [userProfile, hardSkills, softSkills, cvMetadata, matching, setCareerMatches, setStep, router]);

  if (!userProfile) return null;

  // Big Five from personality_traits (keys: openness, conscientiousness, extraversion, agreeableness, neuroticism)
  const personalityTraits = userProfile.personality_traits ?? {};
  // Holland Code RIASEC from work_style (keys: realistic, investigative, artistic, social, enterprising, conventional)
  const workStyle = userProfile.work_style ?? {};
  // IT Work Preferences from work_values (keys: collaboration, problem_solving, leadership_growth, dynamic_environment)
  const workValues = userProfile.work_values ?? {};

  const topSkills = hardSkills.slice(0, 15);

  // Holland Code: sort by score desc, take top 3 (High level)
  const hollandEntries = Object.entries(workStyle)
    .filter(([k]) => RIASEC_KEYS.includes(k))
    .sort(([, a], [, b]) => {
      const aData = a as { score: number; level: string };
      const bData = b as { score: number; level: string };
      return bData.score - aData.score;
    })
    .slice(0, 3) as [string, { score: number; level: string }][];

  // IT Work Preferences: all 4 dimensions
  const itPrefs = Object.entries(workValues)
    .filter(([k]) => ['collaboration', 'problem_solving', 'leadership_growth', 'dynamic_environment'].includes(k))
    .slice(0, 4) as [string, { score: number; level: string }][];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <ProgressBar step={4} progress={85} />

      <main className="max-w-2xl mx-auto px-6 pt-20 pb-16 flex flex-col gap-6">

        {/* Hero header */}
        <header className="flex flex-col items-center gap-3 py-6 text-center">
          <div className="w-14 h-14 rounded-full bg-[#DCFCE7] flex items-center justify-center">
            <CheckCircle size={28} className="text-[#22C55E]" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-[#0A0F1E] tracking-tight">
            Assessment Complete
          </h1>
          <p className="text-sm text-[#64748B]">
            Here&apos;s your professional profile. Review it before discovering your career matches.
          </p>
        </header>

        {/* Section 1: Professional Background */}
        <SectionCard title="Professional Background">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cvMetadata.current_role && (
              <div className="flex items-start gap-3">
                <Briefcase size={16} className="text-[#A8B4C8] mt-0.5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-xs text-[#A8B4C8] font-medium">Current Role</p>
                  <p className="text-sm text-[#0A0F1E] font-medium">{cvMetadata.current_role}</p>
                </div>
              </div>
            )}
            {cvMetadata.experience_years > 0 && (
              <div className="flex items-start gap-3">
                <Clock size={16} className="text-[#A8B4C8] mt-0.5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-xs text-[#A8B4C8] font-medium">Experience</p>
                  <p className="text-sm text-[#0A0F1E] font-medium">
                    {cvMetadata.experience_years} year{cvMetadata.experience_years !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            )}
            {cvMetadata.education_level && (
              <div className="flex items-start gap-3">
                <GraduationCap size={16} className="text-[#A8B4C8] mt-0.5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-xs text-[#A8B4C8] font-medium">Education</p>
                  <p className="text-sm text-[#0A0F1E] font-medium">{cvMetadata.education_level}</p>
                </div>
              </div>
            )}
          </div>
        </SectionCard>

        {/* Section 2: Technical Skills */}
        {topSkills.length > 0 && (
          <SectionCard title="Technical Skills">
            <div className="flex flex-wrap gap-2">
              {topSkills.map((skill) => (
                <SkillChip key={skill} label={skill} variant="matched" />
              ))}
              {hardSkills.length > 15 && (
                <span className="text-xs text-[#A8B4C8] self-center">
                  +{hardSkills.length - 15} more
                </span>
              )}
            </div>
          </SectionCard>
        )}

        {/* Section 2b: Soft Skills (if any) */}
        {softSkills.length > 0 && (
          <SectionCard title="Soft Skills">
            <div className="flex flex-wrap gap-2">
              {softSkills.slice(0, 10).map((skill) => (
                <SkillChip key={skill} label={skill} variant="default" />
              ))}
              {softSkills.length > 10 && (
                <span className="text-xs text-[#A8B4C8] self-center">
                  +{softSkills.length - 10} more
                </span>
              )}
            </div>
          </SectionCard>
        )}

        {/* Section 3: Big Five Personality Profile */}
        {Object.keys(personalityTraits).some((k) => BIG_FIVE_TRAITS.includes(k as typeof BIG_FIVE_TRAITS[number])) && (
          <SectionCard title="Personality Profile (Big Five)">
            <div className="flex flex-col gap-4">
              {BIG_FIVE_TRAITS.filter((t) => t in personalityTraits).map((trait) => {
                const data = personalityTraits[trait] as { score: number; level: string };
                return (
                  <TraitBar
                    key={trait}
                    label={BIG_FIVE_LABELS[trait] ?? trait}
                    score={data.score}
                    level={data.level}
                    color={TRAIT_COLOR[trait] ?? '#1E90FF'}
                    minVal={4}   // Big Five: 4 questions × min answer 1 = 4
                    maxVal={20}  // Big Five: 4 questions × max answer 5 = 20
                  />
                );
              })}
            </div>
          </SectionCard>
        )}

        {/* Section 4: Holland Code RIASEC — read from work_style */}
        {hollandEntries.length > 0 && (
          <SectionCard title="Career Interests (Holland Code)">
            <p className="text-xs text-[#A8B4C8]">Your top 3 RIASEC interest types</p>
            <div className="flex flex-wrap gap-2">
              {hollandEntries.map(([key, data]) => {
                const label = key.charAt(0).toUpperCase() + key.slice(1);
                // Holland scale: 3 questions × 1-5 = 3-15
                const pct = Math.round(((data.score - 3) / 12) * 100);
                return (
                  <span
                    key={key}
                    className="px-3 py-1.5 rounded-full text-sm font-semibold bg-[#EFF6FF] text-[#1E90FF] border border-[#BFDBFE] flex items-center gap-2"
                  >
                    {label}
                    <span className="text-xs font-normal text-[#93C5FD]">
                      {pct}%
                    </span>
                    <LevelBadge level={data.level} />
                  </span>
                );
              })}
            </div>
          </SectionCard>
        )}

        {/* Section 5: IT Work Preferences — read from work_values */}
        {itPrefs.length > 0 && (
          <SectionCard title="IT Work Preferences">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {itPrefs.map(([key, data]) => {
                const label = key
                  .split('_')
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(' ');
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]"
                  >
                    <span className="text-sm text-[#0A0F1E] font-medium">{label}</span>
                    <LevelBadge level={data.level} />
                  </div>
                );
              })}
            </div>
          </SectionCard>
        )}

        {/* Error */}
        {matchError && (
          <div
            role="alert"
            className="px-4 py-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-sm text-[#EF4444] flex items-center gap-2"
          >
            <AlertCircle size={14} aria-hidden="true" />
            {matchError}
          </div>
        )}

        {/* CTA */}
        <button
          type="button"
          onClick={handleDiscoverCareers}
          disabled={matching}
          className={[
            'w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-sm font-semibold transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E90FF] focus-visible:ring-offset-2',
            !matching
              ? 'bg-[#1E90FF] text-white hover:bg-[#1578d4] shadow-sm hover:shadow-md cursor-pointer'
              : 'bg-[#93C5FD] text-white cursor-not-allowed',
          ].join(' ')}
        >
          {matching ? (
            <>
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              Finding your career matches…
            </>
          ) : (
            <>
              Discover My Career Paths
              <ArrowRight size={16} aria-hidden="true" />
            </>
          )}
        </button>
      </main>
    </div>
  );
}
