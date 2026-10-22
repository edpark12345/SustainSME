#!/usr/bin/env python3
"""
heating.py — multi-fuel heating resolver (Option A: "measured anchors the total,
estimates fill the remainder").

A site's heating is one physical load. The floor-area × heating-EUI benchmark is
an estimate of that WHOLE load. So when several fuels heat the same site:

  1. Fuels with a KNOWN amount are computed normally (primary) by scope1.stationary
     / scope2.thermal — and their energy is subtracted from the benchmark here.
  2. The REMAINDER (benchmark − known heating energy, floored at 0) is split across
     the ESTIMATED heating fuels by their `heating_share_pct` (equal split if blank).

This prevents the double-count where an estimated fuel would otherwise re-cover the
whole building that a known fuel already partly serves.

Heating rows are marked `is_heating=True` by the guided UI. This resolver OWNS the
estimated heating rows (quantity/energy is None); the ordinary calculators skip
those and compute only the known ones.
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import factors as F  # noqa: E402
from schema import (  # noqa: E402
    EmissionResult, CompanyBoundary, Scope1Stationary, Scope2Thermal,
)

_MASS_TO_KG = {"kg": 1.0, "tonne": 1000.0, "tonnes": 1000.0, "t": 1000.0, "mt": 1000.0}
_VOLUME_VOL = {"litre", "litres", "l", "liter", "liters"}
_KWH_PER_GJ = 277.7778
# Energy units → gigajoules, so a fuel billed by energy (gas in kWh, US therms)
# converts to its physical base unit via NCV: base_qty = energy_GJ / ncv.
_ENERGY_GJ = {
    "kwh": 0.0036, "kwhr": 0.0036, "kw h": 0.0036,
    "mwh": 3.6, "gj": 1.0, "mj": 0.001,
    "therm": 0.105506, "therms": 0.105506,
    "mmbtu": 1.055056, "mmbtus": 1.055056,
}


def _to_base(qty: float, unit: str | None, rec: dict) -> float:
    """Convert qty in `unit` to the fuel record's base unit (best-effort)."""
    base = rec["base_unit"]
    aliases = {a.lower() for a in rec.get("aliases", [])} | {base.lower()}
    u = (unit or base).strip().lower()
    if u in aliases:
        return qty
    if base in ("kg", "tonne") and u in _MASS_TO_KG:
        kg = qty * _MASS_TO_KG[u]
        return kg / 1000.0 if base == "tonne" else kg
    ncv = rec.get("ncv_gj_per_base_unit")
    if ncv and u in _ENERGY_GJ:
        return qty * _ENERGY_GJ[u] / ncv
    return qty


def _fuel_kwh(fuel_type: str, qty: float, unit: str | None) -> float | None:
    """Energy (kWh) of a known fuel amount, via its net calorific value."""
    rec = F.fuel_factor(fuel_type)
    if not rec or not rec.get("ncv_gj_per_base_unit"):
        return None
    base_qty = _to_base(qty, unit, rec)
    return base_qty * rec["ncv_gj_per_base_unit"] * _KWH_PER_GJ


def resolve(boundary: CompanyBoundary, stationary: list[Scope1Stationary],
            thermal: list[Scope2Thermal], warnings: list[str]) -> tuple[list[EmissionResult], list[EmissionResult]]:
    """Return (scope1_combustion_results, scope2_thermal_results) for ESTIMATED
    heating fuels only. Known heating fuels are left to the ordinary calculators."""
    site0 = boundary.sites[0] if boundary.sites else None

    heat_stat = [a for a in stationary if getattr(a, "is_heating", False)]
    heat_therm = [a for a in thermal if getattr(a, "is_heating", False)]
    est_stat = [a for a in heat_stat if a.quantity is None]
    est_therm = [a for a in heat_therm if a.energy_kwh is None]
    if not est_stat and not est_therm:
        return [], []

    area = site0.floor_area_m2 if site0 else None
    if not area:
        for _ in est_stat + est_therm:
            warnings.append("Heating estimate skipped: no floor area for the site.")
        return [], []

    eui, euisrc = F.eui_heating(site0.building_type)
    benchmark = area * eui

    # Energy already accounted for by fuels with a known amount.
    known_kwh = 0.0
    for a in heat_stat:
        if a.quantity is not None:
            k = _fuel_kwh(a.fuel_type, a.quantity, a.unit)
            if k:
                known_kwh += k
    for a in heat_therm:
        if a.energy_kwh is not None:
            known_kwh += a.energy_kwh  # district heat is already in kWh

    remainder = max(0.0, benchmark - known_kwh)
    n_est = len(est_stat) + len(est_therm)
    base_note = (
        f"heating benchmark {area:,.0f} m2 x {eui:g} kWh/m2/yr = {benchmark:,.0f} kWh; "
        f"minus {known_kwh:,.0f} kWh measured = {remainder:,.0f} kWh to estimate"
    )
    if remainder <= 0:
        warnings.append(
            "Measured heating already meets/exceeds the floor-area benchmark; "
            "estimated heating fuel(s) set to 0."
        )

    def share_of(a) -> float:
        return (a.heating_share_pct / 100.0) if a.heating_share_pct is not None else (1.0 / n_est)

    s1: list[EmissionResult] = []
    s2: list[EmissionResult] = []

    for a in est_stat:
        efk, esrc = F.fuel_ef_per_kwh(a.fuel_type)
        if not efk:
            warnings.append(f"Heating · {a.fuel_type}: no per-kWh factor; skipped.")
            continue
        share = share_of(a)
        kwh = remainder * share
        label = f"Heating · {a.fuel_type}" + (f" · {site0.name}" if site0.name else "")
        s1.append(EmissionResult(
            scope="1", category="Stationary combustion", activity_label=label,
            raw_input=f"{kwh:,.0f} kWh (est.)", co2e_t=round(kwh * efk / 1000.0, 4),
            factor_value=round(efk, 4), factor_unit="kgCO2e/kWh",
            factor_source=f"{esrc}; heating EUI {euisrc}", tier="estimated",
            assumptions=[f"{base_note}; {share * 100:g}% share = {kwh:,.0f} kWh"],
        ))

    for a in est_therm:
        country = site0.country if site0 else None
        ef, src = F.grid_factor(country)
        share = share_of(a)
        kwh = remainder * share
        label = f"{a.carrier.title()}" + (f" · {site0.name}" if site0 and site0.name else "") + " (estimated)"
        s2.append(EmissionResult(
            scope="2", category="Purchased heat/steam/cooling", activity_label=label,
            raw_input=f"{kwh:,.0f} kWh (est.)", co2e_t=round(kwh * ef / 1000.0, 4),
            factor_value=ef, factor_unit="kgCO2e/kWh",
            factor_source=f"{src} [{country or 'world'}] (proxy); heating EUI {euisrc}",
            tier="estimated",
            assumptions=[f"{base_note}; {share * 100:g}% share = {kwh:,.0f} kWh"],
        ))

    return s1, s2
