#!/usr/bin/env python3
"""Deterministic calculator checks (no LLM). Run: python eval/verify_calc.py"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from schema import (  # noqa: E402
    ActivityBundle, CompanyBoundary, Site,
    Scope2Electricity, Scope1Stationary, Scope1Fugitive,
)
from calc.engine import calculate  # noqa: E402

EPS = 1e-3
failures: list[str] = []


def check(label: str, got: float, expected: float):
    ok = abs(got - expected) < EPS
    print(f"  [{'OK ' if ok else 'FAIL'}] {label}: got {got}, expected {expected}")
    if not ok:
        failures.append(label)


bundle = ActivityBundle(
    boundary=CompanyBoundary(reporting_year=2023, sites=[Site(name="BBAN", country="India")]),
    scope2_electricity=[
        # grid drawal explicit
        Scope2Electricity(site="BBAN", period="2023-08", grid_kwh=100000),
        # total with captive split: 120000 total, 20000 solar -> 100000 grid
        Scope2Electricity(site="BBAN", period="2023-09", total_kwh=120000, captive_solar_kwh=20000),
        # green instrument zeroes market-based
        Scope2Electricity(site="BBAN", period="2023-10", grid_kwh=50000, green_instrument="PPA"),
    ],
    scope1_stationary=[
        Scope1Stationary(site="BBAN", fuel_type="natural_gas", quantity=10000, unit="SCM"),
        Scope1Stationary(site="Taloja", fuel_type="lshs", quantity=5, unit="tonne"),
    ],
    scope1_fugitive=[
        Scope1Fugitive(equipment="cassette", refrigerant_type="R410A", refill_kg=10),
        Scope1Fugitive(equipment="cassette", refrigerant_type="R22", tonnage_tr=2),
    ],
)

resp = calculate(bundle)

print("Scope 2 (location-based):")
# 100000*0.71/1000 + 100000*0.71/1000 + 50000*0.71/1000 = 71 + 71 + 35.5 = 177.5
check("scope2_location_t", resp.scope2_location_t, 177.5)

print("Scope 2 (market-based):")
# 71 + 71 + 0 (PPA) = 142.0
check("scope2_market_t", resp.scope2_market_t, 142.0)

print("Scope 1:")
# DEFRA 2024 gas 10000*2.04542/1000 = 20.4542 ; lshs 5*3168/1000 = 15.84 ; AR6 R410A 10*2256/1000 = 22.56 ;
# R22 inventory: 2 TR*0.7=1.4kg charge *0.08 leak *1960 (AR6) /1000 = 0.21952
expected_s1 = round(20.4542 + 15.84 + 22.56 + (1.4 * 0.08 * 1960 / 1000), 4)
check("scope1_total_t", resp.scope1_total_t, expected_s1)

print("\nResult rows:")
for r in resp.results:
    print(f"  [{r.scope}] {r.category} | {r.activity_label} | {r.co2e_t} t | tier={r.tier} | {r.factor_source}")
print("\nWarnings:")
for w in resp.warnings:
    print("  -", w)

if failures:
    print(f"\n{len(failures)} CHECK(S) FAILED: {failures}")
    sys.exit(1)
print("\nALL CHECKS PASSED")
