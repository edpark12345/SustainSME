import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { ActivityBundle, CalculationResponse, CompanyProfile, YesNo } from '../types';
import { EMPTY_BUNDLE } from '../types';
import { SCOPE3_CATEGORIES } from '../data/scope3Categories';

// Categories treated as "relevant" as a fallback for the questionnaire stepper
// when a category is deep-linked before the relevance screen has been completed.
// Aligned with the office/services demo default (see defaultProfile + the office
// archetype in data/sectorArchetypes.ts) so the fallback never implies a
// category the engine can't compute.
export const DEMO_RELEVANT_IDS = [1, 3, 5, 6, 7];

interface AssessmentState {
  profile: CompanyProfile;
  setProfile: (p: Partial<CompanyProfile>) => void;
  /** relevance answers keyed by category id */
  relevance: Record<number, YesNo>;
  setRelevance: (id: number, value: YesNo) => void;
  /** set every Scope 3 category to the same answer (quick-select) */
  setRelevanceAll: (value: YesNo) => void;
  /** replace all relevance answers at once (e.g. sector-based prefill) */
  setRelevanceMap: (map: Record<number, YesNo>) => void;
  /** category ids marked relevant (Yes), in ascending order */
  relevantCategoryIds: number[];
  /** Scope 1 & 2 activity data extracted from uploaded documents (reviewable). */
  bundle: ActivityBundle;
  setBundle: (b: ActivityBundle) => void;
  /** Merge a freshly-extracted bundle into the current one (multiple uploads). */
  mergeBundle: (b: ActivityBundle) => void;
  /** Replace the Scope 3 spend lines (spend-based value-chain entry). */
  setScope3Spend: (lines: ActivityBundle['scope3_spend']) => void;
  /** Replace the Scope 3 Cat 5 waste lines. */
  setScope3Waste: (lines: ActivityBundle['scope3_waste']) => void;
  /** Replace the Scope 3 Cat 6 business-travel lines. */
  setScope3Travel: (lines: ActivityBundle['scope3_travel']) => void;
  /** Replace the Scope 3 Cat 7 commuting lines. */
  setScope3Commute: (lines: ActivityBundle['scope3_commute']) => void;
  /** Deterministic Scope 1 & 2 calculation results, once computed. */
  calc: CalculationResponse | null;
  setCalc: (c: CalculationResponse | null) => void;
}

const defaultProfile: CompanyProfile = {
  companyName: 'Halstead & Roe Legal B.V.',
  // Office/services archetype → only Scope 3 Cat 1, 3, 5, 6, 7 are relevant (all
  // computed by the engine), so the demo shows a complete coverage map with no
  // "to be included" placeholders. See data/sectorArchetypes.ts.
  sector: 'Business activities - Consultancy, legal, accounting, etc.',
  naceCode: '70',
  country: '',
  region: '',
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
  const [bundle, setBundle] = useState<ActivityBundle>(EMPTY_BUNDLE);
  const [calc, setCalc] = useState<CalculationResponse | null>(null);

  const mergeBundle = (b: ActivityBundle) =>
    setBundle((prev) => ({
      boundary: b.boundary?.sites?.length ? b.boundary : prev.boundary,
      scope2_electricity: [...prev.scope2_electricity, ...b.scope2_electricity],
      scope2_thermal: [...prev.scope2_thermal, ...b.scope2_thermal],
      scope1_stationary: [...prev.scope1_stationary, ...b.scope1_stationary],
      scope1_mobile: [...prev.scope1_mobile, ...b.scope1_mobile],
      scope1_fugitive: [...prev.scope1_fugitive, ...b.scope1_fugitive],
      // Preserve manually-entered Scope 3 lines (extraction does not produce them).
      scope3_spend: [...prev.scope3_spend, ...(b.scope3_spend ?? [])],
      scope3_waste: [...prev.scope3_waste, ...(b.scope3_waste ?? [])],
      scope3_travel: [...prev.scope3_travel, ...(b.scope3_travel ?? [])],
      scope3_commute: [...prev.scope3_commute, ...(b.scope3_commute ?? [])],
    }));

  const setScope3Spend = (lines: ActivityBundle['scope3_spend']) =>
    setBundle((prev) => ({ ...prev, scope3_spend: lines }));

  const setScope3Waste = (lines: ActivityBundle['scope3_waste']) =>
    setBundle((prev) => ({ ...prev, scope3_waste: lines }));

  const setScope3Travel = (lines: ActivityBundle['scope3_travel']) =>
    setBundle((prev) => ({ ...prev, scope3_travel: lines }));

  const setScope3Commute = (lines: ActivityBundle['scope3_commute']) =>
    setBundle((prev) => ({ ...prev, scope3_commute: lines }));

  const setProfile = (p: Partial<CompanyProfile>) =>
    setProfileState((prev) => ({ ...prev, ...p }));

  const setRelevance = (id: number, value: YesNo) =>
    setRelevanceState((prev) => ({ ...prev, [id]: value }));

  const setRelevanceAll = (value: YesNo) =>
    setRelevanceState(Object.fromEntries(SCOPE3_CATEGORIES.map((c) => [c.id, value])));

  const setRelevanceMap = (map: Record<number, YesNo>) => setRelevanceState(map);

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
    setRelevanceMap,
    relevantCategoryIds,
    bundle,
    setBundle,
    mergeBundle,
    setScope3Spend,
    setScope3Waste,
    setScope3Travel,
    setScope3Commute,
    calc,
    setCalc,
  };

  return <AssessmentContext.Provider value={value}>{children}</AssessmentContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAssessment() {
  const ctx = useContext(AssessmentContext);
  if (!ctx) throw new Error('useAssessment must be used within AssessmentProvider');
  return ctx;
}
