# Emission-factor source files

Official, free-to-use emission-factor datasets, kept as **raw downloads** so every factor in
`backend/factors/*.json` is traceable to a citable source. These files are the *inputs*; the app's
JSON factor library is the curated, versioned subset the engine actually reads. Re-download annually.

_Downloaded: 2026-07-09._

| File | Provider | Version / year | Covers | Licence |
|---|---|---|---|---|
| `epa-ghg-emission-factors-hub-2025.xlsx` | US EPA | 2025 (Jan 2025) | US stationary & mobile combustion, eGRID electricity, business travel, T&D losses (Scope 1/2/3) | US Gov — public domain |
| `defra-ghg-conversion-factors-2025-full-set.xlsx` | UK DESNZ/DEFRA | 2025 (Jun 2025) | Fuels, UK grid, transport, water, waste, WTT — full set | Open Government Licence v3.0 |
| `defra-ghg-conversion-factors-2025-flat-format.xlsx` | UK DESNZ/DEFRA | 2025 | Same factors, flat/machine-readable layout (best for automated parsing) | Open Government Licence v3.0 |
| `defra-2025-GHG-CF-methodology-paper.pdf` | UK DESNZ/DEFRA | 2025 | Methodology behind the DEFRA factors | Open Government Licence v3.0 |
| `ademe-base-carbone-v17-fr.xlsx` | ADEME (France) — Base Carbone® / Bilan Carbone® | v17.0 | ~1,100 factors: energy, materials, transport, food (FR-centric) | Licence Ouverte / Open Licence 2.0 |
| `ipcc-ar6-wg1-ch7-supplementary-material-gwp.pdf` | IPCC | AR6 WG1 (2021), Ch.7 SM | GWP-20/100/500 values (Table 7.SM.7) — authoritative source for `gwp.json` | IPCC — free for non-commercial/reporting use |
| `ghgprotocol-ipcc-gwp-values-2024-08.pdf` | GHG Protocol (compiled from IPCC SAR/AR4/AR5/AR6) | Aug 2024 | Cross-report GWP comparison table — convenience reference | GHG Protocol |

### Scope 3 sources (added 2026-07-09)
| File | Provider | Version / year | Covers | Licence |
|---|---|---|---|---|
| `ghgp-scope3-standard.pdf` | GHG Protocol / WRI-WBCSD | 2011 | Corporate Value Chain (Scope 3) Standard — the 15 categories | GHG Protocol |
| `ghgp-scope3-technical-guidance.pdf` | GHG Protocol | 2013 | Per-category calculation methods (Appendix D) — basis for `calc/scope3.py` | GHG Protocol |
| `GHGP_SCOPE3_METHODS.md` | (our summary) | 2026 | Appendix-D methods per category + our chosen SME default method | — |
| `epa-supply-chain-ghg-factors-v1.3-CO2e-USD2022.csv` | US EPA (USEEIO) | v1.3 (USD2022) | 1016 NAICS spend factors (kg CO2e/USD, with margins) → `scope3_spend_factors.json` | US Gov — public domain |
| `worldbank-what-a-waste-country-dataset.xlsx` | World Bank | What a Waste 3.0 (Mar 2026) | 217 countries: MSW generation, composition, treatment mix → `waste_benchmarks.json` | CC BY 4.0 |
| `reeb-5-year-journey.pdf`, `reeb-2020-energy-snapshot.pdf` | Better Buildings Partnership (UK) | 2015 / 2021 | Commercial-property in-use energy/carbon/water/waste intensity benchmarks (offices, retail, shopping centres) | BBP — public |

_Note on REEB:_ the per-building-type benchmark tables are embedded as chart images in the PDFs (not
machine-readable). Kept as a **reference** for refining building intensities (`eui_benchmarks.json`
electricity/heating kWh/m² and the waste per-FTE defaults). Extract specific numbers manually from the
report when tightening those benchmarks.

## Source URLs (re-download annually — URLs are year/version specific)

- EPA GHG Emission Factors Hub: https://www.epa.gov/climateleadership/ghg-emission-factors-hub
  - 2025 xlsx: https://www.epa.gov/system/files/other-files/2025-01/ghg-emission-factors-hub-2025.xlsx
- DEFRA/DESNZ conversion factors 2025 (landing): https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2025
  - Full set: https://assets.publishing.service.gov.uk/media/6846a4f55e92539572806125/ghg-conversion-factors-2025-full-set.xlsx
  - Flat format: https://assets.publishing.service.gov.uk/media/6846b6ea57f3515d9611f0dd/ghg-conversion-factors-2025-flat-format.xlsx
  - Methodology: https://assets.publishing.service.gov.uk/media/6846b0870392ed9b784c0187/2025-GHG-CF-methodology-paper.pdf
- ADEME Base Carbone v17.0 (data.gouv.fr): https://www.data.gouv.fr/en/datasets/base-carbone-complete-de-lademe-en-francais-v17-0/
  - XLSX: https://www.data.gouv.fr/api/1/datasets/r/a5393ebb-26cc-4414-bf1c-6c9d60fc0972
  - (An English "Full Carbon Base" edition is on data.europa.eu; live queries at https://bilans-ges.ademe.fr/)
- IPCC EFDB (live query/export tool, not a single file): https://www.ipcc-nggip.iges.or.jp/EFDB/main.php
  - AR6 WG1 Ch.7 SM (GWP tables): https://www.ipcc.ch/report/ar6/wg1/downloads/report/IPCC_AR6_WGI_Chapter_07_Supplementary_Material.pdf
  - GHG Protocol GWP values (Aug 2024): https://ghgprotocol.org/sites/default/files/2024-08/Global-Warming-Potential-Values%20(August%202024).pdf

## Notes
- **IPCC has no single "emission factors spreadsheet."** It provides (a) default factors via the
  online **EFDB** (query then export to Excel — no stable bulk-download URL) and (b) **GWP values** in
  the assessment reports. Our `gwp.json` uses IPCC AR5 GWP100; the AR6 SM here lets you migrate to AR6.
- These raw files are **not** parsed at runtime — treat them as the audit trail / update source for the
  curated JSON in `backend/factors/`. When refreshing a JSON factor, cite the file + tab/row here.
- Licences permit reporting use; keep attribution when factors are shown in the app or exported.
