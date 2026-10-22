Extract all Scope 1 & 2 activity data from the document(s) below into the ActivityBundle JSON schema.

Guidance by document type you may encounter:
- Electricity bill: one `scope2_electricity` entry per billing period. Capture period, total_kwh,
  and (if shown) grid_kwh / captive_solar_kwh / openaccess_renewable_kwh, supplier, tariff, any green
  tariff/REC/PPA in `green_instrument`, and demand_kw / apparent_kva if present. Set `site` to the
  consumer/site name.
- Gas / fuel-oil / LPG bill or delivery invoice: `scope1_stationary` with fuel_type, quantity, unit.
- Fleet / fuel-card record: `scope1_mobile` with fuel_type and quantity (litres) or spend; include
  distance_km if given.
- Refrigerant / AC / HVAC asset list: `scope1_fugitive` per unit or group — refrigerant_type, and
  refill_kg if available, else charge_kg or tonnage_tr (TR). Use the `equipment` field for the unit
  type (split, cassette, VRF, chiller, window).
- Company/site context anywhere: fill `boundary` (reporting_year, sites with country/region/tenure,
  include_employee_housing).

Set `source_doc` on every activity to the file name shown in its "===== FILE: ... =====" header.
If a value is absent, omit it. Do not calculate emissions.

DOCUMENTS:
{{DOCUMENTS}}
