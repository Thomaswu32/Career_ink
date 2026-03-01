'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import ProgressBar from '@/components/ProgressBar';
import CareerCard from '@/components/CareerCard';
import CareerDetailPanel from '@/components/CareerDetailPanel';
import { useStore } from '@/lib/store';
import type { CareerMatch } from '@/types';

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CareersPage() {
  const router = useRouter();
  const { careerMatches, setSelectedCareer, setStep, cvText, userProfile } = useStore();

  const [selectedForDetail, setSelectedForDetail] = useState<CareerMatch | null>(null);

  // Guard: redirect if no data
  useEffect(() => {
    if (!cvText || cvText.trim().length === 0) {
      router.replace('/');
      return;
    }
    if (!userProfile) {
      router.replace('/assessment');
      return;
    }
    if (!careerMatches || careerMatches.length === 0) {
      router.replace('/profile');
    }
  }, [cvText, userProfile, careerMatches, router]);

  const handleViewDetails = useCallback((match: CareerMatch) => {
    setSelectedForDetail(match);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleBack = useCallback(() => {
    setSelectedForDetail(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSelectPath = useCallback(
    (match: CareerMatch) => {
      setSelectedCareer(match);
      setStep(6);
      router.push('/complete');
    },
    [setSelectedCareer, setStep, router]
  );

  if (!careerMatches || careerMatches.length === 0) {
    return null;
  }

  // ── Detail panel view ──────────────────────────────────────────────────────

  if (selectedForDetail) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <ProgressBar step={5} progress={90} />
        <div className="pt-[41px]">
          <CareerDetailPanel
            match={selectedForDetail}
            onBack={handleBack}
            onSelect={handleSelectPath}
          />
        </div>
      </div>
    );
  }

  // ── List view ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <ProgressBar step={5} progress={90} />

      <main className="max-w-2xl mx-auto px-6 pt-20 pb-16 flex flex-col gap-8">

        {/* Header */}
        <header className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#0A0F1E] tracking-tight">
              Your Top Career Matches
            </h1>
            <span className="px-2.5 py-1 rounded-full bg-[#DBEAFE] text-[#1E90FF] text-xs font-semibold">
              {careerMatches.length} match{careerMatches.length !== 1 ? 'es' : ''} found
            </span>
          </div>
          <p className="text-sm text-[#64748B]">
            Based on your skills and personality profile. Click any card to explore the full role details.
          </p>
        </header>

        {/* Career cards */}
        <div className="flex flex-col gap-4">
          {careerMatches.map((match, idx) => (
            <CareerCard
              key={match.career_id}
              match={match}
              rank={idx + 1}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>

        {/* Empty state (defensive) */}
        {careerMatches.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <AlertCircle size={28} className="text-[#A8B4C8]" aria-hidden="true" />
            <p className="text-sm text-[#64748B]">No career matches found. Please try again.</p>
          </div>
        )}
      </main>
    </div>
  );
}
