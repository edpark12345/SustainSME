# GHG Protocol Scope 3 — calculation methods per category (design basis)

Source: **GHG Protocol, "Technical Guidance for Calculating Scope 3 Emissions", Appendix D**
(local copy: `ghgp-scope3-technical-guidance.pdf`) + Corporate Value Chain (Scope 3) Standard
(`ghgp-scope3-standard.pdf`). This is the methodological basis for `backend/calc/scope3.py`.

## Method hierarchy (all categories)
GHG Protocol ranks calculation methods by data specificity. Higher = more accurate, more data burden:
1. **Supplier/asset/investment-specific** — primary data from the value-chain partner (best).
2. **Hybrid** — mix of supplier primary data + secondary factors.
3. **Average-data** — physical activity (kg, kWh, km, tonnes, m², nights) × average EF.
4. **Spend-based** — money spent × **EEIO** factor (kg CO2e per currency unit). Lowest burden, screening quality.

**SME default = spend-based**, upgraded to average-data / primary where the SME actually has the
data. Our engine tags each line `primary | spend | estimated` accordingly and records the method used.

## The 15 categories

### Upstream (1–8)
| # | Category | GHGP methods (Appendix D) | SME default in our tool | EF type |
|---|---|---|---|---|
| 1 | **Purchased goods & services** | supplier-specific / hybrid / average-data (mass×EF) / **spend-based** (spend×EEIO) | **spend-based** (usually the largest category) | kg CO2e/€ (EEIO) |
| 2 | **Capital goods** | supplier-specific / hybrid / average-data / **spend-based** | **spend-based** | kg CO2e/€ (EEIO) |
| 3 | **Fuel- & energy-related (not in S1/S2)** | supplier-/average-data: fuel/electricity consumed × *upstream* EF (WTT); + T&D losses | **average-data** — reuse S1/S2 kWh × WTT/T&D factors (DEFRA WTT) | kg CO2e/kWh (WTT) |
| 4 | **Upstream transport & distribution** | fuel-based / distance-based (tonne-km×EF) / **spend-based** (spend×EEIO); storage site/avg | **spend-based** or distance-based | kg CO2e/€ or /tonne-km |
| 5 | **Waste generated in operations** | supplier-specific / **waste-type-specific** (tonnes×EF) / average-data | **waste-type-specific** (tonnes × treatment EF) | kg CO2e/tonne |
| 6 | **Business travel** | fuel-based / **distance-based** (pkm×EF) + optional hotel nights; spend fallback | **distance-based** (air/rail/car pkm) or spend | kg CO2e/pkm |
| 7 | **Employee commuting** | fuel-based / distance-based / **average-data** (headcount × avg distance × EF) | **average-data** (headcount-based) | kg CO2e/pkm |
| 8 | **Upstream leased assets** | asset-specific / lessor-specific / average-data (floor area m²×EF) | average-data (floor area) — often n/a for SME | kg CO2e/m²/yr |

### Downstream (9–15)
| # | Category | GHGP methods (Appendix D) | SME default in our tool | EF type |
|---|---|---|---|---|
| 9 | **Downstream transport & distribution** | fuel- / distance- / **spend-based**; storage site/avg | spend-based (if company pays) — often n/a | kg CO2e/€ or /tonne-km |
| 10 | **Processing of sold products** | site-specific / average-data (mass × processing EF) | **relevance-flag only** (manufacturers of intermediates) | kg CO2e/kg |
| 11 | **Use of sold products** | direct (lifetime uses × energy/use × EF) / GHG-containing / indirect | **relevance-flag only** (makers of energy-using/fuel products) | kg CO2e/use |
| 12 | **End-of-life of sold products** | waste-type-specific (mass sold+packaging × treatment EF) | average-data (mass × EF) — if product company | kg CO2e/kg |
| 13 | **Downstream leased assets** | asset- / lessee-specific / average-data (floor area) | average-data — often n/a (lessors) | kg CO2e/m²/yr |
| 14 | **Franchises** | franchise-specific (S1+S2 of franchisees) / average-data (floor area) | **relevance-flag only** (franchisors) | kg CO2e/m²/yr |
| 15 | **Investments** | investment-specific (investee S1+S2 × equity share) / average-data (**investee revenue × sector EEIO × equity share**) | **relevance-flag only** (financial institutions) | kg CO2e/€ revenue (EEIO) |

## Implications for the engine (vertical slice)
- **Spend-based core (EEIO):** Cat 1, 2, 4, 9 — `spend (€) × EEIO factor (kg CO2e/€)`. This is the
  first slice we build. Needs an EEIO factor set (EPA Supply Chain Factors / EXIOBASE), spend at
  **purchaser prices** → use the "with margins" EEIO factor; convert USD↔EUR and inflate to the
  activity year where needed.
- **Activity-based (already have factors):** Cat 3 (kWh × WTT), Cat 5 (tonnes waste × EF),
  Cat 6 (pkm × EF), Cat 7 (headcount × avg distance × EF) — use DEFRA sets we downloaded.
- **Relevance-flag only for now:** Cat 8, 10–15 — collected on the relevance screen, shown as
  "relevant / not calculated yet" rather than faked, until real activity data exists.
- Every Scope-3 line carries: category #, method, tier, factor value/unit/source, assumptions —
  same audit contract as Scope 1 & 2, so it appears in the same downloadable Excel.
