const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

async function apiCall(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `API error ${res.status}`);
  }
  return res.json();
}

export const api = {
  analyzeCV: (cvText: string) =>
    apiCall('/api/agent1/analyze-cv', {
      method: 'POST',
      body: JSON.stringify({ cv_text: cvText }),
    }),

  scoreAssessment: (responses: Record<number, number>, userProfileSoFar: object) =>
    apiCall('/api/agent1/score-assessment', {
      method: 'POST',
      body: JSON.stringify({ responses, user_profile_so_far: userProfileSoFar }),
    }),

  matchCareers: (userProfile: object) =>
    apiCall('/api/agent2/match-careers', {
      method: 'POST',
      body: JSON.stringify({ user_profile: userProfile }),
    }),

  generatePDF: async (userProfile: object, careerMatches: object[], userName: string) => {
    const res = await fetch(`${API_BASE}/api/pdf/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_profile: userProfile, career_matches: careerMatches, user_name: userName }),
    });
    if (!res.ok) throw new Error(`PDF generation failed: ${res.statusText}`);
    return res.blob();
  },

  captureOptIn: (email: string, userName: string) =>
    apiCall('/api/optin', {
      method: 'POST',
      body: JSON.stringify({ email, user_name: userName }),
    }),

  getQuestions: () => apiCall('/api/questions'),
};
