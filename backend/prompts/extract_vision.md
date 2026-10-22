Use the Read tool to open the document at the absolute path below. It is a scanned/photographed
bill or document image (e.g. an electricity or gas bill). Read it visually, then extract its Scope 1
& 2 activity data into the ActivityBundle JSON schema.

Apply the same rules as for text documents:
- Electricity bill -> one `scope2_electricity` entry per billing period: period, total_kwh, and the
  grid / captive-solar / open-access split if the bill shows it (grid != total), supplier, tariff,
  any green tariff/REC/PPA in `green_instrument`, demand_kw / apparent_kva if present. Set `site` to
  the consumer/site name.
- Gas / fuel-oil / LPG bill -> `scope1_stationary` with fuel_type, quantity, unit.
- Set `source_doc` to the file's base name. Never invent values; omit what is not present. Do not
  compute emissions.

FILE TO READ: {{PATH}}
