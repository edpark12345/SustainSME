// Shared domain types for the SustainSME platform (Phase 1, frontend only).

export type YesNo = 'yes' | 'no';

/** A single Scope 3 category as shown on the Relevance screen. */
export interface Scope3Category {
  id: number; // 1..15
  name: string;
  /** Short description shown under the title on the questionnaire card. */
  description: string;
  /** Longer hint shown on the relevance screen row. */
  relevanceHint: string;
  questions: CategoryQuestion[];
  /** Column definitions for the manual data-entry table fallback. */
  table: DataEntryColumn[];
  /** Filename label shown in the Excel download card. */
  templateFile: string;
}

/**
 * A gating question. `revealsChildOn` controls the inline follow-up question
 * (e.g. "If NO, ..."); `unlocksUploadOn` marks the question whose answer, when
 * matched, reveals the Excel download + upload section.
 */
export interface CategoryQuestion {
  id: string;
  text: string;
  /** If set, this question only appears when its parent has this answer. */
  parentId?: string;
  showWhenParent?: YesNo;
  /** When this answer is given, the Excel/upload section is unlocked. */
  unlocksUploadOn?: YesNo;
  optional?: boolean;
}

export interface DataEntryColumn {
  key: string;
  label: string;
  /** 'text' free entry, 'select' dropdown, 'number' numeric. */
  type: 'text' | 'select' | 'number';
  options?: string[];
  optional?: boolean;
}

export interface CompanyProfile {
  companyName: string;
  sector: string;
  /** NACE/ISIC sector code — gates spend-based (EEIO) mapping and the sector proxy. */
  naceCode: string;
  country: string;
  region: string;
  entitySize: string;
  reportingYear: string;
  employees: string;
  revenue: string;
  /** Currency of the revenue/spend figures — needed for EEIO factor normalisation. */
  revenueCurrency: string;
  /** Operational-boundary flag: include employee housing / staff colony in scope? */
  includeEmployeeHousing: YesNo;
}

// ───────────────────────────────────────────────────────────────────────────
// Phase-2 calculation contract — the shared types between the (future) Phase-5
// calculation engine and the frontend. Spec: ../../EMISSION_METHODOLOGY.md.
// TYPE-ONLY: these add no runtime code and do not affect the Phase-1 dummy-data
// frontend. They define the contract the engine produces and the UI will consume
// in place of src/data/dummyData.ts.
// ───────────────────────────────────────────────────────────────────────────

export type Scope = 'S1' | 'S2' | 'S3';

/** Method ladder (best→coarsest). One axis; the resolver picks the highest rung
 *  a line's data supports. See EMISSION_METHODOLOGY §5. */
export type CalcMethod = 'supplier_specific' | 'activity' | 'spend' | 'proxy';

/** PCAF-style data-quality tier, 1 = best … 5 = screening-grade. §6 */
export type DataQualityTier = 1 | 2 | 3 | 4 | 5;

/** Triage outcome from ingestion/resolution. §8 */
export type LineStatus = 'resolved' | 'review' | 'gap';

/** A resolved emission factor applied to a line. §3 */
export interface EmissionFactor {
  key: string; // e.g. 'grid_in_KA', 'eeio_basic_metals'
  value: number;
  unit: string; // e.g. 'kgCO2e/kWh', 'kgCO2e/EUR', 'GWP'
  source: string; // provenance / dataset
  region?: string; // ISO region the factor represents
  year?: number; // factor base/reference year
  setVersion: string; // FactorSet version, for reproducibility
}

/** Replaceable factor set: client override takes precedence over bundled default. §3 */
export interface FactorSet {
  id: string;
  version: string;
  origin: 'default' | 'client';
  factors: EmissionFactor[];
}

/** The canonical activity line. Every input normalises into this; the calc is a
 *  pure function over a list of these. §2 */
export interface ActivityLine {
  lineId: string;
  sourceFile: string;
  locator: string; // page / sheet!cell — provenance
  period: string; // month or FY
  scope: Scope;
  category: string; // GHG-Protocol category
  activity: string; // human description
  quantity: number | null; // physical or monetary amount (null = gap)
  unit: string; // e.g. 'kWh', 'kg', 'EUR'
  boundary: string; // plant / colony / fleet / excluded
  method: CalcMethod;
  dataQuality: DataQualityTier;
  factor?: EmissionFactor; // resolved factor (absent → gap)
  emissionsTCO2e: number | null; // computed (null until resolved)
  status: LineStatus;
  flags: string[]; // assumptions, conversions, warnings
  mappingConfidence?: number; // 0–1, from AI mapping (§8.1)
}

// ── Engine outputs — mirror the shapes the UI already renders (dummyData.ts),
//    so the engine is a drop-in replacement. Presentation-only fields (e.g.
//    chart colors) are added by the UI, not the engine. §10 ──

export interface ScopeTotal {
  scope: string; // 'Scope 1' | 'Scope 2' | 'Scope 3'
  label: string;
  value: number; // tCO2e
}

export interface Scope3BreakdownItem {
  category: string;
  value: number; // tCO2e
}

export interface EmissionsTrendPoint {
  year: string;
  scope1: number;
  scope2: number;
  scope3: number;
}

/** Inventory-level data-quality summary. §6 */
export interface DataQualitySummary {
  inventoryScore: number; // emissions-weighted mean tier (1–5)
  coverageByTier: Partial<Record<DataQualityTier, number>>; // share of emissions per tier
}

/** What the engine returns for one company-year — the contract the UI consumes
 *  in place of dummyData.ts. */
export interface InventoryResult {
  company: string;
  reportingYear: string;
  totalTCO2e: number;
  scopeTotals: ScopeTotal[];
  scope3Breakdown: Scope3BreakdownItem[];
  trend: EmissionsTrendPoint[];
  ledger: ActivityLine[]; // the full auditable ledger
  dataQuality: DataQualitySummary;
  gaps: ActivityLine[]; // status === 'gap' — the client to-do list
  factorSetVersion: string; // reproducibility stamp
}
