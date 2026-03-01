'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import ProgressBar from '@/components/ProgressBar';
import LikertScale from '@/components/LikertScale';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import type { Question } from '@/types';

// ─── Constants ───────────────────────────────────────────────────────────────

const AUTOSAVE_INTERVAL = 5; // every N questions answered
const LS_KEY = 'careerink-assessment-order';

// ─── Seeded shuffle (Mulberry32) ─────────────────────────────────────────────

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const rng = mulberry32(seed);
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function getOrCreateSeed(): number {
  if (typeof window === 'undefined') return 42;
  const stored = localStorage.getItem(LS_KEY);
  if (stored) return parseInt(stored, 10);
  const seed = Math.floor(Math.random() * 1_000_000);
  localStorage.setItem(LS_KEY, String(seed));
  return seed;
}

// ─── Progress bar (thin, question-level) ─────────────────────────────────────

function QuestionProgress({ current, total }: { current: number; total: number }) {
  const pct = total > 0 ? Math.round(((current) / total) * 100) : 0;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[#64748B]">
          Question{' '}
          <span className="text-[#0A0F1E] font-semibold">{current}</span>
          {' '}of{' '}
          <span className="text-[#0A0F1E] font-semibold">{total}</span>
        </span>
        <span className="text-xs text-[#A8B4C8]">{pct}%</span>
      </div>
      <div className="h-1 w-full bg-[#E2E8F0] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #1E90FF 0%, #00BFFF 100%)',
          }}
        />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AssessmentPage() {
  const router = useRouter();
  const {
    hardSkills,
    softSkills,
    cvMetadata,
    assessmentResponses,
    setAssessmentResponse,
    setUserProfile,
    setStep,
    cvText,
  } = useStore();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [orderedQuestions, setOrderedQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [scoring, setScoring] = useState(false);
  const [scoreError, setScoreError] = useState<string | null>(null);
  const answeredCountRef = useRef(0);

  // Guard: redirect if no skills
  useEffect(() => {
    if (!cvText || cvText.trim().length === 0) {
      router.replace('/');
    }
  }, [cvText, router]);

  // Fetch questions
  useEffect(() => {
    let mounted = true;
    async function loadQuestions() {
      try {
        const data = await api.getQuestions();
        const qs: Question[] = Array.isArray(data) ? data : data.questions ?? [];
        if (!mounted) return;
        setQuestions(qs);

        // Apply seeded shuffle
        const seed = getOrCreateSeed();
        setOrderedQuestions(seededShuffle(qs, seed));

        // Restore position from existing responses
        const answered = Object.keys(
          JSON.parse(localStorage.getItem('careerink-session') || '{}')?.state?.assessmentResponses ?? {}
        ).length;
        // Set current index to first unanswered question
        const shuffled = seededShuffle(qs, seed);
        const firstUnanswered = shuffled.findIndex((q) => !(q.id in (JSON.parse(localStorage.getItem('careerink-session') || '{}')?.state?.assessmentResponses ?? {})));
        setCurrentIdx(firstUnanswered >= 0 ? firstUnanswered : 0);
      } catch (err) {
        if (!mounted) return;
        setFetchError(err instanceof Error ? err.message : 'Failed to load questions.');
      } finally {
        if (mounted) setLoadingQuestions(false);
      }
    }
    loadQuestions();
    return () => { mounted = false; };
  }, []);

  const currentQuestion = orderedQuestions[currentIdx] ?? null;
  const total = orderedQuestions.length;
  const currentAnswer = currentQuestion ? (assessmentResponses[currentQuestion.id] ?? null) : null;

  // Autosave every N answers
  const handleAnswer = useCallback(
    (value: number) => {
      if (!currentQuestion) return;
      setAssessmentResponse(currentQuestion.id, value);
      answeredCountRef.current += 1;
      // zustand persist middleware handles the actual localStorage write
    },
    [currentQuestion, setAssessmentResponse]
  );

  const handleNext = useCallback(async () => {
    if (currentAnswer === null) return;

    if (currentIdx < total - 1) {
      setCurrentIdx((i) => i + 1);
      return;
    }

    // All done — score the assessment
    setScoring(true);
    setScoreError(null);
    try {
      const userProfileSoFar = {
        hard_skills: hardSkills,
        soft_skills_confirmed: softSkills,
        experience_years: cvMetadata.experience_years,
        current_role: cvMetadata.current_role,
        education_level: cvMetadata.education_level,
        career_goals: cvMetadata.career_goals,
      };
      const result = await api.scoreAssessment(assessmentResponses, userProfileSoFar);
      setUserProfile(result);
      setStep(4);
      // Clear shuffle seed so if user retakes, they get fresh order
      localStorage.removeItem(LS_KEY);
      router.push('/profile');
    } catch (err) {
      setScoreError(err instanceof Error ? err.message : 'Scoring failed. Please try again.');
    } finally {
      setScoring(false);
    }
  }, [
    currentAnswer,
    currentIdx,
    total,
    hardSkills,
    softSkills,
    cvMetadata,
    assessmentResponses,
    setUserProfile,
    setStep,
    router,
  ]);

  const handlePrev = useCallback(() => {
    if (currentIdx > 0) setCurrentIdx((i) => i - 1);
  }, [currentIdx]);

  const isLast = currentIdx === total - 1;

  // ── Loading state ──────────────────────────────────────────────────────────

  if (loadingQuestions) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <ProgressBar step={3} progress={25} />
        <div className="flex flex-col items-center gap-4 text-[#64748B]">
          <Loader2 size={32} className="animate-spin text-[#1E90FF]" aria-hidden="true" />
          <p className="text-sm font-medium">Loading assessment questions...</p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-6">
        <ProgressBar step={3} progress={25} />
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 max-w-md w-full flex flex-col items-center gap-4 text-center">
          <AlertCircle size={32} className="text-[#EF4444]" aria-hidden="true" />
          <p className="text-sm text-[#EF4444]">{fetchError}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-[#1E90FF] text-white text-sm font-semibold rounded-lg hover:bg-[#1578d4] transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return null;
  }

  // Progress for top ProgressBar: maps 3 + fractional within step 3
  const overallProgress = total > 0 ? Math.round(20 + ((currentIdx + 1) / total) * 50) : 20;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <ProgressBar step={3} progress={overallProgress} />

      <main className="max-w-2xl mx-auto px-6 pt-20 pb-16 flex flex-col gap-8">

        {/* Question progress indicator */}
        <QuestionProgress current={currentIdx + 1} total={total} />

        {/* Question card */}
        <section className="bg-white border border-[#E2E8F0] rounded-2xl p-8 flex flex-col gap-8 shadow-sm">
          <p
            className="text-[22px] font-semibold text-[#0A0F1E] text-center leading-snug"
            aria-live="polite"
            aria-atomic="true"
          >
            {currentQuestion.text}
          </p>

          <LikertScale
            value={currentAnswer as 1 | 2 | 3 | 4 | 5 | null}
            onChange={handleAnswer}
            disabled={scoring}
          />
        </section>

        {/* Error */}
        {scoreError && (
          <div
            role="alert"
            className="px-4 py-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-sm text-[#EF4444] flex items-center gap-2"
          >
            <AlertCircle size={14} aria-hidden="true" />
            {scoreError}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentIdx === 0 || scoring}
            className={[
              'inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E90FF] focus-visible:ring-offset-2',
              currentIdx > 0 && !scoring
                ? 'text-[#64748B] border border-[#E2E8F0] hover:bg-[#F1F5F9] hover:text-[#0A0F1E] cursor-pointer'
                : 'text-[#A8B4C8] border border-[#E2E8F0] cursor-not-allowed opacity-50',
            ].join(' ')}
            aria-label="Previous question"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            Previous
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={currentAnswer === null || scoring}
            className={[
              'inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E90FF] focus-visible:ring-offset-2',
              currentAnswer !== null && !scoring
                ? 'bg-[#1E90FF] text-white hover:bg-[#1578d4] shadow-sm cursor-pointer'
                : 'bg-[#F1F5F9] text-[#A8B4C8] cursor-not-allowed',
            ].join(' ')}
            aria-label={isLast ? 'Submit assessment' : 'Next question'}
          >
            {scoring ? (
              <>
                <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                Analyzing...
              </>
            ) : isLast ? (
              <>
                Submit
                <ArrowRight size={15} aria-hidden="true" />
              </>
            ) : (
              <>
                Next
                <ArrowRight size={15} aria-hidden="true" />
              </>
            )}
          </button>
        </div>

        {/* Hint */}
        <p className="text-xs text-center text-[#A8B4C8]">
          Your progress is saved automatically. You can close this tab and return later.
        </p>
      </main>
    </div>
  );
}
