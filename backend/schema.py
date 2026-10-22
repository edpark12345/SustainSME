#!/usr/bin/env python3
"""
schema.py — canonical activity & result schema for SustainSME Scope 1 & 2.

One source of truth, shared by:
  - the extraction step (its JSON-schema is what the `claude` CLI must return),
  - the deterministic calculators,
  - the React app (mirrored in app/src/types.ts).

Designed to extend to Scope 3 later by adding new activity models without
changing the envelope. Every activity carries provenance (`source_doc`,
`confidence`, `notes`) so the UI can show a reviewable, auditable table.
"""
from __future__ import annotations

from typing import Literal, Optional
from pydantic import BaseModel, Field

Tier = Literal["primary", "spend", "estimated"]


class Provenance(BaseModel):
    source_doc: Optional[str] = Field(None, description="File the value came from")
    confidence: Optional[float] = Field(None, ge=0, le=1, description="0–1 model confidence")
    notes: Optional[str] = Field(None, description="Assumptions / caveats / what was unclear")


# ── Company & boundary ──────────────────────────────────────────────────────
class Site(BaseModel):
    name: str
    country: str = Field(..., description="ISO country name, drives the grid factor")
    region: Optional[str] = None
    tenure: Optional[Literal["owned", "leased"]] = None
    include_employee_housing: Optional[bool] = Field(
        None, description="Whether a 'colony'/employee-housing meter is in the operational boundary"
    )
    floor_area_m2: Optional[float] = Field(
        None, description="Floor area — used to estimate Scope 2 electricity when no meter/bill exists"
    )
    building_type: Optional[str] = Field(
        None, description="office / retail / warehouse / manufacturing / hospitality / other — drives EUI benchmark"
    )


class CompanyBoundary(BaseModel):
    reporting_year: Optional[int] = None
    basis: Optional[Literal["calendar", "fiscal"]] = None
    sector: Optional[str] = Field(None, description="NACE/ISIC code or label")
    revenue: Optional[float] = None
    revenue_currency: Optional[str] = None
    employees_fte: Optional[float] = None
    sites: list[Site] = []


# ── Scope 2 — purchased energy ──────────────────────────────────────────────
class Scope2Electricity(Provenance):
    site: Optional[str] = None
    period: Optional[str] = Field(None, description="e.g. '2023-08' or '01/08/2023–01/09/2023'")
    total_kwh: Optional[float] = None
    grid_kwh: Optional[float] = Field(None, description="Grid drawal only (grid ≠ total)")
    captive_solar_kwh: Optional[float] = 0.0
    openaccess_renewable_kwh: Optional[float] = 0.0
    supplier: Optional[str] = None
    tariff: Optional[str] = None
    green_instrument: Optional[str] = Field(None, description="green tariff / REC / PPA, if any")
    demand_kw: Optional[float] = None
    apparent_kva: Optional[float] = None


class Scope2Thermal(Provenance):
    site: Optional[str] = None
    period: Optional[str] = None
    carrier: Literal["heat", "steam", "cooling"] = "heat"
    energy_kwh: Optional[float] = None
    is_heating: Optional[bool] = Field(
        None, description="True if this district heat/steam is used for site heating — pooled with "
        "Scope 1 heating fuels against one floor-area benchmark.",
    )
    heating_share_pct: Optional[float] = Field(
        None, ge=0, le=100,
        description="For a multi-fuel heating ESTIMATE only: this carrier's % share of the REMAINING "
        "heating load after known-amount fuels are subtracted. Ignored when energy_kwh is given.",
    )


# ── Scope 1 — direct ────────────────────────────────────────────────────────
FuelType = Literal[
    "natural_gas", "lshs", "heating_oil", "diesel", "petrol", "lpg", "propane", "coal", "other"
]


class Scope1Stationary(Provenance):
    site: Optional[str] = None
    period: Optional[str] = None
    fuel_type: FuelType = "natural_gas"
    quantity: Optional[float] = None
    unit: Optional[str] = Field(None, description="SCM / m3 / litre / kg / tonne / kWh")
    is_heating: Optional[bool] = Field(
        None, description="True if this fuel is used for site heating — lets the engine pool all "
        "heating fuels against one floor-area benchmark (measured anchors the total; estimates fill "
        "the remainder).",
    )
    heating_share_pct: Optional[float] = Field(
        None, ge=0, le=100,
        description="For a multi-fuel heating ESTIMATE only: this fuel's % share of the REMAINING "
        "heating load (after fuels with known amounts are subtracted). Splits the leftover across the "
        "estimated fuels. Ignored when an actual quantity is given.",
    )


class Scope1Mobile(Provenance):
    site: Optional[str] = None
    period: Optional[str] = None
    vehicle_or_fleet: Optional[str] = None
    fuel_type: FuelType = "diesel"
    quantity: Optional[float] = Field(None, description="litres, or spend amount, or km")
    unit: Optional[str] = Field(None, description="litre / currency / km")
    distance_km: Optional[float] = None
    vehicle_count: Optional[int] = Field(
        None, description="Number of vehicles — to estimate fuel when litres are unknown"
    )


class Scope1Fugitive(Provenance):
    site: Optional[str] = None
    period: Optional[str] = None
    equipment: Optional[str] = None
    refrigerant_type: Optional[str] = Field(None, description="e.g. R22, R410A, R32, R134a")
    refill_kg: Optional[float] = Field(None, description="Best tier: actual top-up mass")
    charge_kg: Optional[float] = Field(None, description="Installed charge, if known")
    tonnage_tr: Optional[float] = Field(None, description="Cooling capacity (TR) to estimate charge")


# ── Scope 3 — value chain (spend-based first slice) ─────────────────────────
class Scope3Spend(Provenance):
    """Spend-based (EEIO) Scope 3 line: money spent in a category × EEIO factor.
    Covers the spend-core categories 1 (purchased goods & services), 2 (capital
    goods), 4 (upstream transport) and 9 (downstream transport)."""
    category: int = Field(..., description="GHG Protocol Scope 3 category number (1, 2, 4 or 9)")
    factor_key: str = Field(..., description="Key into scope3_spend_factors.json (spend bucket)")
    amount: Optional[float] = Field(None, description="Amount spent in the reporting year")
    currency: Optional[str] = Field(None, description="ISO currency of `amount` (e.g. EUR, USD)")


class Scope3Waste(Provenance):
    """Scope 3 Cat 5 waste (average-data method): tonnes × Σ(treatment mix × EF).
    Primary when tonnes are given; estimated from headcount × per-FTE benchmark
    otherwise. Treatment mix defaults to the site country's What a Waste split
    unless the SME provides one."""
    tonnes: Optional[float] = Field(None, description="Total waste mass (tonnes/yr); primary tier")
    country: Optional[str] = Field(None, description="Site country code for the treatment mix")
    building_type: Optional[str] = Field(None, description="For the per-FTE generation benchmark")
    employees_fte: Optional[float] = Field(None, description="Headcount to estimate tonnes if unknown")
    treatment_mix: Optional[dict] = Field(
        None, description="Optional override: {landfill, incineration, recycling, composting} shares"
    )


class Scope3Travel(Provenance):
    """Scope 3 Cat 6 business travel (distance-based). `mode` keys into the travel
    factor table; distance is passenger-km. For hotels, set mode='hotel' with
    `nights` and `country`."""
    mode: str = Field(..., description="e.g. air_short_haul, rail_national, car_average, hotel")
    distance_km: Optional[float] = Field(None, description="Passenger-km travelled")
    nights: Optional[float] = Field(None, description="Room-nights (when mode='hotel')")
    country: Optional[str] = Field(None, description="Country for the hotel factor")


class Scope3Commute(Provenance):
    """Scope 3 Cat 7 employee commuting (average-data). Distance is derived from
    headcount × round-trip km/day × working days unless `distance_km` is given."""
    mode: Optional[str] = Field(None, description="Travel mode key (default car_average)")
    employees_fte: Optional[float] = None
    avg_round_trip_km_per_day: Optional[float] = None
    working_days: Optional[int] = None
    distance_km: Optional[float] = Field(None, description="Explicit total passenger-km (overrides estimate)")


# ── Bundles & results ───────────────────────────────────────────────────────
class ActivityBundle(BaseModel):
    boundary: CompanyBoundary = CompanyBoundary()
    scope2_electricity: list[Scope2Electricity] = []
    scope2_thermal: list[Scope2Thermal] = []
    scope1_stationary: list[Scope1Stationary] = []
    scope1_mobile: list[Scope1Mobile] = []
    scope1_fugitive: list[Scope1Fugitive] = []
    scope3_spend: list[Scope3Spend] = []
    scope3_waste: list[Scope3Waste] = []
    scope3_travel: list[Scope3Travel] = []
    scope3_commute: list[Scope3Commute] = []


class EmissionResult(BaseModel):
    scope: Literal["1", "2", "3"]
    category: str
    activity_label: str
    raw_input: str
    co2e_t: float
    factor_value: Optional[float] = None
    factor_unit: Optional[str] = None
    factor_source: Optional[str] = None
    tier: Tier = "primary"
    assumptions: list[str] = []


class CalculationResponse(BaseModel):
    results: list[EmissionResult] = []
    scope1_total_t: float = 0.0
    scope2_location_t: float = 0.0
    scope2_market_t: float = 0.0
    scope3_total_t: float = 0.0
    warnings: list[str] = []


def extraction_json_schema() -> dict:
    """JSON-schema for the `claude` CLI `--json-schema` flag (the bundle shape)."""
    return ActivityBundle.model_json_schema()
