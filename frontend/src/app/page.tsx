'use client';

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Lock, ArrowRight, Loader2, Check, Clock, Zap, ShieldCheck } from 'lucide-react';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';

// ─── Constants ───────────────────────────────────────────────────────────────

const MIN_CHARS = 500;

// ─── NavBar ──────────────────────────────────────────────────────────────────

function NavBar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#E2E8F0]">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="CareerInk"
            width={40}
            height={40}
            className="h-10 w-10 object-contain"
            priority
          />
        </div>

        {/* Auth buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-[#64748B] hover:text-[#0A0F1E] rounded-lg hover:bg-[#F1F5F9] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E90FF]"
          >
            Login
          </button>
          <button
            type="button"
            className="px-4 py-2 text-sm font-semibold text-[#1E90FF] border border-[#1E90FF]/40 rounded-lg hover:bg-[#EFF6FF] hover:border-[#1E90FF] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E90FF]"
          >
            Sign Up
          </button>
        </div>
      </div>
    </nav>
  );
}

// ─── Character Counter ───────────────────────────────────────────────────────

function CharCounter({ count }: { count: number }) {
  const meetsMin = count >= MIN_CHARS;
  return (
    <p
      className={[
        'flex items-center gap-1 text-xs font-medium transition-colors duration-200',
        meetsMin ? 'text-[#22C55E]' : count > 0 ? 'text-[#EF4444]' : 'text-[#A8B4C8]',
      ].join(' ')}
      aria-live="polite"
    >
      {count} / {MIN_CHARS} characters minimum
      {meetsMin && (
        <Check size={12} className="text-[#22C55E]" aria-hidden="true" />
      )}
    </p>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter();
  const { setCvText, setHardSkills, setSoftSkills, setCvMetadata, setStep } = useStore();

  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const charCount = text.length;
  const meetsMin = charCount >= MIN_CHARS;

  const handleAnalyze = useCallback(async () => {
    if (!meetsMin || loading) return;
    setError(null);
    setLoading(true);

    try {
      const result = await api.analyzeCV(text);

      // Persist to store
      setCvText(text);
      setHardSkills(result.hard_skills ?? []);
      // Backend now returns 'soft_skills' (renamed from soft_skills_raw)
      setSoftSkills(result.soft_skills ?? []);
      setCvMetadata({
        experience_years: result.experience_years ?? 0,
        current_role: result.current_role ?? '',
        education_level: result.education_level ?? '',
        career_goals: result.career_goals ?? [],
      });
      setStep(2);

      router.push('/skills');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze CV. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [text, meetsMin, loading, setCvText, setHardSkills, setSoftSkills, setCvMetadata, setStep, router]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && meetsMin && !loading) {
        handleAnalyze();
      }
    },
    [handleAnalyze, meetsMin, loading]
  );

  return (
    <>
      <NavBar />

      <main className="min-h-screen bg-[#F8FAFC] pt-16">
        <div className="max-w-2xl mx-auto px-6 pt-20 pb-16 flex flex-col items-center gap-10">

          {/* Hero */}
          <header className="text-center flex flex-col gap-4">
            <h1 className="text-[40px] font-bold text-[#0A0F1E] leading-tight tracking-tight">
              Discover Your Perfect{' '}
              <span
                style={{
                  background: 'linear-gradient(90deg, #1E90FF 0%, #00BFFF 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                IT Career Path
              </span>
            </h1>
            <p className="text-[18px] text-[#64748B] leading-relaxed max-w-lg mx-auto">
              Get personalised career recommendations in 30–45 minutes based on your skills
              and personality profile.
            </p>
          </header>

          {/* CV Input card */}
          <section className="w-full bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm flex flex-col gap-4">
            <label htmlFor="cv-input" className="text-sm font-semibold text-[#0A0F1E]">
              Your CV / Resume
            </label>

            <textarea
              id="cv-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Paste your CV or resume content here…"
              disabled={loading}
              rows={10}
              className="w-full min-h-48 px-4 py-3 border border-[#E2E8F0] rounded-xl text-sm text-[#0A0F1E] placeholder:text-[#A8B4C8] bg-white resize-y focus:outline-none focus:ring-2 focus:ring-[#1E90FF] focus:border-transparent transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed leading-relaxed"
              aria-label="CV content input"
              aria-describedby="char-counter security-note"
            />

            {/* Counter */}
            <div id="char-counter">
              <CharCounter count={charCount} />
            </div>

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="px-4 py-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-sm text-[#EF4444]"
              >
                {error}
              </div>
            )}

            {/* CTA */}
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={!meetsMin || loading}
              aria-disabled={!meetsMin || loading}
              className={[
                'w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-semibold transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E90FF] focus-visible:ring-offset-2',
                meetsMin && !loading
                  ? 'bg-[#1E90FF] text-white hover:bg-[#1578d4] shadow-sm hover:shadow-md cursor-pointer'
                  : 'bg-[#F1F5F9] text-[#A8B4C8] cursor-not-allowed',
              ].join(' ')}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                  Analysing your CV…
                </>
              ) : meetsMin ? (
                <>
                  Analyse My CV
                  <ArrowRight size={16} aria-hidden="true" />
                </>
              ) : (
                <>
                  <Lock size={16} aria-hidden="true" />
                  Analyse My CV
                </>
              )}
            </button>

            {/* Security note */}
            <p
              id="security-note"
              className="flex items-center justify-center gap-1.5 text-xs text-[#A8B4C8]"
            >
              <Lock size={11} aria-hidden="true" />
              Your data is processed securely and never stored or shared
            </p>
          </section>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-[#A8B4C8]">
            <span className="flex items-center gap-1.5">
              <Clock size={12} aria-hidden="true" />
              30–45 min assessment
            </span>
            <span className="w-1 h-1 rounded-full bg-[#E2E8F0]" aria-hidden="true" />
            <span className="flex items-center gap-1.5">
              <Zap size={12} aria-hidden="true" />
              AI-powered matching
            </span>
            <span className="w-1 h-1 rounded-full bg-[#E2E8F0]" aria-hidden="true" />
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={12} aria-hidden="true" />
              No account required
            </span>
          </div>
        </div>
      </main>
    </>
  );
}
