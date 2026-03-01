export interface Question {
  id: number;
  text: string;
  section: 'big_five' | 'holland' | 'it_prefs';
  trait: string;
  reverse: boolean;
}

export interface UserProfile {
  hard_skills: string[];
  soft_skills_confirmed: string[];
  experience_years: number;
  current_role: string;
  education_level: string;
  career_goals: string[];
  personality_traits: Record<string, { score: number; level: string }>;
  work_style: Record<string, { score: number; level: string }>;
  work_values: Record<string, { score: number; level: string }>;
}

export interface CareerMatch {
  career_id: string;
  role_name: string;
  role_family: string;
  final_score: number;
  skills_score: number;
  personality_score: number;
  wsv_score: number;
  experience_score: number;
  matched_skills: string[];
  gap_skills: string[];
  avg_ramp_up_months: number;
  salary_range: { min: number; max: number; currency: string };
  salary_growth_yoy: string;
  growth_trajectory: string;
  justification: string;
  description_summary: string;
  full_content: string;
  seniority_level: string;
  // Zone B structured fields
  role_overview: string;
  responsibilities: string;
  required_skills: string[];
  career_progression: string[];
  compensation_bands: { Entry?: string; Mid?: string; Senior?: string; Lead?: string };
  what_makes_great: string;
}

export interface AppState {
  // Step tracking
  step: number;
  progress: number;

  // CV data
  cvText: string;
  hardSkills: string[];
  softSkills: string[];
  cvMetadata: {
    experience_years: number;
    current_role: string;
    education_level: string;
    career_goals: string[];
  };

  // Assessment
  assessmentResponses: Record<number, number>;

  // Profile
  userProfile: UserProfile | null;

  // Career matches
  careerMatches: CareerMatch[];
  selectedCareer: CareerMatch | null;

  // Actions
  setCvText: (text: string) => void;
  setHardSkills: (skills: string[]) => void;
  setSoftSkills: (skills: string[]) => void;
  setCvMetadata: (meta: AppState['cvMetadata']) => void;
  setAssessmentResponse: (questionId: number, answer: number) => void;
  setUserProfile: (profile: UserProfile) => void;
  setCareerMatches: (matches: CareerMatch[]) => void;
  setSelectedCareer: (career: CareerMatch | null) => void;
  setStep: (step: number) => void;
  reset: () => void;
}
