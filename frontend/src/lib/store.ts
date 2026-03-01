import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppState, UserProfile, CareerMatch } from '@/types';

const STEP_PROGRESS: Record<number, number> = {
  1: 10, 2: 20, 3: 70, 4: 85, 5: 90, 6: 100,
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      step: 1,
      progress: 10,
      cvText: '',
      hardSkills: [],
      softSkills: [],
      cvMetadata: { experience_years: 0, current_role: '', education_level: '', career_goals: [] },
      assessmentResponses: {},
      userProfile: null,
      careerMatches: [],
      selectedCareer: null,

      setCvText: (text) => set({ cvText: text }),
      setHardSkills: (skills) => set({ hardSkills: skills }),
      setSoftSkills: (skills) => set({ softSkills: skills }),
      setCvMetadata: (meta) => set({ cvMetadata: meta }),
      setAssessmentResponse: (questionId, answer) =>
        set((s) => ({
          assessmentResponses: { ...s.assessmentResponses, [questionId]: answer },
        })),
      setUserProfile: (profile) => set({ userProfile: profile }),
      setCareerMatches: (matches) => set({ careerMatches: matches }),
      setSelectedCareer: (career) => set({ selectedCareer: career }),
      setStep: (step) => set({ step, progress: STEP_PROGRESS[step] ?? 100 }),
      reset: () =>
        set({
          step: 1, progress: 10, cvText: '', hardSkills: [], softSkills: [],
          cvMetadata: { experience_years: 0, current_role: '', education_level: '', career_goals: [] },
          assessmentResponses: {}, userProfile: null, careerMatches: [], selectedCareer: null,
        }),
    }),
    { name: 'careerink-session' }
  )
);
