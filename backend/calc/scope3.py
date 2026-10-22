#!/usr/bin/env python3
"""Scope 3 deterministic calculators — spend-based (EEIO) first slice.

Covers the spend-core categories: 1 (purchased goods & services), 2 (capital
goods), 4 (upstream transport & distribution) and 9 (downstream transport).

Method (GHG Protocol, spend-based):
    emissions = spend (in USD 2022) × EEIO factor (kg CO2e / USD 2022)
where spend is converted to USD 2022 via a static, documented FX rate. Every
line is tagged tier='spend' (screening quality) with the FX + EEIO assumptions
recorded, so it stays auditable in the same Excel export as Scope 1 & 2.
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import factors as F  # noqa: E402
from schema import (  # noqa: E402
    EmissionResult, Scope3Spend, Scope3Waste, Scope3Travel, Scope3Commute, Scope2Electricity,
    Scope1Stationary, Scope1Mobile,
)
from calc import scope1  # for the shared unit→base conversion  # noqa: E402

_CAT3 = "Cat 3 · Fuel & energy-related (WTT & T&D)"

_CAT_LABELS = {
    1: "Cat 1 · Purchased goods & services",
    2: "Cat 2 · Capital goods",
    4: "Cat 4 · Upstream transport & distribution",
    9: "Cat 9 · Downstream transport & distribution",
}


def spend(items: list[Scope3Spend], warnings: list[str]) -> list[EmissionResult]:
    out: list[EmissionResult] = []
    for a in items:
        rec = F.scope3_spend_factor(a.factor_key)
        cat_label = _CAT_LABELS.get(a.category, f"Cat {a.category}")
        label = f"{cat_label} · {rec['label']}" if rec else f"{cat_label} · {a.factor_key}"
        if rec is None:
            warnings.append(f"{label}: unknown spend factor '{a.factor_key}'; skipped.")
            continue
        if a.amount is None or a.amount <= 0:
            warnings.append(f"{label}: no spend amount; skipped.")
            continue

        rate, matched = F.fx_to_usd(a.currency)
        usd = a.amount * rate
        ef = rec["kg_co2e_per_usd"]
        co2e_kg = usd * ef
        cur = (a.currency or "USD").strip().upper()

        # raw_input carries the USD-converted amount so the Calculation column
        # (qty × factor ÷ 1000) reconciles with the tCO2e result; the original
        # currency + FX step is preserved in the assumptions for the audit trail.
        assumptions = []
        if cur != "USD":
            assumptions.append(f"{a.amount:,.0f} {cur} × {rate:g} FX(2022) = {usd:,.0f} USD2022")
        assumptions.append(f"spend-based (EEIO) proxy NAICS {rec.get('naics', '?')} "
                           f"({rec.get('naics_title', '')})")
        if not matched and cur != "USD":
            warnings.append(
                f"{label}: currency '{a.currency}' has no FX rate; treated as USD 1:1."
            )
            assumptions.append(f"currency '{a.currency}' not in FX table — treated as USD")
        if a.notes:
            assumptions.append(a.notes)

        out.append(EmissionResult(
            scope="3", category=cat_label, activity_label=label,
            raw_input=f"{usd:,.0f} USD2022 spend",
            co2e_t=round(co2e_kg / 1000.0, 4),
            factor_value=ef, factor_unit="kgCO2e/USD2022",
            factor_source=F.scope3_spend_source(), tier="spend",
            assumptions=assumptions,
        ))
    return out


_MIX_METHODS = ("landfill", "incineration", "recycling", "composting")


def waste(items: list[Scope3Waste], warnings: list[str]) -> list[EmissionResult]:
    """Cat 5 waste, average-data method: tonnes × Σ(treatment share × EF)."""
    out: list[EmissionResult] = []
    ef_tbl, ef_src = F.waste_treatment_ef()
    for a in items:
        assumptions: list[str] = []
        tonnes = a.tonnes
        tier = "primary"
        if tonnes is None:
            # Estimate tonnes from headcount × per-FTE screening benchmark.
            if not a.employees_fte:
                warnings.append("Waste (Cat 5): no tonnage and no headcount — skipped.")
                continue
            per_fte, gsrc = F.waste_generation_per_fte(a.building_type)
            tonnes = a.employees_fte * per_fte / 1000.0
            tier = "estimated"
            assumptions.append(
                f"tonnage estimated: {a.employees_fte:g} FTE × {per_fte:g} kg/FTE/yr "
                f"= {tonnes:,.1f} t ({gsrc})"
            )

        mix, mix_label, matched = (
            (a.treatment_mix, "treatment mix (provided)", True)
            if a.treatment_mix else F.waste_treatment_mix(a.country)
        )
        if not matched and a.country:
            warnings.append(f"Waste (Cat 5): no treatment mix for '{a.country}'; used world default.")

        # Blend the per-tonne factor from the treatment split.
        blended = sum(float(mix.get(m, 0.0)) * ef_tbl.get(m, 0.0) for m in _MIX_METHODS)
        co2e_kg = tonnes * blended
        # Show shares to 1 decimal % and the blend to 3-decimal shares so the working
        # reconciles — a whole-% landfill share (e.g. 0.014 → "1%") drops most of the
        # high-EF landfill term and the shown maths no longer ties to the result.
        mix_str = ", ".join(f"{m} {float(mix.get(m, 0.0)) * 100:.1f}%" for m in _MIX_METHODS)
        assumptions.append(f"{mix_label}: {mix_str}")
        assumptions.append(
            "blended EF = Σ(share×EF): "
            + " + ".join(f"{float(mix.get(m, 0.0)):.3f}×{ef_tbl.get(m, 0.0):g}" for m in _MIX_METHODS)
            + f" = {blended:.2f} kgCO2e/t"
        )
        if a.notes:
            assumptions.append(a.notes)

        out.append(EmissionResult(
            scope="3", category="Cat 5 · Waste generated in operations",
            activity_label="Cat 5 · Waste generated in operations",
            raw_input=f"{tonnes:,.1f} tonnes",
            co2e_t=round(co2e_kg / 1000.0, 4),
            factor_value=round(blended, 2), factor_unit="kgCO2e/tonne (blended)",
            factor_source=ef_src, tier=tier, assumptions=assumptions,
        ))
    return out


def _grid_kwh(a: Scope2Electricity) -> float:
    """Purchased grid kWh, mirroring the Scope 2 derivation (grid = explicit, else
    total − captive − open-access)."""
    if a.grid_kwh is not None:
        return a.grid_kwh
    total = a.total_kwh or 0.0
    return max(total - (a.captive_solar_kwh or 0.0) - (a.openaccess_renewable_kwh or 0.0), 0.0)


def energy_related(elec: list[Scope2Electricity], warnings: list[str]) -> list[EmissionResult]:
    """Cat 3 (FERA) — upstream (WTT) of purchased electricity + grid T&D losses.
    Auto-derived from the Scope 2 electricity already in the bundle (no re-entry)."""
    kwh = sum(_grid_kwh(a) for a in elec)
    if kwh <= 0:
        return []
    ef, src = F.electricity_wtt_td()
    co2e_kg = kwh * ef
    return [EmissionResult(
        scope="3", category="Cat 3 · Fuel & energy-related (WTT & T&D)",
        activity_label="Cat 3 · Electricity WTT + grid T&D losses",
        raw_input=f"{kwh:,.0f} kWh",
        co2e_t=round(co2e_kg / 1000.0, 4),
        factor_value=ef, factor_unit="kgCO2e/kWh", factor_source=src, tier="estimated",
        assumptions=[
            "upstream (well-to-tank) of generation + transmission & distribution losses "
            "for purchased grid electricity, from the Scope 2 activity data",
        ],
    )]


def fuel_flight_wtt(stationary: list[Scope1Stationary], mobile: list[Scope1Mobile],
                    travel_items: list[Scope3Travel], warnings: list[str]) -> list[EmissionResult]:
    """Cat 3 — well-to-tank (upstream) of the Scope 1 combustion fuels (natural gas,
    diesel, petrol …) plus the WTT of aviation fuel for Cat 6 flights. This is the
    upstream complement to the combustion emissions counted in Scope 1 / Cat 6."""
    out: list[EmissionResult] = []
    # Ground fuels: stationary + mobile combustion → their upstream (WTT).
    for a in list(stationary) + list(mobile):
        if a.quantity is None:
            continue  # estimated/pooled heating fuels have no measured quantity
        wtt, base_unit, wsrc = F.fuel_wtt(a.fuel_type)
        if wtt is None:
            warnings.append(f"Cat 3 fuel WTT: no upstream (WTT) factor for '{a.fuel_type}'; skipped.")
            continue
        rec = F.fuel_factor(a.fuel_type)
        base_qty = scope1._to_base(a.quantity, a.unit, rec, warnings, f"Cat 3 WTT · {a.fuel_type}")
        co2e_kg = base_qty * wtt
        site = getattr(a, "site", None)
        out.append(EmissionResult(
            scope="3", category=_CAT3,
            activity_label=f"Cat 3 · Fuel WTT · {a.fuel_type}" + (f" · {site}" if site else ""),
            raw_input=f"{base_qty:,.0f} {base_unit}", co2e_t=round(co2e_kg / 1000.0, 4),
            factor_value=wtt, factor_unit=f"kgCO2e/{base_unit}", factor_source=wsrc, tier="estimated",
            assumptions=["well-to-tank (upstream): extraction, refining & delivery of the Scope 1 fuel"],
        ))
    # Flights: upstream (WTT) of aviation fuel, on top of the Cat 6 combustion factor.
    for a in travel_items:
        mode = (a.mode or "").strip().lower()
        if not mode.startswith("air") or not a.distance_km:
            continue
        wtt, wsrc = F.flight_wtt(mode)
        if wtt is None:
            continue
        out.append(EmissionResult(
            scope="3", category=_CAT3,
            activity_label=f"Cat 3 · Flight WTT · {mode.replace('_', ' ')}",
            raw_input=f"{a.distance_km:,.0f} passenger-km", co2e_t=round(a.distance_km * wtt / 1000.0, 4),
            factor_value=wtt, factor_unit="kgCO2e/passenger-km", factor_source=wsrc, tier="estimated",
            assumptions=["well-to-tank (upstream) of aviation fuel, complementing the Cat 6 combustion factor"],
        ))
    return out


def travel(items: list[Scope3Travel], warnings: list[str]) -> list[EmissionResult]:
    """Cat 6 business travel (distance-based) + hotel nights."""
    out: list[EmissionResult] = []
    for a in items:
        mode = (a.mode or "").strip().lower()
        if mode == "hotel":
            if not a.nights:
                warnings.append("Cat 6 travel: hotel line has no nights; skipped.")
                continue
            ef, src, matched = F.hotel_ef(a.country)
            co2e_kg = a.nights * ef
            note = [] if matched else [f"country '{a.country}' not in hotel table — used default"]
            out.append(EmissionResult(
                scope="3", category="Cat 6 · Business travel",
                activity_label="Cat 6 · Hotel stay",
                raw_input=f"{a.nights:,.0f} room-nights",
                co2e_t=round(co2e_kg / 1000.0, 4), factor_value=ef,
                factor_unit="kgCO2e/room-night", factor_source=src, tier="primary",
                assumptions=note + ([a.notes] if a.notes else []),
            ))
            continue
        ef, src = F.travel_mode_ef(mode)
        if ef is None:
            warnings.append(f"Cat 6 travel: unknown mode '{a.mode}'; skipped.")
            continue
        if not a.distance_km:
            warnings.append(f"Cat 6 travel ({mode}): no distance; skipped.")
            continue
        co2e_kg = a.distance_km * ef
        out.append(EmissionResult(
            scope="3", category="Cat 6 · Business travel",
            activity_label=f"Cat 6 · {mode.replace('_', ' ')}",
            raw_input=f"{a.distance_km:,.0f} passenger-km",
            co2e_t=round(co2e_kg / 1000.0, 4), factor_value=ef,
            factor_unit="kgCO2e/passenger-km", factor_source=src, tier="primary",
            assumptions=([a.notes] if a.notes else []),
        ))
    return out


def commuting(items: list[Scope3Commute], warnings: list[str]) -> list[EmissionResult]:
    """Cat 7 employee commuting (average-data): headcount × distance × mode EF."""
    out: list[EmissionResult] = []
    d = F.commuting_defaults()
    for a in items:
        mode = (a.mode or d["default_mode"]).strip().lower()
        ef, src = F.travel_mode_ef(mode)
        if ef is None:
            warnings.append(f"Cat 7 commuting: unknown mode '{a.mode}'; skipped.")
            continue
        assumptions: list[str] = []
        if a.distance_km:
            distance = a.distance_km
        else:
            if not a.employees_fte:
                warnings.append("Cat 7 commuting: no distance and no headcount; skipped.")
                continue
            km_day = a.avg_round_trip_km_per_day or d["avg_round_trip_km_per_day"]
            days = a.working_days or d["working_days_per_year"]
            distance = a.employees_fte * km_day * days
            assumptions.append(
                f"{a.employees_fte:g} FTE × {km_day:g} km/day round-trip × {days:g} days "
                f"= {distance:,.0f} passenger-km"
            )
        co2e_kg = distance * ef
        if a.notes:
            assumptions.append(a.notes)
        out.append(EmissionResult(
            scope="3", category="Cat 7 · Employee commuting",
            activity_label=f"Cat 7 · commuting ({mode.replace('_', ' ')})",
            raw_input=f"{distance:,.0f} passenger-km",
            co2e_t=round(co2e_kg / 1000.0, 4), factor_value=ef,
            factor_unit="kgCO2e/passenger-km", factor_source=src, tier="estimated",
            assumptions=assumptions,
        ))
    return out
