#!/usr/bin/env python3
"""
factors.py — loader and lookups for the bundled emission-factor library.

All factors live as JSON under backend/factors/ with a `_meta` block carrying
source + year, so every computed number is traceable. The datasets are
swappable (e.g. drop in a licensed IEA grid set) by replacing the JSON files.
"""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

_DIR = Path(__file__).resolve().parent / "factors"


@lru_cache(maxsize=None)
def _load(name: str) -> dict:
    return json.loads((_DIR / name).read_text(encoding="utf-8"))


def grid_factor(country: str | None) -> tuple[float, str]:
    """Return (kgCO2e/kWh, source) for a country, falling back to a world average."""
    data = _load("grid_factors.json")
    table = data["factors"]
    src = data["_meta"]["source"]
    if country and country in table:
        return float(table[country]), src
    return float(table["_world_default"]), src + " (world default — country not matched)"


def residual_mix_factor(country: str | None) -> tuple[float | None, str, bool]:
    """Market-based Scope 2 residual-mix factor (kgCO2/kWh) for a country.
    Returns (ef, source, matched). When the country isn't in the set, returns
    (None, source, False) so the caller can fall back to the location factor."""
    data = _load("residual_mix.json")
    table = data["factors"]
    src = data["_meta"]["source"]
    if country and country in table:
        return float(table[country]), src, True
    return None, src, False


def fuel_factor(fuel_type: str) -> dict | None:
    """Return the fuel-factor record (base_unit, co2e_kg_per_base_unit, ncv, aliases)."""
    return _load("fuel_factors.json")["factors"].get(fuel_type)


def fuel_source() -> str:
    return _load("fuel_factors.json")["_meta"]["source"]


def fuel_wtt(fuel_type: str) -> tuple[float | None, str | None, str]:
    """Well-to-tank (upstream) factor per the fuel's base unit → (wtt, base_unit, source).
    Returns (None, base_unit, source) when the fuel has no WTT value (Cat 3 skips it)."""
    rec = _load("fuel_factors.json")["factors"].get(fuel_type)
    src = "UK DEFRA/DESNZ 2025 GHG Conversion Factors — WTT- fuels"
    if not rec or rec.get("wtt_kg_co2e_per_base_unit") is None:
        return None, (rec or {}).get("base_unit"), src
    return float(rec["wtt_kg_co2e_per_base_unit"]), rec["base_unit"], src


def flight_wtt(mode: str | None) -> tuple[float | None, str]:
    """DEFRA 'WTT- flights' factor (kg CO2e/passenger-km) for an air mode, or None."""
    d = _s3act()
    ef = d.get("flight_wtt_kg_per_pkm", {}).get((mode or "").strip().lower())
    return (float(ef) if ef is not None else None), d["_meta"]["source"]


def _norm_refrigerant(name: str) -> str:
    """Normalise a refrigerant label for case-insensitive matching
    (e.g. "R-410a", "r 410A" -> "R410A")."""
    return name.upper().replace("-", "").replace(" ", "")


def gwp(refrigerant: str | None) -> tuple[float | None, str]:
    data = _load("gwp.json")
    src = data["_meta"]["source"]
    if not refrigerant:
        return None, src
    # Match case-insensitively so factor files can use any casing (e.g. the
    # JSON key "R134a" still resolves the normalised input "R134A").
    table = {_norm_refrigerant(k): v for k, v in data["factors"].items()}
    return table.get(_norm_refrigerant(refrigerant)), src


def leak_params() -> dict:
    return _load("leak_rates.json")


def eui_electricity(building_type: str | None, country: str | None = None) -> tuple[float, str]:
    """Electricity use intensity (kWh/m2/yr) for a building type — screening fallback."""
    data = _load("eui_benchmarks.json")
    tbl = data["electricity_kwh_per_m2_yr"]
    key = (building_type or "").strip().lower()
    return float(tbl.get(key, tbl["_default"])), data["_meta"]["source"]


def m2_per_fte(building_type: str | None = None) -> float:
    """Floor area per full-time employee — to estimate area when only headcount is known."""
    data = _load("eui_benchmarks.json")
    tbl = data["m2_per_fte"]
    return float(tbl.get((building_type or "").strip().lower(), tbl["_default"]))


def eui_heating(building_type: str | None) -> tuple[float, str]:
    """Heating energy intensity (kWh/m2/yr) for a building type — screening fallback."""
    data = _load("eui_benchmarks.json")
    tbl = data.get("heating_kwh_per_m2_yr", {})
    key = (building_type or "").strip().lower()
    return float(tbl.get(key, tbl.get("_default", 120))), data["_meta"]["source"]


def avg_litres_per_vehicle(fuel_type: str | None) -> tuple[float, str]:
    """Average annual litres per vehicle — to estimate mobile combustion from a count."""
    data = _load("mobile_benchmarks.json")
    tbl = data["avg_litres_per_vehicle_yr"]
    return float(tbl.get((fuel_type or "").strip().lower(), tbl["_default"])), data["_meta"]["source"]


def scope3_spend_factor(factor_key: str) -> dict | None:
    """Return the spend bucket record (label, kg_co2e_per_usd, naics, ...) or None."""
    return _load("scope3_spend_factors.json")["factors"].get(factor_key)


def scope3_spend_source() -> str:
    return _load("scope3_spend_factors.json")["_meta"]["source"]


def fx_to_usd(currency: str | None) -> tuple[float, bool]:
    """Static 2022 market rate converting `currency` → USD. Returns (rate, matched).
    Unknown/blank currency falls back to 1.0 (treated as USD) with matched=False."""
    tbl = _load("scope3_spend_factors.json")["fx_to_usd_2022"]
    cur = (currency or "USD").strip().upper()
    if cur in tbl:
        return float(tbl[cur]), True
    return 1.0, False


def scope3_category_labels() -> dict:
    return _load("scope3_spend_factors.json")["categories"]


def scope3_buckets() -> dict:
    """Spend buckets + category labels + supported currencies for the UI to render
    the Scope 3 spend-entry form from a single source of truth."""
    data = _load("scope3_spend_factors.json")
    return {
        "categories": data["categories"],
        "currencies": [c for c in data["fx_to_usd_2022"] if not c.startswith("_")],
        "source": data["_meta"]["source"],
        "buckets": [
            {
                "key": k,
                "label": v["label"],
                "suggested_categories": v.get("suggested_categories", []),
                "naics": v.get("naics"),
                "kg_co2e_per_usd": v["kg_co2e_per_usd"],
            }
            for k, v in data["factors"].items()
        ],
    }


# Map full country names (as used by the grid-factor set and the UI) to the ISO-2
# codes used by the waste treatment-mix and hotel factor sets, so a single country
# value ("Germany") resolves consistently across all factor tables.
_COUNTRY_ISO = {
    "GERMANY": "DE", "UNITED KINGDOM": "GB", "UK": "GB", "GREAT BRITAIN": "GB",
    "FRANCE": "FR", "ITALY": "IT", "NETHERLANDS": "NL", "SWITZERLAND": "CH",
    "SPAIN": "ES", "POLAND": "PL", "UNITED STATES": "US", "USA": "US",
    "UNITED STATES OF AMERICA": "US", "INDIA": "IN", "CHINA": "CN",
    "AUSTRALIA": "AU", "JAPAN": "JP", "BRAZIL": "BR", "CANADA": "CA",
}


def _to_iso(country: str | None) -> str:
    """Normalise a country name/code to an ISO-2 code (best effort)."""
    c = (country or "").strip()
    return _COUNTRY_ISO.get(c.upper(), c.upper())


def waste_treatment_ef() -> tuple[dict, str]:
    """Return {method: kg CO2e/tonne} and the source string (DEFRA 2025)."""
    data = _load("waste_benchmarks.json")["treatment_ef_kg_per_tonne"]
    return ({k: v for k, v in data.items() if not k.startswith("_")},
            _load("waste_benchmarks.json")["_meta"]["sources"]["treatment_ef_kg_per_tonne"])


def waste_treatment_mix(country: str | None) -> tuple[dict, str, bool]:
    """Return (treatment mix dict, label, matched) for a country, else world default."""
    tbl = _load("waste_benchmarks.json")["treatment_mix_by_country"]
    code = _to_iso(country)
    if code in tbl:
        return tbl[code], f"What a Waste treatment mix ({code})", True
    return tbl["_world_default"], "What a Waste treatment mix (world default)", False


def waste_generation_per_fte(building_type: str | None) -> tuple[float, str]:
    """Return screening kg-waste/FTE/yr for a building type + source note."""
    data = _load("waste_benchmarks.json")
    tbl = data["generation_kg_per_fte_year"]
    key = (building_type or "").strip().lower()
    return float(tbl.get(key, tbl["_default"])), "screening default (refine with actual tonnage)"


def _s3act() -> dict:
    return _load("scope3_activity_factors.json")


def electricity_wtt_td() -> tuple[float, str]:
    """Combined upstream + T&D emission factor per kWh purchased grid electricity (Cat 3)."""
    d = _s3act()
    return float(d["electricity_wtt_td_kg_per_kwh"]["combined"]), d["_meta"]["source"]


def travel_mode_ef(mode: str | None) -> tuple[float | None, str]:
    """kg CO2e per passenger-km for a travel/commuting mode (Cat 6/7)."""
    d = _s3act()
    tbl = d["travel_modes_kg_per_pkm"]
    ef = tbl.get((mode or "").strip().lower())
    return (float(ef) if ef is not None else None), d["_meta"]["source"]


def hotel_ef(country: str | None) -> tuple[float, str, bool]:
    """kg CO2e per room-night for a country (Cat 6). Returns (ef, source, matched)."""
    d = _s3act()
    tbl = d["hotel_kg_per_room_night_by_country"]
    code = _to_iso(country)
    if code in tbl:
        return float(tbl[code]), d["_meta"]["source"], True
    return float(tbl["_default"]), d["_meta"]["source"], False


def commuting_defaults() -> dict:
    return _s3act()["commuting_defaults"]


def s3_activity_source() -> str:
    return _s3act()["_meta"]["source"]


def fuel_ef_per_kwh(fuel_type: str) -> tuple[float | None, str]:
    """Emission factor per kWh of fuel energy, derived from the fuel record's NCV
    (co2e per base unit ÷ kWh per base unit). Used to cost heating estimates."""
    rec = _load("fuel_factors.json")["factors"].get(fuel_type)
    if not rec or not rec.get("ncv_gj_per_base_unit"):
        return None, ""
    kwh_per_base = rec["ncv_gj_per_base_unit"] * 277.7778  # 1 GJ = 277.778 kWh
    return rec["co2e_kg_per_base_unit"] / kwh_per_base, _load("fuel_factors.json")["_meta"]["source"]


def metadata() -> dict:
    """Expose the _meta of each dataset for the UI's transparency panel."""
    return {
        "grid": _load("grid_factors.json")["_meta"],
        "residual_mix": _load("residual_mix.json")["_meta"],
        "fuel": _load("fuel_factors.json")["_meta"],
        "gwp": _load("gwp.json")["_meta"],
        "leak_rates": _load("leak_rates.json")["_meta"],
        "eui": _load("eui_benchmarks.json")["_meta"],
        "scope3_spend": _load("scope3_spend_factors.json")["_meta"],
        "waste": _load("waste_benchmarks.json")["_meta"],
        "scope3_activity": _load("scope3_activity_factors.json")["_meta"],
        "grid_countries": sorted(
            k for k in _load("grid_factors.json")["factors"] if not k.startswith("_")
        ),
    }
