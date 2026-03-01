'use client';

import React from 'react';
import {
  ArrowLeft, ArrowRight, Clock, Banknote, TrendingUp,
  FileText, Target, Code2, Star, ChevronRight,
} from 'lucide-react';
import { SkillChip } from '@/components/SkillChip';
import type { CareerMatch } from '@/types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CareerDetailPanelProps {
  match: CareerMatch;
  onBack: () => void;
  onSelect: (match: CareerMatch) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatSalary(salary: CareerMatch['salary_range']): string {
  if (!salary || typeof salary.min !== 'number') return 'N/A';
  const fmt = (n: number) =>
    n >= 1000 ? `${salary.currency}${(n / 1000).toFixed(0)}k` : `${salary.currency}${n}`;
  return `${fmt(salary.min)} – ${fmt(salary.max)} / yr`;
}

function getRampLabel(months: number): string {
  if (!months || months < 1) return '< 1 month ramp-up';
  if (months === 1) return '~1 month ramp-up';
  return `~${months} months ramp-up`;
}

// final_score is on 0-100 scale from backend
function getScoreColor(score: number): string {
  if (score >= 80) return '#22C55E';
  if (score >= 60) return '#1E90FF';
  if (score >= 40) return '#F59E0B';
  return '#EF4444';
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CareerDetailPanel({ match, onBack, onSelect }: CareerDetailPanelProps) {
  // final_score is 0-100 — display directly without multiplying
  const scorePercent = Math.round(match.final_score);
  const scoreColor = getScoreColor(scorePercent);

  return (
    <div className="flex flex-col min-h-screen">
      {/* ── Zone A: Sticky summary ── */}
      <div className="sticky top-[41px] z-40 bg-white border-b border-[#E2E8F0] shadow-sm">
        <div className="max-w-3xl mx-auto px-6 py-5 flex flex-col gap-4">

          {/* Navigation row */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#64748B] hover:text-[#0A0F1E] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E90FF] rounded"
              aria-label="Back to all matches"
            >
              <ArrowLeft size={15} aria-hidden="true" />
              Back to All Matches
            </button>

            <button
              type="button"
              onClick={() => onSelect(match)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#1E90FF] text-white text-sm font-semibold hover:bg-[#1578d4] transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E90FF] focus-visible:ring-offset-2"
              aria-label={`Select ${match.role_name} as your career path`}
            >
              Select This Path
              <ArrowRight size={14} aria-hidden="true" />
            </button>
          </div>

          {/* Role name + score */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-block px-2 py-0.5 rounded-full bg-[#F1F5F9] text-[#64748B] text-[11px] font-semibold uppercase tracking-wider">
                  {match.role_family}
                </span>
                {match.seniority_level && (
                  <span className="inline-block px-2 py-0.5 rounded-full bg-[#F8FAFC] text-[#A8B4C8] text-[11px] font-medium border border-[#E2E8F0]">
                    {match.seniority_level}
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold text-[#0A0F1E] leading-tight">
                {match.role_name}
              </h2>
            </div>
            <div className="flex flex-col items-end shrink-0">
              <span
                className="text-3xl font-extrabold tabular-nums leading-none"
                style={{ color: scoreColor }}
              >
                {scorePercent}%
              </span>
              <span className="text-[11px] text-[#A8B4C8] font-medium mt-0.5">match score</span>
            </div>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-[#64748B]">
            <div className="flex items-center gap-1.5">
              <Clock size={14} className="text-[#A8B4C8]" aria-hidden="true" />
              <span>{getRampLabel(match.avg_ramp_up_months)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Banknote size={14} className="text-[#A8B4C8]" aria-hidden="true" />
              <span>{formatSalary(match.salary_range)}</span>
            </div>
            {match.growth_trajectory && (
              <div className="flex items-center gap-1.5">
                <TrendingUp size={14} className="text-[#A8B4C8]" aria-hidden="true" />
                <span>{match.growth_trajectory} growth</span>
              </div>
            )}
          </div>

          {/* Skills */}
          <div className="flex flex-col gap-2">
            {match.matched_skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {match.matched_skills.map((s) => (
                  <SkillChip key={s} label={s} variant="matched" />
                ))}
              </div>
            )}
            {match.gap_skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {match.gap_skills.map((s) => (
                  <SkillChip key={s} label={s} variant="gap" />
                ))}
              </div>
            )}
          </div>

          {/* Justification */}
          {match.justification && (
            <p className="text-sm text-[#64748B] italic border-l-2 border-[#1E90FF] pl-3 leading-relaxed">
              {match.justification}
            </p>
          )}
        </div>
      </div>

      {/* ── Zone B: Scrollable structured content ── */}
      <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
        <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col gap-8">

          {/* ── Role Overview ── */}
          {match.role_overview && (
            <section aria-labelledby="section-overview">
              <div className="flex items-center gap-2 mb-3">
                <FileText size={20} className="text-[#64748B] shrink-0" aria-hidden="true" />
                <h3
                  id="section-overview"
                  className="text-base font-semibold text-[#0A0F1E]"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  Role Overview
                </h3>
              </div>
              <hr className="border-t border-[#E2E8F0] mb-4" />
              <p className="text-sm text-[#64748B] leading-7">{match.role_overview}</p>
            </section>
          )}

          {/* ── Key Responsibilities ── */}
          {match.responsibilities && (
            <section aria-labelledby="section-responsibilities">
              <div className="flex items-center gap-2 mb-3">
                <Target size={20} className="text-[#64748B] shrink-0" aria-hidden="true" />
                <h3
                  id="section-responsibilities"
                  className="text-base font-semibold text-[#0A0F1E]"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  Key Responsibilities
                </h3>
              </div>
              <hr className="border-t border-[#E2E8F0] mb-4" />
              <ul className="flex flex-col gap-2">
                {match.responsibilities
                  .split(/(?<=[.!?])\s+/)
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .map((sentence, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#64748B] leading-6">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#1E90FF] shrink-0" aria-hidden="true" />
                      {sentence}
                    </li>
                  ))}
              </ul>
            </section>
          )}

          {/* ── Required Skills & Technologies ── */}
          {match.required_skills && match.required_skills.length > 0 && (
            <section aria-labelledby="section-skills">
              <div className="flex items-center gap-2 mb-3">
                <Code2 size={20} className="text-[#64748B] shrink-0" aria-hidden="true" />
                <h3
                  id="section-skills"
                  className="text-base font-semibold text-[#0A0F1E]"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  Required Skills &amp; Technologies
                </h3>
              </div>
              <hr className="border-t border-[#E2E8F0] mb-4" />
              <div className="flex flex-wrap gap-2">
                {match.required_skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-[#F1F5F9] text-[#334155] border border-[#E2E8F0]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* ── Career Progression ── */}
          {match.career_progression && match.career_progression.length > 0 && (
            <section aria-labelledby="section-progression">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={20} className="text-[#64748B] shrink-0" aria-hidden="true" />
                <h3
                  id="section-progression"
                  className="text-base font-semibold text-[#0A0F1E]"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  Career Progression
                </h3>
              </div>
              <hr className="border-t border-[#E2E8F0] mb-4" />
              <div className="flex flex-wrap items-center gap-1">
                {match.career_progression.map((step, i) => (
                  <React.Fragment key={i}>
                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] text-xs font-medium text-[#334155] shadow-sm">
                      {step}
                    </span>
                    {i < match.career_progression.length - 1 && (
                      <ChevronRight size={14} className="text-[#A8B4C8] shrink-0" aria-hidden="true" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </section>
          )}

          {/* ── Compensation ── */}
          {match.compensation_bands && Object.keys(match.compensation_bands).length > 0 && (
            <section aria-labelledby="section-compensation">
              <div className="flex items-center gap-2 mb-3">
                <Banknote size={20} className="text-[#64748B] shrink-0" aria-hidden="true" />
                <h3
                  id="section-compensation"
                  className="text-base font-semibold text-[#0A0F1E]"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  Compensation
                </h3>
              </div>
              <hr className="border-t border-[#E2E8F0] mb-4" />
              <div className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                        Seniority
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                        Compensation
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {(['Entry', 'Mid', 'Senior', 'Lead'] as const).map((band) =>
                      match.compensation_bands[band] ? (
                        <tr key={band} className="hover:bg-[#F8FAFC] transition-colors">
                          <td className="px-4 py-3 font-medium text-[#334155]">{band}</td>
                          <td className="px-4 py-3 text-[#64748B]">{match.compensation_bands[band]}</td>
                        </tr>
                      ) : null
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* ── What Makes a Great [Role Name] ── */}
          {match.what_makes_great && (
            <section aria-labelledby="section-great">
              <div className="flex items-center gap-2 mb-3">
                <Star size={20} className="text-[#64748B] shrink-0" aria-hidden="true" />
                <h3
                  id="section-great"
                  className="text-base font-semibold text-[#0A0F1E]"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  What Makes a Great {match.role_name}
                </h3>
              </div>
              <hr className="border-t border-[#E2E8F0] mb-4" />
              <p className="text-sm text-[#64748B] leading-7">{match.what_makes_great}</p>
            </section>
          )}

          {/* Fallback if no structured content */}
          {!match.role_overview && !match.responsibilities && !match.what_makes_great && (
            <div className="text-center text-[#A8B4C8] py-16 text-sm">
              No additional details available.
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
