# SustainSME — instructions for Claude

**Before doing anything, read [`PROJECT_LOG.md`](./PROJECT_LOG.md).** It is the single source of
truth: product overview, exact rebuild steps, how every part functions, and a dated changelog.

For **backend / emissions-calculation work** (Phase 2+), also read
[`EMISSION_METHODOLOGY.md`](./EMISSION_METHODOLOGY.md) — the calculation methodology spec (emission
factors, the Scope-3 method axis, data-quality tiers, ingestion contract, unattended-assurance model).
The shared calc **contract types** (`ActivityLine`, `FactorSet`, `InventoryResult`) live in
[`app/src/types.ts`](./app/src/types.ts); the engine targets them and the UI will consume them in
place of `app/src/data/dummyData.ts`.

Hard rules:
- The app lives in [`./app`](./app) (Vite + React + TS + Tailwind v3 + Recharts + react-router-dom).
  Run it with `npm run dev` from `app/` → http://localhost:5173.
- **After ANY change you make, append a dated entry to the Changelog at the bottom of `PROJECT_LOG.md`**
  (what changed, files touched, why). Keep the log in sync with the code.
- All 15 Scope 3 categories are driven by one config (`app/src/data/scope3Categories.ts`) feeding one
  component (`Scope3Questionnaire.tsx`). Edit the config, never duplicate the component.
- Branding: Accenture only — no "ING" anywhere; Accenture **purple** palette; if copy is ambiguous
  (customer vs vendor) use generic "Company" wording.
- Phase 1 is frontend-only with dummy data: no backend, no API/LLM calls, no real Excel parsing.
