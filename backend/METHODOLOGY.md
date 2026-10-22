# SustainSME — Emission Calculation Methodology

The acceptable, globally-recognised methods this engine implements for Scope 1 & 2, plus the design
principles for the Scope 3 layer it is built to grow into. Every computed number is auditable: each
result row records the factor value, factor source, tier, and assumptions.

## Factor basis (global)
- **Grid electricity:** country location-based factor (kgCO₂e/kWh). India = CEA CO₂ Baseline Database;
  others = IEA/Ember national averages. `backend/factors/grid_factors.json`. Swappable (drop in a
  licensed IEA set with the same shape).
- **Fuel combustion:** IPCC 2006 default emission factors with net calorific values, cross-checked
  against UK DEFRA/BEIS. `backend/factors/fuel_factors.json`.
- **Refrigerant GWPs:** IPCC AR5 GWP100. `backend/factors/gwp.json`.
- **Fugitive leak/charge defaults:** IPCC 2006 / US EPA / GHG Protocol screening values.
  `backend/factors/leak_rates.json`.

## Tiering principle (applies to every category)
Use the **best available data tier for each line, always** — if activity data exists, it is used,
regardless of the line's size. The Pareto rule governs only **where to spend effort chasing _missing_
quantities** (focus on the largest gaps); it never restricts using activity data that is already in
hand. Tiers, best → screening:
1. **primary** — measured activity data (kWh, litres, refill kg, sold units).
2. **spend** — monetary spend × spend-based factor (when physical data is absent).
3. **estimated** — modelled from proxies (e.g. refrigerant charge from cooling tonnage × leak rate).

## Scope 2 — purchased energy
- **Location-based:** `Σ grid_kWh × grid_EF[country]`. The **drawal split matters — grid ≠ total**:
  `grid_kWh = total − captive_solar − open-access/PPA renewable`. Captive solar = 0 emissions.
- **Market-based:** a contractual instrument (green tariff / REC / PPA) zeroes the covered grid
  portion; otherwise the residual = grid factor.
- **Heat/steam/cooling:** `energy_kWh × factor` (grid factor used as a screening proxy until a
  dedicated heat factor is supplied).
- **Boundary trap captured, not resolved:** employee-housing ("colony") meters are recorded as a
  separate site with an `include_employee_housing` flag, surfaced for a human decision.

## Scope 1 — direct
- **Stationary combustion** (natural gas SCM/m³, LSHS/heating oil, LPG, coal): convert native unit →
  energy via NCV → `energy × IPCC fuel EF`. Native units preserved through extraction; conversion is
  explicit and recorded.
- **Mobile/fleet:** tiered — litres × fuel EF (primary) → fuel-card spend → litres → EF (spend) →
  vehicle list + km × distance EF. This iteration computes the litres tier; spend/distance tiers are
  flagged for the next phase.
- **Fugitive/refrigerants:** `refill_kg × GWP` (primary). When only an asset inventory exists (the
  Bühler case — refrigerant type + tonnage, no refills): estimate
  `annual_leak = charge_kg × annual_leak_rate(equipment)`, with `charge_kg = tonnage_TR × charge/TR`,
  then `× GWP` → flagged **estimated**. Not-working/scrap units are flagged for review.

---

## Scope 3 — design principles (next phase; the engine is built to grow into this)
Scope 3 is **gated by the relevance screener already in the app** (the 15-category Yes/No screen).
Only material categories per sector are collected. Key principles from carbon-accounting review:

1. **Energy inputs are dual-purpose.** The same `Scope2Electricity` / `Scope2Thermal` kWh that drives
   Scope 2 also drives **Cat 3** (upstream fuel production + T&D losses) — *one input, two scopes*.
   No new question; Cat 3 reads the existing energy activities × an upstream/T&D factor.
2. **Sold-product quantity + weight is dual-purpose.** Sold units per product type + estimated weights
   drive **Cat 9** (downstream transport) *and* **Cat 12** (end-of-life) — *one question, two
   categories*. Most SMEs lack tonne-km logistics detail, so this proxy is the practical ask.
3. **Spend-first for upstream goods.** Cat 1/2/4 default to AP-ledger spend × EEIO factors, upgraded to
   activity data wherever physical quantities exist (per the tiering principle above).
4. **Material downstream categories are irreducibly company-specific.** Cat 8, 10, 11, 13, 14, 15 have
   no generic field that works across companies. Each is a **bespoke module = {activity question +
   calc rule}**, gated by the relevance screener — a *module registry keyed by category*, not fixed
   schema fields. Examples (from Sandoz pharma):
   - **Cat 10 (processing of sold products):** kg of intermediate products sold → model the emissions
     of the onward processing they would undergo.
   - **Cat 11 (use of sold products):** units sold per product type × GHG content — e.g. inhalers ×
     propellant type/charge → propellant mass × GWP released in use.

   Implementation implication: a registry of per-category modules (each declaring the question to ask,
   the extraction schema slot, and the calc rule), activated when the screener marks that category
   relevant. The current `ActivityBundle` is intentionally extensible to host these without changing
   the envelope.
