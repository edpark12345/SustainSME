// Central route table so every button navigates to a known path.
export const ROUTES = {
  login: '/',
  onboarding: '/onboarding',
  scope1: '/scope-1',
  scope2: '/scope-2',
  scope3Relevance: '/scope-3/relevance',
  scope3Category: (id: number | string) => `/scope-3/category/${id}`,
  results: '/results',
  calculations: '/results/calculations',
  esg: '/results/esg',
  levers: '/results/levers',
  report: '/results/report',
  leadership: '/leadership',
  rm: '/relationship-manager',
} as const;
