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

// ── Scope 1 & 2 calculation pipeline (mirrors backend/schema.py) ────────────
export type Tier = 'primary' | 'spend' | 'estimated';

export interface ProvenanceFields {
  source_doc?: string | null;
  confidence?: number | null;
  notes?: string | null;
}

export interface Site {
  name: string;
  country: string;
  region?: string | null;
  tenure?: 'owned' | 'leased' | null;
  include_employee_housing?: boolean | null;
  /** Floor area — used to estimate Scope 2 electricity when no meter/bill exists. */
  floor_area_m2?: number | null;
  /** office / retail / warehouse / manufacturing / hospitality / other — drives EUI benchmark. */
  building_type?: string | null;
}

export interface CompanyBoundary {
  reporting_year?: number | null;
  basis?: 'calendar' | 'fiscal' | null;
  sector?: string | null;
  revenue?: number | null;
  revenue_currency?: string | null;
  employees_fte?: number | null;
  sites: Site[];
}

export interface Scope2Electricity extends ProvenanceFields {
  site?: string | null;
  period?: string | null;
  total_kwh?: number | null;
  grid_kwh?: number | null;
  captive_solar_kwh?: number | null;
  openaccess_renewable_kwh?: number | null;
  supplier?: string | null;
  tariff?: string | null;
  green_instrument?: string | null;
  demand_kw?: number | null;
  apparent_kva?: number | null;
}

export interface Scope2Thermal extends ProvenanceFields {
  site?: string | null;
  period?: string | null;
  carrier: 'heat' | 'steam' | 'cooling';
  energy_kwh?: number | null;
  /** True if this district heat is used for site heating — pooled against the heating benchmark. */
  is_heating?: boolean | null;
  /** Multi-fuel heating estimate only: this carrier's % share of the REMAINING heating load. */
  heating_share_pct?: number | null;
}

export type FuelType =
  | 'natural_gas' | 'lshs' | 'heating_oil' | 'diesel' | 'petrol' | 'lpg' | 'propane' | 'coal' | 'other';

export interface Scope1Stationary extends ProvenanceFields {
  site?: string | null;
  period?: string | null;
  fuel_type: FuelType;
  quantity?: number | null;
  unit?: string | null;
  /** True if this fuel is used for site heating — pooled against the heating benchmark. */
  is_heating?: boolean | null;
  /** Multi-fuel heating estimate only: this fuel's % share of the REMAINING heating load. */
  heating_share_pct?: number | null;
}

export interface Scope1Mobile extends ProvenanceFields {
  site?: string | null;
  period?: string | null;
  vehicle_or_fleet?: string | null;
  fuel_type: FuelType;
  quantity?: number | null;
  unit?: string | null;
  distance_km?: number | null;
  vehicle_count?: number | null;
}

export interface Scope1Fugitive extends ProvenanceFields {
  site?: string | null;
  period?: string | null;
  equipment?: string | null;
  refrigerant_type?: string | null;
  refill_kg?: number | null;
  charge_kg?: number | null;
  tonnage_tr?: number | null;
}

/** Spend-based (EEIO) Scope 3 line — categories 1, 2, 4, 9 (mirrors schema.py). */
export interface Scope3Spend extends ProvenanceFields {
  category: number; // GHG Protocol Scope 3 category (1, 2, 4 or 9)
  factor_key: string; // key into scope3_spend_factors.json
  amount?: number | null;
  currency?: string | null;
}

/** Scope 3 Cat 5 waste line (mirrors schema.py). */
export interface Scope3Waste extends ProvenanceFields {
  tonnes?: number | null;
  country?: string | null;
  building_type?: string | null;
  employees_fte?: number | null;
  treatment_mix?: Record<string, number> | null;
}

/** Scope 3 Cat 6 business travel line (mirrors schema.py). */
export interface Scope3Travel extends ProvenanceFields {
  mode: string; // air_short_haul, rail_national, car_average, hotel, …
  distance_km?: number | null;
  nights?: number | null;
  country?: string | null;
}

/** Scope 3 Cat 7 employee commuting line (mirrors schema.py). */
export interface Scope3Commute extends ProvenanceFields {
  mode?: string | null;
  employees_fte?: number | null;
  avg_round_trip_km_per_day?: number | null;
  working_days?: number | null;
  distance_km?: number | null;
}

export interface ActivityBundle {
  boundary: CompanyBoundary;
  scope2_electricity: Scope2Electricity[];
  scope2_thermal: Scope2Thermal[];
  scope1_stationary: Scope1Stationary[];
  scope1_mobile: Scope1Mobile[];
  scope1_fugitive: Scope1Fugitive[];
  scope3_spend: Scope3Spend[];
  scope3_waste: Scope3Waste[];
  scope3_travel: Scope3Travel[];
  scope3_commute: Scope3Commute[];
}

export interface EmissionResult {
  scope: '1' | '2' | '3';
  category: string;
  activity_label: string;
  raw_input: string;
  co2e_t: number;
  factor_value?: number | null;
  factor_unit?: string | null;
  factor_source?: string | null;
  tier: Tier;
  assumptions: string[];
}

export interface CalculationResponse {
  results: EmissionResult[];
  scope1_total_t: number;
  scope2_location_t: number;
  scope2_market_t: number;
  scope3_total_t: number;
  warnings: string[];
}

export interface Scope3Bucket {
  key: string;
  label: string;
  suggested_categories: number[];
  naics?: string | null;
  kg_co2e_per_usd: number;
}

export interface Scope3BucketsResponse {
  /** category number (as string) → human label */
  categories: Record<string, string>;
  currencies: string[];
  source: string;
  buckets: Scope3Bucket[];
}

export interface FactorMeta {
  grid: Record<string, unknown>;
  fuel: Record<string, unknown>;
  gwp: Record<string, unknown>;
  leak_rates: Record<string, unknown>;
  grid_countries: string[];
}

export const EMPTY_BUNDLE: ActivityBundle = {
  boundary: { sites: [] },
  scope2_electricity: [],
  scope2_thermal: [],
  scope1_stationary: [],
  scope1_mobile: [],
  scope1_fugitive: [],
  scope3_spend: [],
  scope3_waste: [],
  scope3_travel: [],
  scope3_commute: [],
};
