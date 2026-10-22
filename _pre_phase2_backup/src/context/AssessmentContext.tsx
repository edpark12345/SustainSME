import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { CompanyProfile, YesNo } from '../types';
import { SCOPE3_CATEGORIES } from '../data/scope3Categories';

// Categories shown as "relevant" in the Figma demo, used only as a fallback for
// the questionnaire stepper when a category is deep-linked before the relevance
// screen has been completed.
export const DEMO_RELEVANT_IDS = [1, 2, 5, 7, 8, 10, 11, 12, 14, 15];

interface AssessmentState {
  profile: CompanyProfile;
  setProfile: (p: Partial<CompanyProfile>) => void;
  /** relevance answers keyed by category id */
  relevance: Record<number, YesNo>;
  setRelevance: (id: number, value: YesNo) => void;
  /** set every Scope 3 category to the same answer (quick-select) */
  setRelevanceAll: (value: YesNo) => void;
  /** category ids marked relevant (Yes), in ascending order */
  relevantCategoryIds: number[];
}

const defaultProfile: CompanyProfile = {
  companyName: 'Meridian Foods B.V.',
  sector: 'Food & Beverage Manufacturing',
  naceCode: '10.89',
  country: 'Netherlands',
  region: 'Amsterdam',
  entitySize: 'Mid-corporate',
  reportingYear: '2024',
  employees: '480',
  revenue: '120',
  revenueCurrency: 'EUR',
  includeEmployeeHousing: 'no',
};

const AssessmentContext = createContext<AssessmentState | null>(null);

export function AssessmentProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<CompanyProfile>(defaultProfile);
  // Start unanswered so the relevance screen's "Next enables only when all 15
  // are answered" gating is real and demonstrable.
  const [relevance, setRelevanceState] = useState<Record<number, YesNo>>({});

  const setProfile = (p: Partial<CompanyProfile>) =>
    setProfileState((prev) => ({ ...prev, ...p }));

  const setRelevance = (id: number, value: YesNo) =>
    setRelevanceState((prev) => ({ ...prev, [id]: value }));

  const setRelevanceAll = (value: YesNo) =>
    setRelevanceState(Object.fromEntries(SCOPE3_CATEGORIES.map((c) => [c.id, value])));

  const relevantCategoryIds = useMemo(
    () =>
      SCOPE3_CATEGORIES.filter((c) => relevance[c.id] === 'yes').map((c) => c.id),
    [relevance],
  );

  const value: AssessmentState = {
    profile,
    setProfile,
    relevance,
    setRelevance,
    setRelevanceAll,
    relevantCategoryIds,
  };

  return <AssessmentContext.Provider value={value}>{children}</AssessmentContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAssessment() {
  const ctx = useContext(AssessmentContext);
  if (!ctx) throw new Error('useAssessment must be used within AssessmentProvider');
  return ctx;
}
