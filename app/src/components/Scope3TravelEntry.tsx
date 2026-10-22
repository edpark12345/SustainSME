import { Card } from './Card';
import { Button } from './Button';
import { useAssessment } from '../context/AssessmentContext';
import type { Scope3Travel } from '../types';

// Modes offered in the travel dropdown (keys must match the backend factor table).
const TRAVEL_MODES: { key: string; label: string }[] = [
  { key: 'air_domestic', label: 'Air — domestic (within your own country)' },
  { key: 'air_short_haul', label: 'Air — short-haul (international, up to ~3,700 km)' },
  { key: 'air_long_haul', label: 'Air — long-haul (over ~3,700 km)' },
  { key: 'air_international', label: 'Air — international average (mix of short/long-haul)' },
  { key: 'rail_national', label: 'Rail — national' },
  { key: 'rail_international', label: 'Rail — international' },
  { key: 'tram_metro', label: 'Tram / metro' },
  { key: 'bus', label: 'Bus' },
  { key: 'coach', label: 'Coach' },
  { key: 'taxi', label: 'Taxi' },
  { key: 'car_average', label: 'Car — average' },
  { key: 'hotel', label: 'Hotel stay (nights) — optional under the GHG Protocol' },
];

/**
 * Scope 3 Cat 6 (business travel) + Cat 7 (employee commuting).
 * Cat 3 (energy WTT + grid T&D) needs no input here — it is auto-derived from
 * the Scope 2 electricity already entered.
 */
export function Scope3TravelEntry() {
  const { bundle, setScope3Travel, setScope3Commute, profile } = useAssessment();
  const travel = bundle.scope3_travel;
  const commute = bundle.scope3_commute[0] ?? {};
  const commuteOn = bundle.scope3_commute.length > 0;
  const num = (v: string): number | null => (v.trim() === '' ? null : Number(v));

  const addTravel = () =>
    setScope3Travel([...travel, { mode: 'air_short_haul', distance_km: null }]);
  const setTravel = (i: number, patch: Partial<Scope3Travel>) =>
    setScope3Travel(travel.map((t, j) => (j === i ? { ...t, ...patch } : t)));
  const removeTravel = (i: number) => setScope3Travel(travel.filter((_, j) => j !== i));

  const country = bundle.boundary.sites[0]?.country || profile.country || 'DE';

  return (
    <>
      <Card
        title="Cat 6 · Business travel"
        subtitle="Flights, rail, road and hotel nights for work trips (distance-based)."
        className="mt-6"
        action={<Button variant="ghost" onClick={addTravel}>+ Add trip type</Button>}
      >
        {travel.length === 0 && (
          <p className="text-sm text-ink-muted">
            Nothing added. Add a row per travel mode (e.g. short-haul flights, rail) with the total
            passenger-km for the year.
          </p>
        )}
        <div className="space-y-3">
          {travel.map((t, i) => {
            const isHotel = t.mode === 'hotel';
            return (
              <div key={i} className="grid gap-3 sm:grid-cols-[minmax(0,1.6fr)_1fr_1fr_auto] sm:items-end">
                <div>
                  <label className="block text-[11px] font-medium text-ink-muted">Mode</label>
                  <select className="text-input mt-1" value={t.mode} onChange={(e) => setTravel(i, { mode: e.target.value })}>
                    {TRAVEL_MODES.map((m) => (
                      <option key={m.key} value={m.key}>{m.label}</option>
                    ))}
                  </select>
                </div>
                {isHotel ? (
                  <>
                    <div>
                      <label className="block text-[11px] font-medium text-ink-muted">Room-nights / year</label>
                      <input className="text-input mt-1" inputMode="numeric" value={t.nights ?? ''} onChange={(e) => setTravel(i, { nights: num(e.target.value) })} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-ink-muted">Country</label>
                      <input className="text-input mt-1" value={t.country ?? country} onChange={(e) => setTravel(i, { country: e.target.value })} />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-[11px] font-medium text-ink-muted">Passenger-km / year</label>
                      <input className="text-input mt-1" inputMode="numeric" value={t.distance_km ?? ''} onChange={(e) => setTravel(i, { distance_km: num(e.target.value) })} />
                    </div>
                    <div />
                  </>
                )}
                <button onClick={() => removeTravel(i)} className="pb-2 text-xs text-danger hover:underline">Remove</button>
              </div>
            );
          })}
        </div>
      </Card>

      <Card
        title="Cat 7 · Employee commuting"
        subtitle="Estimated from headcount × average commute, unless you have survey data."
        className="mt-6"
      >
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={commuteOn}
            className="accent-accenture-600"
            onChange={(e) =>
              setScope3Commute(
                e.target.checked
                  ? [{ mode: 'car_average', employees_fte: Number(profile.employees) || null }]
                  : [],
              )
            }
          />
          Include commuting (estimate)
        </label>
        {commuteOn && (
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-[11px] font-medium text-ink-muted">Employees (FTE)</label>
              <input
                className="text-input mt-1"
                inputMode="numeric"
                value={commute.employees_fte ?? ''}
                onChange={(e) => setScope3Commute([{ ...commute, employees_fte: num(e.target.value) }])}
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-ink-muted">Avg round-trip km/day</label>
              <input
                className="text-input mt-1"
                inputMode="numeric"
                placeholder="22 (default)"
                value={commute.avg_round_trip_km_per_day ?? ''}
                onChange={(e) => setScope3Commute([{ ...commute, avg_round_trip_km_per_day: num(e.target.value) }])}
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-ink-muted">Main mode</label>
              <select
                className="text-input mt-1"
                value={commute.mode ?? 'car_average'}
                onChange={(e) => setScope3Commute([{ ...commute, mode: e.target.value }])}
              >
                {TRAVEL_MODES.filter((m) => m.key !== 'hotel').map((m) => (
                  <option key={m.key} value={m.key}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </Card>

      <p className="mt-3 text-[11px] text-ink-muted">
        Cat 3 (fuel &amp; energy — upstream and grid losses) is calculated automatically from your
        Scope 2 electricity; no entry needed here.
      </p>
    </>
  );
}
