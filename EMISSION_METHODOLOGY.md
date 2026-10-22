# SustainSME — Emission Calculation Methodology Specification

> **Status:** Draft v0.1 (2026-06-18). This is the **Phase 4** deliverable named in
> `SustainSME_Workplan_Summary.docx` ("Emission Methodology & Logic Definition") — the spec the
> Phase 5 backend implements. It is **analytical/methodological**, not code. Numbers marked
> _(seed)_ are placeholders extracted from the reviewed decarbonization models and **must be
> validated by a carbon-accounting SME** before production use.
>
> **Companion docs:** product/build context in [`PROJECT_LOG.md`](./PROJECT_LOG.md); calculation
> models reviewed: BBAN / Hindalco decarbonization models; real-data validation: Hindalco *Taloja*
> and Bühler *BBAN* sites.

---

## 0. The one idea this document is built around

**Calculating emissions is trivial: `emissions = activity × emission_factor`.** The product is
**not** the arithmetic — it is (a) wading through the messy data companies actually have, mapping
each line to the right scope/category/method, and (b) being honest about the resulting quality.
Everything below optimises for that, not for formula sophistication.

## 0a. Emission factors MUST match the reporting year (core rule)

**Every emission factor must correspond to the reporting year, and its value + source + vintage year
must be traceable per line.** A 2024 inventory uses 2024-release factors (e.g. DEFRA 2024 conversion
factors, the reporting-year national grid factor), not a stale or mixed-vintage set. Rules:

- **Match the year.** When the reporting year changes, the factor set changes with it. Do not carry
  forward last year's (or an ad-hoc) factors. Datasets that are genuinely not year-versioned are the
  documented exceptions — **GWP** (use the current IPCC assessment, AR6; it is not re-issued annually)
  and **spend-based EEIO** (a fixed price-base-year method, e.g. USEEIO USD-2022) — and these must be
  labelled as such so they are not mistaken for a stale annual factor.
- **Be traceable.** Every factor carries `source` + `year`; every result line exposes its factor value,
  unit, source and year (see the Excel "Factor library" tab and the app's emission-factor register), so
  a reviewer can see exactly which factor, from where, for which year, produced each number.
- **Single, stated vintage.** Prefer one consistent release across the physical/energy factors for a
  given report; where a specific factor lags, state its year explicitly rather than hiding it.

Validated against real data: a single site already breaks the naïve model — e.g. a Taloja
electricity bill must be **split into grid vs. captive-renewable** before any factor is applied
(naïve "drawal × grid EF" overcounted by ~37%); a Bühler waste document lists streams and disposal
routes **but no quantities at all**.

---

## 1. Design principles

1. **Deterministic calc; AI mapping is governed, not human-checked per line.** The calculation is
   pure and reproducible — it always runs on a **frozen, versioned mapping artifact, never live on a
   model**. AI (vision/LLM) does extraction (scans, legacy docs) and *suggests* line → category/factor
   mappings. Because the product must run **unattended** (bank-operated, at scale), assurance is **not**
   a human confirming each line; it is confidence-gating + graceful degradation + model governance +
   automated controls. See **§8.1**.
2. **Spend-based is the default for upstream Scope 3, not the exception.** SMEs reliably have
   financial/consumption data, rarely physical quantities. See §5.
3. **One method axis, not parallel pipelines.** A single resolver picks the best method each line's
   data supports (§5). "Hybrid" and "proxy" are rungs of that ladder, not separate code paths.
4. **Replaceable emission factors.** Factors are data, never hardcoded; a client factor set
   overrides the bundled default (§3).
5. **Honest data quality over false precision.** Every line and the inventory carry a PCAF-style
   quality tier (§6). Screening-grade estimates are labelled as such.
6. **Missing data is a first-class output.** What the tool *cannot* compute (and why) is surfaced as
   a gap list — often the most useful artifact for the engagement (§8).

---

## 2. Core data contract — the canonical activity line

Every input — a PDF bill, an AP-ledger row, a fuel sheet, an asset list — is normalised into one
record type. The calc is a pure function over a list of these.

| Field | Meaning |
|---|---|
| `line_id` | stable id |
| `source_file`, `locator` | provenance (file + page/sheet!cell) — for audit |
| `period` | reporting period (month / FY) |
| `scope` | S1 / S2 / S3 |
| `category` | e.g. "Stationary combustion", "Cat 1 Purchased goods" |
| `activity` | human description |
| `quantity`, `unit` | physical or monetary amount (+ currency for spend) |
| `boundary` | plant / colony / fleet / excluded — operational-boundary tag |
| `method` | `supplier_specific` \| `activity` \| `spend` \| `proxy` (§5) |
| `data_quality` | tier 1–5 (§6) |
| `ef_key`, `ef`, `ef_unit` | resolved factor (§3) |
| `status` | `resolved` \| `review` \| `gap` |
| `flags` | assumptions, conversions, warnings |

---

## 3. Emission-factor model (replaceable factor set)

- A **`FactorSet`** is a versioned table keyed by `(scope, activity/category, unit, region, year, method)`.
- **Resolution precedence:** `client-provided override` → `bundled default`. A client can replace or
  extend any factor by uploading their own set; results stay reproducible because the set is versioned
  and stamped onto each line.
- **Dimensions that matter:** *region* (grid EF, EEIO economic structure) and *year* (grid
  decarbonisation, EEIO base year). Region representativeness matters **more** than currency.
- **Default sources (to license/confirm, §9):** grid = CEA/IEA by country; combustion/activity =
  DEFRA / GHG Protocol; EEIO (spend) = **EXIOBASE** (multi-regional) — *not* US-only USEEIO for
  EU/India SMEs; GWP = IPCC assessment report (§4.5); supplier PCFs = client registry.

---

## 4. Scope 1 & 2 methodology (the Phase-5 vertical slice)

Derived from the reviewed BBAN/Hindalco models and validated on Taloja.

### 4.1 General form
`emissions_tCO2e = (quantity × unit_conversion × emission_factor) / 1000`

### 4.2 Scope 2 — purchased electricity *(the non-obvious one)*
Electricity drawal **must be decomposed before applying a factor**:

```
grid_consumption      × grid_EF(region, year)      → tCO2e   (location/market based)
captive_renewable_kWh × renewable_EF (≈0, market)  → tCO2e   (needs RE-attribute proof)
```

- Source data: the utility bill's energy-drawal table. On Indian bills (e.g. MSEDCL) this is itemised
  (grid units vs. open-access captive generation self-consumed); the two **sum to total drawal**.
- Market-based vs location-based is a reporting choice — store both factor variants.
- _(seed)_ India grid EF ≈ **0.71 kgCO₂e/kWh** (validate per DISCOM/CEA; BBAN model used 0.91 BESCOM).
- Diesel-genset electricity output is **not** Scope 2 — the diesel is Scope 1 fuel; counting the kWh
  too is double counting.
- **One input, two scopes:** the same electricity / heat / steam / cooling consumption also feeds
  **Scope 3 Cat 3** (upstream & transmission-and-distribution losses of purchased energy). Collect the
  energy data once; it serves both S2 (direct) and Cat 3 (upstream).

### 4.3 Scope 1 — stationary combustion
`fuel_quantity × unit_conversion × fuel_EF`. _(seed factors from reviewed model)_

| Fuel | EF _(seed)_ | Unit | Notes |
|---|---|---|---|
| Natural gas | 0.18316 kgCO₂e/kWh | via 10.55 kWh/m³ (SCM) | SCM → kWh → EF |
| LPG | 1.55709 kgCO₂e/L | + kg→L 1.96 | |
| LSHS (heavy fuel oil) | 3.12696 kgCO₂e/kg | tonne → kg ×1000 | |
| Diesel | 2.51233 kgCO₂e/L | | |

**Heating — multiple fuels (guided entry).** A site may use several heating fuels at once, so the
guided question is **multi-select**. Each selected fuel is calculated on its own best tier and summed
(GHG-Protocol-correct — no percentage splitting when real data exists):
- **Amount known** → `quantity × EF` (**primary**). Native units: gas m³, oil litres, LPG kg,
  district heating kWh (district heat is **Scope 2** thermal, not Scope 1).
- **Amount unknown** → estimate from `floor area × heating EUI (kWh/m²/yr) × per-kWh EF` (**estimated**).
- **Measured anchors the total; estimates fill the remainder** (a site's heating is ONE load, and
  `area × EUI` estimates the WHOLE of it). The pooled resolver (`backend/calc/heating.py`, run from
  `engine.py`) works per site across all `is_heating` fuels (Scope 1 combustion + Scope 2 district):
  1. Fuels with a **known amount** are computed normally (primary) and their **energy (via NCV) is
     subtracted** from the benchmark.
  2. `remainder = max(0, benchmark − Σ known heating kWh)` is split across the **estimated** fuels by
     `heating_share_pct` (equal split if blank; a single estimated fuel takes the whole remainder).
  This removes the double-count where an estimated fuel would otherwise re-cover heating a known fuel
  already provides. If measured ≥ benchmark, estimated fuels → 0 (flagged). Fields:
  `is_heating` + `heating_share_pct` on `Scope1Stationary` / `Scope2Thermal`. Electric heating adds
  nothing here (already in the electricity figure).

### 4.4 Scope 1 — mobile combustion
Same `quantity × EF`, but **separate category** from stationary (e.g. "HSD used in transport" maps to
mobile, not the boiler). Watch ambiguous units (KL vs L).

### 4.5 Scope 1 — fugitive (refrigerants)
`charge_kg × leak_rate × GWP / 1000`.
- _(seed)_ charge ≈ **2 kg per TR** cooling capacity; leak ≈ **2 %/yr** (from model assumptions).
- GWP by refrigerant: R22 1810, R32 675, R410A 2088, R134a 1430, R407c 1774, R404a 3922.
- **GWP set is a parameter to confirm (IPCC AR5 vs AR6).**
- Data-quality varies by site: where the asset list records refrigerant type → tier 2; where it does
  not → assume a type → tier 5. (Both seen in real data.)

---

## 5. Scope 3 methodology — the single method axis

One resolver walks a ladder per line and uses the highest-fidelity rung the data supports.

### 5.1 The ladder

| Rung | `method` | Line needs | EF source | DQ tier (1=best) |
|---|---|---|---|---|
| 1 | `supplier_specific` | supplier PCF / actual for the purchase | supplier registry | 1 |
| 2 | `activity` | physical quantity + unit | physical EF | 2–3 |
| 3 | `spend` *(default)* | itemised spend + EEIO mapping | EEIO (regional) | 4 |
| 4 | `proxy` | revenue×sector intensity *or* headcount×per-capita | sector/per-capita set | 5 |

### 5.2 The resolver (one function)

```
resolve(line, data, factor_sets):
    if not line.material:           return SKIP        # relevance screener first
    if is_energy_or_fuel_spend(line): return SKIP      # de-dup: belongs to S1/S2
    if data.supplier_pcf:                       m, tier = "supplier_specific", 1
    elif data.quantity and ef_activity(line):   m, tier = "activity", 2
    elif data.spend and eeio_map(line):         m, tier = "spend", 4
    else:                                        m, tier = "proxy", 5
    line.emissions    = compute(m, line, factor_sets)
    line.method, line.data_quality = m, tier
    line.flags       += guardrails(m, line)
    return line
```

### 5.3 Why this collapses the four "paths"
- **Hybrid is emergent, not a mode.** Each line resolves at the **highest rung its available data
  supports**, so a category is routinely **mixed-tier**. Use activity/supplier data **wherever it
  already exists — not only on big lines.** The **Pareto principle governs where you _chase_ missing
  data** (spend effort getting quantities for the few high-impact lines), *not* which lines get
  activity treatment.
- **Proxy** is the same function's lowest rung — applied **per category** (e.g. Cat 6/7 via headcount)
  **or whole-inventory** (revenue × sector intensity) when spend isn't even itemised. This serves the
  no-data micro/small SME, which is the mass market.
- **Upgrade = rung change, same engine.** New supplier data moves a line from tier 4 → 2 with no code
  change. This is the product story: *better data → better score, same engine.*

### 5.4 Relevance screener (precedes resolution)
The existing frontend already flags each Scope 3 category Yes/No. Only material categories are
resolved; the rest stay **visibly unc­omputed** (avoids false precision on irrelevant categories).

> **Frontend implication:** the current Scope 3 questionnaire gates *activity-first*
> ("have mass/units? if NO, spend?"). Reality is the inverse — **default to spend, offer activity as
> the refinement**. Invert the gating in `app/src/data/scope3Categories.ts`.

---

## 6. Data-quality scoring (PCAF-style, 1 = best … 5 = worst)

- **Line** → tier from the rung used.
- **Category** → emissions-weighted mean tier **+ coverage** (% of spend resolved at rung ≤ 3 vs proxy).
- **Inventory** → one aggregate score. Output shows the footprint **and** its confidence — never a bare
  tCO₂e without a quality flag.
- **Precision tracks tier:** proxy-grade lines render to ~2 significant figures; supplier-specific may
  show more. No six-decimal numbers on a ledger estimate.

---

## 7. Guardrails / honest constraints (enforced in the engine)

1. **De-dup:** energy/fuel spend excluded from the spend rung (already counted in S1/S2 activity).
2. **Region before currency:** pick EEIO by region (EXIOBASE), *then* normalise currency + base year as
   explicit, visible steps.
3. **Two uncertainties on the spend rung:** spend-as-proxy *and* line→sector mapping error — the tier
   flag carries both.
4. **Category boundaries:** keep GHG-Protocol category limits clean so mixing methods across categories
   doesn't double count.
5. **Reconciliation as a feature:** sub-meters vs. bill totals; top-down proxy total vs. bottom-up sum;
   multiple documents for one meter-month → pick the authoritative source, surface conflicts.

---

## 8. Ingestion layer contract (format-agnostic)

`detect → route to adapter → extract → normalise → resolve → triage`. Adding a new file format = add
one adapter; the canonical line, resolver, factor set and triage are shared.

- **Adapters seen to be needed (real data):** digital-table PDF (utility bill), **scanned-image PDF**
  (different DISCOM, no text layer → vision), tabular xlsx, inventory xlsx (phantom-row aware), legacy
  `.doc` (Office/LibreOffice), and the **AP/GL ledger export** — the workhorse for Scope 3.
- **AI/Office seams (isolated behind the adapter boundary):** (1) vision extraction for scans/photos,
  (2) Office/legacy doc parsing, (3) line → category/factor mapping. All produce *suggestions a human
  confirms*; **client data must not be sent to external services without an explicit data-residency
  decision** (this data includes employee PII, e.g. colony meter names).
- **Triage output:**
  - `resolved` → feeds the calc.
  - `review` → needs human confirm (e.g. vision-extracted, low-confidence mapping).
  - `gap` → missing data to chase the client (e.g. waste mass absent; refrigerant type unknown).
- **Architectural note:** the calc stays client-portable, but **ingestion realistically needs a
  server/serverless step** (vision API keys, OCR, Office parsing). Shape: *ingestion service →
  canonical ledger → portable calc → dashboards.*

### 8.1 Assurance when running unattended (no per-line human review)

The product is bank-operated at scale, so assurance **cannot** be a human confirming each mapping.
Credibility comes from a governed, transparent, reproducible method — the way banks already run
autonomous credit/AML models — not from manual review. The layered model:

1. **Governed mapping model.** The line → category model is **version-pinned**, validated *offline*
   against a labelled benchmark, and monitored (bank model-risk discipline, e.g. SR 11-7). Human
   assurance lives here — at the *method* level, periodically — not per transaction.
2. **Confidence-gated graceful degradation.** Each suggestion carries a confidence. Above threshold →
   auto-accept. **Below threshold → the line degrades to a coarser, more conservative deterministic
   default and takes a data-quality penalty (it never blocks).** Uncertainty becomes a DQ score (§6),
   not a checkpoint.
3. **Conservative bias.** When unsure, prefer the method that does **not understate** — under-reporting
   is the bank's reputational/regulatory risk. Errors trend safe.
4. **Automated plausibility / reconciliation controls.** Anomalies (e.g. intensity ≫ sector median,
   sub-meters vs. bill mismatch) are **auto-quarantined by rules**, not silently passed.
5. **Materiality-weighted escalation.** If a human ever looks, only at lines that are *both*
   high-impact (Pareto) *and* low-confidence/anomalous — a tiny fraction. **Optional SME self-confirm**
   is a trust / data-ownership / data-improvement feature, never a gate.
6. **Reproducibility & audit.** The model's mapping decision is **frozen and stored as versioned data**;
   the arithmetic runs on that artifact, never live on a model. Pinned model version + structured
   low-temperature output → same input reproduces the same number, and an external assurer can
   **sample the frozen mappings** later. The model is in the *pipeline*, not in the *calculation*.

> **Parameters to set (product decision):** confidence threshold(s); the conservative fallback per
> rung; plausibility bounds; model-revalidation cadence; whether SME self-confirm is offered.

---

## 9. Emission-factor data sources (to source/license — decision required)

| Set | Candidate | Note |
|---|---|---|
| Grid electricity | CEA (India), IEA, national DISCOM | region + year keyed |
| Combustion / activity | DEFRA, GHG Protocol | well-established, free |
| Spend (EEIO) | **EXIOBASE** (multi-regional) | preferred over US-only USEEIO for EU/India |
| GWP | IPCC AR5 / AR6 | pick one set globally |
| Supplier PCF | client-provided | rung-1 overrides |

Default policy: bundle open/free sets; let clients upload their own (the override mechanism in §3).

---

## 10. Engine outputs (must match existing UI contract)

The engine produces exactly the shapes the frontend already renders as dummy data
(`app/src/data/dummyData.ts`): scope totals, Scope-3 category breakdown, trend, ESG inputs — **plus**
two new first-class outputs: the **data-quality score** and the **gap list**.

---

## 11. Worked examples (from real data)

**Taloja FY22-23, Scope 1 & 2** (9/12 electricity months parsed; provisional):

| Stream | Scope | Quantity | Method | DQ | tCO₂e _(seed EF)_ |
|---|---|---|---|---|---|
| Grid electricity | S2 | 37.5 M kWh | actual | primary | 26,638 |
| Captive renewable | S2 | 13.8 M kWh | actual | primary | 0 |
| LSHS fuel oil | S1 | 3,199 t | activity | primary | 10,004 |
| Natural gas | S1 | 1.14 M SCM | activity | primary | 2,205 |
| HSD (transport) | S1 | 86.7 kL | activity | secondary | 218 |
| Refrigerant (AC) | S1 | 846 TR | estimated | estimated | 61 |

**Cat 1, mixed-tier** (typical SME AP data):

| AP line | available | rung | DQ |
|---|---|---|---|
| Steel supplier, €120,000 | spend only | spend | 4 |
| → later: 50 t reported | + quantity | activity | 2 ⬆ |
| Office supplies, €2,000 (long tail) | spend only | spend | 4 |
| Micro-SME: revenue €800k, sector metal-fab | nothing itemised | proxy | 5 |

---

## 12. Open decisions (need product/SME sign-off)
- GWP set: AR5 vs AR6.
- EEIO dataset: EXIOBASE vs national EEIO; base-year/currency policy.
- Grid EF source per region (CEA vs IEA vs DISCOM-specific).
- Proxy depth: **whole-inventory screening** (recommended) — gated by the relevance screener and the
  dominant data-quality flag — vs Cat-1-only.
- Scope 2 reporting basis to surface: location-based, market-based, or both.

## 13. Out of scope (here)
PDF/UI generation, lever/abatement engine, ESG scoring formula (separate specs). This document covers
the **emissions calculation** only: factors, methods, the method axis, data quality, ingestion contract.

---

## Appendix A — Input data requirements

What the tool asks the SME for. Derived from real client data (Hindalco *Taloja*, Bühler *BBAN*) and
SME data reality, reviewed with a carbon-accounting SME. Principles: **ask for what they have** (bills,
ledgers, headcount — never "your emissions"); **upload/connector-first**; **never block** (missing
items lower the data-quality score, the tool still returns a number).
Legend: ⬤ nearly every SME has it · ◐ some · ○ richer/industrial only.

### A.1 Company profile & boundary — *always*
- Reporting year + basis (calendar/fiscal) ⬤
- **Sector code (NACE/ISIC)** — from bank KYC where possible; gates EEIO mapping, sector proxy, plausibility ⬤
- Annual revenue + currency ⬤ · Employees (FTE) ⬤
- Country/region **per site** ⬤
- Sites in scope + boundary (owned/leased; **include employee housing / "colony"?**) ⬤

### A.2 Scope 2 — purchased energy ⬤
- Electricity **kWh/period** + supplier/tariff; **split grid vs on-site solar / PPA / open-access renewable**; green tariff / RECs
- Purchased heat / steam / cooling (kWh)
- **One input, two scopes:** this energy data also feeds **Scope 3 Cat 3** (upstream & T&D losses) — collect once.

### A.3 Scope 1 — direct ◐
- Natural gas (m³/SCM/kWh); heating oil / LSHS (L or t); LPG (kg or L) — stationary
- Fleet fuel: litres, *or* fuel-card spend, *or* vehicle list + km — mobile
- Refrigerants: refill kg by type *(best)* → else AC/chiller inventory: type + charge or cooling TR *(estimate)*
- Process emissions ○

### A.4 Scope 3 — value chain (spend-first; only **material** categories — screener first)
- **AP / accounts-payable ledger** (supplier · category · amount · currency · date) — the workhorse for Cat 1/2/4 ⬤
- **Physical quantities (mass/units) wherever they already exist** — *not* only top lines; upgrades any
  line to the activity rung. (Pareto governs only where you *chase* missing quantities — §5.3.)
- Supplier PCFs → tier-1 supplier-specific ○
- Waste: tonnes/stream + disposal route (route often present, **quantity often missing**) ◐
- Business travel (T&E spend or trips) ◐ · Commuting (headcount ± mode survey) ⬤
- **Sold-product quantities + weight estimates** — the practical key to **Cat 9** (downstream transport,
  when logistics data is absent — the common case) **and Cat 12** (end-of-life of sold products). One input, two categories. ◐

### A.5 Company-specific downstream categories (8, 10, 11, 13–15)
**Irreducibly company-specific — no generic field works.** Treat each as a **bespoke module**: the
relevance screener flags materiality, then a per-company *activity question + calculation rule* is
defined. Illustrative patterns (from a real pharma engagement):
- **Cat 10 (processing of sold products):** ask **kg of intermediate products sold**; model the
  emissions of the downstream processing those intermediates undergo (proxied by in-house processing).
- **Cat 11 (use of sold products):** ask **units sold per product type + their GHG content** (e.g.
  inhalers × propellant type/charge → propellant mass × GWP released in use).

### A.6 Input tiers (always yields a number)
- **Minimum (screening):** sector + revenue + employees + region + electricity kWh.
- **Good (target):** + AP ledger + gas/fuel bills + electricity grid/renewable split.
- **Best:** + physical quantities wherever available + refrigerant actuals + supplier PCFs + waste tonnages + sold-product data.
