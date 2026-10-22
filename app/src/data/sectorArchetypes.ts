import type { YesNo } from '../types';

/**
 * Coarse business archetypes that pre-mark which Scope 3 categories are likely
 * relevant, so an SME confirms/adjusts a short list instead of answering all 15
 * from scratch. The user can still override every answer on the relevance screen.
 *
 * S1 & S2 are always assessed. Cat 3 (fuel/energy-related) auto-relates to S1/S2.
 * See EMISSION_METHODOLOGY.md — category scheme.
 */
export type Archetype =
  | 'office' | 'manufacturing' | 'retail' | 'transport'
  | 'construction' | 'realestate' | 'agriculture' | 'hospitality';

export const ARCHETYPE_LABEL: Record<Archetype, string> = {
  office: 'office / services',
  manufacturing: 'manufacturing / industry',
  retail: 'retail / wholesale',
  transport: 'transport & logistics',
  construction: 'construction',
  realestate: 'real estate',
  agriculture: 'agriculture / land use',
  hospitality: 'tourism & hospitality',
};

// Sector labels MUST match data/dummyData.ts SECTORS.
export const SECTOR_ARCHETYPE: Record<string, Archetype> = {
  'Business activities - Consultancy, legal, accounting, etc.': 'office',
  'Construction and civil engineering': 'construction',
  'Creative arts and entertainment activities': 'office',
  'Education and research': 'office',
  'Energy and utilities': 'manufacturing',
  'Finance - General': 'office',
  'Finance - Insurance and pension': 'office',
  'Health care and services': 'office',
  'Information technology': 'office',
  'Land use - Agriculture, forestry, and fishing': 'agriculture',
  'Manufacturing - Chemicals': 'manufacturing',
  'Manufacturing - Consumer goods': 'manufacturing',
  'Manufacturing - Food and beverages': 'manufacturing',
  'Manufacturing - Heavy industries': 'manufacturing',
  'Manufacturing - Other': 'manufacturing',
  'Membership organizations': 'office',
  'Non-governmental organization': 'office',
  'Other commercial service activities': 'office',
  'Pharmaceuticals': 'manufacturing',
  'Public administration': 'office',
  'Publishing activities': 'office',
  'Real estate activities': 'realestate',
  'Retail and wholesale': 'retail',
  'Telecommunication': 'office',
  'Tourism and hospitality': 'hospitality',
  'Transport and logistics': 'transport',
  'Warehousing': 'retail',
};

// Scope 3 category ids pre-marked YES per archetype (all others default NO).
export const ARCHETYPE_RELEVANT_CATEGORIES: Record<Archetype, number[]> = {
  office:        [1, 3, 5, 6, 7],
  manufacturing: [1, 2, 3, 4, 5, 6, 7],
  retail:        [1, 3, 4, 5, 6, 7],
  transport:     [1, 3, 4, 6, 7],
  construction:  [1, 2, 3, 4, 5, 6, 7],
  realestate:    [1, 3, 6, 7, 8, 13],
  agriculture:   [1, 3, 4, 5, 6, 7],
  hospitality:   [1, 3, 5, 6, 7],
};

export function archetypeForSector(sector: string | undefined | null): Archetype | null {
  if (!sector) return null;
  return SECTOR_ARCHETYPE[sector] ?? null;
}

/** Pre-filled Yes/No for all 15 Scope 3 categories based on the sector's archetype. */
export function defaultRelevanceForSector(
  sector: string | undefined | null,
): Record<number, YesNo> | null {
  const a = archetypeForSector(sector);
  if (!a) return null;
  const yes = new Set(ARCHETYPE_RELEVANT_CATEGORIES[a]);
  const out: Record<number, YesNo> = {};
  for (let id = 1; id <= 15; id++) out[id] = yes.has(id) ? 'yes' : 'no';
  return out;
}
