import { useState } from 'react';
import { Card } from './Card';
import { useAssessment } from '../context/AssessmentContext';
import type { Scope3Waste } from '../types';

const BUILDING_TYPES = ['office', 'retail', 'warehouse', 'manufacturing', 'hospitality', 'other'];

/**
 * Scope 3 Cat 5 (waste) entry. Primary = actual tonnage; otherwise estimated
 * from headcount × a per-FTE screening benchmark. Treatment mix + factors come
 * from the backend (What a Waste country split × DEFRA treatment factors).
 *
 * The chosen mode is explicit UI state — it must NOT be derived from whether
 * `tonnes` is set, otherwise picking "I know the tonnage" (which starts empty)
 * would immediately flip back to the estimate view.
 */
export function Scope3WasteEntry() {
  const { bundle, setScope3Waste, profile } = useAssessment();
  const line: Scope3Waste = bundle.scope3_waste[0] ?? {};
  const country = bundle.boundary.sites[0]?.country || profile.country || '';

  const [mode, setMode] = useState<'none' | 'tonnes' | 'estimate'>(
    bundle.scope3_waste.length === 0 ? 'none' : line.tonnes != null ? 'tonnes' : 'estimate',
  );

  const num = (v: string): number | null => (v.trim() === '' ? null : Number(v));
  const write = (patch: Partial<Scope3Waste>) =>
    setScope3Waste([{ ...line, country: line.country ?? country, ...patch }]);

  const choose = (m: 'none' | 'tonnes' | 'estimate') => {
    setMode(m);
    if (m === 'none') setScope3Waste([]);
    else if (m === 'tonnes') setScope3Waste([{ country, tonnes: line.tonnes ?? null }]);
    else
      setScope3Waste([
        { country, employees_fte: line.employees_fte ?? null, building_type: line.building_type ?? 'office' },
      ]);
  };

  const Radio = ({ v, label }: { v: 'none' | 'tonnes' | 'estimate'; label: string }) => (
    <label className="flex items-center gap-2 text-sm">
      <input type="radio" checked={mode === v} onChange={() => choose(v)} className="accent-accenture-600" />
      {label}
    </label>
  );

  return (
    <Card
      title="Cat 5 · Waste generated in operations"
      subtitle="Emissions from treating your operational waste (landfill, incineration, recycling, composting)."
      className="mt-6"
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
          <Radio v="tonnes" label="I know our annual waste tonnage" />
          <Radio v="estimate" label="Estimate it from our headcount" />
          <Radio v="none" label="Skip waste for now" />
        </div>

        {mode === 'tonnes' && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-[11px] font-medium text-ink-muted">Total waste (tonnes / year)</label>
              <input
                className="text-input mt-1"
                inputMode="numeric"
                value={line.tonnes ?? ''}
                onChange={(e) => write({ tonnes: num(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-ink-muted">Country (treatment mix)</label>
              <input
                className="text-input mt-1"
                value={line.country ?? country}
                onChange={(e) => write({ country: e.target.value })}
              />
            </div>
          </div>
        )}

        {mode === 'estimate' && (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-[11px] font-medium text-ink-muted">Employees (FTE)</label>
                <input
                  className="text-input mt-1"
                  inputMode="numeric"
                  value={line.employees_fte ?? ''}
                  onChange={(e) => write({ employees_fte: num(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-ink-muted">Primary building type</label>
                <select
                  className="text-input mt-1"
                  value={line.building_type ?? 'office'}
                  onChange={(e) => write({ building_type: e.target.value })}
                >
                  {BUILDING_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-ink-muted">Country (treatment mix)</label>
                <input
                  className="text-input mt-1"
                  value={line.country ?? country}
                  onChange={(e) => write({ country: e.target.value })}
                />
              </div>
            </div>
            <p className="text-[11px] text-ink-muted">
              We estimate tonnage from a per-employee screening benchmark, then apply your country’s
              treatment mix (World Bank “What a Waste”) and DEFRA treatment factors. Result is flagged{' '}
              <span className="font-semibold">estimated</span> — provide actual tonnage for a firmer figure.
            </p>
          </>
        )}

        {mode === 'none' && (
          <p className="text-[11px] text-ink-muted">
            Skipped for now. Waste is part of a complete Scope 3 footprint — it will show as{' '}
            <span className="font-semibold">not yet provided</span> in the Scope 3 coverage summary as a
            reminder to come back and add it (a rough tonnage or headcount estimate is enough to start).
          </p>
        )}
      </div>
    </Card>
  );
}
