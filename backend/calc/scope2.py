#!/usr/bin/env python3
"""Scope 2 deterministic calculators: electricity (location + market) and thermal."""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import factors as F  # noqa: E402
from schema import (  # noqa: E402
    EmissionResult, CompanyBoundary, Scope2Electricity, Scope2Thermal,
)


def _norm_site(name: str | None) -> str:
    """Normalise a site label for tolerant matching (case- and space-insensitive)."""
    return " ".join((name or "").split()).lower()


def _same_site(meter: str, site: str) -> bool:
    """True if a metered line's site label and a boundary site name refer to the same
    place — exact, or one contained in the other (extraction often writes a verbose
    address where the boundary carries a short site name)."""
    return bool(meter) and bool(site) and (meter == site or meter in site or site in meter)


def _has_green_instrument(value: str | None) -> bool:
    """True only if `green_instrument` names a real contractual instrument. Extraction
    often fills a descriptive negative ("none - no GoO on this contract") which is a
    truthy string but must NOT zero the market-based figure."""
    if not value:
        return False
    s = value.strip().lower()
    if s in {"none", "no", "n/a", "na", "nil", "false", "-", "0", "none."}:
        return False
    return not s.startswith(("none", "no ", "no-", "without", "not "))


def _country_for(site_name: str | None, boundary: CompanyBoundary) -> str | None:
    if site_name:
        n = _norm_site(site_name)
        for s in boundary.sites:
            if _same_site(n, _norm_site(s.name)):
                return s.country
    return boundary.sites[0].country if boundary.sites else None


def electricity(items: list[Scope2Electricity], boundary: CompanyBoundary,
                warnings: list[str]) -> tuple[list[EmissionResult], list[EmissionResult]]:
    """Return (location_based_results, market_based_results)."""
    loc: list[EmissionResult] = []
    mkt: list[EmissionResult] = []
    for a in items:
        country = _country_for(a.site, boundary)
        ef, src = F.grid_factor(country)
        label = "Electricity" + (f" · {a.site}" if a.site else "") + (f" · {a.period}" if a.period else "")

        # Grid drawal: explicit grid_kwh wins; else total minus on-site/renewable; else total.
        if a.grid_kwh is not None:
            grid_kwh = a.grid_kwh
            assum = ["grid drawal used (captive solar / open-access excluded)"]
        elif a.total_kwh is not None:
            grid_kwh = a.total_kwh - (a.captive_solar_kwh or 0) - (a.openaccess_renewable_kwh or 0)
            assum = ["grid = total − captive solar − open-access renewable"] if (
                a.captive_solar_kwh or a.openaccess_renewable_kwh) else ["no drawal split provided; full total treated as grid"]
            if a.captive_solar_kwh or a.openaccess_renewable_kwh:
                pass
            else:
                warnings.append(f"{label}: no grid-vs-captive split provided — full consumption treated as grid.")
        else:
            warnings.append(f"{label}: no kWh value — skipped.")
            continue

        loc.append(EmissionResult(
            scope="2", category="Purchased electricity (location-based)", activity_label=label,
            raw_input=f"{grid_kwh:,.0f} kWh grid", co2e_t=round(grid_kwh * ef / 1000.0, 4),
            factor_value=ef, factor_unit="kgCO2e/kWh", factor_source=f"{src} [{country or 'world'}]",
            tier="primary", assumptions=assum + ([a.notes] if a.notes else []),
        ))

        # Market-based (GHG Protocol Scope 2): a contractual instrument (green tariff /
        # GoO / PPA) zeroes the covered portion; any UNCOVERED consumption uses the
        # RESIDUAL MIX — the mix left after tracked green attributes are stripped out
        # and sold to others — NOT the location-based grid average (which would
        # double-count those attributes). The residual mix is higher than location-based.
        if _has_green_instrument(a.green_instrument):
            mkt_kwh, mkt_ef = 0.0, 0.0
            mkt_src = f"{src} [{country or 'world'}]"
            mkt_assum = [f"green instrument '{a.green_instrument}' → contractual zero"]
        else:
            rm_ef, rm_src, matched = F.residual_mix_factor(country)
            if matched:
                mkt_kwh, mkt_ef, mkt_src = grid_kwh, rm_ef, f"{rm_src} [{country}]"
                mkt_assum = [
                    "no contractual instrument → residual-mix factor applied (GHG Protocol "
                    "market-based; residual mix > location-based grid average)"
                ]
            else:
                mkt_kwh, mkt_ef, mkt_src = grid_kwh, ef, f"{src} [{country or 'world'}]"
                mkt_assum = [
                    "no contractual instrument and no residual-mix factor for this country; "
                    "location-based grid factor used as a conservative fallback (understates market-based)"
                ]
                warnings.append(
                    f"{label}: market-based used the location-based grid factor as a fallback "
                    f"(no residual-mix value for '{country or 'unknown'}') — likely an understatement."
                )
        mkt.append(EmissionResult(
            scope="2", category="Purchased electricity (market-based)", activity_label=label,
            raw_input=f"{mkt_kwh:,.0f} kWh charged", co2e_t=round(mkt_kwh * mkt_ef / 1000.0, 4),
            factor_value=mkt_ef, factor_unit="kgCO2e/kWh",
            factor_source=mkt_src, tier="primary", assumptions=mkt_assum,
        ))

    # ── Fallback: a boundary site with floor area / headcount but NO metered
    # electricity → estimate it. Guard hard against double-counting: a metered bill
    # whose `site` label doesn't line up with a boundary site name must NOT also get
    # a floor-area estimate (extraction writes verbose addresses that rarely match). ──
    metered_lines = [a for a in items if (a.grid_kwh is not None or a.total_kwh is not None)]
    named_meters = [n for n in (_norm_site(a.site) for a in metered_lines) if n]
    has_unnamed_meter = any(not _norm_site(a.site) for a in metered_lines)
    site_norms = [_norm_site(s.name) for s in boundary.sites]
    # metered kWh that matches no boundary site by name → can't be attributed
    orphan_meter = any(not any(_same_site(mn, sn) for sn in site_norms) for mn in named_meters)
    single_site = len(boundary.sites) == 1

    for s in boundary.sites:
        sn = _norm_site(s.name)
        # Site already metered: a bill's label matches it, or it's the only site and
        # any meter exists at all (named or unnamed).
        if any(_same_site(mn, sn) for mn in named_meters):
            continue
        if single_site and metered_lines:
            continue
        # No bill matched this site, but metered electricity exists that we couldn't
        # tie to a site — estimating here would double-count it. Skip and flag instead.
        if metered_lines and (orphan_meter or has_unnamed_meter):
            warnings.append(
                f"Electricity - {s.name}: metered electricity is present but its site label "
                f"doesn't match this site — skipped the floor-area estimate to avoid double "
                f"counting; reconcile the site name in review."
            )
            continue
        area = s.floor_area_m2
        basis = f"{area:,.0f} m2 floor area" if area else None
        if not area and s.building_type and boundary.employees_fte:
            per = F.m2_per_fte(s.building_type)
            area = boundary.employees_fte * per
            basis = f"{boundary.employees_fte:g} FTE x {per:g} m2/FTE = {area:,.0f} m2"
        if not area:
            continue
        eui, eui_src = F.eui_electricity(s.building_type, s.country)
        est_kwh = area * eui
        ef, src = F.grid_factor(s.country)
        label = f"Electricity - {s.name} (estimated)"
        note = f"no meter/bill - estimated: {basis} x {eui:g} kWh/m2/yr ({eui_src})"
        loc.append(EmissionResult(
            scope="2", category="Purchased electricity (location-based)", activity_label=label,
            raw_input=f"{est_kwh:,.0f} kWh (est.)", co2e_t=round(est_kwh * ef / 1000.0, 4),
            factor_value=ef, factor_unit="kgCO2e/kWh", factor_source=f"{src} [{s.country or 'world'}]",
            tier="estimated", assumptions=[note],
        ))
        mkt.append(EmissionResult(
            scope="2", category="Purchased electricity (market-based)", activity_label=label,
            raw_input=f"{est_kwh:,.0f} kWh (est.)", co2e_t=round(est_kwh * ef / 1000.0, 4),
            factor_value=ef, factor_unit="kgCO2e/kWh", factor_source=f"{src} [{s.country or 'world'}]",
            tier="estimated", assumptions=["estimated consumption; no contractual instrument"],
        ))
        warnings.append(f"{label}: no bill - electricity estimated from {basis}.")
    return loc, mkt


def thermal(items: list[Scope2Thermal], boundary: CompanyBoundary,
            warnings: list[str]) -> list[EmissionResult]:
    out: list[EmissionResult] = []
    # Use the grid factor as a screening proxy for purchased heat/steam/cooling (kWh basis).
    site0 = boundary.sites[0] if boundary.sites else None
    for a in items:
        country = _country_for(a.site, boundary)
        ef, src = F.grid_factor(country)
        label = f"{a.carrier.title()}" + (f" · {a.site}" if a.site else "")
        if a.energy_kwh is None:
            # Estimated heating district rows are pooled + owned by calc/heating.py.
            if getattr(a, "is_heating", False):
                continue
            # "Don't know" district heat → estimate from floor area × heating EUI.
            area = site0.floor_area_m2 if site0 else None
            if not area:
                continue
            eui, euisrc = F.eui_heating(site0.building_type)
            kwh = area * eui
            share_note = ""
            if a.heating_share_pct is not None:
                kwh *= a.heating_share_pct / 100.0
                share_note = f", {a.heating_share_pct:g}% share"
            out.append(EmissionResult(
                scope="2", category="Purchased heat/steam/cooling",
                activity_label=f"{label} (estimated)",
                raw_input=f"{kwh:,.0f} kWh (est.)", co2e_t=round(kwh * ef / 1000.0, 4),
                factor_value=ef, factor_unit="kgCO2e/kWh",
                factor_source=f"{src} [{country or 'world'}] (proxy); heating EUI {euisrc}",
                tier="estimated",
                assumptions=[f"district heat estimated: {area:,.0f} m2 x {eui:g} kWh/m2/yr{share_note} = {kwh:,.0f} kWh"],
            ))
            continue
        out.append(EmissionResult(
            scope="2", category="Purchased heat/steam/cooling", activity_label=label,
            raw_input=f"{a.energy_kwh:,.0f} kWh", co2e_t=round(a.energy_kwh * ef / 1000.0, 4),
            factor_value=ef, factor_unit="kgCO2e/kWh",
            factor_source=f"{src} [{country or 'world'}] (proxy)", tier="estimated",
            assumptions=["grid factor used as screening proxy for thermal energy"],
        ))
    return out
