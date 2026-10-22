# SustainSME — Project Log & Build Bible

> **Purpose of this file.** This is the single source of truth for the SustainSME app.
> It documents (a) what the product is, (b) **exactly** how to rebuild it from zero so a
> brand-new Claude session or a colleague's Claude reproduces it identically, (c) how every
> part functions, and (d) a dated changelog. **Anyone (human or Claude) who changes the app
> MUST append an entry to the [Changelog](#changelog) at the bottom.** Treat this as a living
> document — keep it in sync with the code.
>
> **Companion spec:** [`EMISSION_METHODOLOGY.md`](./EMISSION_METHODOLOGY.md) — the Phase-4 emission
> calculation methodology (the spec the Phase-5 backend implements). Shared calc contract types live
> in [`app/src/types.ts`](./app/src/types.ts).

---

## 0. How to use this log (read this first, future Claude)

1. **To continue the project:** read §1–§10, then run the app per §4, then look at the bottom
   of the [Changelog](#changelog) to see the latest state.
2. **To rebuild from scratch identically:** follow §3 (scaffold) → §4 (run). The config files
   and architecture in §5–§8 are reproduced verbatim so the result is byte-for-intent identical.
3. **After you make ANY change:** append a Changelog entry (date, who/what, files touched, why).
   Keep entries newest-at-the-bottom. Don't rewrite history; add to it.
4. **Decision rule for branding ambiguity:** if unsure whether text refers to the customer or to
   Accenture-the-vendor, use the generic "Company" wording and flag it — never introduce "ING".

---

## 1. Product overview

**SustainSME** is an SME (small/medium enterprise) **carbon decarbonization platform**. An SME
completes a guided assessment of its greenhouse-gas emissions across **Scope 1** (direct),
**Scope 2** (purchased energy) and **Scope 3** (value chain — 15 GHG-Protocol categories), then
sees results: an emissions dashboard, an ESG score (0–100), prioritized decarbonization levers,
and a board-ready PDF report. Two internal personas also get dashboards: **Leadership**
(portfolio view) and **Relationship Manager** (per-company drill-down + matched sustainable-finance
products).

- **Client/vendor:** Built by **Accenture** (the vendor) for an SME customer (referred to generically
  as "Company"). The original Figma was an ING build; **all ING branding has been removed** (see §9).
- **Phase 1 (this build):** Frontend only, fully deterministic, **no backend, no API calls, no LLM,
  no external connectors**. All data is realistic dummy data. Runs locally for a leadership demo.
- **Later phases (NOT in this repo yet):** Supabase backend (auth, Postgres, storage, Edge Functions),
  real emission-factor calculations, real Excel parsing. See §11 and `SustainSME_Workplan_Summary.docx`.

---

## 2. Current status

| Area | Status |
|---|---|
| Scaffold (Vite + React + TS + Tailwind + Recharts + Router) | ✅ Done |
| Shared components (12) | ✅ Done |
| Login, Onboarding, Scope 1, Scope 2 | ✅ Done |
| Scope 3 Category Relevance (15-row Yes/No, gated Next) | ✅ Done |
| Scope 3 Questionnaire engine (1 component drives all 15 categories) | ✅ Done |
| Results: Emissions dashboard, ESG gauge, Levers, PDF preview | ✅ Done |
| Leadership dashboard, RM dashboard | ✅ Done |
| End-to-end navigation wired | ✅ Done |
| Verified: builds clean, all 12 routes render, gating + conditional logic work | ✅ Done |
| Backend / real calculations / real Excel parsing | ⛔ Out of scope (Phase 1) |

---

## 3. Exact rebuild from scratch

> Goal: reproduce this app identically. Anything project-specific is in §5–§8.

### 3.1 Locations / inputs (on the original machine)
- Project root: `C:\Users\priyank.e.jain\AI Projects\SustainSME`
- App (the code): `…\SustainSME\app`
- Figma screenshots (the design source): `…\SustainSME\figma_screens\` (32 PNGs — see §3.5)
- Accenture logo (high-res): `…\SustainSME\accenture_png_logo.png` (3840×1011, black wordmark +
  purple chevron). **Use this file**, not the older tiny `accentue_logo.png`.
- Workplan: `…\SustainSME\SustainSME_Workplan_Summary.docx`

### 3.2 Prerequisites — Node.js (IMPORTANT gotcha)
The machine had **no Node.js**, and **admin-scoped installs are blocked**. Node was installed
**user-scope** via winget:
```powershell
winget install --id OpenJS.NodeJS.LTS -e --silent --accept-source-agreements --accept-package-agreements --scope user
```
This installed **Node v24.16.0 / npm 11.13.0** to:
```
C:\Users\priyank.e.jain\AppData\Local\Microsoft\WinGet\Packages\OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v24.16.0-win-x64
```
- A **newly opened terminal** (interactive) picks Node up on PATH automatically (winget updated the
  user PATH). **Non-interactive/automation shells may not** — in that case prepend the dir above to
  `$env:Path` before running `npm`/`node`.
- If reproducing elsewhere, any Node ≥ 18 LTS works; just `npm install` then run.

### 3.3 Scaffold commands (run inside the project root)
```powershell
npm create vite@latest app -- --template react-ts
cd app
npm install
npm install react-router-dom recharts
npm install -D tailwindcss@3 postcss autoprefixer
```
> We deliberately pin **Tailwind v3** (not v4) for the classic `tailwind.config.js` + PostCSS setup.

### 3.4 Then create the config + source files
Create the config files in §5 and the source files in §6 (each file's responsibility and contract
is documented). The exact dependency versions resolved are in §5.1.

### 3.5 Figma → screen mapping (so the design is reproducible)
The 32 screenshots map to screens as follows (filenames are quirky; this is the logical order):
- `Scope 3 Category Relevance.png` + `-1` → **Category Relevance** screen (15 rows, Yes/No, Next).
- `…-2`…`-20` → **Scope 3 questionnaire** cards. Detailed categories visible in Figma: **1, 5, 8,
  10, 11, 14, 15** (others were authored to match the same pattern). Variants show the gating:
  Q1=No reveals an "If NO…" follow-up; a "consolidated Excel?" question = Yes reveals the Excel
  download + upload section.
- `…-21`…`-28` → **manual data-entry tables** (the fallback to Excel), one column-set per category.
- `Leadership Dashbaoard.png` → **Leadership dashboard** (profile donut, top emitters, RM table).
- `Relationship manager dashbaoard.png` + `-1` → **RM dashboard** (Emission Profile / New Financial
  Products toggle, company list, scope donut, finance-product panel).
- Screens **not** in Figma (designed to match the visual language): Login, Onboarding, Scope 1,
  Scope 2, ESG gauge, Levers, PDF report preview. The workplan confirms these are Phase-1 scope.

---

## 4. How to run

```powershell
cd "C:\Users\priyank.e.jain\AI Projects\SustainSME\app"
npm install      # first time only
npm run dev      # → http://localhost:5173
```
- **Build / type-check:** `npm run build` (runs `tsc -b && vite build`).
- **Lint:** `npm run lint`.
- The dev server is an SPA; deep links like `/scope-3/category/5` work on refresh in dev.

---

## 5. Configuration files (verbatim intent)

### 5.1 Resolved dependency versions (`app/package.json`)
```jsonc
"dependencies": {
  "react": "^19.2.6",
  "react-dom": "^19.2.6",
  "react-router-dom": "^7.17.0",
  "recharts": "^3.8.1"
},
"devDependencies": {
  "@vitejs/plugin-react": "^6.0.1",
  "autoprefixer": "^10.5.0",
  "postcss": "^8.5.15",
  "tailwindcss": "^3.4.19",
  "typescript": "~6.0.2",
  "vite": "^8.0.12"
  // + eslint toolchain & @types from the create-vite template
}
```
Scripts: `dev: vite`, `build: tsc -b && vite build`, `lint: eslint .`, `preview: vite preview`.

### 5.2 `tailwind.config.js` — **content globs use `import.meta.url`, not relative paths**
This is a deliberate, important detail: content globs and the Tailwind config path are resolved
from the **config file's own directory** (via `import.meta.url`), so the dev server works **even
when launched from a different working directory** (the Claude preview tool spawns from elsewhere).
If you revert to plain `./src/**` globs, the preview MCP breaks with "class does not exist" errors.

Theme tokens (the **design system** — see §7):
```js
colors: {
  accenture: { DEFAULT:'#A100FF', 50:'#F6ECFF',100:'#EBD6FF',200:'#D9B3FF',300:'#C285FF',
               400:'#AE4DFF',500:'#A100FF',600:'#8400D6',700:'#6A00AB',800:'#500080',900:'#3A005C' },
  ink:     { DEFAULT:'#1A1A24', soft:'#4A4A57', muted:'#7A7A88' },
  surface: { DEFAULT:'#FFFFFF', subtle:'#F5F4F7', border:'#E6E4EC' },
  positive:'#1FA971', warning:'#E6A700', danger:'#D64545',
}
boxShadow.card = '0 1px 3px rgba(26,26,36,.06), 0 8px 24px rgba(26,26,36,.06)'
borderRadius.xl = '14px'
fontFamily.sans = ['Graphik','Inter','Segoe UI','system-ui','sans-serif']
```

### 5.3 `postcss.config.js`
Also uses `import.meta.url` to pass an **absolute** `config` path to the `tailwindcss` plugin
(`tailwindcss: { config: join(here,'tailwind.config.js') }`) + `autoprefixer`. Same cwd-independence reason.

### 5.4 `src/index.css`
`@tailwind base/components/utilities;` plus three reusable `@layer components` classes used across
forms: **`.field-label`**, **`.text-input`**, **`.card`**. Body defaults to `bg-surface-subtle text-ink`.

### 5.5 `index.html`
`<title>SustainSME — Carbon Decarbonization Platform</title>`. Mount node `#root`, `/src/main.tsx`.

### 5.6 Asset
`accenture_png_logo.png` is copied into `app/src/assets/accenture-logo.png` and imported by
`Navbar`, `Footer`, `Login`, `ReportPreview`. On dark/purple backgrounds it's rendered white via
the Tailwind classes `brightness-0 invert`.

---

## 6. Project structure / file manifest

```
app/
├─ index.html, vite.config.ts, tailwind.config.js, postcss.config.js, tsconfig*.json
├─ src/
│  ├─ main.tsx                 # entry: <BrowserRouter><AssessmentProvider><App/>
│  ├─ App.tsx                  # <Routes> — the route table (see §8)
│  ├─ routes.ts                # ROUTES constant — single source of all paths
│  ├─ types.ts                 # domain types (Scope3Category, CategoryQuestion, etc.)
│  ├─ index.css                # Tailwind + .field-label/.text-input/.card
│  ├─ assets/accenture-logo.png
│  ├─ context/
│  │  └─ AssessmentContext.tsx # global state: company profile + Scope-3 relevance answers
│  ├─ data/
│  │  ├─ scope3Categories.ts   # ⭐ THE ENGINE CONFIG: all 15 categories (see §8.3)
│  │  └─ dummyData.ts          # all dashboard / ESG / lever / RM placeholder data
│  ├─ lib/
│  │  └─ chartFormat.ts        # Recharts tooltip formatters (typed for Recharts v3 strictness)
│  ├─ components/              # 12 reusable components (see §7.2)
│  │  ├─ Navbar, Footer, PageShell, Button, Card
│  │  ├─ RadioGroup, ProgressStepper, CategoryBadge
│  │  ├─ ExcelDownloadCard, UploadTrigger, DataEntryTable
│  │  ├─ GaugeChart, ResultsNav
│  └─ pages/                   # one file per screen (see §8 + §9... actually §10)
│     ├─ Login, Onboarding, Scope1, Scope2
│     ├─ Scope3Relevance, Scope3Questionnaire
│     ├─ Results, EsgScore, Levers, ReportPreview
│     └─ LeadershipDashboard, RmDashboard
```
**Scaffold leftovers (unused, safe to delete):** `src/App.css`, `src/assets/hero.png`,
`src/assets/react.svg`, `src/assets/vite.svg`, `public/icons.svg`. Not imported anywhere.

---

## 7. Design system

### 7.1 Palette & brand
- **Primary = Accenture purple `#A100FF`** (full scale 50–900 in Tailwind as `accenture-*`).
- Navbar is **white** with the black Accenture logo + purple nav accents (we moved OFF the original
  ING blue per the product owner's decision on 2026-06-10).
- Neutrals: `ink` (text), `surface` (backgrounds/borders). Semantic: `positive/warning/danger`
  (used for lever impact + RM engagement bars).
- Selected/active highlight = purple (the Figma used yellow; we use `accenture-50` + `accenture-300` ring).

### 7.2 Shared component contracts
- **`PageShell`** `{title?, subtitle?, chrome=true, headerAction?, children}` — page wrapper with
  Navbar+Footer (set `chrome={false}` to hide, e.g. Login). Standard page header with purple title.
- **`Navbar`** — Accenture logo (links to onboarding) + nav links (Assessment/Results/Leadership/RM) +
  "Hello ABC" avatar. Sticky, white.
- **`Footer`** — Accenture logo + "Copyright © {year} Accenture. All rights reserved."
- **`Button`** `{variant: primary|secondary|outline|ghost, size: md|lg}` — purple primary.
- **`Card`** `{title?, subtitle?, action?, children}` — white rounded card with optional header.
- **`RadioGroup`** `{name, value, onChange, options?=Yes/No, inline?}` — the Yes/No control everywhere.
- **`ProgressStepper`** `{steps:[{id,label,sublabel}], current, onStepClick?}` — questionnaire stepper.
- **`CategoryBadge`** `{label}` — the "Category N" purple pill.
- **`ExcelDownloadCard`** `{fileName, size?}` — green spreadsheet card; click downloads a placeholder file.
- **`UploadTrigger`** — hidden file input; on select shows a **mocked** parsed-rows table (no real parsing).
- **`DataEntryTable`** `{columns:DataEntryColumn[], addLabel?, seedRows?}` — editable manual-entry table.
- **`GaugeChart`** `{value 0–100, label?, rating?}` — custom SVG semicircular ESG gauge.
- **`ResultsNav`** — tab bar across the four Results sub-pages.

---

## 8. Data model, routing & the questionnaire engine

### 8.1 Global state — `AssessmentContext`
Provides `{ profile, setProfile, relevance, setRelevance, relevantCategoryIds }`.
- `profile`: `CompanyProfile` (name, sector, country, region, entitySize, reportingYear, employees, revenue).
- `relevance`: `Record<categoryId, 'yes'|'no'>` — **starts empty** so the relevance screen's
  "Next enables only when all 15 answered" gate is real/demonstrable.
- `relevantCategoryIds`: derived list of category ids answered `yes` (ascending).
- `DEMO_RELEVANT_IDS = [1,2,5,7,8,10,11,12,14,15]` — used only as the stepper fallback if a category
  page is deep-linked before relevance is completed (so the stepper is never empty).

### 8.2 Routes — `routes.ts` / `App.tsx`
| Path | Page |
|---|---|
| `/` | Login |
| `/onboarding` | Onboarding |
| `/scope-1` | Scope1 |
| `/scope-2` | Scope2 |
| `/scope-3/relevance` | Scope3Relevance |
| `/scope-3/category/:id` | Scope3Questionnaire |
| `/results` | Results (emissions dashboard) |
| `/results/esg` | EsgScore |
| `/results/levers` | Levers |
| `/results/report` | ReportPreview |
| `/leadership` | LeadershipDashboard |
| `/relationship-manager` | RmDashboard |
| `*` | Login (fallback) |

### 8.3 ⭐ The Scope 3 questionnaire engine (the most important design)
**There is ONE questionnaire component** (`Scope3Questionnaire.tsx`) that renders **all 15 categories**
by reading a config array. To change a category's text/questions/table, edit
**`src/data/scope3Categories.ts`** — never duplicate the component.

Each entry is a `Scope3Category`:
```ts
{ id, name, description, relevanceHint, templateFile,
  questions: CategoryQuestion[],   // gating questions
  table: DataEntryColumn[] }       // manual-entry fallback columns
```
`CategoryQuestion` gating convention:
- A question with `parentId` + `showWhenParent:'yes'|'no'` is an **inline follow-up** that only
  appears when the parent has that answer (e.g. the "If NO, …" sub-question).
- The question with `unlocksUploadOn:'yes'|'no'` reveals the **Excel download + upload** section
  (and the "enter manually" toggle → `DataEntryTable`) when answered with that value.
- `optional:true` just renders an "(Optional)" tag.

Questionnaire flow: the stepper shows the user's relevant categories; **Next** advances to the next
relevant category, and on the last one routes to `/results`. **Back** goes to the previous relevant
category (or to the relevance screen).

Categories **1, 5, 8, 10, 11, 14, 15** use the exact Figma question wording; **2, 3, 4, 6, 7, 9, 12,
13** were authored to follow the same pattern (each ends with the "consolidated Excel?" question).

### 8.4 Dummy data — `dummyData.ts`
All numbers for: scope totals & trend, Scope-3 breakdown, ESG score + sub-pillars + benchmarks,
6 decarbonization levers, top emitters, top RMs, portfolio profile, RM portfolio companies, scope
split, financial-product suggestions, the mocked parsed-Excel rows, and the dropdown option lists.
Change demo numbers here only.

### 8.5 Recharts note — `chartFormat.ts`
Recharts v3 types tooltip formatter values as `number | string | ReadonlyArray<…> | undefined`.
Formatters must accept that full union or `tsc` fails under `strictFunctionTypes`. Use the helpers
`tooltipTco2e()`, `tooltipTco2eNamed`, `tooltipPercentNamed`, `fmtNumber` rather than inline
`(v:number)=>…` formatters.

---

## 9. Branding cleanup rules (ING → Accenture/Company)

Applied throughout and must be maintained:
- **No ING logo / wordmark / name** anywhere. Top-of-screen logo = **Accenture logo**.
- The word "ING" in any copy → **"Company"** / "the company" / "the company's" (e.g. "ING leadership
  dashboard" → "Leadership dashboard"; "ING's emissions" → "the company's emissions").
- Footer keeps **"Accenture"** only (original was "accenture ING" — drop ING).
- If unsure whether text means the customer or Accenture-the-vendor → use generic "Company" + flag it.
- Palette moved to **Accenture purple** (per owner decision 2026-06-10).

---

## 10. How each screen functions (behavior summary)

- **Login** (`/`): split panel; brand panel left (purple), form right. Any submit → Onboarding. No real auth.
- **Onboarding**: company profile form bound to `AssessmentContext.profile`. Continue → Scope 1.
- **Scope 1**: three sections (stationary/mobile/fugitive) with unit-suffixed inputs. → Scope 2.
- **Scope 2**: electricity (location vs **market-based** toggle reveals a factor field) + heat/steam. → Relevance.
- **Scope 3 Relevance**: 15 rows, Yes/No each; live "n/15 answered" counter; **Next disabled until all
  15 answered**; Next → first relevant category (or Results if none).
- **Scope 3 Questionnaire** (`/scope-3/category/:id`): stepper + one category card; gating questions
  with inline follow-ups; conditional Excel download/upload (+ "enter manually" `DataEntryTable`);
  Next chains relevant categories, last → Results.
- **Results / Emissions**: KPI strip + Recharts (scope bar, stacked trend, horizontal Scope-3 breakdown).
  "Download PDF report" → ReportPreview. Tabs via `ResultsNav`.
- **ESG**: SVG `GaugeChart` (overall + rating + percentile), pillar bars + Recharts bar w/ peer-avg
  reference line, three benchmark cards.
- **Levers**: summary cards + 6 lever cards (impact tag, reduction tCO₂e/%, payback, capex).
- **PDF Report Preview**: A4-style purple-cover report (exec summary, emissions table, top 4 levers);
  "Download / Print" uses `window.print()`.
- **Leadership dashboard**: filters + portfolio profile donut + top-emitters horizontal bar + top-RM
  table with green/amber/red engagement bars.
- **RM dashboard**: filters + **Emission Profile / New Financial Products** toggle; company list with
  purple selection; scope-split donut OR finance-product lever panel; "Record new engagement" button.

---

## 11. Known limitations / Phase-2 backlog (not built yet)
- No backend, auth, persistence, or real calculations — all values are dummy data.
- Excel upload is mocked (shows fixed parsed rows; no real `.xlsx` parsing).
- Form inputs (Scope 1/2, data-entry tables) are not yet persisted to context or used in results.
- Production SPA routing fallback not configured (only matters if hosting a static build; dev is fine).
- Bundle is one chunk (~681 kB) — code-splitting deferred.
- Next phases per `SustainSME_Workplan_Summary.docx`: Supabase (DB/auth/storage/Edge Functions),
  emission-methodology spec, calculation engine, real Excel parsing, ESG/benchmark engine, lever
  engine, PDF generation, then integration + testing + Accenture-staging deploy.

---

## Changelog

> Append newest entries at the bottom. Format: `### YYYY-MM-DD — short title` then bullets of
> what changed, files touched, and why. Every code change gets an entry.

### 2026-06-10 — Initial Phase-1 frontend build
- Installed Node v24.16.0 (user-scope winget) — machine had none; admin installs blocked.
- Scaffolded Vite React-TS app at `app/`; added `react-router-dom`, `recharts`, Tailwind v3 + PostCSS + autoprefixer.
- Built design system (Accenture purple) + 12 shared components.
- Built all screens: Login, Onboarding, Scope 1, Scope 2, Scope 3 Relevance, Scope 3 Questionnaire
  (config-driven engine for all 15 categories), Results (emissions/ESG/levers/report), Leadership &
  RM dashboards. Wired full navigation via `routes.ts`/`App.tsx`.
- Authored `scope3Categories.ts` (15-category config; 1/5/8/10/11/14/15 verbatim from Figma) and
  `dummyData.ts` (all demo data). Added `chartFormat.ts` for Recharts v3 tooltip typing.
- Branding: replaced ING logo with Accenture logo (`src/assets/accenture-logo.png`), removed all "ING"
  copy, moved palette to Accenture purple.
- Verified: `npm run build` clean; all 12 routes render with no console errors; relevance Next gate
  works (0/15 disabled → 15/15 enabled); Category-1 conditional Excel + "If NO" follow-up logic works.

### 2026-06-10 — Relevance gating made demonstrable
- `AssessmentContext.tsx`: stopped pre-seeding relevance answers (now starts `{}`) so the
  "Next enables only when all 15 answered" gate is real in the demo. Added exported `DEMO_RELEVANT_IDS`.
- `Scope3Questionnaire.tsx`: stepper falls back to `DEMO_RELEVANT_IDS` when relevance not yet completed
  (prevents an empty stepper on deep-link).

### 2026-06-10 — Tailwind/PostCSS cwd-independence
- `tailwind.config.js` + `postcss.config.js`: resolve content globs and config path via
  `import.meta.url` (absolute) so the dev server works regardless of launch cwd (the Claude preview
  MCP spawns from a different directory; relative globs caused "class does not exist" errors).

### 2026-06-10 — Fix stretched Accenture logo on Login welcome panel
- `Login.tsx`: the left brand panel is `flex flex-col`, which stretches children on the cross axis;
  the logo (`h-7 w-auto`) was being stretched to full panel width. Added **`self-start`** so it keeps
  its natural 3.80:1 aspect ratio (verified rendered 106×28 = source ratio).

### 2026-06-12 — Handover kit
- Added `HANDOVER.md` at the project root: what folder to transfer (whole `SustainSME/`, excluding
  `app/node_modules` + `app/dist`), a one-command zip recipe, receiver setup steps, ready-to-paste
  prompts for the colleague's Claude (orientation / conventions / feature-task template), and an
  acceptance checklist. Confirmed the project is portable: `.gitignore` excludes build/deps,
  `package-lock.json` pins versions, `app/.claude/launch.json` uses plain `npm run dev`, no secrets/env.

### 2026-06-12 — Pin dev server to IPv4 (fix "can't reach localhost")
- Symptom: browser couldn't reach http://localhost:5173. Root cause: on this Windows machine Vite's
  default binding listened only on IPv6 `::1`, while the browser resolved `localhost` to IPv4
  `127.0.0.1` (not bound) → connection refused. (`--host` made it worse: bound `::` only, still no IPv4.)
- `vite.config.ts`: added `server: { host: '127.0.0.1', port: 5173, strictPort: true }`. Now both
  `localhost` and `127.0.0.1` return HTTP 200.
- Ops note: background dev servers started via tooling get reaped when the session turn ends. For a
  persistent server, run `npm run dev` in your own terminal, or launch detached via
  `Start-Process powershell -ArgumentList '-NoExit','-Command','…npm run dev'`.

### 2026-06-10 — Quick-select on Scope 3 Relevance screen
- Decision: chose **quick-select buttons** over defaulting all categories to Yes. Defaulting to Yes
  would re-break the "Next enables only when all 15 answered" gate (it'd start satisfied) and biases
  the user; an explicit action keeps the choice deliberate and the gate meaningful.
- `AssessmentContext.tsx`: added `setRelevanceAll(value: YesNo)` to the context (sets every category
  at once).
- `Scope3Relevance.tsx`: added a "Quick select" toolbar above the list with **Mark all as Yes** /
  **Mark all as No** buttons. Individual Yes/No toggles still work after a bulk set.
- Verified: 0/15 (Next disabled) → All Yes = 15/15 / 15 relevant / Next enabled → flip one to No =
  14 relevant → All No = 0 relevant / Next enabled. `npm run build` clean.

### 2026-06-18 — Phase-4 emission methodology spec started
- Added `EMISSION_METHODOLOGY.md` at project root: the Phase-4 calculation spec the Phase-5 backend
  will implement (per `SustainSME_Workplan_Summary.docx`). Covers the canonical activity-line data
  contract, replaceable factor sets, Scope 1 & 2 formulae (incl. the grid-vs-captive electricity
  split), and the Scope 3 **single method axis** (supplier-specific → activity → spend → proxy) with
  PCAF-style data-quality tiers, the relevance screener, guardrails (de-dup, region>currency, double
  counting), and the format-agnostic ingestion contract (detect→adapter→normalise→resolve→triage).
- Grounded in review of the BBAN/Hindalco decarbonization models and validated against real site data
  (Hindalco *Taloja*, Bühler *BBAN*). EF values in the doc are flagged _(seed)_ and need SME validation.
- Doc-only; no app code changed. Flagged for later: invert the Scope 3 questionnaire gating in
  `app/src/data/scope3Categories.ts` to spend-first (matches SME data reality).

### 2026-06-18 — Methodology: unattended assurance model (no per-line human review)
- `EMISSION_METHODOLOGY.md`: revised principle §1 and added **§8.1** — the product must run
  unattended (bank-operated at scale), so "a human confirms" is replaced by a layered assurance model:
  governed/version-pinned mapping model (offline benchmark validation, monitoring), confidence-gated
  graceful degradation (low confidence → conservative deterministic fallback + data-quality penalty,
  never blocks), conservative bias, automated plausibility/reconciliation controls, materiality-weighted
  escalation (+ optional SME self-confirm), and reproducibility via a frozen versioned mapping artifact
  (maths runs on the artifact, not live on a model). Added the product knobs to set (thresholds,
  fallbacks, plausibility bounds, revalidation cadence).

### 2026-06-18 — First bridge: shared calc contract types + doc linkage
- `app/src/types.ts`: added the Phase-2 **calculation contract** as TYPE-ONLY declarations (no runtime
  code, Phase-1 frontend unaffected): `Scope`, `CalcMethod`, `DataQualityTier`, `LineStatus`,
  `EmissionFactor`, `FactorSet`, `ActivityLine`, and engine-output shapes (`ScopeTotal`,
  `Scope3BreakdownItem`, `EmissionsTrendPoint`, `DataQualitySummary`, `InventoryResult`). These mirror
  `dummyData.ts` shapes so the Phase-5 engine is a drop-in; cross-referenced to `EMISSION_METHODOLOGY.md`.
- Doc discoverability: root `CLAUDE.md`, `app/CLAUDE.md`, and the top of this log now point to
  `EMISSION_METHODOLOGY.md` and the contract types, so backend work is findable from inside `app/`.
- Verified: `npm run build` (tsc -b && vite build) clean — type-only additions, no behaviour change.

### 2026-06-18 — Methodology refinements from carbon-accounting SME review
- `EMISSION_METHODOLOGY.md`: incorporated SME feedback. (1) §5.3 — clarified activity/supplier data is
  used **wherever it already exists**, not only on big lines; Pareto governs only where you *chase*
  missing data. (2) §4.2 — energy inputs (electricity/heat/steam/cooling) explicitly **also feed Scope 3
  Cat 3** (upstream + T&D losses): one input, two scopes. (3) Added **Appendix A — Input data
  requirements** (profile/boundary, S1, S2, S3) with ⬤/◐/○ realism flags and three input tiers;
  Cat 9 + Cat 12 driven by **sold-product quantities + weights**; Cat 8/10/11/13–15 specified as
  **company-specific modules** (per-company activity question + calc rule), with Cat 10 (intermediate-kg
  → modelled onward processing) and Cat 11 (sold units × propellant GWP) as illustrative patterns.
- Doc-only; no app code changed.

### 2026-06-18 — Front-end: Scope 3 spend-first inversion + onboarding gating inputs
- **Scope 3 questionnaire inverted to spend-first** for the purchased/paid upstream categories
  (`scope3Categories.ts`): for Cat 1, 2, 4, 6 the lead question now asks for **spend** (e.g. from the
  AP ledger) and physical quantity is the **optional refinement** (shown when spend = Yes; "for any of
  these items… improves accuracy"). Manual-entry tables reworked to lead with Spend + Currency, with
  quantity/unit columns now `optional`. Added a `CURRENCIES` const and a data-method note in the file
  header pointing to `EMISSION_METHODOLOGY.md §5`. Other categories keep their category-appropriate
  primary ask (unchanged).
- **Onboarding extended** (`Onboarding.tsx`) with the Appendix-A gating inputs: **Sector code
  (NACE/ISIC)**, **Reporting currency**, and an **operational-boundary toggle** ("include employee
  housing / staff colony?"). `CompanyProfile` (`types.ts`) gained `naceCode`, `revenueCurrency`,
  `includeEmployeeHousing`; defaults added in `AssessmentContext.tsx`.
- Still Phase-1: forms/UI only, dummy data, **no calculation wired**.
- Verified: `npm run build` clean; in-browser — onboarding renders all new fields; Cat 1 leads with the
  spend question; the quantity-refinement appears on Yes; manual table columns are spend-first
  (Spend Category · Supplier · Spend · Currency · Quantity/Mass (Optional) · Unit (Optional)).

### 2026-06-30 — Phase-2 applied: real Scope 1 & 2 engine (backend + Emissions Workbench)
- Applied the `SustainSME_Scope1_2_Update` package in **merge mode** (preserving this session's work).
- **Security-reviewed before running:** `backend/claude_client.py` calls the local `claude` CLI via a
  subprocess **arg list** (no shell → no injection), file content on **stdin**, **tools disabled** for
  text / **`Read`-only scoped dir** for vision — no `--dangerously-skip-permissions`, no network, no API
  key. `requirements.txt` = standard packages (fastapi/uvicorn/pydantic/openpyxl/pdfplumber/pypdf/docx).
- **ADDED** `backend/` (FastAPI service: `/api/extract`, `/api/calculate`, `/api/factors`, `/api/ping`;
  deterministic `calc/` + source-cited `factors/*.json`) and `app/src/lib/apiClient.ts`,
  `app/src/components/EmissionsWorkbench.tsx`, `app/src/components/ExtractionSummary.tsx`.
- **REPLACED** `app/src/pages/{Scope1,Scope2,Results}.tsx` (host the Workbench / live Scope 1&2 banner);
  **MERGED** `app/src/types.ts` + `app/src/context/AssessmentContext.tsx` — took the update's schema
  mirror (`ActivityBundle`, `EmissionResult`, …) and re-added this session's onboarding fields
  (`naceCode`, `revenueCurrency`, `includeEmployeeHousing`) so `Onboarding.tsx` still compiles.
  Backups of the 5 replaced files in `_pre_phase2_backup/`.
- **Untouched:** `Onboarding.tsx` (kept); `data/scope3Categories.ts` (spend-first Scope 3 retained);
  `vite.config.ts`. The earlier `components/DataUpload.tsx` is now superseded by the Workbench (left
  unused; the `xlsx` dep it used is still installed).
- **Verified:** backend venv (Python 3.14) + `pip install` clean; `eval/verify_calc.py` → **ALL CHECKS
  PASSED** (Scope 2 loc 177.5 / mkt 142.0, Scope 1 57.12 t, cited factors); HTTP `/api/calculate`
  returns cited tCO₂e (100k kWh India grid → 71.0 t; gas + R410A → Scope 1); `/api/factors` lists 13
  countries; `npm run build` clean; the Workbench renders in-browser and reaches the backend.
- **Not completed (flagged):** the upload→extract path needs the `claude` CLI on PATH or `CLAUDE_BIN`
  set (not found on this machine — calc path is independent and works); a clean in-browser *Calculate*
  click wasn't captured due to preview tab-instability (tooling, not the app). **Calculation logic
  unchanged**, per instruction.

### 2026-06-30 — Onboarding: Country & Region fillable, not pre-filled (feedback)
- `Onboarding.tsx`: changed **Country** and **Region** from fixed dropdowns to free-text inputs
  (placeholders "e.g. India" / "e.g. Maharashtra") so any location can be entered (the old dropdowns
  didn't even list India); removed the now-unused `COUNTRIES`/`REGIONS` imports.
- `AssessmentContext.tsx`: cleared the pre-filled `country`/`region` defaults (now `''`) so the fields
  start empty. Verified in-browser (both render as empty inputs) + `npm run build` clean.
- Note: the Workbench's "Primary site country" dropdown is populated from the backend
  (`/api/factors`, 13 countries incl. India) — it shows empty only when the backend isn't running.

### 2026-06-30 — Workbench: per-line calculation trail (easy validation)
- `EmissionsWorkbench.tsx`: under every result row the table now shows an **always-visible derivation
  line** reconstructed from the backend's returned fields — `quantity × factor_value factor_unit
  [÷ 1000 when per-kg] = tCO₂e` — plus the row's `assumptions` (e.g. "grid drawal used; captive/
  open-access excluded"). Makes each number auditable at a glance; factor source + tier stay in their
  columns. Added `fmtCalc()` helper; frontend-only, **no calculation change**.
- Verified in-browser: e.g. `3199.0 tonnes × 3,168 kgCO2e/tonne ÷ 1000 = 10,134.43 tCO₂e`
  (Scope 1 KPI 10,134.43). `npm run build` clean.
- Also fixed earlier this session (ops): a wedged `uvicorn` was holding :8000 without responding →
  frontend "Calculating…" hung forever; killed it and started a clean backend (responds in ~260 ms).

### 2026-06-30 — Auditable Excel export of the full calculation (bank disclosure)
- Backend `export_xlsx.py` + `POST /api/export.xlsx` (openpyxl, already a dep): workbook with
  **Summary** (totals that tie back, boundary, factor-source register, warnings), **Calculations**
  (one row per line: quantity × factor ÷1000 = tCO₂e, tier, factor value/unit/source, assumptions),
  **Factor library** (datasets + sources + year). Frontend: `apiClient.exportXlsx` + a
  **"Download Excel (all calculations)"** button in the workbench results. Reuses the deterministic
  `calculate()`, so the workbook matches the app exactly.

### 2026-06-30 — Scope 2 estimate when no bill/meter (floor area / headcount + EUI)
- Extended the method ladder down one rung for Scope 2. If a site has **no metered electricity**, the
  engine estimates it: `floor_area_m2 × EUI` (electricity), or — with no area — `employees_fte ×
  m²/FTE × EUI`. Result flagged **`tier="estimated"`** with a full assumption line + source. **Never
  fires when a bill exists** (metered rows win → no double-count; verified).
- Files: `schema.py` `Site` gained `floor_area_m2` + `building_type` (**mirrored in
  `app/src/types.ts`**); new `factors/eui_benchmarks.json` (screening EUI kWh/m²/yr by building type +
  m²/FTE, sourced CIBSE TM46/DEFRA, flagged screening-grade); `factors.py` (`eui_electricity`,
  `m2_per_fte`, metadata + `eui`); `calc/scope2.py` fallback; `EmissionsWorkbench` boundary gained
  Floor-area + Building-type inputs + a hint; Excel factor register includes EUI.
- "Unknown energy mix" was already handled (no `green_instrument` → location-based grid average).
- Verified: 1,200 m² office → 43.43 t (estimated); 25 FTE → 375 m² → 13.57 t (estimated); bill present
  → 45.72 t primary only (no double-count); `npm run build` clean. EUI values are a **starter set —
  validate before assurance.**

### 2026-06-30 — Onboarding: full 27-sector list + placeholder
- Replaced the 8 demo sectors in `dummyData.ts` `SECTORS` with the **27-sector list** from the
  reference tool (Business activities · Construction & civil engineering · … · Manufacturing —
  Chemicals/Consumer goods/Food & beverages/Heavy/Other · … · Transport & logistics · Warehousing).
- Added a **"Select your sector"** placeholder option; cleared `defaultProfile.sector` and `naceCode`
  to `''` so the field starts unset (old default was no longer in the list).
- Verified in-browser: dropdown shows 28 options (placeholder + 27); `npm run build` clean.
- Note: sector will later drive the EEIO mapping + sector-materiality (the category-guidance design) —
  a sector→NACE map is a follow-up.

### 2026-07-08 — Plain-language guidance: recurring "support person" helper (English)
- New `components/GuideNote.tsx` (Accenture purple): a friendly **support-person avatar** (inline SVG)
  + "Why we ask this / What counts here" + plain-language tips. Reused on **Onboarding** (with a
  "first time? here's what you'll need" list), **Scope 1**, **Scope 2** (incl. the no-bill / unknown-mix
  tips), and **Scope 3 Relevance** (replaced the plain note). English copy, additive, no logic change.
- Rationale: the tool was too dense for first-time SMEs (inspired by SME Climate Hub's side-panel
  guidance, not copied; kept our purple). The same avatar is the intended entry point for a future
  **advisory support chatbot** — which is architecturally independent (separate stateless `claude`
  call) and does **not** affect the deterministic calc or the extraction LLM.
- Verified: `npm run build` clean; in-browser (Scope 2) the guide + avatar render. (preview_screenshot
  was flaky this session; confirmed via live-DOM eval instead.)

### 2026-07-08 — Sector→archetype prefill of the Scope 3 relevance screener
- New `data/sectorArchetypes.ts`: maps all **27 sectors → 8 archetypes** (office · manufacturing ·
  retail · transport · construction · realestate · agriculture · hospitality) and each archetype →
  its default-relevant Scope 3 category ids. `defaultRelevanceForSector()` returns Yes/No for all 15.
- `AssessmentContext`: added `setRelevanceMap` (bulk set).
- `Scope3Relevance.tsx`: on first visit auto-prefills all 15 answers from the sector's archetype
  (fully editable; adds a "Prefill for my sector" quick-select button + a "Pre-filled for <archetype>"
  note). The SME confirms a short list instead of answering 15 from scratch → fewer questions.
- S1 & S2 are always assessed; Cat 3 (fuel/energy) auto-relates to them.
- Verified live (SPA nav): "Manufacturing - Food and beverages" → archetype "manufacturing / industry",
  15/15 answered, 7 relevant (Cat 1–7) / 8 No; `npm run build` clean. (Full-reload eval nav resets
  context — real in-app navigation persists the sector, which is how the prefill is driven.)

### 2026-07-08 — Scope 3 relevance redesigned: plain-language, question-led, filtered
- Feedback: the category + technical definition + Yes/No was intimidating (no SME self-assesses "cradle-
  to-gate emissions…"). Reworked `Scope3Relevance.tsx` to **lead with a plain-language question** per
  category ("Do your people travel for business?"); the GHG-Protocol name/definition drops to a small
  secondary line + hover tooltip. Added `RELEVANCE_QUESTIONS` (15) to `scope3Categories.ts`.
- **Grouped by sector archetype**: "Likely relevant for your business" (the prefilled set) shown up top;
  everything else under a collapsible **"Show other categories (n)"** — filtering never *drops* a
  category, it just de-emphasizes it (addresses the "what falls away?" worry). Prefill, per-item toggle,
  quick-select and the 15/15 Next-gate all retained.
- Removed the now-unused `CategoryBadge` import from the page.
- Verified live (office sector): 5 plain questions under "Likely relevant" + "Show other categories (10)"
  that expands/collapses; 15/15 answered, 5 relevant; `npm run build` clean.

### 2026-07-08 — Onboarding: auto-fill NACE code from the sector
- SMEs don't know their NACE code, so it's now derived: `SECTOR_NACE` map (all 27 sectors →
  representative NACE Rev.2 code) in `dummyData.ts`; the onboarding sector `<select>` sets `naceCode`
  automatically on change; the NACE field is now **read-only / auto-filled** (helper: "Auto-filled
  from your sector"). Also refreshed the earlier reword: Country/Region are free-text (unchanged).
- Starter mapping — refine alongside the sector→EEIO work.
- Verified: select "Pharmaceuticals" → NACE "21"; field read-only & empty until a sector is picked;
  `npm run build` clean.

### 2026-07-08 — Question-led Scope 1 & 2 entry + heating estimate (SME Climate Hub style)
- New `components/GuidedEntry.tsx`, shown at the top of the workbench: plain-language, question-led
  data entry instead of raw fields.
  - **Electricity (Scope 2):** "Do you have an electricity bill?" → *Yes* (kWh, primary) / *No, but I
    know our floor area* (floor area + building type → EUI estimate) / *No premises / no purchased
    electricity* (recorded as 0).
  - **Heating (Scope 1/2):** "Did your company heat its site?" → gas / oil / district heating /
    electricity / none; for gas/oil/district a follow-up "Do you know how much?" → amount (primary) or
    *estimate* (from floor area). Electric heating → noted as counted in electricity; none → 0.
  - Answers write `notes`-tagged rows into the shared bundle; the deterministic engine picks the tier.
- **Disambiguates estimate-vs-zero** (the blank-field ambiguity): "none" writes an explicit `grid_kwh=0`
  row, which the electricity fallback treats as metered → **no floor-area estimate** fires. Fixes the
  case where floor area (set for heating) would otherwise wrongly trigger an electricity estimate.
- **Backend heating estimate:** `eui_benchmarks.json` `heating_kwh_per_m2_yr`; `factors.eui_heating` +
  `fuel_ef_per_kwh` (per-kWh EF derived from the fuel NCV); `calc/scope1.stationary` estimates gas/oil
  heating (quantity null + floor area) as **S1 `estimated`**; `calc/scope2.thermal` estimates district
  heat (energy_kwh null + floor area) as **S2 `estimated`**; `engine` now passes `boundary` to `stationary`.
- Verified (HTTP): gas heating "don't know", office 1,000 m² → **S1 19.5 t estimated**; district →
  **S2 38.1 t estimated**; electricity "none" (grid 0) with floor area set → **S2 0, no estimate**.
  `npm run build` clean; both guided questions render live on Scope 1 & Scope 2.

### 2026-07-08 — Scope 1: company-vehicles (mobile combustion) guided question + estimate
- Closed a real Scope-1 gap (fleet was only shown if extracted, no guided/manual entry). `GuidedEntry`
  focus 1 now has a second card: **"Does your company own or lease vehicles?"** → Yes (main fuel
  diesel/petrol; litres = primary, or "don't know" → estimate from vehicle count) / No → 0.
- Backend: `Scope1Mobile.vehicle_count` (schema + `types.ts` mirror); new `factors/mobile_benchmarks.json`
  (avg litres/vehicle/yr, screening, sourced); `factors.avg_litres_per_vehicle`; `calc/scope1.mobile`
  now estimates `count × avg L/vehicle × fuel EF` → **S1 `estimated`** when litres are unknown.
- Scope 1 UI now covers stationary (heating) + **mobile (fleet)** + fugitive (refrigerants). Still not
  modelled: broader stationary (generators/process heat) beyond heating, and process emissions
  (heavy-industry only).
- Verified: 5 diesel vehicles, litres unknown → **24.12 t estimated**; `npm run build` clean; both
  Scope-1 questions render live.

### 2026-07-08 — Bug fixes: R134a refrigerant lookup + API fetch timeout
- **R134a (and any refrigerant) now matches case-insensitively.** `factors.gwp()` upper-cased the
  input to `R134A` but the JSON key was `R134a`, so R134a fugitive emissions were silently skipped.
  Fix: normalise both the input and the factor-file keys via new `_norm_refrigerant()` before lookup,
  so factor files can use any casing. Files: `backend/factors.py`. Verified: `R134a`/`R-134A`/`r134a`
  all → 1430; `R410A` → 2088.
- **API calls no longer hang forever when the backend is down/wedged.** Added `fetchWithTimeout()`
  (AbortController) in `app/src/lib/apiClient.ts` with clear, user-facing errors ("Request timed out…
  Is the backend running? Start it with backend/start-backend.bat"). Applied to all calls: ping 4 s,
  calculate/factors/export 30 s, extract 120 s (LLM headroom). Fixes the stuck-"Calculating…" spinner.
  Files: `app/src/lib/apiClient.ts`. Verified: `npm run build` clean.

### 2026-07-09 — Downloaded official emission-factor source files (EPA, DEFRA, ADEME, IPCC)
- Added `backend/factors/sources/` holding the raw, free official datasets so every factor in
  `backend/factors/*.json` is traceable to a citable source (audit trail + annual-update input; not
  parsed at runtime). Files: EPA GHG Emission Factors Hub 2025 (xlsx), DEFRA/DESNZ 2025 conversion
  factors full-set + flat-format (xlsx) + methodology (pdf), ADEME Base Carbone® v17.0 FR (xlsx),
  IPCC AR6 WG1 Ch.7 Supplementary Material GWP tables (pdf), GHG Protocol GWP values Aug-2024 (pdf).
- `backend/factors/sources/SOURCES.md` = provenance manifest (provider, version, coverage, licence,
  URL, download date). All 7 files signature-validated (PK/%PDF).
- Note: IPCC has no single factors spreadsheet — default factors come from the online **EFDB** (query
  → export), GWP values from the assessment reports (our `gwp.json` = AR5 GWP100; AR6 SM enables migration).

### 2026-07-09 — Scope 3 spend-based (EEIO) engine + unified S1/S2/S3 download at end of flow
- **Why:** users/customers must see & download the actual calculations (esp. Scope 3) to trust and
  test them. Scope 3 previously existed only as a relevance questionnaire with dummy numbers.
- **Methodology first:** downloaded GHG Protocol Scope 3 Standard + Technical Guidance
  (`backend/factors/sources/ghgp-scope3-*.pdf`), extracted Appendix D calculation methods for all 15
  categories → `backend/factors/sources/GHGP_SCOPE3_METHODS.md` (design basis). First slice = the
  **spend-core categories 1, 2, 4, 9** (spend × EEIO factor); activity-based 3/5/6/7 and relevance-flag
  10–15 deferred.
- **EEIO factors:** `backend/factors/sources/epa-supply-chain-ghg-factors-v1.3-CO2e-USD2022.csv`
  (EPA USEEIO, 1016 NAICS, 'with margins', kg CO2e/USD2022, GWP AR5). Curated into
  `backend/factors/scope3_spend_factors.json` — 31 SME-friendly spend buckets, each cited to a
  representative NAICS code, + static 2022 FX table (EUR/GBP/CHF/INR→USD).
- **Backend:** `schema.Scope3Spend` (+ `scope3_spend[]`, `scope3_total_t`, `EmissionResult.scope` now
  `1|2|3`); `factors.py` spend lookups + `fx_to_usd` + `scope3_buckets`; new `calc/scope3.py`
  (`spend`: amount → USD2022 via FX × EEIO factor, tier `spend`, full audit assumptions);
  `engine.py` sums S3; `export_xlsx.py` Summary rows + factor register include Scope 3; new endpoint
  `GET /api/scope3-buckets`.
- **Frontend:** `types.ts` mirror (Scope3Spend, Scope3Bucket/Response, scope3_total_t, scope '3');
  `apiClient.scope3Buckets`; context `setScope3Spend` + mergeBundle preserves spend; new
  `components/Scope3SpendEntry.tsx` (spend form driven by /api/scope3-buckets, grouped by category);
  new `pages/AllCalculations.tsx` at `ROUTES.calculations` (`/results/calculations`) = spend entry +
  unified S1/S2/S3 KPIs + per-line formula table + **⬇ Download Excel (all calculations)**; added to
  `ResultsNav` ("All calculations" tab) and `App.tsx`.
- **Verified:** backend E2E (S1 93.77 t, S2 228 t, **S3 301.77 t**; Excel has S1/S2/S3 rows with
  formulas that reconcile). `npm run build` clean (623 modules). In-browser: page renders all 4
  categories, purchase-type dropdown populates 24 live Cat-1 buckets, entering €500k → **S3 25.3 t**
  (500k × 1.053 FX × 0.048), Total KPI + download button appear.
- **Not done (by design, deferred):** activity-based Cat 3/5/6/7 (DEFRA factors already local);
  relevance-flag-only Cat 8, 10–15; EXIOBASE (EU) EEIO set as an alternative to US USEEIO; wiring the
  new page into the main flow's "Next" (reachable now via ResultsNav tab).

### 2026-07-09 — Scope 3 Cat 5 (waste) engine + What a Waste / DEFRA / REEB benchmarks
- **Why:** benchmark-based estimation so a SME without waste tonnage still gets a defensible Cat 5
  figure (the "estimate" tier), per user request to build in What a Waste + REEB benchmarking data.
- **Sources (all in `backend/factors/sources/`, see SOURCES.md):** World Bank **What a Waste 3.0**
  country dataset (treatment mix + composition, 217 countries), **DEFRA 2025** waste-disposal factors
  (kg CO2e/tonne by treatment), **REEB** (Better Buildings Partnership) building-intensity PDFs
  (kept as reference — numbers are chart-image only, not machine-readable).
- **Factor file** `backend/factors/waste_benchmarks.json`: DEFRA treatment EFs (landfill 520.5,
  incineration 4.69, recycling 4.69, composting/AD 8.98 kg CO2e/t); What a Waste treatment mix for
  DE/GB/FR/IT/NL/CH/ES/PL/US + world default (consolidated to 4 buckets, renormalised); per-FTE
  generation screening defaults by building type.
- **Method (GHG Protocol Cat 5, average-data):** `tonnes × Σ(treatment share × EF)`. Primary when
  tonnes given; else estimated `headcount × per-FTE benchmark → tonnes`. Treatment mix from the site
  country (What a Waste) unless the SME overrides. Backend: `schema.Scope3Waste` (+ `scope3_waste[]`),
  `factors.py` waste lookups, `calc/scope3.waste`, `engine.py` adds it to the Scope 3 total,
  `export_xlsx` factor register includes `waste`.
- **Frontend:** `types.ts` mirror (Scope3Waste, scope3_waste); context `setScope3Waste` + merge
  preserves it; new `components/Scope3WasteEntry.tsx` (question-led: known tonnage / estimate from
  headcount / skip) on `AllCalculations` page.
- **Verified:** backend E2E — 40 t DE → blended EF 12.86 → 0.51 t (primary); 50 office FTE GB →
  7.5 t est. → blended 54.4 → 0.41 t (estimated), full audit trail (What a Waste mix + DEFRA EF
  formula). `npm run build` clean (624 modules). In-browser: waste card renders 3 options, estimate +
  50 FTE + Calculate → Cat 5 row appears (estimated tier, "What a Waste" assumptions, download button).
- **Deferred at that point (now done, see next entry):** activity-based Cat 3, Cat 6, Cat 7
  — DEFRA factors already local; relevance-flag Cat 8, 10–15; REEB numeric extraction for tighter
  building intensities; EXIOBASE (EU) EEIO.

### 2026-07-09 - Scope 3 activity-based Cat 3 (energy WTT/T&D), Cat 6 (travel), Cat 7 (commuting)
- Completes the activity-based slice with DEFRA 2025 factors (already local). New factor file
  backend/factors/scope3_activity_factors.json: electricity WTT+T&D 0.0684 kg/kWh (gen 0.0459 +
  T&D 0.01853 + WTT-of-T&D 0.00397); travel modes per passenger-km (air with RF, rail, bus, coach,
  taxi, car); hotel per room-night by country; commuting defaults (220 days, 22 km/day round-trip).
- Cat 3 auto-derives from the Scope 2 electricity already in the bundle (grid kWh x combined WTT+T&D)
  - no re-entry; tier estimated. Cat 6 distance-based (mode x passenger-km) + hotel nights; tier
  primary. Cat 7 commuting = headcount x km/day x working days x mode EF (or explicit pkm); estimated.
- Backend: schema.Scope3Travel/Scope3Commute (+ bundle lists), factors.py loaders (electricity_wtt_td,
  travel_mode_ef, hotel_ef, commuting_defaults), calc/scope3 (energy_related, travel, commuting),
  engine.py adds all three to the Scope 3 total, export factor register includes scope3_activity.
- Frontend: types.ts mirror (Scope3Travel/Commute), context setters + merge preserve, new
  components/Scope3TravelEntry.tsx (Cat 6 trip rows + hotel; Cat 7 commuting toggle) on the
  AllCalculations page; Cat 3 shown as auto-calculated (note, no input).
- Verified: backend E2E - 480k kWh -> Cat 3 32.83 t; air 40k pkm -> 5.11 t; rail 25k -> 0.89 t;
  hotel 120 nights -> 1.58 t; 50 FTE commuting -> 242k pkm -> 40.47 t (S3 total 80.89 t, no warnings).
  npm run build clean (625 modules). In-browser: Cat 6/7 cards render, add-trip + commuting toggle +
  Calculate -> Cat 6 & Cat 7 rows appear, no warnings, download present.
- Scope 3 now computed: Cat 1/2/4/9 (spend), Cat 3 (energy WTT), Cat 5 (waste), Cat 6 (travel),
  Cat 7 (commuting). Deferred: relevance-flag Cat 8, 10-15; EXIOBASE (EU) EEIO; REEB numeric tables.

### 2026-07-09 - Scope 3 coverage map (all 15 categories) + flow wiring
- Better "flag" for the uncomputed categories: instead of a flat "not calculated", a GHG-Protocol-style
  COMPLETENESS statement across all 15 categories, each with an honest status badge:
  Quantified (green) / Supported - add data (blue, engine exists: 1/2/3/4/5/6/7/9) /
  Relevant - not yet quantified (amber, relevance=yes for 8,10-15) / Not relevant - excluded (grey,
  relevance=no) / Not screened. New component components/Scope3Coverage.tsx, added to the
  AllCalculations page. Status derives from calc.results (parses "Cat N") + the relevance answers in
  context - no new state. GHG Protocol requires disclosing included vs excluded categories + reason;
  this panel is that statement.
- Flow wiring: Scope3Relevance "Next" now navigates to ROUTES.calculations (the real S1/S2/S3
  calculation + download) instead of the Phase-1 dummy per-category questionnaire. The main path is
  now Scope1 -> Scope2 -> Scope3 relevance -> All calculations -> report. Questionnaire pages remain
  reachable by deep link / ResultsNav.
- Verified: npm run build clean (626 modules). In-browser: coverage renders all 15 rows with badges;
  after entering a Cat 1 spend and calculating, that category flips from "Supported" to "Quantified".

### 2026-07-09 - Full-flow demo verification + coverage status-priority fix
- Coverage fix: a category the SME marked "not relevant" is now shown Excluded even when the engine
  supports it (SME screening beats engine-support; Quantified still wins if data was entered).
  components/Scope3Coverage.tsx statusFor order: quantified > excluded(relevance=no) > supported > relevant > unscreened.
- End-to-end demo click-through verified in-browser (SPA nav, context preserved): Onboarding (sector
  Construction -> NACE 41 auto-filled) -> Scope 1 (guided) -> Scope 2 -> Scope 3 relevance (prefilled
  from archetype, 15/15) -> Next -> /results/calculations. Coverage showed 7 supported (Cat 1-7) +
  8 excluded (Cat 8-15) per the construction archetype; entering a Cat 1 spend + Calculate flips it to
  Quantified with S1/S2/S3 totals + download. npm run build clean (626 modules).

### 2026-07-09 - Onboarding GuideNote copy trimmed
- Removed the "Now / Next steps / Later + nothing has to be perfect" roadmap tips from the Onboarding
  GuideNote (confusing/unnecessary at that step). Replaced with one concise line: enter what's
  relevant to your business; anything missing is estimated and flagged. Title -> "Just the basics to
  start". File: app/src/pages/Onboarding.tsx. Verified in-browser + build clean.

### 2026-07-09 - Removed developer-only "Download JSON" from extraction review
- ExtractionSummary: removed the "Download JSON" action button + downloadJson() helper (a
  developer artifact, not needed by SME clients) and trimmed the subtitle to
  "What the model read from your documents. Confirm it below before calculating."
  File: app/src/components/ExtractionSummary.tsx. Build clean (626 modules).

### 2026-07-09 - Report page: dual download (real Excel + high-level PDF) + working print
- ReportPreview reworked into "Reports & downloads": a no-print card with two options -
  (1) "Download all calculations (Excel)" -> api.exportXlsx(bundle), the real auditable S1/S2/S3
  workbook; (2) "Download / print report (PDF)" -> window.print() of the board-ready summary.
  Backend-status + error handling like the calc page; Excel button disabled when backend down.
- Print now works: added @media print rules in index.css (visibility trick - only .print-area prints,
  .no-print hidden, background colours preserved via print-color-adjust, @page margins). Report wrapper
  tagged .print-area; download card + bottom nav tagged .no-print. So print/Save-as-PDF outputs just
  the clean report, not the app chrome.
- Note: the visual report still uses dummyData (high-level demo); the *real* auditable numbers are the
  Excel export. Files: app/src/pages/ReportPreview.tsx, app/src/index.css. Verified in-browser
  (both buttons render, print-area + 2 no-print present, Excel enabled); build clean (626 modules).

### 2026-07-09 - Primary site country: free-text with autocomplete (was a limited dropdown)
- EmissionsWorkbench "Primary site country (grid factor)" changed from a <select> limited to the
  ~13 countries in grid_factors.json to a free-text <input> + <datalist> (suggestions = those grid
  countries). SMEs can now enter any country; unmatched countries fall back to the world-average grid
  factor (already handled by factors.grid_factor, flagged as an assumption). Added a hint line.
  File: app/src/components/EmissionsWorkbench.tsx. Verified in-browser; build clean (626 modules).

### 2026-07-09 - Excel export: full step-by-step calculation detail
- User wanted to see every calculation, not just the final formula. export_xlsx.py now:
  (1) "Calculations" sheet - assumptions joined line-by-line with wrap_text + sized rows + wider
      columns, renamed col to "Working / assumptions".
  (2) NEW "Calculation steps" sheet - every sub-calculation broken out row by row per activity:
      Input -> Factor (value/unit/source) -> Step 1..n (each intermediate assumption, e.g. FX
      conversion, tonnage-from-headcount, blended-EF = Sum(share x EF)) -> Calculation (formula)
      -> Result (tCO2e + scope + tier). Purple block header per activity.
  Workbook now: Summary / Calculations / Calculation steps / Factor library.
- Verified: generated a full S1/S2/S3 workbook; the steps sheet shows the complete audit chain for
  every line (stationary, mobile-estimate, electricity location+market, spend+FX, waste-estimate,
  travel, commuting). File: backend/export_xlsx.py.

### 2026-07-10 - Heating: multi-select fuels + % split for estimates
- Why: a site can use several heating fuels at once, but the guided question was single-select — you
  could only record one. (Requested by PM.)
- Frontend (`app/src/components/GuidedEntry.tsx`): heating question is now **multi-select checkboxes**
  (Natural gas, Heating oil, **LPG**, District heating, Electricity, "No heating"). Each selected fuel
  gets its own amount-vs-estimate choice + amount field. Gas/oil/LPG → Scope 1 stationary; district →
  Scope 2 thermal; electricity → note only; "No heating" clears + zeroes. Added a `Chk` checkbox
  component and per-carrier state.
- Methodology: each fuel is summed on its own best tier (GHG-Protocol correct — no % when amounts are
  known). **Percentages are an estimation-only device:** when 2+ fuels are all estimated, the
  `area × heating-EUI` benchmark is split by each fuel's `heating_share_pct` so they don't each count
  the full load (total conserved); blank shares → equal split.
- Schema: added optional `heating_share_pct` (0–100) to `Scope1Stationary` and `Scope2Thermal`
  (`backend/schema.py`), mirrored in `app/src/types.ts`. Calc applies it in the estimate branches of
  `calc/scope1.py` (stationary) and `calc/scope2.py` (thermal). `EMISSION_METHODOLOGY.md` §4.3 updated.
- Verified: `npm run build` clean; backend HTTP test — 1,000 m² office split 60% gas / 40% oil →
  60,000 kWh (11.70 t) + 40,000 kWh (9.55 t), total heating energy conserved at 100,000 kWh, each fuel
  on its own DEFRA per-kWh factor.

### 2026-07-10 - Heating double-count fix: "measured anchors, estimates fill the remainder" (Option A)
- Bug (spotted by PM): with a KNOWN-amount fuel + estimated fuels, the estimated fuels split only the
  amount among themselves and each still drew on the FULL `area×EUI` benchmark — which already includes
  the heating the known fuel provides. Result: the known fuel's heat was counted twice (overcount).
- Fix: new pooled resolver `backend/calc/heating.py` (`resolve()`), called first in `engine.py`. Per
  site it (1) subtracts each **known** heating fuel's energy (via NCV) from the `area×heating-EUI`
  benchmark, (2) splits the **remainder** across the **estimated** heating fuels by `heating_share_pct`
  (equal if blank; single estimated fuel → whole remainder). If measured ≥ benchmark → estimates = 0
  (warned). Known fuels still computed as primary by the ordinary calculators.
- Schema: added `is_heating` to `Scope1Stationary` + `Scope2Thermal` (`backend/schema.py`, mirrored in
  `app/src/types.ts`) so the resolver can pool heating fuels across Scope 1 & 2. `heating_share_pct`
  re-documented as "% of the REMAINING heating." `calc/scope1.py` + `calc/scope2.py` now SKIP estimated
  `is_heating` rows (the resolver owns them); known/other rows unchanged. `GuidedEntry.tsx` sets
  `is_heating:true` on all heating rows and relabels the split as "of the heating we estimate."
- `EMISSION_METHODOLOGY.md` §4.3 rewritten for the remainder model.
- Verified: `npm run build` clean; backend HTTP test — office 1,000 m² (benchmark 100,000 kWh), gas
  KNOWN 6,000 m³ (→12.12 t primary, 62,167 kWh measured), oil+LPG ESTIMATED 50/50 → remainder 37,833
  kWh split 18,917 each → oil 4.52 t + LPG 4.29 t. No double-count; audit line shows benchmark − measured
  = remainder → share.

### 2026-07-10 - Added SETUP_PROMPT.md (first-time collaborator onboarding)
- New `SETUP_PROMPT.md` at repo root: a short paste-in starting prompt + full step-by-step setup for a
  collaborator's Claude — read the docs, **install/authenticate the `claude` CLI** (incl. the Accenture
  "managed settings" re-login fix + a headless `claude -p` verify test), Node/Python prereqs, backend
  venv + uvicorn, frontend npm, and end-to-end verification. Docs-only; no app code changed.

### 2026-08-03 - Demo default company → office/services law firm (fewer Scope 3 categories)
- Goal: the demo default was a food manufacturer, which is Scope-3-heavy (agricultural supply chain →
  large Cat 1 + downstream categories), so the demo pulled in almost all 15 categories and the coverage
  map looked full of gaps. Switched the default to an **office/services** example so only the categories
  the engine computes are relevant.
- Change (`app/src/context/AssessmentContext.tsx`, `defaultProfile`): `companyName` →
  **"Halstead & Roe Legal B.V."**; `sector` → "Business activities - Consultancy, legal, accounting,
  etc." (previously blank); `naceCode` → "70" (matches `SECTOR_NACE`). Because the relevance screen
  prefills from `profile.sector` on mount (`Scope3Relevance.tsx` useEffect →
  `defaultRelevanceForSector`), setting the default sector is all that's needed — it maps to the
  **office** archetype (`data/sectorArchetypes.ts`) = Cat **1, 3, 5, 6, 7**, every one computed by the
  engine. Downstream Cat 10–15 are excluded as genuinely-not-applicable rather than "to be included".
- Also realigned `DEMO_RELEVANT_IDS` (the deep-link fallback for the questionnaire stepper) from the old
  Figma-heavy set `[1,2,5,7,8,10,11,12,14,15]` (which implied uncomputed categories) to the office set
  `[1,3,5,6,7]`, so the fallback can never imply a category the engine can't compute.
- No schema change (default values only), so `schema.py` ↔ `types.ts` untouched.
- Verified: `npm run build` clean; browser — onboarding shows the firm + legal sector; relevance shows
  "Pre-filled for office / services … 5 relevant categories" (Cat 1/3/5/6/7).

### 2026-08-03 - One-click demo launcher (start-demo.bat)
- Added `start-demo.bat` at repo root for local client demos (Option 1). Pre-checks `backend\.venv`
  and `app\node_modules` exist locally (prints fix-it steps if not), launches
  `backend\start-backend.bat` + `app\start-frontend.bat` in their own windows, polls
  http://127.0.0.1:5173 until ready, then opens the browser. Reuses the existing per-server .bats.
- Tooling only; no app code changed. Frontend backend URL stays configurable via `VITE_API_BASE`
  (`app/src/lib/apiClient.ts`, default http://127.0.0.1:8000).

### 2026-08-03 - Auto-discover the `claude` binary (upload works without a PATH install)
- Problem: `backend/claude_client.py` assumed `claude` was on PATH (`CLAUDE_BIN=claude`). On a machine
  where only the Claude Code desktop app / IDE extension is installed (no standalone CLI on PATH), the
  extraction subprocess raised `FileNotFoundError` → `POST /api/extract` returned 500. This blocks the
  upload feature for anyone testing the frontend without a manual CLI install.
- Fix: new `_resolve_claude_bin()` resolves, in order: (1) `CLAUDE_BIN` env override (verbatim),
  (2) `shutil.which("claude")` on PATH, (3) the binary **bundled** with an installed Claude Code —
  globbing IDE-extension bundles (`~/.vscode`, `~/.vscode-insiders`, `~/.cursor` →
  `anthropic.claude-code-*/resources/native-binary/claude(.exe)`) and desktop-app installs
  (`%APPDATA%/Claude/claude-code/*`, `%LOCALAPPDATA%/Packages/Claude_*/.../claude-code/*`), choosing the
  highest version (version parsed from the path; mtime tiebreak), (4) bare `claude` fallback. No
  username or version hardcoded — portable across collaborators and stable across extension
  auto-updates. `CLAUDE_BIN` still overrides everything.
- Verified: with `CLAUDE_BIN` unset, resolves the newest bundled binary and extraction returns a correct
  bundle. End-to-end upload tested on the 4 `sample_docs/` files (extraction + `calculate()` → sensible
  S1 55.2 t / S2 81.5 t / S3-cat3 17.0 t) and on **4 real public sample invoices** (We Energies US,
  Nevada PUC, Stadtwerke München + Münster): correct kWh/gas, native units kept (US therms, DE
  gas-in-kWh), meter-delta computed, blank form flagged low-confidence.
- Follow-ups noted (not fixed here): (a) refrigerant "no top-up" → `refill_kg=0` suppresses the
  charge×leak-rate estimate in the engine (estimate-vs-explicit-zero ambiguity at the extract↔calc
  seam); (b) confirm the engine converts `therms` and gas billed in kWh. `SETUP_PROMPT.md` §2 updated.

### 2026-08-05 - Fix gas energy-unit conversion + refrigerant explicit-zero; full SME test
- **Gas energy units (bug).** `calc/scope1.py` and `calc/heating.py` `_to_base()` only handled
  mass↔mass and volume↔volume, so gas billed in **kWh** (EU) or **therms** (US) was silently multiplied
  by the per-m³ factor (only a warning). Verified before: 100 kWh, 100 therms and 100 m³ all gave
  0.202 t. Fix: added an `_ENERGY_GJ` map and, in both `_to_base()`s, convert energy→base via the
  existing `ncv_gj_per_base_unit` (`base_qty = qty × energy_GJ / ncv`). After: 100 kWh → 0.0195 t,
  100 therms → 0.571 t, 100 m³ → 0.202 t; warnings gone. (heating.py needed the same fix so the
  measured-heating remainder subtracts the right energy.)
- **Refrigerant explicit-zero (bug).** `calc/scope1.py` `fugitive()` used `if a.refill_kg is not None`,
  so an extracted `refill_kg=0` ("no top-up recorded") counted as a primary 0 and skipped the
  charge×leak-rate estimate. Changed to `if a.refill_kg:` (>0 → primary); a 0/None with a charge or
  tonnage now runs the inventory estimate; a 0 with no charge/tonnage still emits a stated-zero primary
  line. Verified: 14 kg R410A VRF → 1.75 t (6%/yr), 10 kg R32 split → 0.54 t (8%/yr), 1.2 kg refill
  precision AC → 2.51 t primary (unchanged). No schema change; `schema.py` ↔ `types.ts` untouched.
- **Full SME test case** (for a carbon specialist to review the maths): Halstead & Roe Legal B.V.,
  Amsterdam, 120 FTE, FY2024. Scope 1 & 2 came from the **upload/extraction** of the 4 `sample_docs`;
  Scope 3 filled with a realistic office/services profile — Cat 1 (10 spend lines) + Cat 2 (2) + Cat 3
  (auto) + Cat 5 (headcount) + Cat 6 (5 travel + hotel) + Cat 7 (3-mode commute). `calculate()` +
  `build_xlsx()` → S1 57.5 / S2 81.5 / S3 369.4 = **508.3 tCO2e**; 4-tab auditable workbook shared.
- **New engine finding (worked around in the test, NOT yet fixed): Scope 2 double-count on site-name
  mismatch.** `calc/scope2.py` (lines 68–102) matches metered electricity to boundary sites by **exact
  name**; the extractor writes a verbose address as the line's `site`, so if it ≠ the boundary site
  name, the floor-area estimate fires ON TOP of the metered bill (bill 81.5 t + estimate 99.7 t). The
  `None in metered` guard only covers an unnamed meter row on a single site. In the test I reconciled
  the site name to one value (what the app's review step would do). Fix options: normalize/relax the
  site match, or suppress the estimate whenever total metered kWh already exists for the boundary.

### 2026-08-05 - SETUP_PROMPT.md: lead with "do you already have Claude Code", CLI now last-resort
- Why: a PM Q&A surfaced that "you need the CLI" was being read as mandatory for every collaborator,
  when auto-discovery (2026-08-03 entry) already makes the desktop app or VS Code/Cursor extension
  equally sufficient — a dedicated CLI install is only needed if NONE of the three exist on that
  machine. The doc needed to say that up front, not bury it after CLI instructions.
- `SETUP_PROMPT.md` rewritten: new **"How the LLM connection works"** section explains, in plain terms,
  that there's no API key — the backend borrows whatever Claude Code (desktop app / IDE extension / CLI)
  is already logged in, via `_resolve_claude_bin()`'s auto-discovery, and any one of the three is enough.
- Step 2 is now "check what you already have" (a yes/no per the three), not "install the CLI" — CLI
  setup only runs if the answer is no to all three, then returns to the main flow.
- CLI section demoted to a labelled **"only if you have none of the three"** appendix, and its install
  method changed from `npm install -g @anthropic-ai/claude-code` to the **native installer**
  (`irm https://claude.ai/install.ps1 | iex`) — no Node.js needed for this part (Node is still required
  later, for the frontend). Login/headless-verify/managed-settings-fix steps unchanged, just relocated.
- Docs-only; no app code changed.

### 2026-08-05 - Fix Scope 2 double-count on site-name mismatch
- Bug (found in the SME test): `calc/scope2.py`'s floor-area estimate fallback matched metered
  electricity to boundary sites by **exact name**. The extractor writes a verbose address as each
  electricity line's `site`, so when it didn't equal the boundary site name, the estimate fired ON TOP
  of the metered bill (e.g. bill 81.5 t + estimate 99.7 t for one office).
- Fix: added `_norm_site()` (case/space-insensitive) and `_same_site()` (exact or either-way
  containment). The fallback now: (1) skips a site whose name loosely matches a metered line; (2) treats
  a **single-site** boundary as covered whenever ANY metered line exists (named or unnamed); (3) when
  metered kWh can't be attributed to a site (orphan/verbose label), **skips the estimate and warns**
  ("reconcile the site name in review") instead of double-counting. `_country_for()` now uses the same
  tolerant match.
- Verified (deterministic, 4 scenarios): verbose-name bug case → 81.48 t, 0 estimate, no warning; single
  site + no bill → still estimates; multi-site A-metered + B-unmetered → only B estimated; multi-site
  orphan meter → 0 estimate + 2 reconcile warnings. The SME deliverable's Scope 2 is now correct without
  the manual name reconciliation. No schema change.

### 2026-08-05 - Scope 2 market-based = residual mix (#1) + audit-display reconciliation + disclaimer
- **#1 (headline compliance).** Market-based Scope 2 used the location factor for uncovered
  consumption → understated & non-compliant. Per the GHG Protocol Scope 2 Guidance it must use the
  RESIDUAL MIX. Added `backend/factors/residual_mix.json` (AIB European Residual Mixes 2023, direct-CO2
  production RM: Netherlands 0.380, Italy 0.501, Poland 0.788 kgCO2/kWh — starter set),
  `factors.residual_mix_factor()`, and rewired `calc/scope2.py` market-based: real contractual
  instrument → 0; else residual-mix factor; country without a residual value → location fallback +
  warning. Added `_has_green_instrument()` so a descriptive negative ("none - no GoO on this contract")
  isn't mistaken for an instrument (was silently zeroing market-based). NL example: location 81.48 t vs
  market 94.39 t. `metadata()` + the export source lists include `residual_mix`.
- **Audit-display fixes (#7/#8/#9).** Fugitive estimated rows now carry the LEAKED mass (charge×rate) as
  the shown input so `input × GWP` reconciles (was charge×GWP, ~17× off); `export_xlsx._fmt_qty` keeps
  up to 3 decimals (1.2 kg no longer shows "1"); `calc/scope3.py` waste working shows shares to 1-dec %
  and 3-dec in the blend so it ties to the used EF (was rounding the 520-EF landfill share to a whole %).
- **Positioning.** Screening-grade / NOT-for-audit disclaimer written onto the Summary sheet; softened
  "auditable" wording in `export_xlsx`/`main` docstrings. All working/detail retained (per the user:
  keep the detail, just don't claim audit-usability).
- Verified deterministically (residual mix, green-instrument, display reconciliation) + end-to-end by
  regenerating the SME workbook (v2). **No schema change; `schema.py` ↔ `types.ts` untouched.**
- **Remaining review items (need decisions/data — NOT done):** #2 aviation RF + cabin class; #3 gas
  per-kWh via bill CV (NL G-gas ~9.77 kWh/m³); #4 Scope 1 fuel WTT into Cat 3; #6 EEIO NAICS re-mapping
  (facility/paper/R&M); US-EEIO→EXIOBASE; homeworking Cat 7; EV commuting on NL grid; GWP AR5→AR6.

### 2026-08-05 - GWP AR6, fuel + flight WTT into Cat 3, aviation verified (all from local source files)
- Sourced from the authoritative files already in `backend/factors/sources/` (DEFRA 2025 flat file, IPCC
  AR6 SM) rather than web snippets (which conflicted / mixed AR5+AR6).
- **GWP AR5 → AR6** (`gwp.json`): R410A 2088→2256, R32 675→771, R134a 1430→1526, R22 1810→1960; blends
  recomputed from AR6 components (verify vs DEFRA workbook).
- **#4 fuel WTT → Cat 3**: `wtt_kg_co2e_per_base_unit` on natural_gas (0.3366/m³), diesel (0.61101/L),
  petrol (0.58094/L) in `fuel_factors.json`; `flight_wtt_kg_per_pkm` (DEFRA WTT- flights) in
  `scope3_activity_factors.json`; `factors.fuel_wtt()` + `factors.flight_wtt()`; new
  `scope3.fuel_flight_wtt()` (reuses `scope1._to_base`) wired into the Cat 3 block of `engine.py`. Ground
  + flight WTT ≈ 16.7 t in the demo.
- **#2 aviation verified**: the app's air factors (0.12786/0.15282/…) are the DEFRA **with-RF** average-
  passenger values (without-RF = 0.0756/0.0904, unused). Specialist's without-RF claim was incorrect → no
  change. Cabin-class weighting deferred (needs a `cabin_class` field).
- **#6**: SME facility line remapped `real_estate_facility` (0.246) → `generic_services` (0.090) interim;
  proper fix = a CEDA facility-services factor (EEIO localisation, pending).
- Water factors noted for a future category (DEFRA supply 0.1913 / treatment 0.17088 per m³).
- Verified deterministically + regenerated SME workbook v3: S1 57.88 / S2 loc 81.48 / market 94.39 /
  S3 336.76 = 476.11 t (location). No schema change.

### 2026-08-05 - Emission factors aligned to reporting year 2024 (DEFRA 2024) + traceability rule
- SME calc review: reporting year 2024 but factors were mixed-vintage (grid 2023, fuel IPCC-2006) and
  untraceable. Added `EMISSION_METHODOLOGY.md` §0a **"EF must match the reporting year"** (per-line
  value·source·year; documented exceptions GWP=AR6, spend EEIO=USD-2022).
- Downloaded the official DEFRA 2024 flat file to `backend/factors/sources/` and swapped the factor
  library to DEFRA 2024: `fuel_factors.json` gas 2.02→2.04542, diesel 2.68→2.51279, petrol 2.31→2.0844;
  `scope3_activity_factors.json` air with-RF short 0.12786→0.18592 / long 0.15282→0.26128 (DEFRA 2024's
  2021-load-year data → higher), elec WTT+T&D 0.0684→0.06817, car/tram/EV → DEFRA 2024; WTT unchanged;
  `grid_factors.json` Netherlands 0.328→0.2853 (IEA, per SME); waste relabelled 2024. GWP stays AR6,
  EEIO USEEIO USD-2022 (labelled current-standard). No schema change; `types.ts` unaffected.
- Demo: added an emission-factor register (value·unit·source·year + "Reporting year 2024") and
  regenerated. New totals S1 57.4 / S2 loc 70.9 / market 94.4 / S3 358.6 = **486.9 t** (location).
  Verified in browser (register shows 2024 / IEA / DEFRA 2024).
- 2026-08-27 — Asset one-pager (PPTX): single-slide exec summary `client-demo/SMEScope_OnePager.pptx`
  (also Downloads). Accenture-purple, restrained. What it is / how it works (Upload→Extract→Compute,
  LLM reads + Python calculates) / coverage (S3 computed 1,2,3,4,5,6,7,9; out of scope 8 & 10–15) /
  Halstead & Roe FY2024 worked example 487 t (S1 57 / S2 loc 71 / S3 359) / fit (BBVA, Santander,
  Accenture SBTi SaaS) / "further developed by Sylvia & team". pptxgenjs; validated + PNG-QA'd.
- 2026-10-02 — Demo bring-up (ops note, no code change): the checked-in `backend/.venv` is broken
  on other machines — it hard-codes another user's interpreter path
  (`C:\Users\sophia.colville\...\Python312\python.exe`), so it can't run here. Workaround: create a
  LOCAL venv outside the synced folder and install `backend/requirements.txt` into it, then run
  `uvicorn main:app --port 8000` from `backend/`. (Deps install cleanly on Python 3.14.) Backend CORS
  already allows any `localhost`/`127.0.0.1` port, and the app reads `VITE_API_BASE=http://127.0.0.1:8000`
  from `app/.env.local`, so the frontend port doesn't matter. Verified `/api/ping` healthy and the app
  reaches the backend. TODO for the team: stop committing `.venv` (add to .gitignore / SharePoint ignore).

### 2026-10-14 - Root launch config: run the dev server from `app/`
- `.claude/launch.json` (project root): `sustainsme-app` ran `npm run dev` from the root, which has no
  `package.json` → the Claude preview failed with npm ENOENT. Changed `runtimeArgs` to
  `["--prefix", "app", "run", "dev"]`. Tooling only; no app code changed. Verified: preview starts on
  :5173 and the Login page renders with no console errors.
- Setup notes from this machine (not fixed, need code changes): `claude_client._resolve_claude_bin()`
  misses the desktop app's newer layout `%APPDATA%\Claude\claude-code\<ver>\<hash>\claude.exe` (glob
  is one level too shallow), so set `CLAUDE_BIN` until fixed; `backend/start-backend.bat` points at
  `%LOCALAPPDATA%\sustainsme-venv`, which may not exist; `eval/verify_calc.py`'s expected Scope 1 is
  stale (pre-DEFRA-2024 gas + AR5 GWPs) → reports 59.0737 vs 57.1227, engine is correct.

### 2026-10-14 - Fix claude auto-discovery for newer desktop app + stale verify_calc expectation
- `backend/claude_client.py` `_resolve_claude_bin()`: newer Claude desktop builds install the binary at
  `claude-code/<ver>/<hash>/claude.exe` (one level deeper). Added a `*/*/claude.exe` pattern alongside
  the existing `*/claude.exe` for both desktop locations (`%APPDATA%` and the MSIX `Packages\Claude_*`
  path). Version ranking unchanged (version parsed from path; the hash folder has no dots). `CLAUDE_BIN`
  no longer needed on such machines. Verified with `CLAUDE_BIN` unset → resolves
  `...\claude-code\2.1.295\d2e29494ec83\claude.exe`.
- `backend/eval/verify_calc.py`: Scope 1 expected value updated to the current factor library —
  DEFRA 2024 gas 2.04542 (was 2.02), AR6 GWP R410A 2256 (was 2088), R22 1960 (was 1810) →
  59.0737 t. Verified: ALL CHECKS PASSED. No engine/factor change.
