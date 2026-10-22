// Realistic placeholder data so dashboards and charts look real in a demo.
// All values are illustrative — no real calculation happens in Phase 1.

export const COMPANY = {
  name: 'Meridian Foods B.V.',
  sector: 'Food & Beverage Manufacturing',
  country: 'Netherlands',
  region: 'Amsterdam',
  entitySize: 'Mid-corporate',
  reportingYear: '2024',
  totalEmissions: 540039, // tCO2e
};

// ---- Emissions dashboard (Recharts bar chart) ----
export const SCOPE_TOTALS = [
  { scope: 'Scope 1', label: 'Direct', value: 86420, color: '#A100FF' },
  { scope: 'Scope 2', label: 'Energy (indirect)', value: 64810, color: '#C285FF' },
  { scope: 'Scope 3', label: 'Value chain', value: 388809, color: '#7A7A88' },
];

export const SCOPE3_BREAKDOWN = [
  { category: 'Cat 1 · Purchased goods', value: 158200 },
  { category: 'Cat 5 · Waste', value: 21400 },
  { category: 'Cat 8 · Leased assets', value: 33900 },
  { category: 'Cat 10 · Processing', value: 41250 },
  { category: 'Cat 11 · Use of sold products', value: 96500 },
  { category: 'Cat 14 · Franchises', value: 18600 },
  { category: 'Cat 15 · Investments', value: 18959 },
];

export const EMISSIONS_TREND = [
  { year: '2021', scope1: 99200, scope2: 78400, scope3: 432000 },
  { year: '2022', scope1: 94100, scope2: 72100, scope3: 414500 },
  { year: '2023', scope1: 90300, scope2: 68900, scope3: 401200 },
  { year: '2024', scope1: 86420, scope2: 64810, scope3: 388809 },
];

// ---- ESG score gauge ----
export const ESG_SCORE = {
  overall: 68,
  rating: 'B+',
  percentile: 72, // vs sector peers
  sub: [
    { pillar: 'Environmental', score: 64, color: '#A100FF' },
    { pillar: 'Social', score: 71, color: '#C285FF' },
    { pillar: 'Governance', score: 74, color: '#AE4DFF' },
  ],
  peerAverage: 58,
  topQuartile: 81,
};

// ---- Decarbonization levers ----
export type LeverImpact = 'High' | 'Medium' | 'Low';
export interface Lever {
  id: string;
  title: string;
  scope: string;
  description: string;
  reductionPotential: number; // tCO2e / yr
  reductionPct: number;
  impact: LeverImpact;
  payback: string;
  capex: string;
}

export const LEVERS: Lever[] = [
  {
    id: 'lev-1',
    title: 'Switch to a renewable electricity (PPA) contract',
    scope: 'Scope 2',
    description:
      'Move purchased electricity to a green tariff or power purchase agreement, eliminating most market-based Scope 2 emissions.',
    reductionPotential: 51800,
    reductionPct: 9.6,
    impact: 'High',
    payback: '1–2 yrs',
    capex: 'Low',
  },
  {
    id: 'lev-2',
    title: 'Electrify the owned vehicle fleet',
    scope: 'Scope 1',
    description:
      'Replace internal-combustion company cars and light trucks with electric vehicles as leases roll over.',
    reductionPotential: 38400,
    reductionPct: 7.1,
    impact: 'High',
    payback: '3–5 yrs',
    capex: 'Medium',
  },
  {
    id: 'lev-3',
    title: 'Supplier engagement on purchased goods',
    scope: 'Scope 3 · Cat 1',
    description:
      'Engage top-20 suppliers to share primary emission factors and set science-based reduction targets.',
    reductionPotential: 29600,
    reductionPct: 5.5,
    impact: 'Medium',
    payback: '2–3 yrs',
    capex: 'Low',
  },
  {
    id: 'lev-4',
    title: 'Improve product use-phase efficiency',
    scope: 'Scope 3 · Cat 11',
    description:
      'Redesign sold products for lower energy draw during use, cutting downstream use-phase emissions.',
    reductionPotential: 21300,
    reductionPct: 3.9,
    impact: 'Medium',
    payback: '3–4 yrs',
    capex: 'Medium',
  },
  {
    id: 'lev-5',
    title: 'Divert operational waste from landfill',
    scope: 'Scope 3 · Cat 5',
    description:
      'Increase recycling and composting rates and reduce incineration of operational waste streams.',
    reductionPotential: 8900,
    reductionPct: 1.6,
    impact: 'Low',
    payback: '<1 yr',
    capex: 'Low',
  },
  {
    id: 'lev-6',
    title: 'On-site solar generation',
    scope: 'Scope 2',
    description:
      'Install rooftop PV at owned manufacturing sites to offset grid electricity consumption.',
    reductionPotential: 12700,
    reductionPct: 2.4,
    impact: 'Medium',
    payback: '5–7 yrs',
    capex: 'High',
  },
];

// ---- Leadership dashboard ----
export const TOP_EMITTERS = [
  { company: 'Company 7', value: 959500 },
  { company: 'Company 8', value: 860000 },
  { company: 'Company 9', value: 662100 },
  { company: 'Company 6', value: 542200 },
  { company: 'Company 1', value: 540039 },
  { company: 'Company 10', value: 461400 },
  { company: 'Company 3', value: 398000 },
  { company: 'Company 4', value: 278000 },
  { company: 'Company 2', value: 178400 },
  { company: 'Company 5', value: 155000 },
];

export const TOP_RMS = [
  { name: 'Jon Doe', engaged: 84 },
  { name: 'Max Miller', engaged: 70 },
  { name: 'Mini Dhillon', engaged: 55 },
  { name: 'Alex Carey', engaged: 47 },
  { name: 'Apurva Singh', engaged: 27 },
  { name: 'Alex Doe', engaged: 20 },
];

// Portfolio emission profile (used for the sunburst-style donut on leadership dashboard)
export const PORTFOLIO_PROFILE = [
  { name: 'Scope 1', value: 18, color: '#A100FF' },
  { name: 'Scope 2', value: 14, color: '#C285FF' },
  { name: 'Scope 3', value: 68, color: '#D9D7E0' },
];

// ---- Relationship Manager dashboard ----
export const PORTFOLIO_COMPANIES = [
  { name: 'Company 1', emissions: 540039 },
  { name: 'Company 2', emissions: 498079 },
  { name: 'Company 3', emissions: 449800 },
  { name: 'Company 4', emissions: 357899 },
  { name: 'Company 5', emissions: 115679 },
];

export const COMPANY_SCOPE_SPLIT = [
  { name: 'Scope 1', value: 86420, color: '#A100FF' },
  { name: 'Scope 2', value: 64810, color: '#C285FF' },
  { name: 'Scope 3', value: 388809, color: '#D9D7E0' },
];

export interface FinancialProductSuggestion {
  lever: string;
  description: string;
  applicability: string;
  offerings: string[];
}

export const FINANCIAL_PRODUCTS: FinancialProductSuggestion[] = [
  {
    lever: 'Low Emission Vehicles',
    description:
      'Transition current internal diesel/gasoline combustion vehicles to electric vehicles transportation and on-site mobility',
    applicability: 'Scope 1',
    offerings: ['Sustainability-linked Loan', 'Green Car Loan', 'Sustainability Improvement Derivative'],
  },
  {
    lever: 'Electrification of Equipment',
    description:
      'Replace fossil-fuel powered process equipment with electric alternatives connected to a renewable supply.',
    applicability: 'Scope 1 & 2',
    offerings: ['Green Term Loan', 'Equipment Leasing', 'Sustainability-linked Loan'],
  },
  {
    lever: 'Alternative Fuels',
    description:
      'Substitute fossil fuels with certified biofuels or green hydrogen for high-temperature processes.',
    applicability: 'Scope 1',
    offerings: ['Transition Finance Facility', 'Green Term Loan'],
  },
  {
    lever: 'On-site Renewables',
    description:
      'Finance rooftop solar and battery storage at owned and operated sites to reduce purchased electricity.',
    applicability: 'Scope 2',
    offerings: ['Green Project Finance', 'Sustainability-linked Loan'],
  },
];

// ---- Mock "parsed" Excel result shown after upload ----
export const MOCK_PARSED_ROWS = [
  { row: 1, item: 'Metals', supplier: 'Supplier A', quantity: '15,000', unit: 'KG', status: 'OK' },
  { row: 2, item: 'Food & Meals', supplier: 'Supplier A', quantity: '500', unit: 'KG', status: 'OK' },
  { row: 3, item: 'Packaging', supplier: 'Supplier B', quantity: '10,000', unit: 'KG', status: 'OK' },
  { row: 4, item: 'Software', supplier: 'Supplier C', quantity: '100,000', unit: 'USD', status: 'OK' },
  { row: 5, item: 'Electronics', supplier: 'Supplier B', quantity: '15,000', unit: 'KG', status: 'OK' },
];

export const SECTORS = [
  'Business activities - Consultancy, legal, accounting, etc.',
  'Construction and civil engineering',
  'Creative arts and entertainment activities',
  'Education and research',
  'Energy and utilities',
  'Finance - General',
  'Finance - Insurance and pension',
  'Health care and services',
  'Information technology',
  'Land use - Agriculture, forestry, and fishing',
  'Manufacturing - Chemicals',
  'Manufacturing - Consumer goods',
  'Manufacturing - Food and beverages',
  'Manufacturing - Heavy industries',
  'Manufacturing - Other',
  'Membership organizations',
  'Non-governmental organization',
  'Other commercial service activities',
  'Pharmaceuticals',
  'Public administration',
  'Publishing activities',
  'Real estate activities',
  'Retail and wholesale',
  'Telecommunication',
  'Tourism and hospitality',
  'Transport and logistics',
  'Warehousing',
];

// Representative NACE Rev.2 code per sector (starter mapping). SMEs don't know
// their NACE code, so it's auto-filled from the chosen sector. Refine alongside
// the sector→EEIO work. Keys MUST match SECTORS above.
export const SECTOR_NACE: Record<string, string> = {
  'Business activities - Consultancy, legal, accounting, etc.': '70',
  'Construction and civil engineering': '41',
  'Creative arts and entertainment activities': '90',
  'Education and research': '85',
  'Energy and utilities': '35',
  'Finance - General': '64',
  'Finance - Insurance and pension': '65',
  'Health care and services': '86',
  'Information technology': '62',
  'Land use - Agriculture, forestry, and fishing': '01',
  'Manufacturing - Chemicals': '20',
  'Manufacturing - Consumer goods': '32',
  'Manufacturing - Food and beverages': '10',
  'Manufacturing - Heavy industries': '24',
  'Manufacturing - Other': '25',
  'Membership organizations': '94',
  'Non-governmental organization': '94',
  'Other commercial service activities': '82',
  'Pharmaceuticals': '21',
  'Public administration': '84',
  'Publishing activities': '58',
  'Real estate activities': '68',
  'Retail and wholesale': '47',
  'Telecommunication': '61',
  'Tourism and hospitality': '55',
  'Transport and logistics': '49',
  'Warehousing': '52',
};

export const COUNTRIES = ['Netherlands', 'Belgium', 'Germany', 'France', 'United Kingdom', 'Spain'];
export const REGIONS = ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven'];
export const ENTITY_SIZES = ['Small', 'Mid-corporate', 'Large corporate'];
