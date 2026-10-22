#!/usr/bin/env python3
"""Top-level calculation: ActivityBundle -> CalculationResponse (deterministic)."""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from schema import ActivityBundle, CalculationResponse  # noqa: E402
from calc import scope1, scope2, scope3, heating  # noqa: E402


def calculate(bundle: ActivityBundle) -> CalculationResponse:
    warnings: list[str] = []

    # Multi-fuel heating: known amounts are subtracted from the floor-area benchmark and the
    # remainder is split across the estimated heating fuels (calc/heating.py). Known heating
    # fuels still flow through the ordinary calculators below; the estimated ones are owned here.
    heat_s1, heat_thermal = heating.resolve(
        bundle.boundary, bundle.scope1_stationary, bundle.scope2_thermal, warnings
    )

    s1 = (
        scope1.stationary(bundle.scope1_stationary, bundle.boundary, warnings)
        + scope1.mobile(bundle.scope1_mobile, warnings)
        + scope1.fugitive(bundle.scope1_fugitive, warnings)
        + heat_s1
    )
    loc, mkt = scope2.electricity(bundle.scope2_electricity, bundle.boundary, warnings)
    thermal = scope2.thermal(bundle.scope2_thermal, bundle.boundary, warnings) + heat_thermal
    loc += thermal
    mkt += thermal  # thermal is identical under both methods here

    s3 = (
        scope3.spend(bundle.scope3_spend, warnings)
        + scope3.waste(bundle.scope3_waste, warnings)
        + scope3.energy_related(bundle.scope2_electricity, warnings)
        + scope3.fuel_flight_wtt(
            bundle.scope1_stationary, bundle.scope1_mobile, bundle.scope3_travel, warnings
        )
        + scope3.travel(bundle.scope3_travel, warnings)
        + scope3.commuting(bundle.scope3_commute, warnings)
    )

    scope1_total = round(sum(r.co2e_t for r in s1), 4)
    scope2_loc = round(sum(r.co2e_t for r in loc), 4)
    scope2_mkt = round(sum(r.co2e_t for r in mkt), 4)
    scope3_total = round(sum(r.co2e_t for r in s3), 4)

    # Report location-based electricity + Scope 1 in the audit rows; market rows are
    # included too (distinguished by category) so the UI can show both. Scope 3
    # spend rows follow.
    return CalculationResponse(
        results=s1 + loc + mkt + s3,
        scope1_total_t=scope1_total,
        scope2_location_t=scope2_loc,
        scope2_market_t=scope2_mkt,
        scope3_total_t=scope3_total,
        warnings=warnings,
    )
