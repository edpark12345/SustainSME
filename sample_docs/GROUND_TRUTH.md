# Sample upload documents — Halstead & Roe Legal B.V. (synthetic test set)

Fake but internally-consistent Scope 1 & 2 source documents for testing the **Upload source
documents → Extract files** feature. Company matches the demo default (office/services law firm,
HQ Amsterdam → the Netherlands grid factor applies). Reporting year **2024**.

All figures are invented. No real client data. Safe to keep in the shared folder.

## The files & what each is meant to exercise

| File | Format | Scope | Reader path |
|---|---|---|---|
| `electricity_invoice_2024.pdf` | text PDF | Scope 2 electricity | pdfplumber (PDF text) |
| `gas_invoice_2024.pdf` | text PDF | Scope 1 stationary (heating) | pdfplumber (PDF text) |
| `fleet_fuel_log_2024.xlsx` | Excel | Scope 1 mobile | openpyxl |
| `refrigerant_ac_register_2024.xlsx` | Excel | Scope 1 fugitive (estimated + primary) | openpyxl |

You can upload all four at once (the extractor batches text docs into one call and merges the result).

## Ground truth — what a correct extraction should return

**Boundary:** reporting_year `2024`; site `Halstead & Roe Legal B.V.`, Amsterdam, **Netherlands**.

**Scope 2 — electricity** (`electricity_invoice_2024.pdf`)
- `total_kwh` = **248,400** (normal 152,000 + off-peak 96,400)
- `grid_kwh` = 248,400 · `captive_solar_kwh` = 0 · `openaccess_renewable_kwh` = 0 · `green_instrument` = none
- supplier "Hollandse Energie B.V.", period 2024

**Scope 1 — stationary** (`gas_invoice_2024.pdf`)
- `fuel_type` = **natural_gas** · `quantity` = **19,250** · `unit` = **m3** · `is_heating` = true

**Scope 1 — mobile** (`fleet_fuel_log_2024.xlsx`) — 3 vehicles
- VW Passat — **diesel** — **1,920 L**
- Toyota Corolla — **petrol** — **1,240 L**
- BMW 320d — **diesel** — **2,150 L**  (totals: diesel 4,070 L, petrol 1,240 L)

**Scope 1 — fugitive** (`refrigerant_ac_register_2024.xlsx`) — 3 units
- VRF rooftop — **R410A** — charge **14 kg** — no refill → **estimated** (leak-rate) tier
- Split units x5 — **R32** — charge **10 kg** — no refill → **estimated** tier
- Precision AC (server room) — **R410A** — charge 6 kg — **refill 1.2 kg** → **primary** tier

## Approximate emissions (sanity-check only — the engine is the source of truth)

- **Scope 2 electricity:** 248,400 kWh × 0.328 (NL grid) ≈ **81.5 t CO2e** (location-based).
- **Scope 1 mobile:** diesel 4,070 L (~2.51/L) + petrol 1,240 L (~2.31/L) ≈ **13.1 t CO2e**.
- **Scope 1 gas & fugitive:** depend on the engine's NCV / fuel EF and refrigerant GWP (AR5) — let the
  engine compute. Gas is roughly in the mid-30s t CO2e; fugitive is small (the 1.2 kg R410A refill
  alone ≈ 2.5 t).

## Deliberate "gotchas" to check the review step catches

1. **Business-use %** column in the fuel log (BMW = 80%). The schema/engine has **no business-use
   field**, so expect the full 2,150 L to be counted. That's a known model limitation, not an
   extraction error — good test of whether a reviewer spots it.
2. **Gas volume is in m3, not kWh.** The extractor should keep `unit = m3`; the engine converts via
   NCV. Watch for a wrong unit or a silent m3→kWh guess.
3. **Peak/off-peak split** on the electricity bill — the correct `total_kwh` is the **sum** (248,400),
   not either line alone.
4. **"No GvO / no PPA"** is stated explicitly → market-based should NOT be zeroed.

## Regenerate / adjust
Generator script: `scratchpad/gen_samples.py` (uses `fpdf2` + `openpyxl`). Edit the values there and
re-run to produce new variants (e.g. a scanned-PDF or photo case to test the vision path).
