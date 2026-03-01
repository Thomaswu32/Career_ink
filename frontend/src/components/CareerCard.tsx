'use client';

import React from 'react';
import { Clock, Banknote, ArrowRight, TrendingUp } from 'lucide-react';
import { SkillChip } from '@/components/SkillChip';
import type { CareerMatch } from '@/types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CareerCardProps {
  match: CareerMatch;
  rank: number;
  onViewDetails: (match: CareerMatch) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatSalary(salary: CareerMatch['salary_range']): string {
  if (!salary || typeof salary.min !== 'number') return 'N/A';
  const fmt = (n: number) =>
    n >= 1000 ? `${salary.currency}${(n / 1000).toFixed(0)}k` : `${salary.currency}${n}`;
  return `${fmt(salary.min)} – ${fmt(salary.max)}`;
}

function getRampLabel(months: number): string {
  if (!months || months < 1) return '< 1 month';
  if (months === 1) return '~1 month';
  return `~${months} month${months !== 1 ? 's' : ''}`;
}

// final_score is on 0-100 scale from backend
function getScoreColor(score: number): string {
  if (score >= 80) return '#22C55E';
  if (score >= 60) return '#1E90FF';
  if (score >= 40) return '#F59E0B';
  return '#EF4444';
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CareerCard({ match, rank, onViewDetails }: CareerCardProps) {
  // final_score is 0-100 — display directly without multiplying
  const scorePercent = Math.round(match.final_score);
  const topMatched = match.matched_skills.slice(0, 3);
  const topGaps = match.gap_skills.slice(0, 3);
  const scoreColor = getScoreColor(scorePercent);

  return (
    <article
      className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-[#1E90FF]/30 transition-all duration-200 flex flex-col gap-4"
      aria-label={`Career match: ${match.role_name}`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          {/* Rank + Role family */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#64748B] tabular-nums">
              #{rank}
            </span>
            <span className="inline-block px-2 py-0.5 rounded-full bg-[#F1F5F9] text-[#64748B] text-[11px] font-semibold uppercase tracking-wider">
              {match.role_family}
            </span>
            {match.seniority_level && (
              <span className="inline-block px-2 py-0.5 rounded-full bg-[#F8FAFC] text-[#A8B4C8] text-[11px] font-medium border border-[#E2E8F0]">
                {match.seniority_level}
              </span>
            )}
          </div>
          {/* Role name */}
          <h3 className="text-[20px] font-bold text-[#0A0F1E] leading-tight">
            {match.role_name}
          </h3>
        </div>

        {/* Match score */}
        <div className="flex flex-col items-end shrink-0">
          <span
            className="text-[28px] font-extrabold tabular-nums leading-none"
            style={{ color: scoreColor }}
          >
            {scorePercent}%
          </span>
          <span className="text-[11px] text-[#A8B4C8] font-medium mt-0.5">match</span>
        </div>
      </div>

      {/* Meta row: ramp-up + salary + growth */}
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
      {(topMatched.length > 0 || topGaps.length > 0) && (
        <div className="flex flex-col gap-2">
          {topMatched.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {topMatched.map((skill) => (
                <SkillChip key={skill} label={skill} variant="matched" />
              ))}
            </div>
          )}
          {topGaps.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {topGaps.map((skill) => (
                <SkillChip key={skill} label={skill} variant="gap" />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Justification */}
      {match.justification && (
        <p className="text-sm text-[#64748B] italic border-l-2 border-[#1E90FF] pl-3 leading-relaxed">
          {match.justification}
        </p>
      )}

      {/* Footer: CTA */}
      <div className="flex justify-end pt-1">
        <button
          type="button"
          onClick={() => onViewDetails(match)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-[#1E90FF] border border-[#1E90FF]/30 bg-transparent hover:bg-[#EFF6FF] hover:border-[#1E90FF] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E90FF] focus-visible:ring-offset-2"
          aria-label={`View full details for ${match.role_name}`}
        >
          View Full Details
          <ArrowRight size={14} aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}
