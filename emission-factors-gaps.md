# Emission-factor gap & accuracy register — SMEScope (Scope 1–3)

Companion to the factor inventory. Honest status of what the tool needs vs. what it has, and how
precise each item is. The engine already flags every line by data-quality tier
(`primary` / `spend` / `estimated`), so the imprecision below is *surfaced*, not hidden — but it is
real and this is the hardening backlog.

**Status legend:** ✅ have (solid) · 🟡 have (screening / rough) · 🔴 missing · 🌍 geo-mismatch · 🕐 vintage issue
**Priority:** P1 (material for most SMEs) · P2 (common) · P3 (edge / later)

_Last updated: 2026-07-27._

## Scope 1 — Direct
| Factor / need | Status | Current source | Target / fix | Priority |
|---|---|---|---|---|
| Fossil fuel combustion (gas, oils, LPG, coal) | ✅ | IPCC 2006 + DEFRA 2023 | Refresh to DEFRA 2025; single vintage | P2 |
| Biogenic / biofuel blends (wood, pellets, biodiesel, ethanol) | 🔴 missing | — | Add DEFRA/IPCC biomass + blend factors (biogenic split) | P2 |
| Process emissions (cement, chemicals, metals) | 🔴 missing | — | Add IPCC process EFs (only if targeting heavy industry) | P3 |
| Refrigerant GWP set | 🟡 partial (10) | IPCC AR5 | Extend list (R448A/449A/513A/1234yf/152a/23, SF6, PFCs); move to AR6 | P2 |
| Mobile: fuel types | 🟡 diesel/petrol only | fuel_factors | Add CNG/LPG vehicles, biofuel blends | P2 |
| Mobile: vehicle type/size | 🔴 missing | avg litres only | Add car/van/motorbike + size (Sophia feedback) | P2 |
| Refrigerant leak rates | 🟡 screening | IPCC 2006 / EPA defaults | Validate against equipment data | P3 |
| Avg litres per vehicle | 🟡 screening | unsourced starter set | Replace with sourced fleet-average dataset | P2 |

## Scope 2 — Purchased energy
| Factor / need | Status | Current source | Target / fix | Priority |
|---|---|---|---|---|
| Grid electricity, national | 🟡 13 countries + world avg | CEA/IEA/Ember 2023 | **License full IEA set (all countries)**; refresh yearly | **P1** |
| Grid electricity, sub-national | 🔴 missing | — | US eGRID subregions, India state grids | P2 |
| District heat / steam / cooling EF | 🔴 no direct EF | estimated via floor area | Add DEFRA heat/steam factors | P2 |
| Market-based residual mix | 🔴 missing | grid or 0 | Add residual-mix factors (AIB/Green-e) | P3 |
| EUI benchmarks (kWh/m²) electricity + heating | 🟡 screening | CIBSE TM46 / DEFRA | Validate by climate zone / building age | P2 |
| m²-per-FTE (area from headcount) | 🟡 screening | starter set | Validate | P3 |

## Scope 3 — Value chain
| Factor / need | Status | Current source | Target / fix | Priority |
|---|---|---|---|---|
| Cat 1/2/4/9 spend (EEIO) | 🟡🌍 US-based, coarse | EPA USEEIO v1.3 (USD2022) | **Add EXIOBASE (EU/regional)**; expand beyond 31 buckets; inflation-adjust FX to activity year | **P1** |
| Cat 3 electricity WTT + T&D | ✅ | DEFRA 2025 | ok (regionalise WTT) | P3 |
| Cat 3 fuel WTT (upstream of S1 fuels) | 🔴 missing | — | Add DEFRA WTT-fuels per kWh | P2 |
| Cat 5 waste treatment EF | 🟡🌍 UK values | DEFRA 2025 | Regionalise; document recycling boundary (why 4.69) | P2 |
| Cat 5 waste generation (kg/FTE) | 🟡 **unsourced** | order-of-magnitude default | **Source a real per-FTE/per-m² benchmark** (REEB / national) | **P1** |
| Cat 5 treatment mix by country | 🟡 9 countries | World Bank What a Waste | Extend country coverage | P3 |
| Cat 6 travel (pkm) | 🟡🌍 UK-centric | DEFRA 2025 (incl. RF) | Regionalise rail (grid-linked) & car | P2 |
| Cat 6 hotel (per night) | 🟡 9 countries | DEFRA 2025 | Extend country list | P3 |
| Cat 7 commuting distance/mode | 🟡 generic default | 22 km/day starter | Adopt **Numbeo** (with attribution) or survey | P2 |
| Cat 8 upstream leased assets | 🔴 missing | — | Building intensity kg CO₂e/m²/yr (REEB) | P3 |
| Cat 10 processing of sold products | 🔴 missing | — | kg CO₂e per kg product (awaiting Sophia sample) | P3 |
| Cat 11 use of sold products | 🔴 missing | — | energy/use × lifetime × grid/fuel (awaiting sample) | P2 (product cos) |
| Cat 12 end-of-life | 🔴 missing | — | kg CO₂e/tonne treated | P3 |
| Cat 13 downstream leased assets | 🔴 missing | — | building/asset intensity | P3 |
| Cat 14 franchises | 🔴 missing | — | franchisee S1+S2 or floor-area intensity | P3 |
| Cat 15 investments | 🔴 missing | — | kg CO₂e/€ revenue × equity share (sector EEIO) | P3 (financials) |
| Water supply / treatment | 🔴 missing | — | Add DEFRA water factors | P3 |

## Cross-cutting issues
| Issue | Detail | Fix | Priority |
|---|---|---|---|
| 🕐 Mixed vintages | fuels 2023, GWP AR5 (2014), grid 2023, EEIO 2022, DEFRA 2025, IPCC 2006 | Align to a stated base year per set; document | P2 |
| 🕐 GWP set | AR5, not AR6 | Move refrigerant GWPs to **IPCC AR6** | **P1** |
| 🌍 Geo-mismatch | DEFRA-UK factors (travel, waste, WTT) applied to non-UK SMEs | Regionalise or state the assumption per line | P2 |
| Licensing | All sources free/open (good), but IEA grid & EXIOBASE (licensed) would raise accuracy | Decide licence budget vs. free-only positioning | P1 |

## Top priorities (do first)
1. **P1 — Grid factors for all countries** (license IEA or add more national values). Biggest single line for most SMEs; today most countries hit the 0.475 world average.
2. **P1 — EXIOBASE (regional EEIO)** for Cat 1 spend. Usually the largest Scope 3 block; currently US-biased.
3. **P1 — Source the waste kg/FTE benchmark** (currently unsourced) and hardening of the estimate benchmarks generally.
4. **P1 — GWP → AR6** for refrigerants (consistency with current reporting practice).

_Note: none of this blocks the demo — the tool is screening-grade by design and flags every estimate.
This register is the roadmap to move individual lines from `estimated`/`spend` toward `primary`._
