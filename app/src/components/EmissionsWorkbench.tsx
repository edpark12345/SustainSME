import { Fragment, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from './Card';
import { Button } from './Button';
import { ExtractionSummary } from './ExtractionSummary';
import { GuidedEntry } from './GuidedEntry';
import { api } from '../lib/apiClient';
import { useAssessment } from '../context/AssessmentContext';
import { ROUTES } from '../routes';
import type { ActivityBundle, EmissionResult, Tier } from '../types';

type Focus = '1' | '2';
type ListKey = keyof Pick<
  ActivityBundle,
  'scope2_electricity' | 'scope2_thermal' | 'scope1_stationary' | 'scope1_mobile' | 'scope1_fugitive'
>;

const FUELS = ['natural_gas', 'lshs', 'heating_oil', 'diesel', 'petrol', 'lpg', 'propane', 'coal', 'other'];

const tierStyle: Record<Tier, string> = {
  primary: 'bg-positive/10 text-positive',
  spend: 'bg-warning/10 text-warning',
  estimated: 'bg-ink-muted/10 text-ink-soft',
};

// Reconstruct the explicit calculation for a result line so validation is easy:
// quantity × factor (÷ 1000 when the factor is per-kg) = tCO₂e.
function fmtCalc(r: EmissionResult): string {
  const t = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  const m = (r.raw_input ?? '').match(/^([\d.,]+)\s*(.*)$/);
  if (!m || r.factor_value == null) return `${r.raw_input ?? '—'} → ${t(r.co2e_t)} tCO₂e`;
  const kgToT = /^kg/i.test(r.factor_unit ?? '');
  return `${m[1]} ${m[2]} × ${t(r.factor_value)} ${r.factor_unit ?? ''}${kgToT ? ' ÷ 1000' : ''} = ${t(r.co2e_t)} tCO₂e`;
}

export function EmissionsWorkbench({ focus }: { focus: Focus }) {
  const navigate = useNavigate();
  const { profile, bundle, setBundle, mergeBundle, calc, setCalc } = useAssessment();
  const fileRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState<'idle' | 'extract' | 'calc'>('idle');
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backendUp, setBackendUp] = useState<boolean | null>(null);
  const [countries, setCountries] = useState<string[]>([]);

  useEffect(() => {
    api.ping().then(setBackendUp);
    api.factors().then((f) => setCountries(f.grid_countries)).catch(() => {});
  }, []);

  // Prefill boundary from the onboarding profile so the SME doesn't re-enter it
  // (reporting year + HQ country), only if not already set/extracted.
  useEffect(() => {
    const b = { ...bundle, boundary: { ...bundle.boundary } };
    let changed = false;
    if (b.boundary.reporting_year == null && profile.reportingYear) {
      b.boundary.reporting_year = Number(profile.reportingYear);
      changed = true;
    }
    if (!b.boundary.sites[0]?.country && profile.country) {
      b.boundary.sites = b.boundary.sites.length
        ? b.boundary.sites.map((s, i) => (i === 0 ? { ...s, country: profile.country } : s))
        : [{ name: 'Site 1', country: profile.country }];
      changed = true;
    }
    if (changed) setBundle(b);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── helpers to edit the bundle immutably ──
  const setList = <K extends ListKey>(key: K, idx: number, patch: Partial<ActivityBundle[K][number]>) =>
    setBundle({
      ...bundle,
      [key]: bundle[key].map((a, i) => (i === idx ? { ...a, ...patch } : a)),
    });
  const removeRow = (key: ListKey, idx: number) =>
    setBundle({ ...bundle, [key]: bundle[key].filter((_, i) => i !== idx) });
  const addRow = (key: ListKey, blank: object) =>
    setBundle({ ...bundle, [key]: [...bundle[key], blank as never] });

  const num = (v: string): number | null => (v.trim() === '' ? null : Number(v));

  const onExtract = async () => {
    if (!files.length) return;
    setBusy('extract'); setError(null);
    try {
      const result = await api.extract(files);
      mergeBundle(result);
      setFiles([]);
      if (fileRef.current) fileRef.current.value = '';
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy('idle');
    }
  };

  const onCalculate = async () => {
    setBusy('calc'); setError(null);
    try {
      setCalc(await api.calculate(bundle));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy('idle');
    }
  };

  const onExport = async () => {
    setExporting(true); setError(null);
    try {
      await api.exportXlsx(bundle);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setExporting(false);
    }
  };

  const Provenance = ({ a }: { a: { source_doc?: string | null; confidence?: number | null; notes?: string | null } }) => (
    <div className="mt-2 space-y-1 text-[11px] text-ink-muted">
      {(a.source_doc || a.confidence != null) && (
        <p>
          {a.source_doc && <span className="rounded bg-surface-subtle px-1.5 py-0.5">{a.source_doc}</span>}
          {a.confidence != null && <span className="ml-2">confidence {(a.confidence * 100).toFixed(0)}%</span>}
        </p>
      )}
      {a.notes && <p className="italic leading-snug">{a.notes}</p>}
    </div>
  );

  const Lbl = ({ children }: { children: React.ReactNode }) => (
    <label className="block text-[11px] font-medium text-ink-muted">{children}</label>
  );

  return (
    <div className="space-y-6">
      {/* Backend status */}
      {backendUp === false && (
        <div className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          Backend not reachable at the API URL. Start it: <code>uvicorn main:app --port 8000</code> in{' '}
          <code>backend/</code>. Upload &amp; calculation need it.
        </div>
      )}

      {/* Plain-language, question-led entry (the simple path for SMEs) */}
      <GuidedEntry focus={focus} />

      {/* Upload */}
      <Card title="Upload source documents" subtitle="Bills, ledgers, refrigerant/asset lists — PDF, Excel, CSV, Word, or a photo/screenshot (JPG, PNG). The model structures them; you review before calculating.">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            ref={fileRef}
            type="file"
            multiple
            accept=".pdf,.xlsx,.xls,.csv,.docx,.png,.jpg,.jpeg"
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            className="text-sm text-ink-soft file:mr-3 file:rounded-lg file:border-0 file:bg-accenture-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-accenture-700 hover:file:bg-accenture-100"
          />
          <Button onClick={onExtract} disabled={!files.length || busy !== 'idle' || backendUp === false}>
            {busy === 'extract' ? 'Extracting…' : `Extract ${files.length || ''} file${files.length === 1 ? '' : 's'}`}
          </Button>
        </div>
        {busy === 'extract' && (
          <p className="mt-2 text-xs text-ink-muted">Reading documents and structuring with the model — scanned bills use vision and take longer.</p>
        )}
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      </Card>

      {/* Formatted read-only summary of what was extracted */}
      <ExtractionSummary bundle={bundle} focus={focus} />

      {/* Boundary */}
      <Card title="Company & boundary" subtitle="Drives the grid factor and scoping. Confirm or correct what was extracted.">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Lbl>Reporting year</Lbl>
            <input
              className="text-input mt-1"
              value={bundle.boundary.reporting_year ?? ''}
              onChange={(e) => setBundle({ ...bundle, boundary: { ...bundle.boundary, reporting_year: num(e.target.value) } })}
            />
          </div>
          <div>
            <Lbl>Primary site country (grid factor)</Lbl>
            <input
              className="text-input mt-1"
              list="grid-country-list"
              placeholder="e.g. Germany"
              value={bundle.boundary.sites[0]?.country ?? ''}
              onChange={(e) => {
                const sites = bundle.boundary.sites.length
                  ? bundle.boundary.sites.map((s, i) => (i === 0 ? { ...s, country: e.target.value } : s))
                  : [{ name: 'Site 1', country: e.target.value }];
                setBundle({ ...bundle, boundary: { ...bundle.boundary, sites } });
              }}
            />
            <datalist id="grid-country-list">
              {countries.map((c) => <option key={c} value={c} />)}
            </datalist>
            <p className="mt-1 text-[11px] text-ink-muted">
              Type any country. Suggestions have a country-specific grid factor; others use a
              world-average factor (flagged as an assumption).
            </p>
          </div>
          <div>
            <Lbl>Employee-housing (“colony”) meter in scope?</Lbl>
            <select
              className="text-input mt-1"
              value={bundle.boundary.sites[0]?.include_employee_housing ? 'yes' : 'no'}
              onChange={(e) => {
                const v = e.target.value === 'yes';
                const sites = bundle.boundary.sites.length
                  ? bundle.boundary.sites.map((s, i) => (i === 0 ? { ...s, include_employee_housing: v } : s))
                  : [{ name: 'Site 1', country: '', include_employee_housing: v }];
                setBundle({ ...bundle, boundary: { ...bundle.boundary, sites } });
              }}
            >
              <option value="no">No — excluded</option>
              <option value="yes">Yes — included</option>
            </select>
          </div>
          <div>
            <Lbl>Floor area (m²) — to estimate energy if no bill</Lbl>
            <input
              className="text-input mt-1"
              value={bundle.boundary.sites[0]?.floor_area_m2 ?? ''}
              onChange={(e) => {
                const v = e.target.value.trim() === '' ? null : Number(e.target.value);
                const sites = bundle.boundary.sites.length
                  ? bundle.boundary.sites.map((s, i) => (i === 0 ? { ...s, floor_area_m2: v } : s))
                  : [{ name: 'Site 1', country: '', floor_area_m2: v }];
                setBundle({ ...bundle, boundary: { ...bundle.boundary, sites } });
              }}
            />
          </div>
          <div>
            <Lbl>Primary building type</Lbl>
            <select
              className="text-input mt-1"
              value={bundle.boundary.sites[0]?.building_type ?? ''}
              onChange={(e) => {
                const v = e.target.value || null;
                const sites = bundle.boundary.sites.length
                  ? bundle.boundary.sites.map((s, i) => (i === 0 ? { ...s, building_type: v } : s))
                  : [{ name: 'Site 1', country: '', building_type: v }];
                setBundle({ ...bundle, boundary: { ...bundle.boundary, sites } });
              }}
            >
              <option value="">Select…</option>
              {['office', 'retail', 'warehouse', 'manufacturing', 'hospitality', 'other'].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
        <p className="mt-3 text-[11px] text-ink-muted">
          No bill or meter reading? Enter floor area + primary building type and we’ll estimate from
          energy-intensity benchmarks — heating fuel (Scope 1) on the Scope 1 page and purchased
          electricity (Scope 2) on the Scope 2 page. Any estimate is flagged{' '}
          <span className="font-semibold">estimated</span>.
        </p>
      </Card>

      {/* Review — Scope 2 (editable / manual entry) */}
      {focus === '2' && (
        <details open={bundle.scope2_electricity.length === 0}>
          <summary className="cursor-pointer select-none text-sm font-semibold text-accenture-700">
            Edit / correct values, or add a row manually
          </summary>
          <div className="mt-3">
        <Card
          title="Scope 2 — purchased electricity"
          subtitle="Enter total electricity, then split out any power that didn't come from the grid (your own solar or a renewable contract) — only grid power is charged the grid factor."
          action={<Button variant="ghost" onClick={() => addRow('scope2_electricity', { captive_solar_kwh: 0, openaccess_renewable_kwh: 0 })}>+ Add</Button>}
        >
          {bundle.scope2_electricity.length === 0 && <p className="text-sm text-ink-muted">No electricity activities yet — upload a bill or add a row.</p>}
          <div className="space-y-4">
            {bundle.scope2_electricity.map((a, i) => (
              <div key={i} className="rounded-lg border border-surface-border p-3">
                <div className="grid gap-3 sm:grid-cols-4">
                  <div><Lbl>Site</Lbl><input className="text-input mt-1" value={a.site ?? ''} onChange={(e) => setList('scope2_electricity', i, { site: e.target.value })} /></div>
                  <div><Lbl>Period</Lbl><input className="text-input mt-1" value={a.period ?? ''} onChange={(e) => setList('scope2_electricity', i, { period: e.target.value })} /></div>
                  <div><Lbl>Total kWh</Lbl><input className="text-input mt-1" value={a.total_kwh ?? ''} onChange={(e) => setList('scope2_electricity', i, { total_kwh: num(e.target.value) })} /></div>
                  <div><Lbl>Grid kWh</Lbl><input className="text-input mt-1" value={a.grid_kwh ?? ''} onChange={(e) => setList('scope2_electricity', i, { grid_kwh: num(e.target.value) })} /></div>
                  <div><Lbl>On-site solar kWh</Lbl><input className="text-input mt-1" value={a.captive_solar_kwh ?? ''} onChange={(e) => setList('scope2_electricity', i, { captive_solar_kwh: num(e.target.value) })} /></div>
                  <div><Lbl>Renewable via contract kWh</Lbl><input className="text-input mt-1" value={a.openaccess_renewable_kwh ?? ''} onChange={(e) => setList('scope2_electricity', i, { openaccess_renewable_kwh: num(e.target.value) })} /></div>
                  <div><Lbl>Supplier / tariff name</Lbl><input className="text-input mt-1" value={a.supplier ?? ''} onChange={(e) => setList('scope2_electricity', i, { supplier: e.target.value })} /></div>
                  <div><Lbl>Renewable certificate (REC/GO/PPA)</Lbl><input className="text-input mt-1" value={a.green_instrument ?? ''} onChange={(e) => setList('scope2_electricity', i, { green_instrument: e.target.value })} /></div>
                </div>
                <p className="mt-2 text-[11px] text-ink-muted">
                  <strong>On-site solar</strong> = power you generate and use yourself.{' '}
                  <strong>Renewable via contract</strong> = grid power you buy under a renewable
                  supply agreement.{' '}
                  <strong>Renewable certificate</strong> = a REC/GO/PPA proving renewable sourcing
                  (drives the market-based figure).{' '}
                  <strong>Tariff</strong> = your plan/supplier name.
                  Renting and billed by the landlord for utilities by floor area? Enter your
                  apportioned share as Total kWh — it's better data than an estimate.
                </p>
                <div className="mt-2 flex items-start justify-between"><Provenance a={a} /><button onClick={() => removeRow('scope2_electricity', i)} className="text-xs text-danger hover:underline">Remove</button></div>
              </div>
            ))}
          </div>
        </Card>
          </div>
        </details>
      )}

      {/* Review — Scope 1 (editable / manual entry) */}
      {focus === '1' && (
        <details open={bundle.scope1_stationary.length === 0 && bundle.scope1_fugitive.length === 0}>
          <summary className="cursor-pointer select-none text-sm font-semibold text-accenture-700">
            Edit / correct values, or add a row manually
          </summary>
          <div className="mt-3 space-y-6">
          <Card title="Scope 1 — stationary combustion" action={<Button variant="ghost" onClick={() => addRow('scope1_stationary', { fuel_type: 'natural_gas' })}>+ Add</Button>}>
            {bundle.scope1_stationary.length === 0 && <p className="text-sm text-ink-muted">No stationary fuel activities yet.</p>}
            <div className="space-y-3">
              {bundle.scope1_stationary.map((a, i) => (
                <div key={i} className="rounded-lg border border-surface-border p-3">
                  <div className="grid gap-3 sm:grid-cols-4">
                    <div><Lbl>Site</Lbl><input className="text-input mt-1" value={a.site ?? ''} onChange={(e) => setList('scope1_stationary', i, { site: e.target.value })} /></div>
                    <div><Lbl>Fuel</Lbl><select className="text-input mt-1" value={a.fuel_type} onChange={(e) => setList('scope1_stationary', i, { fuel_type: e.target.value as never })}>{FUELS.map((f) => <option key={f}>{f}</option>)}</select></div>
                    <div><Lbl>Quantity</Lbl><input className="text-input mt-1" value={a.quantity ?? ''} onChange={(e) => setList('scope1_stationary', i, { quantity: num(e.target.value) })} /></div>
                    <div><Lbl>Unit</Lbl><input className="text-input mt-1" value={a.unit ?? ''} onChange={(e) => setList('scope1_stationary', i, { unit: e.target.value })} /></div>
                  </div>
                  <div className="mt-2 flex items-start justify-between"><Provenance a={a} /><button onClick={() => removeRow('scope1_stationary', i)} className="text-xs text-danger hover:underline">Remove</button></div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Scope 1 — fugitive (refrigerants)" subtitle="Refill mass is best. With only an asset inventory, charge is estimated from cooling tonnage (flagged 'estimated')." action={<Button variant="ghost" onClick={() => addRow('scope1_fugitive', {})}>+ Add</Button>}>
            {bundle.scope1_fugitive.length === 0 && <p className="text-sm text-ink-muted">No refrigerant activities yet.</p>}
            <div className="space-y-3">
              {bundle.scope1_fugitive.map((a, i) => (
                <div key={i} className="rounded-lg border border-surface-border p-3">
                  <div className="grid gap-3 sm:grid-cols-5">
                    <div><Lbl>Equipment</Lbl><input className="text-input mt-1" value={a.equipment ?? ''} onChange={(e) => setList('scope1_fugitive', i, { equipment: e.target.value })} /></div>
                    <div><Lbl>Refrigerant</Lbl><input className="text-input mt-1" value={a.refrigerant_type ?? ''} onChange={(e) => setList('scope1_fugitive', i, { refrigerant_type: e.target.value })} /></div>
                    <div><Lbl>Refill kg</Lbl><input className="text-input mt-1" value={a.refill_kg ?? ''} onChange={(e) => setList('scope1_fugitive', i, { refill_kg: num(e.target.value) })} /></div>
                    <div><Lbl>Charge kg</Lbl><input className="text-input mt-1" value={a.charge_kg ?? ''} onChange={(e) => setList('scope1_fugitive', i, { charge_kg: num(e.target.value) })} /></div>
                    <div><Lbl>Tonnage TR</Lbl><input className="text-input mt-1" value={a.tonnage_tr ?? ''} onChange={(e) => setList('scope1_fugitive', i, { tonnage_tr: num(e.target.value) })} /></div>
                  </div>
                  <div className="mt-2 flex items-start justify-between"><Provenance a={a} /><button onClick={() => removeRow('scope1_fugitive', i)} className="text-xs text-danger hover:underline">Remove</button></div>
                </div>
              ))}
            </div>
          </Card>
          </div>
        </details>
      )}

      {/* Calculate + results */}
      <Card title="Calculate emissions" subtitle="Deterministic calculation from the reviewed data — a transparent, traceable factor shown per line.">
        <Button onClick={onCalculate} disabled={busy !== 'idle' || backendUp === false}>
          {busy === 'calc' ? 'Calculating…' : 'Calculate Scope 1 & 2'}
        </Button>

        {calc && (
          <div className="mt-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <Kpi label="Scope 1" value={calc.scope1_total_t} />
              <Kpi label="Scope 2 (location-based)" value={calc.scope2_location_t} />
              <Kpi label="Scope 2 (market-based)" value={calc.scope2_market_t} />
            </div>

            <div className="mt-4 overflow-hidden rounded-lg border border-surface-border">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-subtle text-ink-soft">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Scope</th>
                    <th className="px-3 py-2 font-semibold">Activity</th>
                    <th className="px-3 py-2 font-semibold">Input</th>
                    <th className="px-3 py-2 font-semibold text-right">tCO₂e</th>
                    <th className="px-3 py-2 font-semibold">Tier</th>
                    <th className="px-3 py-2 font-semibold">Factor source</th>
                  </tr>
                </thead>
                <tbody>
                  {calc.results
                    .filter((r) => (focus === '1' ? r.scope === '1' : r.scope === '2'))
                    .map((r, i) => (
                      <Fragment key={i}>
                        <tr className="border-t border-surface-border">
                          <td className="px-3 pt-2 align-top">{r.scope}</td>
                          <td className="px-3 pt-2 align-top text-ink">{r.activity_label}</td>
                          <td className="px-3 pt-2 align-top text-ink-soft">{r.raw_input}</td>
                          <td className="px-3 pt-2 text-right align-top font-medium">{r.co2e_t.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                          <td className="px-3 pt-2 align-top"><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${tierStyle[r.tier]}`}>{r.tier}</span></td>
                          <td className="px-3 pt-2 align-top text-ink-muted">{r.factor_source}</td>
                        </tr>
                        <tr>
                          <td colSpan={6} className="px-3 pb-2 pl-6 text-[11px] leading-relaxed text-ink-muted">
                            <span className="font-mono text-ink-soft">{fmtCalc(r)}</span>
                            {r.assumptions.length > 0 && (
                              <span className="italic"> · assumes: {r.assumptions.join('; ')}</span>
                            )}
                          </td>
                        </tr>
                      </Fragment>
                    ))}
                </tbody>
              </table>
            </div>

            {calc.warnings.length > 0 && (
              <div className="mt-3 rounded-lg border border-warning/30 bg-warning/5 p-3 text-xs text-ink-soft">
                <p className="mb-1 font-semibold text-warning">Warnings</p>
                <ul className="list-disc space-y-0.5 pl-4">{calc.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-3">
              <Button variant="outline" onClick={onExport} disabled={exporting}>
                {exporting ? 'Preparing…' : '⬇ Download Excel (all calculations)'}
              </Button>
              <Button variant="outline" onClick={() => navigate(ROUTES.results)}>View full results dashboard →</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-medium text-ink-muted">{label}</p>
      <p className="mt-1 text-xl font-bold text-ink">{value.toLocaleString()} <span className="text-sm font-medium text-ink-muted">tCO₂e</span></p>
    </div>
  );
}
