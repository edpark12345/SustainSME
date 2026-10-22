#!/usr/bin/env python3
"""Scope 1 deterministic calculators: stationary, mobile, fugitive."""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import factors as F  # noqa: E402
from schema import (  # noqa: E402
    EmissionResult, CompanyBoundary, Scope1Stationary, Scope1Mobile, Scope1Fugitive,
)

# Mass/volume aliases that map onto a fuel's base unit.
_MASS_TO_KG = {"kg": 1.0, "tonne": 1000.0, "tonnes": 1000.0, "t": 1000.0, "mt": 1000.0}
_VOLUME_VOL = {"litre", "litres", "l", "liter", "liters"}
# Energy units → gigajoules. When a fuel is billed by energy (e.g. gas in kWh on
# EU bills, or therms on US bills) we convert energy → the fuel's physical base
# unit via its net calorific value: base_qty = energy_GJ / ncv_gj_per_base_unit.
_ENERGY_GJ = {
    "kwh": 0.0036, "kwhr": 0.0036, "kw h": 0.0036,
    "mwh": 3.6, "gj": 1.0, "mj": 0.001,
    "therm": 0.105506, "therms": 0.105506,
    "mmbtu": 1.055056, "mmbtus": 1.055056,
}


def _to_base(qty: float, unit: str | None, rec: dict, warnings: list[str], label: str):
    """Convert qty in `unit` to the fuel's base unit; return base-unit quantity or None."""
    base = rec["base_unit"]
    aliases = {a.lower() for a in rec.get("aliases", [])} | {base.lower()}
    u = (unit or base).strip().lower()
    if u in aliases or u == base.lower():
        return qty
    # mass <-> mass (e.g. kg given, base tonne)
    if base in ("kg", "tonne") and u in _MASS_TO_KG:
        kg = qty * _MASS_TO_KG[u]
        return kg / 1000.0 if base == "tonne" else kg
    # volume base with a volume unit synonym
    if base in _VOLUME_VOL and u in _VOLUME_VOL:
        return qty
    # energy unit (kWh, therms, GJ, …) → base via the fuel's net calorific value
    ncv = rec.get("ncv_gj_per_base_unit")
    if ncv and u in _ENERGY_GJ:
        return qty * _ENERGY_GJ[u] / ncv
    warnings.append(f"{label}: unit '{unit}' not convertible to base '{base}'; treated as base unit.")
    return qty


def stationary(items: list[Scope1Stationary], boundary: CompanyBoundary,
               warnings: list[str]) -> list[EmissionResult]:
    out: list[EmissionResult] = []
    site0 = boundary.sites[0] if boundary.sites else None
    for a in items:
        if a.quantity is None:
            # Estimated heating fuels are pooled + owned by calc/heating.py (remainder logic).
            if getattr(a, "is_heating", False):
                continue
            # Heating estimate: fuel known, amount unknown ("don't know") + floor area available.
            area = site0.floor_area_m2 if site0 else None
            efk, esrc = F.fuel_ef_per_kwh(a.fuel_type)
            if area and efk:
                eui, euisrc = F.eui_heating(site0.building_type)
                kwh = area * eui
                # Multi-fuel heating estimate: split the building's heating load by this
                # fuel's share so several estimated fuels don't each count the full total.
                share_note = ""
                if a.heating_share_pct is not None:
                    kwh *= a.heating_share_pct / 100.0
                    share_note = f", {a.heating_share_pct:g}% share"
                label = f"Heating · {a.fuel_type}" + (f" · {site0.name}" if site0.name else "")
                out.append(EmissionResult(
                    scope="1", category="Stationary combustion", activity_label=label,
                    raw_input=f"{kwh:,.0f} kWh (est.)", co2e_t=round(kwh * efk / 1000.0, 4),
                    factor_value=round(efk, 4), factor_unit="kgCO2e/kWh",
                    factor_source=f"{esrc}; heating EUI {euisrc}", tier="estimated",
                    assumptions=[f"heating estimated: {area:,.0f} m2 x {eui:g} kWh/m2/yr{share_note} = {kwh:,.0f} kWh"],
                ))
            continue
        rec = F.fuel_factor(a.fuel_type)
        label = f"Stationary · {a.fuel_type}" + (f" · {a.site}" if a.site else "")
        if not rec:
            warnings.append(f"{label}: no factor for fuel '{a.fuel_type}'.")
            continue
        base_qty = _to_base(a.quantity, a.unit, rec, warnings, label)
        co2e_kg = base_qty * rec["co2e_kg_per_base_unit"]
        out.append(EmissionResult(
            scope="1", category="Stationary combustion", activity_label=label,
            raw_input=f"{a.quantity} {a.unit or rec['base_unit']}",
            co2e_t=round(co2e_kg / 1000.0, 4),
            factor_value=rec["co2e_kg_per_base_unit"],
            factor_unit=f"kgCO2e/{rec['base_unit']}", factor_source=F.fuel_source(),
            tier="primary", assumptions=([a.notes] if a.notes else []),
        ))
    return out


def mobile(items: list[Scope1Mobile], warnings: list[str]) -> list[EmissionResult]:
    out: list[EmissionResult] = []
    for a in items:
        label = f"Mobile · {a.fuel_type}" + (f" · {a.vehicle_or_fleet}" if a.vehicle_or_fleet else "")
        unit = (a.unit or "").strip().lower()
        rec = F.fuel_factor(a.fuel_type)
        if a.quantity is not None and unit in _VOLUME_VOL and rec and rec["base_unit"] in _VOLUME_VOL:
            co2e_kg = a.quantity * rec["co2e_kg_per_base_unit"]
            out.append(EmissionResult(
                scope="1", category="Mobile combustion", activity_label=label,
                raw_input=f"{a.quantity} {a.unit}", co2e_t=round(co2e_kg / 1000.0, 4),
                factor_value=rec["co2e_kg_per_base_unit"], factor_unit=f"kgCO2e/{rec['base_unit']}",
                factor_source=F.fuel_source(), tier="primary",
                assumptions=([a.notes] if a.notes else []),
            ))
        elif a.quantity is None and a.vehicle_count and rec and rec["base_unit"] in _VOLUME_VOL:
            # "Don't know litres" → estimate from vehicle count × average annual fuel.
            avg, asrc = F.avg_litres_per_vehicle(a.fuel_type)
            litres = a.vehicle_count * avg
            co2e_kg = litres * rec["co2e_kg_per_base_unit"]
            out.append(EmissionResult(
                scope="1", category="Mobile combustion", activity_label=label,
                raw_input=f"{a.vehicle_count} vehicles -> {litres:,.0f} L (est.)",
                co2e_t=round(co2e_kg / 1000.0, 4), factor_value=rec["co2e_kg_per_base_unit"],
                factor_unit=f"kgCO2e/{rec['base_unit']}", factor_source=f"{F.fuel_source()}; {asrc}",
                tier="estimated",
                assumptions=[f"{a.vehicle_count} vehicles x {avg:g} L/vehicle/yr = {litres:,.0f} L"],
            ))
        else:
            # spend-based or distance-based tiers need a price/vehicle-EF table (later phase).
            warnings.append(
                f"{label}: only litre-based fuel is computed in this iteration "
                f"(got quantity={a.quantity} unit={a.unit}, distance_km={a.distance_km}). Skipped."
            )
    return out


def fugitive(items: list[Scope1Fugitive], warnings: list[str]) -> list[EmissionResult]:
    out: list[EmissionResult] = []
    lp = F.leak_params()
    for a in items:
        label = f"Fugitive · {a.refrigerant_type or 'refrigerant'}" + (f" · {a.equipment}" if a.equipment else "")
        g, gsrc = F.gwp(a.refrigerant_type)
        if g is None:
            warnings.append(f"{label}: unknown refrigerant '{a.refrigerant_type}'; no GWP — skipped.")
            continue
        # Primary tier: an actual recorded top-up mass (> 0). A refill of 0 kg
        # alongside an asset inventory (charge/tonnage) means "no top-up logged",
        # NOT a measured zero-leak — refrigerant leaks continuously — so a 0 falls
        # through to the charge×leak-rate estimate below (per METHODOLOGY.md).
        if a.refill_kg:
            co2e_kg = a.refill_kg * g
            out.append(EmissionResult(
                scope="1", category="Fugitive emissions", activity_label=label,
                raw_input=f"{a.refill_kg} kg refill", co2e_t=round(co2e_kg / 1000.0, 4),
                factor_value=g, factor_unit="kgCO2e/kg (GWP100)", factor_source=gsrc,
                tier="primary", assumptions=([a.notes] if a.notes else []),
            ))
            continue
        # Inventory tier: estimate leakage from installed charge.
        charge = a.charge_kg
        assumptions: list[str] = []
        if charge is None and a.tonnage_tr is not None:
            charge = a.tonnage_tr * lp["charge_kg_per_tr"]
            assumptions.append(f"charge estimated as {a.tonnage_tr} TR × {lp['charge_kg_per_tr']} kg/TR")
        if charge is None:
            if a.refill_kg == 0:
                # Explicit zero and nothing to estimate from → a stated measured zero.
                out.append(EmissionResult(
                    scope="1", category="Fugitive emissions", activity_label=label,
                    raw_input="0 kg refill", co2e_t=0.0,
                    factor_value=g, factor_unit="kgCO2e/kg (GWP100)", factor_source=gsrc,
                    tier="primary", assumptions=([a.notes] if a.notes else []),
                ))
            else:
                warnings.append(f"{label}: no refill, charge or tonnage — cannot estimate; skipped.")
            continue
        eq = (a.equipment or "default").strip().lower()
        rate_table = lp["annual_leak_rate_by_equipment"]
        rate = next((v for k, v in rate_table.items() if k in eq), rate_table["default"])
        leaked_kg = charge * rate
        co2e_kg = leaked_kg * g
        # The emitting quantity is the LEAKED mass (charge × leak rate), so the
        # displayed formula (leaked × GWP) reconciles; the charge→leak derivation
        # stays in the working below.
        assumptions.append(
            f"annual leak = {charge:.2f} kg charge × {rate:.0%} leak rate = {leaked_kg:.3f} kg")
        if a.notes:
            assumptions.append(a.notes)
        out.append(EmissionResult(
            scope="1", category="Fugitive emissions", activity_label=label,
            raw_input=f"{leaked_kg:.3f} kg leaked (est.)", co2e_t=round(co2e_kg / 1000.0, 4),
            factor_value=g, factor_unit="kgCO2e/kg (GWP100)", factor_source=gsrc,
            tier="estimated", assumptions=assumptions,
        ))
    return out
