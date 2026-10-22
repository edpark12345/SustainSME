# Project Log — SME Decarbonization Asset (SustainSME / "SMEScope")

Shared running history for this asset. Both collaborators (Claudia Daniel, Priyank Jain) work in
this SharePoint-synced folder, so changes sync to both. **Every change gets a short dated entry
below, newest at the bottom.**

> This is the lightweight shared changelog. The full technical build bible (architecture, rebuild
> steps, detailed change log) lives in [`PROJECT_LOG.md`](./PROJECT_LOG.md).

## Getting started (each collaborator, once, locally)
- Frontend: `cd app` → `npm install` → `npm run dev` (http://localhost:5173)
- Backend: create a venv in `backend/` → `pip install -r requirements.txt` (or the packages in use:
  fastapi, uvicorn, pydantic, openpyxl, pdfplumber, pypdf) → double-click `backend/start-backend.bat`
- `node_modules/` and `backend/.venv/` are intentionally **not** in this folder (too many files to
  sync) — they are rebuilt locally by the steps above.

## History
- **2026-07-09** — Project moved into this shared folder and set as the working directory. Copied all
  source (`app/`, `backend/`, docs, factor library + `backend/factors/sources/`) from the previous
  `Downloads/SustainSME_handover` location, excluding `node_modules/`, `backend/.venv/` and `dist/`
  (rebuildable locally). 162 files. Added this `project-log.md` and a `.gitignore`.

- **2026-07-09** — Frontend now runs from this shared folder. Repointed the Claude preview launch to
  `app/` here and ran `npm install` (node_modules rebuilt locally, not synced). Added
  `app/start-frontend.bat` (double-click, leave open) so the dev server stays up independently of
  Claude sessions. App serves at http://127.0.0.1:5173 (note: 127.0.0.1, not localhost). HMR reflects
  edits made in this folder live.

- **2026-07-20** — Filled the Accenture Asset Documentation / PRD template for SMEScope and saved it as
  `Asset Documentation - SMEScope.xlsx` in this folder. All 8 sheets completed (PRD Overview metadata;
  Asset Overview; Design Hypothesis; Data Input; Database; Software; Data Transformation; UX) covering
  Core / AI-Governance / Legal / Security questions — 74 answers + metadata (Owner: Claudia Daniel;
  Priyank Jain, Stage: Demo, v0.1). Original template left untouched. Flagged as pending: OSS/vuln
  scan + SBOM, MyRND ID, Marketing name approval, formal Legal review of disclaimers, EU-7-requirements
  mapping, external SME user test.

- **2026-07-27** — Worked through Sophia Colville's testing feedback (16.07.26). Tracker with an
  implementation column saved as `feedback-sophia-16-07.md`. Implemented 24 clarity/wording items +
  fixed 1 bug; 1 was already in place; 4 deferred; 5 noted. Highlights:
  * BUG FIX: Scope 3 waste "I know our annual waste tonnage" was unselectable (mode derived from
    tonnage value) — now explicit UI state. `Scope3WasteEntry.tsx` (verified in browser).
  * Scope 1: added electric-vehicle option (BEV=0, charging in S2) + plug-in/hybrid guidance;
    heating-oil example; "no distance needed" note. `GuidedEntry.tsx`
  * Onboarding: entity-size explainer; Country/Region → "(headquarters)"; staff-housing "often"→
    "sometimes"; reporting-year FY/CY note. `Onboarding.tsx`
  * Boundary: prefill reporting year + HQ country from onboarding; "Primary building type";
    scope-correct estimate note; image/screenshot upload example. `EmissionsWorkbench.tsx`
  * Scope 2: removed "captive drawal" jargon; simplified green/PPA; explained field terms; landlord-
    apportioned-utilities note; electricity duplicate-entry/precedence note. `Scope2.tsx`, `GuidedEntry.tsx`
  * Scope 3: plain-language EEIO; review-other-categories prompt; hotel "optional"; flight-class
    descriptions; waste-skip reminder. Reframed "auditable" → "transparent/screening-grade" across UI.
  * Deferred (planned): multi-site; vehicle type/size; Excel upload for Scope 3 spend/travel; Cat 11
    use-of-sold-products (awaiting Sophia's sample data). `npm run build` clean (626 modules).

- **2026-07-27** — Follow-up on feedback #10 (distance in km): the earlier note alone was inconsistent
  because the Scope-1 mobile review table still showed a "Distance km" column that the calc never uses
  (backend skips distance; only litres / vehicle-count are computed). Removed that misleading column
  from `ExtractionSummary.tsx` so the flow matches the guided note. Build clean (626 modules).

- **2026-07-27** — Consistency audit of the feedback changes (checking each ✅ item for the same
  "changed one surface, left another" bug as #10). Found & fixed:
  * Scope 2 review table (ExtractionSummary) still used old terms → renamed headers to match the
    new field labels: On-site solar / Renewable (contract) / Certificate.
  * "Building type" → "Primary building type" also in GuidedEntry (estimate) and Scope3WasteEntry
    (was only changed on the boundary card).
  * Excel export now includes Scope 3 but title said "Scope 1 & 2 Emissions" and file was named
    "scope12" → title now "Scope 1, 2 & 3 Emissions"; downloads renamed "sustainsme_scope_1_2_3".
    (`export_xlsx.py`, `main.py`, `apiClient.ts`)
  Checked clean: EV option never emits an 'electric' fuel_type row (type-safe); "captive/drawal"
  fully gone from UI; EEIO user-facing copy reworded (remaining EEIO mentions are code/docs only).
  `npm run build` clean (626 modules).

- **2026-07-27** — Added `emission-factors-gaps.md` — a Scope 1–3 factor gap & accuracy register
  (Factor · Status · Current source · Target/fix · Priority). Flags what's missing, what's screening-
  grade/rough, and cross-cutting issues (mixed vintages, GWP AR5 vs AR6, UK-factor geo-mismatch).
  Top P1s: full-country grid factors, EXIOBASE (regional EEIO) for Cat 1, source the waste kg/FTE
  benchmark, move GWP to AR6.

- **2026-07-27** — Scope 3 coverage map: greyed out the categories the engine can't compute yet
  (Cat 8, 10–15) — dimmed rows + a "TO BE INCLUDED" tag, and footnote "work in progress — to be
  included" (they contribute 0 to the Scope 3 total for now). Computable ones (1–7, 9) unchanged.
  `Scope3Coverage.tsx`. Build clean (626 modules); verified in browser.

- **2026-07-27** — Full calc test (all Scope 1/2/3 paths) via the engine. Found & fixed a MATERIAL BUG:
  country-code mismatch — grid factors key on full names ("Germany") but waste & hotel factors key on
  ISO-2 ("DE"), so the same country value silently fell back to world/default. Germany waste blended EF
  was 314.6 (world default, 60% landfill) instead of 12.86 → waste overstated ~24x. Fix: added
  `_to_iso()` name→ISO map in `factors.py`, applied in `waste_treatment_mix` and `hotel_ef`. Re-tested:
  Germany waste EF now 12.86, warning gone.
  Also noted (not bugs): district heat/steam uses the electricity grid factor as a screening proxy
  (flagged 'estimated'/'proxy') — imprecise, on the gap list. Env: a wedged process was holding port
  8000 (killed); the shared backend `.venv` had synced from another machine and is broken here — each
  user must rebuild the venv locally (venvs are not portable).

- **2026-07-27** — Refreshed `NEXT_SESSION.md` as the start-here handover for a new chat: new working
  location (this shared folder; run via the two .bat files; 127.0.0.1 not localhost), the environment
  gotchas (rebuild node_modules/.venv locally — venvs aren't portable; preview reaping; wedged :8000),
  the SMEScope name decision, pointers to feedback-sophia-16-07.md + emission-factors-gaps.md +
  Asset Documentation - SMEScope.xlsx, and the open priorities (grid coverage, EXIOBASE, waste kg/FTE
  source, GWP→AR6; Cat 11; Excel upload for Scope 3). No code change.

- **2026-08-03** — Added `start-demo.bat` at repo root: a one-click demo launcher (Option 1, local).
  It pre-checks that `backend\.venv` and `app\node_modules` exist locally (with fix-it instructions if
  not), starts `backend\start-backend.bat` and `app\start-frontend.bat` each in its own window, waits
  for http://127.0.0.1:5173 to answer, then opens the browser. Reuses the existing per-server .bats
  (no logic duplicated). Docs/tooling only — no app code changed. Note found while testing: a stale
  uvicorn from the old `Downloads\SustainSME_handover\backend` copy was still holding :8000 (since
  07/30) and a stray vite held :5173 — flagged for cleanup so the launcher binds fresh.

- **2026-08-03** — Changed the demo default company from a food manufacturer to an office/services law
  firm so the demo doesn't trigger all 15 Scope 3 categories. `defaultProfile` (in
  `app/src/context/AssessmentContext.tsx`) is now **"Halstead & Roe Legal B.V."**, sector
  "Business activities - Consultancy, legal, accounting, etc." (NACE 70). That sector maps to the
  **office** archetype, so the relevance screen auto-prefills only Cat **1, 3, 5, 6, 7** — all of which
  the engine actually computes, so the coverage map shows a complete story with no "to be included"
  placeholders (downstream Cat 10–15 are legitimately excluded, not gaps). Also realigned the
  `DEMO_RELEVANT_IDS` deep-link fallback from the old heavy set [1,2,5,7,8,10,11,12,14,15] to the office
  set [1,3,5,6,7]. `npm run build` clean; verified in browser (onboarding shows the firm + sector;
  relevance shows "office / services · 5 relevant categories"). Rationale: food is Scope-3-heavy
  (agricultural supply chain), which made the demo messy.

- **2026-08-03** — Added a synthetic Scope 1 & 2 test set for exercising the document-upload/extraction
  feature, in new folder `sample_docs/` (all fictional, no client data — safe to keep in the shared
  folder). Matches the demo law firm (Halstead & Roe Legal B.V., Amsterdam/NL, FY2024):
  `electricity_invoice_2024.pdf` (Scope 2), `gas_invoice_2024.pdf` (Scope 1 stationary heating),
  `fleet_fuel_log_2024.xlsx` (Scope 1 mobile, 3 vehicles), `refrigerant_ac_register_2024.xlsx`
  (Scope 1 fugitive, mix of estimated + primary), plus `GROUND_TRUTH.md` (expected extraction, approx
  emissions, and deliberate gotchas). Verified each file round-trips through the app's own `readers.py`
  (pdfplumber/openpyxl) so the LLM sees clean, extractable text. No app code changed.

- **2026-08-03** — Made the document-upload/extraction robust so it works for anyone testing the
  frontend: the backend now **auto-discovers** the `claude` binary instead of assuming it's on PATH.
  Background: the upload feature calls the `claude` CLI headless; on a machine where only the Claude
  Code *desktop app / IDE extension* is installed (no standalone CLI on PATH), the backend threw
  `FileNotFoundError` and `/api/extract` returned 500. Fix: `_resolve_claude_bin()` in
  `backend/claude_client.py` tries, in order, (1) `CLAUDE_BIN` env override, (2) `claude` on PATH,
  (3) the bundled binary inside an installed Claude Code (VS Code / Cursor extension or desktop app),
  newest version, (4) bare `claude`. No username or version hardcoded (derived from
  `%USERPROFILE%`/`%APPDATA%`/`%LOCALAPPDATA%`), so it survives extension auto-updates and works on any
  collaborator's machine. Verified: with `CLAUDE_BIN` unset it resolved the bundled binary and extracted
  correctly. Then **tested the upload end-to-end** — the 4 synthetic sample docs (correct S1/S2/S3
  numbers) and **4 real public sample invoices** (We Energies US, Nevada PUC, Stadtwerke München +
  Münster): electricity/gas read correctly, native units preserved (US therms vs German gas-in-kWh),
  meter-delta computed, blank PUC form correctly flagged low-confidence. Two findings for later:
  (a) refrigerant "no top-up recorded" → extractor emits `refill_kg=0`, which the engine treats as
  primary 0 and skips the charge×leak-rate estimate; (b) verify the engine handles `therms`/gas-in-kWh.
  `SETUP_PROMPT.md` §2 updated. (Note: the still-running :8000 is the stale Downloads-copy uvicorn from
  07/30 — my tests bypassed it by calling the extractor directly, so results are unaffected.)

- **2026-08-03** — Followed up the two upload findings with actual tests (results in `NEXT_SESSION.md`
  "Pick up here"): (1) **Gas unit bug CONFIRMED** — `calc/scope1.py _to_base()` treats gas billed in
  `kWh`/`therms` as `m3` (only a warning): 100 kWh, 100 therms and 100 m3 all compute as 0.202 t, but
  correct is 0.0195 t (kWh, ~10× too high) and 0.571 t (therms, ~2.8× too low). Fix = use the existing
  `ncv_gj_per_base_unit` to convert energy→base. Hits most real EU (kWh) and US (therms) gas bills.
  (2) **Vision/OCR path WORKS** — rendered the sample invoices to images and extracted: clean scan PNG
  → correct, conf 0.97; a rotated + JPEG-compressed "photo" JPG → gas 19,250 m3 correct. Auto-discovery
  also works in the vision call. No fixes applied (test-only).

- **2026-08-05** — Fixed the two calc bugs the upload testing surfaced, and ran a full SME test case.
  **Fixes** (backend, no schema change): (1) **Gas energy-unit conversion** — `calc/scope1.py` and
  `calc/heating.py` `_to_base()` now convert energy units (kWh, MWh, GJ, therms, MMBTU) to a fuel's
  physical base unit via the existing `ncv_gj_per_base_unit`, instead of silently treating them as the
  base unit. Verified: gas 100 kWh → 0.0195 t (was 0.202), 100 therms → 0.571 t, 100 m³ → 0.202 t
  (unchanged); warnings gone. (2) **Refrigerant explicit-zero** — `calc/scope1.py` `fugitive()` now only
  takes the primary refill tier when `refill_kg` > 0; a `refill_kg=0` alongside a charge/tonnage falls
  through to the charge×leak-rate estimate (a bare "no top-up" is not a measured zero-leak). Verified:
  14 kg R410A VRF → 1.75 t, 10 kg R32 split → 0.54 t (were 0). **SME test:** built a realistic law-firm
  case (Halstead & Roe Legal B.V., Amsterdam, 120 FTE, FY2024) — Scope 1 & 2 from the **upload/extraction**
  of the 4 sample docs + a full Scope 3 profile (Cat 1/2 spend, 3, 5, 6, 7) → `calculate()` →
  `build_xlsx()`. Result S1 57.5 / S2 81.5 / S3 369.4 → **508.3 tCO2e** total; auditable workbook +
  inputs shared with Claudia for a carbon specialist to check. **New engine finding (worked around, NOT
  fixed):** Scope 2 double-counts when an uploaded bill's `site` name ≠ the boundary site name — the
  floor-area estimate fires ON TOP of the metered bill (`calc/scope2.py` lines 68–102 match sites by
  exact name). Reconciled the name in the test to get a clean number; needs a real fix (match on a
  normalized site key, or skip the estimate when total metered kWh already exists).

- **2026-08-05** — **Fixed the Scope 2 double-count bug** (`calc/scope2.py`). The floor-area estimate
  fallback matched metered electricity to boundary sites by exact name, so a bill whose extracted `site`
  label differed from the boundary site name got an estimate ON TOP of the metered bill. New logic:
  tolerant matching (`_norm_site` + `_same_site`: case/space-insensitive, either-way containment); a
  single-site boundary with ANY metered line is treated as covered (no estimate); and metered kWh that
  can't be attributed to a site (orphan/verbose name) → estimate **skipped with a warning to reconcile**
  instead of double-counting. Verified 4 scenarios: bug case (verbose name + floor area) → 81.48 t /
  0 estimate; single site no bill → still estimates; multi-site A-metered/B-unmetered → only B estimated;
  multi-site orphan meter → skipped + warned. The SME deliverable's Scope 2 (81.48 t) is now robust
  without the manual name reconciliation. No schema change.

- **2026-08-05** — Worked the carbon-specialist calc review — **fixes are in the engine/logic** (so they
  hold for every client demo, not just one export). **(#1, headline) Scope 2 market-based now uses the
  residual mix**, not the location factor: new `backend/factors/residual_mix.json` (AIB European Residual
  Mixes 2023 — NL 0.380, IT 0.501, PL 0.788 kgCO2/kWh), `residual_mix_factor()` in `factors.py`, and
  `calc/scope2.py` applies it when there's no contractual instrument (fallback to location + warning for
  countries not yet loaded). Hardened the green-instrument test so an extracted "none - no GoO" string
  no longer zeroes market-based. NL example: location 81.48 t vs **market 94.39 t**. **(#7/#8/#9) audit
  display now reconciles**: fugitive rows show leaked mass (charge×rate), non-integer inputs keep decimals
  (1.2 kg no longer "1"), waste blend shows shares to enough precision. Added a **screening-grade /
  NOT-for-audit disclaimer** to the Excel Summary tab + softened "auditable" wording (positioning rule;
  all detail kept). Verified deterministically + regenerated the SME workbook (v2). No schema change.
  **Still open (need your decision/data):** aviation RF + cabin class (#2), gas per-kWh via bill CV (#3),
  Scope 1 fuel WTT into Cat 3 (#4), EEIO NAICS re-mapping (#6), US-EEIO→EXIOBASE, homeworking, AR5→AR6.

- **2026-08-05** — Refrigerant **GWP updated AR5 → AR6** (`backend/factors/gwp.json`): IPCC AR6 (2021)
  Table 7.SM.7 — R410A 2088→2256, R32 675→771, R134a 1430→1526, R22 1810→1960, blends (R404A/R407C/
  R507A) recomputed from AR6 component GWPs (flagged to verify vs the DEFRA workbook). Verified: fugitive
  now VRF 1.90 t / split 0.62 t / precision 2.71 t. **Emission-factor sourcing decided with the specialist:**
  EEIO geographic fix → **OpenCEDA/CEDA** (free, requires prominent attribution; EXIOBASE-free is stale) —
  specialist to share more; aviation-with-RF (#2), Scope 1 fuel WTT (#4) and water → pull from the official
  **DEFRA workbook** (not web snippets — they conflicted); gas → capture kWh from EU bills. Full map in
  `NEXT_SESSION.md`. Web factor-search caveat noted: one result mixed AR5/AR6 GWP — sourcing from official
  files only.

- **2026-08-05** — Pulled the remaining review factors **from the official files already in
  `backend/factors/sources/`** (not web snippets). **#4 fuel WTT into Cat 3:** added
  `wtt_kg_co2e_per_base_unit` to `fuel_factors.json` (DEFRA 2025 WTT- fuels: gas 0.3366/m3, diesel
  0.61101/L, petrol 0.58094/L) + `flight_wtt_kg_per_pkm` in `scope3_activity_factors.json` (DEFRA WTT-
  flights), `factors.fuel_wtt()`/`flight_wtt()`, and `scope3.fuel_flight_wtt()` wired into Cat 3 in
  `engine.py` — ~16.7 t previously-missing upstream in the demo. **#2 aviation VERIFIED against the DEFRA
  file: the air factors are already 'with RF'** (0.12786 short / 0.15282 long = DEFRA with-RF average
  passenger; the specialist's 'without RF' claim was wrong — those are 0.0756/0.0904). No change;
  cabin-class weighting deferred. **#6 facility line** remapped off 'Offices of Real Estate Agents'
  (0.246, 77.7 t) to interim 'generic_services' (0.090, ~28 t) — proper fix is a **CEDA** factor (pending).
  **Water** captured for later (DEFRA supply 0.1913 + treatment 0.17088 /m3). Regenerated the SME workbook
  (v3): S1 57.88 / S2 loc 81.48 / market 94.39 / S3 336.76 = **476.11 t** location. Verified
  deterministically. No schema change.

- **2026-08-05** — Built a **standalone, client-ready HTML demo** (does NOT touch the app):
  `client-demo/SMEScope_Demo_Halstead_Roe.html` — a single self-contained file (~180 KB, offline). It
  reproduces the full prefilled walkthrough (Login → Company → Scope 1 → Scope 2 → Scope 3 relevance →
  Scope 3 data → Results) for the Halstead & Roe v3 case in the Accenture design system, with a stepper,
  and an **Excel download** button at the end (the real v3 workbook embedded as base64). Generated by
  `scratchpad/dump_demo_data.py` (computes the case deterministically from `inputs_v3.json`, embeds
  results + xlsx + logo) injected into an HTML template. Verified in-browser: 6 steps navigate, 38 calc
  rows render, KPIs total 476.1 t, download yields a valid `.xlsx` (PK signature).

- **2026-08-05** — Extended the standalone demo (`client-demo/SMEScope_Demo_Halstead_Roe.html`) with a
  visible **"Upload &amp; extract" step** (new step 2 of 7): shows the source documents, an **"Extract
  files"** button → brief "reading…" state → reveals each document with a **rendered bill image**
  (electricity + gas PDFs rendered to PNG), the **extracted fields**, an **extraction-confidence** score
  and the model's **"what I read" note** (real provenance from the extraction). Then the data flows into
  the Scope 1 &amp; 2 steps as before. `dump_demo_data.py` now also renders the bill images and emits the
  per-document extraction detail. Also removed the on-screen screening/audit disclaimer banner from the
  demo (per request; the disclaimer stays on the Excel Summary tab). Verified in-browser: 7 steps, 4 doc
  cards (2 bill images + 2 xlsx), confidence + notes render, results + Excel download intact.

- **2026-08-05** — Restyled the standalone demo to the **Accenture Design System v2** (user supplied the
  `Final Design System` kit), tastefully restrained per request ("not too heavy on branding"): **light
  theme**, neutral canvas (#F1F1EF), white cards, purple as accent only, mono "Step" micro-labels, one
  gradient moment (Total KPI rule + login rule); **real Graphik + GT Sectra fonts embedded** as base64
  `@font-face`. Replaced the base64-PNG Accenture logo with an **inline-SVG wordmark** (renders in every
  context — a `data:` image inside a `data:` snapshot was failing; also −96 KB) and cleaned the raw
  extraction notes to client-ready English. Made the results-table header **non-sticky** (the sticky
  header was floating into the rows). File `client-demo/SMEScope_Demo_Halstead_Roe.html` (~630 KB, one
  offline file). Note: the in-app preview kept caching stale snapshots, so final visual confirmation is
  on opening the file in a normal browser.

- **2026-08-05** — **SME calc review incorporated: emission factors aligned to the reporting year (2024)**
  + full factor traceability. New rule in `EMISSION_METHODOLOGY.md` §0a: **EF must match the reporting
    year**, with per-line traceability (value·source·year); documented exceptions = GWP (IPCC AR6, not
    year-versioned) and spend EEIO (USD-2022 base-year method).
  * **Engine factor library → DEFRA 2024** (downloaded the official `defra-ghg-conversion-factors-2024-
    flat-format.xlsx` to `backend/factors/sources/`, parsed): `fuel_factors.json` natural_gas 2.02→2.04542,
    diesel 2.68→2.51279, petrol 2.31→2.0844 (kgCO2e per m³/L, DEFRA 2024); `scope3_activity_factors.json`
    air with-RF short 0.12786→0.18592, long 0.15282→0.26128 (2024 uses 2021-load-year data → higher),
    electricity WTT+T&D 0.0684→0.06817, car/tram/EV to DEFRA 2024; WTT-fuels/flights unchanged (2024=2025);
    `grid_factors.json` Netherlands 0.328→**0.2853** (IEA, per the SME's reference); `waste_benchmarks.json`
    relabelled 2024. GWP stays AR6; EEIO stays USEEIO USD-2022 (both labelled "current standard").
  * **Demo:** added an **Emission-factor register** (every factor · value · unit · source · year) + a
    "Reporting year 2024" header, then regenerated with the 2024 factors. New totals: S1 57.4 · S2 loc
    **70.9** (was 81.5, grid change) · S2 market 94.4 · S3 358.6 (air up) · **Total 486.9 t**. Verified in
    browser (register shows 2024 / IEA / DEFRA 2024). Delivered the interactive HTML.
  * Note: the intermediate scratchpad (sme_run.py, inputs_v3.json, fonts/design-system) had been cleaned;
    rebuilt sme_run deterministically (Scope 1&2 hardcoded from the known extraction — the live `claude`
    CLI batch returned empty) so the demo regenerates without an LLM call.
  * **Still open (SME comments, for the tool):** 80% business-use handling (currently 100% of litres);
    monthly/multi-site/"messy" invoice UX; label the market-based line clearly (not FERA); Scope-3
    relevance access for reviewers; and complete the DEFRA-2024 swap for the remaining minor fuels.

* **2026-08-27 — Asset one-pager (PPTX).** Created a single-slide executive one-pager on the asset
  (`client-demo/SMEScope_OnePager.pptx`, also in Downloads). Accenture-purple, restrained branding;
  covers: what it is (screening-grade Scope 1·2·3), how it works (Upload → Extract → Compute; LLM reads,
  deterministic Python calculates), coverage (S3 computed cats 1,2,3,4,5,6,7,9; **out of scope 8 & 10–15**),
  the Halstead & Roe FY2024 worked example (487 tCO₂e; S1 57 / S2 loc 71 / S3 359), where it fits
  (BBVA & Santander banking channels; Accenture SBTi SaaS), and "further developed by Sylvia & team".
  Built with pptxgenjs; validated (XSD/rels/content-types pass) and visually QA'd via a rendered PNG.
