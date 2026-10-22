# SMEScope (SustainSME) — Start-here note for the next chat

_Last updated: 2026-08-03. Short pointer file. Full history: [project-log.md](project-log.md) (shared,
lightweight) + [PROJECT_LOG.md](PROJECT_LOG.md) (technical build bible). Methodology:
[EMISSION_METHODOLOGY.md](EMISSION_METHODOLOGY.md)._

## ⏭️ Pick up here (from the 2026-08-03 session → do first on 2026-08-04)
**The document upload/extraction now works locally.** The backend auto-discovers the `claude` binary
(`_resolve_claude_bin()` in `backend/claude_client.py`): tries `CLAUDE_BIN` env → `claude` on PATH →
the binary bundled with an installed Claude Code (VS Code/Cursor extension or desktop app, newest
version). No install/login change needed if you run Claude Code and are signed in. Tested end-to-end on
text PDFs + xlsx, on 4 real public sample invoices, and on the **vision path** (a scan PNG conf 0.97 +
a rotated/compressed "photo" JPG — both read correctly).

**Do first tomorrow — see the upload work in the browser:**
1. The server currently on `:8000` is the **STALE** uvicorn from the old
   `Downloads\SustainSME_handover\backend` (it does NOT have the fix). Close that old backend window,
   then from THIS folder run `backend\start-backend.bat` (confirm http://127.0.0.1:8000/api/ping → ok)
   and `app\start-frontend.bat`. Go to the Scope 1/2 step → **"Extract files"** → upload
   `sample_docs\electricity_invoice_2024.pdf` (+ the other 3) → confirm the extracted data appears for
   review. (No hard process-kill needed — just close the old window.)
2. **Decision pending (A vs B):** A = backend auto-discovery (**done**). B = install the standalone CLI
   (`npm install -g @anthropic-ai/claude-code` + `claude auth login`, once per tester). B is *additive* —
   no rework, keep A regardless.

**Calc bugs — FIXED 2026-08-05** (verified; see PROJECT_LOG.md):
- ✅ **Gas energy-unit conversion.** `calc/scope1.py` + `calc/heating.py` `_to_base()` now convert
  kWh/MWh/GJ/therms/MMBTU → the fuel's base unit via `ncv_gj_per_base_unit`. Gas 100 kWh → 0.0195 t,
  100 therms → 0.571 t (were both 0.202 t).
- ✅ **Refrigerant explicit-zero.** `fugitive()` now only takes the primary tier when `refill_kg` > 0;
  a 0 with a charge/tonnage runs the charge×leak-rate estimate (VRF 14 kg → 1.75 t, split 10 kg → 0.54 t).

- ✅ **Scope 2 double-count on site-name mismatch (FIXED 2026-08-05).** `calc/scope2.py` matched metered
  electricity to boundary sites by exact name, so a bill whose extracted `site` label ≠ the boundary site
  name got a floor-area estimate ON TOP of the metered bill (81.5 t + 99.7 t). Now: tolerant match
  (`_norm_site`/`_same_site` — case/space-insensitive + containment); a single-site boundary with any
  meter is covered (no estimate); unattributable metered kWh → estimate skipped **with a reconcile
  warning** instead of double-counting. Verified across 4 scenarios; the SME Scope 2 (81.48 t) is now
  robust without manual name reconciliation.

**No known open calc bugs.** (Remaining items are factor-quality, not correctness — see below.)

### Emission-factor review (carbon specialist, 2026-08-05) — sourcing map & status
**Done in the engine:** #1 market-based = residual mix (AIB 2023; `residual_mix.json`); #7/#8/#9 audit
display; **GWP AR5 → AR6** (`gwp.json`, IPCC AR6 Table 7.SM.7 — R410A 2088→2256, R32 675→771, etc.;
blends recomputed from components, verify vs DEFRA workbook).
**Still to do, with the sources the specialist named:**
- **#6 EEIO geographic mismatch** → use **OpenCEDA / CEDA** (free, but requires **prominent attribution**
  wherever used) instead of US-USEEIO. EXIOBASE free version is no longer updated. https://openceda.org/solutions/ceda
  — ⏳ **REMINDER: the specialist will share more on CEDA — ask them for it.** (Interim: the current
  USEEIO buckets are labelled US-proxy; a couple of NAICS proxies are weak — facility→real estate,
  paper→paperboard, R&M→auto — remap or replace with CEDA.)
- **#2 aviation RF + cabin class**, **#4 Scope 1 fuel well-to-tank into Cat 3**, and **water** → all in the
  **DEFRA GHG conversion factors workbook** (UK). Pull exact values from the official DEFRA file (do NOT
  trust web-search snippets — they conflicted, one even mixed AR5/AR6 GWP). Decision taken: aviation WITH
  RF + average class for now, cabin-class field later.
- **#3 gas**: prefer capturing gas energy in **kWh** (EU bills show it) so the engine's per-kWh path is
  used — avoids the NL G-gas CV overstatement. (Engine already converts kWh→base via NCV.)
- **Waste** benchmark: specialist pointed to a source (link to follow) to replace the unsourced kg/FTE.
- Homeworking (Cat 7): DEFRA homeworking ≈ 0.33378 kgCO2e/hr/person (2024) — add a homeworking line.

**SME test deliverable (2026-08-05):** full end-to-end run for a carbon specialist — Halstead & Roe Legal
B.V. (Amsterdam, 120 FTE, FY2024), Scope 1&2 from the upload + full Scope 3 → **508.3 tCO2e**. Auditable
Excel (`SMEScope_Halstead_Roe_FY2024_emissions.xlsx`) + inputs (MD + JSON) were shared in chat; the
generator `scratchpad/sme_run.py` can regenerate them.

**Test assets:** `sample_docs/` (4 synthetic docs + `GROUND_TRUTH.md`) are committed. The 4 real sample
invoices, the rendered scan/photo images, and the SME deliverable lived in the session scratchpad
(temporary — regenerate if needed).

## What this is
SME carbon-accounting platform (Accenture, for a bank channel). **Name decided: "SMEScope"** (code &
UI still say "SustainSME" — not yet renamed). **Branding: Accenture purple only, no bank name.**
Deterministic engine (Python) — **Python calculates, the LLM only reads** (extraction/mapping at the
seams, never per-line calc). **All frontend UI strings in English.**

## Location & how to run (READ THIS — changed)
- **Working directory is this shared SharePoint folder:** `C:\Users\claudia.daniel\Accenture\SME Decarbonization Asset - SustainSME Live`. Work here, not the old `Downloads\SustainSME_handover`.
- Frontend: `cd app` → `npm install` (once, **locally**) → double-click `app/start-frontend.bat`
  → **http://127.0.0.1:5173** (NOT `localhost` — Vite binds to 127.0.0.1).
- Backend: create a venv in `backend/` **locally** → install deps → double-click `backend/start-backend.bat` → http://127.0.0.1:8000.
- Shared contract: `backend/schema.py` (Pydantic) mirrored in `app/src/types.ts` — **keep in sync**.
- Factor library (swappable JSON, `_meta{source,year}`): `backend/factors/*.json` (fuel, grid, gwp,
  leak_rates, eui_benchmarks, mobile_benchmarks, **scope3_spend_factors, waste_benchmarks,
  scope3_activity_factors**). Loader: `backend/factors.py`.

## ⚠️ Environment gotchas (hit these 2026-07-27)
- **`node_modules/` and `backend/.venv/` must be rebuilt LOCALLY — never rely on the synced copies.**
  A Python venv is not portable: the shared `.venv` had synced from a teammate's machine and its
  python stub pointed at *their* user path → backend wouldn't start. Delete it and make your own venv.
- **Preview servers started by the assistant get reaped between turns** → the browser preview keeps
  vanishing. For a stable preview, YOU run the two `.bat` files and leave the windows open.
- **Wedged backend on port 8000:** if Calculate hangs/errors, a stale process may hold :8000 — kill it
  and restart `start-backend.bat`. (The frontend now times out with a clear message instead of hanging.)

## Current state (what works)
- **Scope 1**: stationary (heating, primary or floor-area estimate) + **mobile/fleet** (litres primary,
  or vehicle-count estimate) + fugitive (refrigerant refill primary, or tonnage/charge estimate).
- **Scope 2**: electricity (grid = explicit or total−captive−openaccess; location + market based;
  green instrument → 0; floor-area/headcount EUI fallback when no meter) + thermal (heat/steam/cooling).
- **Guided, question-led entry** (`app/src/components/GuidedEntry.tsx`): plain-language questions
  ("Do you have an electricity bill?", "Did your company heat its site?",
  "Does your company own or lease vehicles?") with **estimate-vs-zero disambiguation**
  (explicit 0 suppresses the estimate; "don't know" triggers it).
- **Scope 3 relevance**: question-led, sector→archetype prefill, grouped "likely relevant" +
  collapsible others. Sector→NACE auto-fill on Onboarding (27-sector dropdown).
- **Method/data-quality tiers**: `primary` / `spend` / `estimated`, surfaced per line + as warnings.
- **Excel export** for bank disclosure: `POST /api/export.xlsx` (Summary / Calculations / Factor library).
- **Support-person GuideNote** panels on Onboarding, Scope 1, Scope 2, Scope 3 relevance.

## Scope 3 (spend-based) — added 2026-07-09
- Real spend-based (EEIO) engine for the **spend-core categories 1, 2, 4, 9**: `spend × EEIO factor`.
  Factors: `backend/factors/scope3_spend_factors.json` (31 SME buckets from EPA USEEIO v1.3, cited to
  NAICS, + static 2022 FX). Method basis: `backend/factors/sources/GHGP_SCOPE3_METHODS.md`.
- End-of-flow page **`/results/calculations`** (`AllCalculations.tsx`, "All calculations" tab): enter
  spend → Calculate → unified **S1/S2/S3** KPIs + per-line formulas + **Excel download**.
- **Cat 5 (waste)** added: primary tonnage OR estimate from headcount × per-FTE benchmark; treatment
  mix from World Bank **What a Waste** (per country) × **DEFRA** treatment factors. Files:
  `backend/factors/waste_benchmarks.json`, `calc/scope3.waste`, `components/Scope3WasteEntry.tsx`.
  REEB PDFs kept as reference for building intensities (chart-image only, not auto-extracted).
- **Cat 3 / 6 / 7** added (activity-based, DEFRA 2025): Cat 3 (energy WTT + grid T&D) auto-derived
  from Scope 2 electricity; Cat 6 (business travel + hotel) distance-based; Cat 7 (commuting)
  headcount-estimated. Files: `backend/factors/scope3_activity_factors.json`,
  `calc/scope3.{energy_related,travel,commuting}`, `components/Scope3TravelEntry.tsx`.
- **Scope 3 computed:** Cat 1/2/4/9 (spend/EEIO), 3 (energy WTT), 5 (waste), 6 (travel), 7 (commuting).
- **Coverage map** (`components/Scope3Coverage.tsx`) on the calc page: all 15 categories with a status
  badge (Quantified / Supported / Relevant-pending / Excluded / Not screened) — the GHG-Protocol
  completeness statement. Cat 8, 10–15 are screened & shown, not computed (business-model specific).
- **Main flow** now: Scope 1 → Scope 2 → Scope 3 relevance → **All calculations** (`/results/calculations`)
  → report. (Relevance "Next" routes here; Phase-1 per-category questionnaires still reachable by link.)
- Deferred: quantify Cat 8/10–15 when a business model needs it; optional **EXIOBASE** (EU) EEIO set;
  tighten building intensities from REEB numbers (manual extraction from the PDFs).

## Done since last handover (2026-07-20 → 27) — pointers, detail in project-log.md
- **Asset PRD filled:** `Asset Documentation - SMEScope.xlsx` (8 sheets; Owner: Claudia Daniel; Priyank Jain; Stage: Demo, v0.1).
- **Sophia Colville testing feedback worked through** → `feedback-sophia-16-07.md` (tracker with an
  "implemented" column). 24 clarity/wording fixes + 1 bug fixed; a consistency audit caught & fixed
  leftover terms in the review table + Excel title/filename.
- **Full calc test (all Scope 1/2/3 paths)** passed. Found & fixed a **material bug**: country-code
  mismatch — waste & hotel factors keyed on ISO-2 ("DE") but the app passed full names ("Germany"),
  silently falling back to world default (Germany waste was ~24× too high). Fixed via `_to_iso()` in
  `factors.py`.
- **Scope 3 coverage map** greys out the not-yet-computed categories (Cat 8, 10–15) with a
  "TO BE INCLUDED" tag (they add 0 to the total).
- **Factor gap/accuracy register:** `emission-factors-gaps.md` — what's missing / rough / to harden.

## Open priorities (next)
**Factor hardening (from `emission-factors-gaps.md`, P1):** 1) grid factors for all countries (or license
IEA); 2) **EXIOBASE** regional EEIO for Cat 1 (currently US-USEEIO); 3) source the waste kg/FTE
benchmark (currently unsourced); 4) refrigerant GWP → **AR6** (currently AR5).
**Scope 3 build-out:** Cat 11 (use of sold products) is the most material missing one — Sophia offered
sample data/templates (also for commuting via Numbeo, with attribution). Then Cat 8/10/12–15.
**From Sophia's feedback, still deferred:** multi-site support; vehicle type/size selector; **Excel
upload for Scope 3 spend/travel** (she says SMEs strongly prefer this).
**Known imprecision (not a bug):** district heat/steam uses the electricity grid factor as a screening
proxy (flagged) — replace with a real heat EF.

## Standing rules
- **Log every change:** short dated entry in `project-log.md` (shared) + `PROJECT_LOG.md` (technical). Keep `schema.py` ↔ `types.ts` in sync.
- Position outputs as **screening-grade / transparent**, NOT "auditable/assured" (per Sophia).
- Real client data (Hindalco/Taloja, Bühler/BBAN — incl. employee PII) is **local only**. Never sync/export it. Keep it out of this shared folder.
