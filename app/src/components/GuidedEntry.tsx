import { useState } from 'react';
import { Card } from './Card';
import { useAssessment } from '../context/AssessmentContext';
import type { Scope1Mobile, Scope1Stationary, Scope2Electricity, Scope2Thermal, Site } from '../types';

/**
 * Plain-language, question-led entry for Scope 1 & 2 — so an SME answers what it
 * knows ("Do you have an electricity bill?", "Did you heat your site?") instead
 * of filling technical fields. Each answer writes into the shared bundle; the
 * deterministic engine then picks the tier: value → primary, "don't know" +
 * floor area → estimated, "none" → zero. Rows it owns are tagged via `notes`.
 */
const TAG_E = 'guided-electricity';
const TAG_H = 'guided-heating';
const TAG_V = 'guided-vehicles';
const BUILDING_TYPES = ['office', 'retail', 'warehouse', 'manufacturing', 'hospitality', 'other'];

// Heating carriers a site can use — multiple may apply at once.
type HeatCarrier = 'gas' | 'oil' | 'lpg' | 'district';
const HEAT_META: Record<HeatCarrier, { label: string; unit: string; fuel?: string; unitKey?: string }> = {
  gas: { label: 'Natural gas', unit: 'm³', fuel: 'natural_gas', unitKey: 'm3' },
  oil: { label: 'Heating oil (e.g. kerosene / gas oil / red diesel)', unit: 'litres', fuel: 'heating_oil', unitKey: 'litre' },
  lpg: { label: 'LPG', unit: 'kg', fuel: 'lpg', unitKey: 'kg' },
  district: { label: 'District heating', unit: 'kWh' }, // Scope 2 thermal
};
const HEAT_CARRIERS = ['gas', 'oil', 'lpg', 'district'] as const;
type HRow = { on: boolean; know: 'amount' | 'estimate' | ''; amount: string; share: string };
const emptyHRow = (): HRow => ({ on: false, know: '', amount: '', share: '' });
const emptyHeat = (): Record<HeatCarrier, HRow> => ({ gas: emptyHRow(), oil: emptyHRow(), lpg: emptyHRow(), district: emptyHRow() });

function Opt({ name, checked, onChange, children }: { name: string; checked: boolean; onChange: () => void; children: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 py-1 text-sm text-ink">
      <input type="radio" name={name} checked={checked} onChange={onChange} className="accent-accenture" />
      {children}
    </label>
  );
}

function Chk({ checked, onChange, disabled, children }: { checked: boolean; onChange: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <label className={`flex items-center gap-2 py-1 text-sm ${disabled ? 'cursor-not-allowed text-ink-muted' : 'cursor-pointer text-ink'}`}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={onChange} className="accent-accenture" />
      {children}
    </label>
  );
}

export function GuidedEntry({ focus }: { focus: '1' | '2' }) {
  const { bundle, setBundle } = useAssessment();
  const site0 = bundle.boundary.sites[0];

  const setSite = (patch: Partial<Site>) => {
    const sites = bundle.boundary.sites.length
      ? bundle.boundary.sites.map((s, i) => (i === 0 ? { ...s, ...patch } : s))
      : [{ name: 'Site 1', country: '', ...patch }];
    setBundle({ ...bundle, boundary: { ...bundle.boundary, sites } });
  };

  const Lbl = ({ children }: { children: React.ReactNode }) => (
    <label className="block text-[11px] font-medium text-ink-muted">{children}</label>
  );

  const areaInputs = (
    <div className="mt-2 grid gap-3 sm:grid-cols-2">
      <div>
        <Lbl>Floor area (m²)</Lbl>
        <input
          className="text-input mt-1"
          value={site0?.floor_area_m2 ?? ''}
          onChange={(e) => setSite({ floor_area_m2: e.target.value.trim() === '' ? null : Number(e.target.value) })}
        />
      </div>
      <div>
        <Lbl>Primary building type</Lbl>
        <select className="text-input mt-1" value={site0?.building_type ?? ''} onChange={(e) => setSite({ building_type: e.target.value || null })}>
          <option value="">Select…</option>
          {BUILDING_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
    </div>
  );

  // ── Electricity (Scope 2) ──
  const [eMode, setEMode] = useState<'bill' | 'estimate' | 'none' | ''>('');
  const [eKwh, setEKwh] = useState('');
  const writeElec = (rows: Scope2Electricity[]) => {
    const kept = bundle.scope2_electricity.filter((r) => r.notes !== TAG_E);
    setBundle({ ...bundle, scope2_electricity: [...kept, ...rows] });
  };
  const chooseE = (mode: 'bill' | 'estimate' | 'none') => {
    setEMode(mode);
    if (mode === 'bill') writeElec([{ site: site0?.name, grid_kwh: eKwh ? Number(eKwh) : null, notes: TAG_E }]);
    else if (mode === 'estimate') writeElec([]);
    else writeElec([{ site: site0?.name, grid_kwh: 0, notes: TAG_E }]);
  };

  // ── Heating — multi-select (a site can use several fuels at once) ──
  // Combustion fuels (gas/oil/lpg) → Scope 1 stationary; district heat → Scope 2 thermal;
  // electricity → already in the electricity number; "none" → zero. Amount known → primary;
  // "estimate" → floor-area×EUI. With 2+ estimated fuels, a % split conserves the heating total.
  const [heat, setHeat] = useState<Record<HeatCarrier, HRow>>(emptyHeat);
  const [heatElec, setHeatElec] = useState(false);
  const [heatNone, setHeatNone] = useState(false);

  const writeHeat = (stationary: Scope1Stationary[], thermal: Scope2Thermal[]) => {
    const keptS = bundle.scope1_stationary.filter((r) => r.notes !== TAG_H);
    const keptT = bundle.scope2_thermal.filter((r) => r.notes !== TAG_H);
    setBundle({ ...bundle, scope1_stationary: [...keptS, ...stationary], scope2_thermal: [...keptT, ...thermal] });
  };

  const rebuildHeat = (h: Record<HeatCarrier, HRow>, none: boolean) => {
    if (none) return writeHeat([], []);
    const estCarriers = HEAT_CARRIERS.filter((c) => h[c].on && h[c].know === 'estimate');
    const multiEst = estCarriers.length > 1;
    const stationary: Scope1Stationary[] = [];
    const thermal: Scope2Thermal[] = [];
    HEAT_CARRIERS.forEach((c) => {
      const r = h[c];
      if (!r.on || r.know === '') return; // incomplete — don't write a partial row
      const isAmount = r.know === 'amount';
      if (isAmount && !r.amount) return; // amount chosen but not typed → skip (avoid null→estimate)
      const qty = isAmount ? Number(r.amount) : null;
      const share = !isAmount && multiEst
        ? (r.share ? Number(r.share) : Math.round((100 / estCarriers.length) * 10) / 10)
        : null;
      if (c === 'district') {
        thermal.push({ site: site0?.name, carrier: 'heat', energy_kwh: qty, is_heating: true, heating_share_pct: share, notes: TAG_H });
      } else {
        stationary.push({
          site: site0?.name, fuel_type: HEAT_META[c].fuel! as Scope1Stationary['fuel_type'],
          quantity: qty, unit: HEAT_META[c].unitKey, is_heating: true, heating_share_pct: share, notes: TAG_H,
        });
      }
    });
    writeHeat(stationary, thermal);
  };

  const updateHeat = (c: HeatCarrier, patch: Partial<HRow>) => {
    const next = { ...heat, [c]: { ...heat[c], ...patch } };
    setHeat(next);
    rebuildHeat(next, heatNone);
  };
  const toggleHeat = (c: HeatCarrier) => {
    if (heat[c].on) updateHeat(c, emptyHRow()); // turning off → clear this carrier
    else updateHeat(c, { on: true });
  };
  const setNoHeating = (v: boolean) => {
    setHeatNone(v);
    if (v) { setHeat(emptyHeat()); setHeatElec(false); }
    rebuildHeat(emptyHeat(), v);
  };

  // derived (for the render)
  const heatEst = HEAT_CARRIERS.filter((c) => heat[c].on && heat[c].know === 'estimate');
  const heatMultiEst = heatEst.length > 1;
  const heatAnyEst = heatEst.length > 0;
  const shareSum = heatEst.reduce((s, c) => s + (heat[c].share ? Number(heat[c].share) : 0), 0);

  // ── Vehicles (Scope 1 mobile combustion) ──
  const [vMode, setVMode] = useState<'yes' | 'no' | ''>('');
  const [vFuel, setVFuel] = useState<'diesel' | 'petrol' | 'electric'>('diesel');
  const [vKnow, setVKnow] = useState<'amount' | 'estimate' | ''>('');
  const [vLitres, setVLitres] = useState('');
  const [vCount, setVCount] = useState('');
  const writeVehicles = (rows: Scope1Mobile[]) => {
    const kept = bundle.scope1_mobile.filter((r) => r.notes !== TAG_V);
    setBundle({ ...bundle, scope1_mobile: [...kept, ...rows] });
  };
  const rebuildVehicles = (mode: typeof vMode, fuel: typeof vFuel, know: typeof vKnow, litres: string, count: string) => {
    if (mode !== 'yes') return writeVehicles([]);
    // Fully-electric vehicles have no Scope 1 tailpipe emissions — the charging
    // energy is counted under electricity (Scope 2), so nothing is written here.
    if (fuel === 'electric') return writeVehicles([]);
    const qty = know === 'amount' ? (litres ? Number(litres) : null) : null;
    const cnt = know === 'estimate' ? (count ? Number(count) : null) : null;
    writeVehicles([{ site: site0?.name, fuel_type: fuel, quantity: qty, unit: 'litre', vehicle_count: cnt, notes: TAG_V }]);
  };

  if (focus === '2') {
    return (
      <Card title="Electricity — a few quick questions" subtitle="Answer what you know; we'll pick the right method and flag any estimates.">
        <p className="font-medium text-ink">Do you have an electricity bill for this period?</p>
        <div className="mt-1">
          <Opt name="emode" checked={eMode === 'bill'} onChange={() => chooseE('bill')}>Yes — I have the kWh</Opt>
          <Opt name="emode" checked={eMode === 'estimate'} onChange={() => chooseE('estimate')}>No, but I know our floor area</Opt>
          <Opt name="emode" checked={eMode === 'none'} onChange={() => chooseE('none')}>No premises / no purchased electricity</Opt>
        </div>
        {eMode === 'bill' && (
          <div className="mt-3 max-w-xs">
            <Lbl>Electricity used (kWh)</Lbl>
            <input className="text-input mt-1" value={eKwh} onChange={(e) => { setEKwh(e.target.value); writeElec([{ site: site0?.name, grid_kwh: e.target.value ? Number(e.target.value) : null, notes: TAG_E }]); }} />
            <p className="mt-2 text-[11px] text-ink-muted">
              Read the kWh off your bill — or just upload the bill below and we'll read it for you
              (no need to enter it twice). If both are given, your uploaded bill takes precedence.
            </p>
          </div>
        )}
        {eMode === 'estimate' && (
          <div className="mt-3">
            {areaInputs}
            <p className="mt-2 text-[11px] text-ink-muted">We'll estimate from energy-intensity benchmarks — flagged <span className="font-semibold">estimated</span>.</p>
          </div>
        )}
        {eMode === 'none' && <p className="mt-3 text-sm text-ink-soft">Recorded as zero for electricity.</p>}
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card title="Heating — a few quick questions" subtitle="Select every fuel used to heat the site; we'll pick the right method per fuel and flag any estimates.">
      <p className="font-medium text-ink">How did your company heat its site? <span className="font-normal text-ink-muted">(select all that apply)</span></p>
      <div className="mt-1">
        {HEAT_CARRIERS.map((c) => (
          <div key={c}>
            <Chk checked={heat[c].on} disabled={heatNone} onChange={() => toggleHeat(c)}>{HEAT_META[c].label}</Chk>
            {heat[c].on && !heatNone && (
              <div className="mb-2 ml-6">
                <Opt name={`hknow-${c}`} checked={heat[c].know === 'amount'} onChange={() => updateHeat(c, { know: 'amount' })}>I have the amount</Opt>
                <Opt name={`hknow-${c}`} checked={heat[c].know === 'estimate'} onChange={() => updateHeat(c, { know: 'estimate' })}>Estimate it for me</Opt>
                {heat[c].know === 'amount' && (
                  <div className="mt-1 max-w-xs">
                    <Lbl>Amount ({HEAT_META[c].unit})</Lbl>
                    <input className="text-input mt-1" value={heat[c].amount} onChange={(e) => updateHeat(c, { amount: e.target.value })} />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        <Chk checked={heatElec} disabled={heatNone} onChange={() => setHeatElec(!heatElec)}>Electricity</Chk>
        {heatElec && !heatNone && <p className="mb-2 ml-6 text-[11px] text-ink-muted">Electric heating is already counted in your electricity use — nothing added here.</p>}
        <Chk checked={heatNone} onChange={() => setNoHeating(!heatNone)}>No heating at site</Chk>
      </div>

      {heatAnyEst && !heatNone && (
        <div className="mt-3">
          {areaInputs}
          <p className="mt-2 text-[11px] text-ink-muted">Estimates use floor area × heating benchmark — flagged <span className="font-semibold">estimated</span>.</p>
        </div>
      )}

      {heatMultiEst && !heatNone && (
        <div className="mt-3 rounded-lg border border-surface-border p-3">
          <p className="text-sm font-medium text-ink">Of the heating we estimate, what share did each fuel cover?</p>
          <p className="text-[11px] text-ink-muted">
            Any fuels you gave amounts for are counted in full first; these shares split only the
            remaining heating between the estimated fuels. Leave blank for an equal split.
          </p>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {heatEst.map((c) => (
              <div key={c} className="max-w-xs">
                <Lbl>{HEAT_META[c].label} — % of heating</Lbl>
                <input className="text-input mt-1" placeholder={`${Math.round(100 / heatEst.length)}`} value={heat[c].share} onChange={(e) => updateHeat(c, { share: e.target.value })} />
              </div>
            ))}
          </div>
          {shareSum > 0 && Math.abs(shareSum - 100) > 1 && (
            <p className="mt-1 text-[11px] text-warning">Shares total {shareSum}% — they should add up to about 100%.</p>
          )}
        </div>
      )}
      {heatNone && <p className="mt-3 text-sm text-ink-soft">Recorded as zero for heating.</p>}
      </Card>

      <Card title="Company vehicles — a few quick questions" subtitle="Fuel burned in owned/leased vehicles is direct (Scope 1).">
        <p className="font-medium text-ink">Does your company own or lease vehicles?</p>
        <div className="mt-1">
          <Opt name="vmode" checked={vMode === 'yes'} onChange={() => { setVMode('yes'); rebuildVehicles('yes', vFuel, vKnow, vLitres, vCount); }}>Yes</Opt>
          <Opt name="vmode" checked={vMode === 'no'} onChange={() => { setVMode('no'); rebuildVehicles('no', vFuel, vKnow, vLitres, vCount); }}>No — no company vehicles</Opt>
        </div>
        {vMode === 'yes' && (
          <div className="mt-3">
            <div className="max-w-xs">
              <Lbl>Main fuel</Lbl>
              <select className="text-input mt-1" value={vFuel} onChange={(e) => { const f = e.target.value as 'diesel' | 'petrol' | 'electric'; setVFuel(f); rebuildVehicles('yes', f, vKnow, vLitres, vCount); }}>
                <option value="diesel">Diesel</option>
                <option value="petrol">Petrol</option>
                <option value="electric">Fully electric (battery)</option>
              </select>
              <p className="mt-1 text-[11px] text-ink-muted">
                Plug-in / hybrid vehicles: pick the liquid fuel you actually refuel with (petrol or
                diesel) — that's the Scope 1 part; their charging is counted under electricity.
              </p>
            </div>
            {vFuel === 'electric' ? (
              <p className="mt-3 text-sm text-ink-soft">
                Battery-electric vehicles have no Scope 1 tailpipe emissions — the charging energy is
                already counted in your electricity use (Scope 2). Nothing to add here.
              </p>
            ) : (
            <>
            <p className="mt-3 text-sm font-medium text-ink">Do you know how many litres of fuel?</p>
            <p className="text-[11px] text-ink-muted">We work from fuel used (litres) or the number of vehicles — you don't need distance travelled.</p>
            <Opt name="vknow" checked={vKnow === 'amount'} onChange={() => { setVKnow('amount'); rebuildVehicles('yes', vFuel, 'amount', vLitres, vCount); }}>Yes — I have the litres</Opt>
            <Opt name="vknow" checked={vKnow === 'estimate'} onChange={() => { setVKnow('estimate'); rebuildVehicles('yes', vFuel, 'estimate', vLitres, vCount); }}>No — estimate from number of vehicles</Opt>
            {vKnow === 'amount' && (
              <div className="mt-2 max-w-xs">
                <Lbl>Fuel used (litres)</Lbl>
                <input className="text-input mt-1" value={vLitres} onChange={(e) => { setVLitres(e.target.value); rebuildVehicles('yes', vFuel, 'amount', e.target.value, vCount); }} />
              </div>
            )}
            {vKnow === 'estimate' && (
              <div className="mt-2 max-w-xs">
                <Lbl>Number of vehicles</Lbl>
                <input className="text-input mt-1" value={vCount} onChange={(e) => { setVCount(e.target.value); rebuildVehicles('yes', vFuel, 'estimate', vLitres, e.target.value); }} />
                <p className="mt-2 text-[11px] text-ink-muted">We'll estimate from average annual fuel per vehicle — flagged <span className="font-semibold">estimated</span>.</p>
              </div>
            )}
            </>
            )}
          </div>
        )}
        {vMode === 'no' && <p className="mt-3 text-sm text-ink-soft">Recorded as zero for vehicles.</p>}
      </Card>
    </div>
  );
}
