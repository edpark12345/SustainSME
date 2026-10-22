# SustainSME app — instructions for Claude

This is the SustainSME frontend (Vite + React + TS + Tailwind v3 + Recharts + react-router-dom).

**Read the full build bible first: [`../PROJECT_LOG.md`](../PROJECT_LOG.md).** It documents the
product, exact rebuild steps, how everything functions, and the changelog.

For **calculation / backend** work, also read [`../EMISSION_METHODOLOGY.md`](../EMISSION_METHODOLOGY.md)
(the Phase-4 methodology spec). The shared calc **contract types** live in
[`src/types.ts`](src/types.ts) (`ActivityLine`, `FactorSet`, `InventoryResult`) — type-only for now;
the engine targets these and the UI will consume them in place of `src/data/dummyData.ts`.

Hard rules:
- Run: `npm run dev` → http://localhost:5173. Build/type-check: `npm run build`.
- **After ANY change, append a dated entry to the Changelog at the bottom of `../PROJECT_LOG.md`.**
- All 15 Scope 3 categories come from one config (`src/data/scope3Categories.ts`) rendered by one
  component (`src/pages/Scope3Questionnaire.tsx`). Edit the config, don't duplicate the component.
- All demo numbers live in `src/data/dummyData.ts`. Routes live in `src/routes.ts`.
- Tailwind/PostCSS configs use `import.meta.url` for absolute paths on purpose (cwd-independence) —
  don't change them back to relative globs.
- Branding: Accenture only (no "ING"), Accenture **purple** palette, generic "Company" wording.
- Phase 1 = frontend only, dummy data: no backend, no API/LLM calls, no real Excel parsing.
