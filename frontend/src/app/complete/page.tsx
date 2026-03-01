'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Trophy,
  Download,
  Loader2,
  AlertCircle,
  RotateCcw,
  Bell,
  CheckCircle,
  Clock,
  Banknote,
} from 'lucide-react';
import ProgressBar from '@/components/ProgressBar';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import type { CareerMatch } from '@/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatSalary(salary: CareerMatch['salary_range']): string {
  if (!salary || typeof salary.min !== 'number') return 'N/A';
  const fmt = (n: number) =>
    n >= 1000 ? `${salary.currency}${(n / 1000).toFixed(0)}k` : `${salary.currency}${n}`;
  return `${fmt(salary.min)} – ${fmt(salary.max)}`;
}

function getRampLabel(months: number): string {
  if (!months || months < 1) return '< 1 mo';
  return `~${months} mo`;
}

// final_score is 0-100 scale from backend
function getScoreColor(score: number): string {
  if (score >= 80) return '#22C55E';
  if (score >= 60) return '#1E90FF';
  if (score >= 40) return '#F59E0B';
  return '#EF4444';
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ─── Summary Table ────────────────────────────────────────────────────────────

function SummaryTable({ matches }: { matches: CareerMatch[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[#E2E8F0]">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-[#0A0F1E]">
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#A8B4C8] uppercase tracking-wider w-10">
              #
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#A8B4C8] uppercase tracking-wider">
              Role
            </th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-[#A8B4C8] uppercase tracking-wider">
              Match
            </th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-[#A8B4C8] uppercase tracking-wider hidden sm:table-cell">
              Ramp-up
            </th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-[#A8B4C8] uppercase tracking-wider hidden md:table-cell">
              Salary
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F1F5F9]">
          {matches.map((match, idx) => {
            // final_score is 0-100 — display directly
            const scorePercent = Math.round(match.final_score);
            const scoreColor = getScoreColor(scorePercent);
            return (
              <tr
                key={match.career_id}
                className={idx === 0
                  ? 'bg-[#EFF6FF] hover:bg-[#DBEAFE] transition-colors'
                  : 'bg-white hover:bg-[#F8FAFC] transition-colors'}
              >
                <td className="px-4 py-3.5 text-[#A8B4C8] font-medium tabular-nums text-xs">
                  {idx + 1}
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-[#0A0F1E]">{match.role_name}</span>
                    <span className="text-xs text-[#A8B4C8]">{match.role_family}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-right">
                  <span
                    className="font-bold tabular-nums text-base"
                    style={{ color: scoreColor }}
                  >
                    {scorePercent}%
                  </span>
                </td>
                <td className="px-4 py-3.5 text-right text-[#64748B] hidden sm:table-cell">
                  <span className="flex items-center justify-end gap-1">
                    <Clock size={12} className="text-[#A8B4C8]" aria-hidden="true" />
                    {getRampLabel(match.avg_ramp_up_months)}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-right text-[#64748B] hidden md:table-cell">
                  <span className="flex items-center justify-end gap-1">
                    <Banknote size={12} className="text-[#A8B4C8]" aria-hidden="true" />
                    {formatSalary(match.salary_range)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CompletePage() {
  const router = useRouter();
  const {
    careerMatches,
    selectedCareer,
    userProfile,
    cvMetadata,
    reset,
    cvText,
  } = useStore();

  // PDF state
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfSuccess, setPdfSuccess] = useState(false);

  // Email opt-in state
  const [email, setEmail] = useState('');
  const [optInLoading, setOptInLoading] = useState(false);
  const [optInSuccess, setOptInSuccess] = useState(false);
  const [optInError, setOptInError] = useState<string | null>(null);

  // Guard: redirect if no data
  useEffect(() => {
    if (!cvText || cvText.trim().length === 0) {
      router.replace('/');
      return;
    }
    if (!careerMatches || careerMatches.length === 0) {
      router.replace('/careers');
    }
  }, [cvText, careerMatches, router]);

  // ── PDF download ───────────────────────────────────────────────────────────

  const handleDownloadPDF = useCallback(async () => {
    if (pdfLoading) return;
    setPdfError(null);
    setPdfSuccess(false);
    setPdfLoading(true);
    try {
      const userName = cvMetadata.current_role || 'Professional';
      const blob = await api.generatePDF(userProfile ?? {}, careerMatches, userName);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'careerink-report.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setPdfSuccess(true);
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : 'Failed to generate PDF. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  }, [pdfLoading, userProfile, careerMatches, cvMetadata]);

  // ── Email opt-in ───────────────────────────────────────────────────────────

  const handleOptIn = useCallback(async () => {
    if (!isValidEmail(email) || optInLoading || optInSuccess) return;
    setOptInError(null);
    setOptInLoading(true);
    try {
      await api.captureOptIn(email, cvMetadata.current_role || 'Professional');
      setOptInSuccess(true);
    } catch (err) {
      setOptInError(err instanceof Error ? err.message : 'Failed to subscribe. Please try again.');
    } finally {
      setOptInLoading(false);
    }
  }, [email, optInLoading, optInSuccess, cvMetadata]);

  const handleEmailKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') handleOptIn();
    },
    [handleOptIn]
  );

  // ── Reset ──────────────────────────────────────────────────────────────────

  const handleReset = useCallback(() => {
    reset();
    router.push('/');
  }, [reset, router]);

  if (!careerMatches || careerMatches.length === 0) return null;

  const topMatch = selectedCareer ?? careerMatches[0];
  // final_score is 0-100 — display directly
  const topScorePercent = Math.round(topMatch.final_score);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <ProgressBar step={6} progress={100} />

      <main className="max-w-2xl mx-auto px-6 pt-20 pb-16 flex flex-col gap-8">

        {/* Hero */}
        <header className="flex flex-col items-center gap-4 py-8 text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#1E90FF] to-[#00BFFF] flex items-center justify-center shadow-lg shadow-blue-200">
            <Trophy size={30} className="text-white" aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold text-[#0A0F1E] tracking-tight">
              Career Discovery Complete
            </h1>
            <p className="text-sm text-[#64748B] max-w-sm mx-auto leading-relaxed">
              Your personalised IT career report is ready.{' '}
              {selectedCareer
                ? `You selected ${selectedCareer.role_name} as your path.`
                : `Your top match is ${topMatch.role_name}.`}
            </p>
          </div>

          {/* Selected/top career highlight */}
          {topMatch && (
            <div className="flex items-center gap-4 px-6 py-4 bg-white border border-[#BFDBFE] rounded-2xl shadow-sm">
              <span
                className="text-3xl font-extrabold tabular-nums leading-none"
                style={{ color: getScoreColor(topScorePercent) }}
              >
                {topScorePercent}%
              </span>
              <div className="text-left">
                <p className="text-sm font-semibold text-[#0A0F1E]">{topMatch.role_name}</p>
                <p className="text-xs text-[#64748B]">{topMatch.role_family}</p>
              </div>
            </div>
          )}
        </header>

        {/* Summary table */}
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold text-[#0A0F1E]">All Career Matches</h2>
          <SummaryTable matches={careerMatches} />
        </section>

        {/* PDF download */}
        <section className="bg-white border border-[#E2E8F0] rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold text-[#0A0F1E]">Download Your Career Report</h2>
            <p className="text-sm text-[#64748B]">
              Get your complete career analysis as a PDF — match scores, salary ranges, ramp-up times,
              and personalised recommendations for your top career paths.
            </p>
          </div>

          {pdfError && (
            <div
              role="alert"
              className="px-4 py-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-sm text-[#EF4444] flex items-center gap-2"
            >
              <AlertCircle size={14} aria-hidden="true" />
              {pdfError}
            </div>
          )}

          {pdfSuccess && (
            <div className="flex items-center gap-2 px-4 py-3 bg-[#DCFCE7] border border-[#86EFAC] rounded-xl text-sm text-[#15803D] font-medium">
              <CheckCircle size={14} aria-hidden="true" />
              Report downloaded successfully!
            </div>
          )}

          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={pdfLoading}
            className={[
              'flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-semibold transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E90FF] focus-visible:ring-offset-2',
              !pdfLoading
                ? 'bg-[#1E90FF] text-white hover:bg-[#1578d4] shadow-sm hover:shadow-md cursor-pointer'
                : 'bg-[#93C5FD] text-white cursor-not-allowed',
            ].join(' ')}
          >
            {pdfLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                Generating your report…
              </>
            ) : (
              <>
                <Download size={16} aria-hidden="true" />
                Download Career Report (PDF)
              </>
            )}
          </button>
        </section>

        {/* Email opt-in */}
        <section className="bg-white border border-[#E2E8F0] rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] flex items-center justify-center shrink-0 mt-0.5">
              <Bell size={16} className="text-[#1E90FF]" aria-hidden="true" />
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-base font-semibold text-[#0A0F1E]">
                Get Notified When Skills Gap Analysis Launches
              </h2>
              <p className="text-sm text-[#64748B] leading-relaxed">
                We&apos;re building a personalised skills gap analyser. Be the first to know when it launches.
              </p>
            </div>
          </div>

          {optInSuccess ? (
            <div className="flex items-center gap-2.5 px-4 py-3 bg-[#DCFCE7] border border-[#86EFAC] rounded-xl text-sm text-[#15803D] font-medium">
              <CheckCircle size={16} aria-hidden="true" />
              You&apos;re on the list! We&apos;ll notify you at {email}.
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={handleEmailKeyDown}
                  placeholder="you@example.com"
                  disabled={optInLoading}
                  className="flex-1 px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm text-[#0A0F1E] placeholder:text-[#A8B4C8] focus:outline-none focus:ring-2 focus:ring-[#1E90FF] focus:border-transparent transition-all disabled:opacity-60"
                  aria-label="Email address for notification"
                />
                <button
                  type="button"
                  onClick={handleOptIn}
                  disabled={!isValidEmail(email) || optInLoading}
                  className={[
                    'px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E90FF] focus-visible:ring-offset-2',
                    isValidEmail(email) && !optInLoading
                      ? 'bg-[#0A0F1E] text-white hover:bg-[#1a2235] cursor-pointer'
                      : 'bg-[#F1F5F9] text-[#A8B4C8] cursor-not-allowed',
                  ].join(' ')}
                >
                  {optInLoading ? (
                    <Loader2 size={14} className="animate-spin mx-auto" aria-hidden="true" />
                  ) : (
                    'Notify Me'
                  )}
                </button>
              </div>

              {optInError && (
                <p className="text-xs text-[#EF4444] flex items-center gap-1">
                  <AlertCircle size={12} aria-hidden="true" />
                  {optInError}
                </p>
              )}
            </>
          )}
        </section>

        {/* Reset / start over */}
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-[#64748B] border border-[#E2E8F0] bg-white hover:bg-[#F1F5F9] hover:text-[#0A0F1E] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E90FF] focus-visible:ring-offset-2"
          >
            <RotateCcw size={14} aria-hidden="true" />
            Start New Assessment
          </button>
        </div>
      </main>
    </div>
  );
}
