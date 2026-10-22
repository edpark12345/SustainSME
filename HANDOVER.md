# SustainSME — Handover Kit

Everything a colleague needs to take this project into their own Claude Code environment and run /
continue it **exactly** as built. Hand this whole folder over; this file tells the receiver what to do.

---

## 1. What to hand over

Give the **entire `SustainSME` folder**:

```
SustainSME/
├─ app/                              ← the application (Vite + React + TS)
│  ├─ src/ … (all source)
│  ├─ package.json, package-lock.json   ← lockfile = identical installs
│  ├─ vite.config.ts, tailwind.config.js, postcss.config.js, tsconfig*.json
│  ├─ .gitignore, .claude/launch.json, CLAUDE.md
│  └─ (node_modules/ and dist/ are EXCLUDED — see below)
├─ PROJECT_LOG.md                    ← the build bible (read this first)
├─ CLAUDE.md                         ← instructions Claude auto-reads
├─ HANDOVER.md                       ← this file
├─ figma_screens/                    ← 32 design screenshots (context for future work)
├─ accenture_png_logo.png            ← brand asset (a copy already lives in app/src/assets)
└─ SustainSME_Workplan_Summary.docx  ← phasing / roadmap context
```

### EXCLUDE before sending (do not transfer these)
- **`app/node_modules/`** (~148 MB) — platform/arch-specific; the receiver reinstalls it.
- **`app/dist/`** — build output; regenerated on demand.
- Optional: **`Carbon Calculator Figma screens.zip`** (~14 MB) — redundant, already extracted into `figma_screens/`.

### One-command package (PowerShell on the sender's machine)
Creates a clean zip without `node_modules`/`dist`:
```powershell
$src = "C:\Users\priyank.e.jain\AI Projects\SustainSME"
$stage = "$env:TEMP\SustainSME_handover"
robocopy $src $stage /MIR /XD node_modules dist ".git" | Out-Null
Remove-Item "$stage\Carbon Calculator Figma screens.zip" -ErrorAction SilentlyContinue
Compress-Archive -Path "$stage\*" -DestinationPath "$env:USERPROFILE\Desktop\SustainSME_handover.zip" -Force
Remove-Item $stage -Recurse -Force
"Done -> Desktop\SustainSME_handover.zip"
```

---

## 2. What does NOT transfer (and doesn't need to)

- **Node.js install** — machine-specific; the receiver installs their own (see §3).
- **`node_modules/`** — reinstalled from `package-lock.json`.
- **The sender's Claude memory** — durable knowledge is captured in `PROJECT_LOG.md` + `CLAUDE.md`,
  so none of the sender's private memory is required.
- **No secrets / `.env` / API keys exist** — Phase 1 is frontend-only with dummy data, so there is
  nothing sensitive to move and nothing to configure.
- The harness `launch.json` that pointed at absolute Windows paths was for the sender's preview tool
  only; the project's own `app/.claude/launch.json` is portable (`npm run dev`).

---

## 3. Receiver setup (do this on the colleague's machine)

**Prerequisites:** Node.js ≥ 18 LTS (project was built on v24.16.0) and npm.
- Check: `node --version`. If missing and admin installs are blocked, install user-scope:
  `winget install --id OpenJS.NodeJS.LTS -e --scope user` (then open a fresh terminal so PATH updates).

**Install & run:**
```powershell
cd <path>\SustainSME\app
npm install        # installs exact versions from package-lock.json
npm run dev        # → http://localhost:5173
```
Open **http://localhost:5173/** — you should see the SustainSME login screen.
Build/type-check anytime with `npm run build`.

> Note: `vite.config.ts` pins the dev server to `127.0.0.1:5173` so `localhost` resolves reliably on
> Windows. If the colleague is on macOS/Linux this is harmless.

---

## 4. Prompts to give the colleague's Claude

Paste these into the colleague's Claude Code session, in order.

### Prompt A — Orientation & bring-up
```
You are taking over the SustainSME project (an SME carbon-decarbonization platform, Phase 1:
frontend only, React + Vite + TypeScript + Tailwind + Recharts, no backend).

1. Read PROJECT_LOG.md and CLAUDE.md in the project root before doing anything — PROJECT_LOG.md is
   the full build bible (architecture, how every screen works, conventions, changelog).
2. Confirm Node.js >= 18 is installed (install user-scope via winget if missing and admin is blocked).
3. From the app/ folder run `npm install` then `npm run dev`, and open http://localhost:5173.
4. Verify the login screen renders, then click through: Login → Onboarding → Scope 1 → Scope 2 →
   Scope 3 Relevance (test the "Mark all as Yes/No" buttons and that Next is disabled until all 15
   are answered) → a Scope 3 category questionnaire → Results (Emissions, ESG, Levers, PDF report) →
   Leadership dashboard → Relationship Manager dashboard.
5. Report the running URL and anything that didn't work. Do not change code yet.
```

### Prompt B — Working conventions (give once, before they build)
```
Follow the conventions in PROJECT_LOG.md:
- All 15 Scope 3 categories are driven by ONE config (app/src/data/scope3Categories.ts) rendered by
  ONE component (app/src/pages/Scope3Questionnaire.tsx). To change category text/questions/tables,
  edit the config — never duplicate the component.
- All demo numbers live in app/src/data/dummyData.ts. Routes live in app/src/routes.ts.
- Branding rule: Accenture only (never reintroduce "ING"), Accenture purple palette, use generic
  "Company" wording for the customer.
- Phase 1 is deterministic: no backend, no API/LLM calls, no real Excel parsing.
- After EVERY change you make, append a dated entry to the Changelog at the bottom of PROJECT_LOG.md
  (what changed, files touched, why). Keep the log in sync with the code.
```

### Prompt C — Example feature task (template for future work)
```
<describe the change>. Before coding, read the relevant section of PROJECT_LOG.md. Implement it
following the existing component/design-system patterns (Tailwind tokens in tailwind.config.js,
shared components in app/src/components). Run `npm run build` to confirm it type-checks, verify the
change in the browser at http://localhost:5173, then append a Changelog entry to PROJECT_LOG.md.
```

---

## 5. Receiver acceptance checklist
- [ ] `npm install` completes with no errors.
- [ ] `npm run dev` serves http://localhost:5173 and the login screen renders.
- [ ] `npm run build` passes (tsc + vite build, no type errors).
- [ ] All 12 routes load; relevance Next-gate and the conditional Excel section behave per PROJECT_LOG §10.
- [ ] Navbar/footer/login/report show the **Accenture** logo; no "ING" text anywhere.
