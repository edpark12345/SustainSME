import { Fragment, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { ResultsNav } from '../components/ResultsNav';
import { Scope3SpendEntry } from '../components/Scope3SpendEntry';
import { Scope3WasteEntry } from '../components/Scope3WasteEntry';
import { Scope3TravelEntry } from '../components/Scope3TravelEntry';
import { Scope3Coverage } from '../components/Scope3Coverage';
import { api } from '../lib/apiClient';
import { useAssessment } from '../context/AssessmentContext';
import { ROUTES } from '../routes';
import type { EmissionResult, Tier } from '../types';

const tierStyle: Record<Tier, string> = {
  primary: 'bg-positive/10 text-positive',
  spend: 'bg-warning/10 text-warning',
  estimated: 'bg-ink-muted/10 text-ink-soft',
};

// Reconstruct quantity × factor (÷ 1000 when per-kg) = tCO₂e for each line.
function fmtCalc(r: EmissionResult): string {
  const t = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  const m = (r.raw_input ?? '').match(/^([\d.,]+)\s*(.*)$/);
  if (!m || r.factor_value == null) return `${r.raw_input ?? '—'} → ${t(r.co2e_t)} tCO₂e`;
  const kgToT = /^kg/i.test(r.factor_unit ?? '');
  return `${m[1]} ${m[2]} × ${t(r.factor_value)} ${r.factor_unit ?? ''}${kgToT ? ' ÷ 1000' : ''} = ${t(r.co2e_t)} tCO₂e`;
}

export function AllCalculations() {
  const navigate = useNavigate();
  const { bundle, calc, setCalc } = useAssessment();
  const [busy, setBusy] = useState<'idle' | 'calc'>('idle');
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backendUp, setBackendUp] = useState<boolean | null>(null);

  useEffect(() => {
    api.ping().then(setBackendUp);
  }, []);

  const onCalculate = async () => {
    setBusy('calc');
    setError(null);
    try {
      setCalc(await api.calculate(bundle));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy('idle');
    }
  };

  const onExport = async () => {
    setExporting(true);
    setError(null);
    try {
      await api.exportXlsx(bundle);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setExporting(false);
    }
  };

  const total =
    calc != null
      ? calc.scope1_total_t + calc.scope2_location_t + calc.scope3_total_t
      : 0;

  return (
    <PageShell
      title="All calculations — Scope 1, 2 & 3"
      subtitle="Every figure with its formula, factor and data-quality tier — a transparent, fully-documented screening footprint you can download and share (not a certified/assured inventory)."
    >
      <ResultsNav />

      {backendUp === false && (
        <div className="mb-6 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          Backend not reachable. Start it: <code>backend/start-backend.bat</code> (or{' '}
          <code>uvicorn main:app --port 8000</code> in <code>backend/</code>), then Calculate again.
        </div>
      )}

      {/* Scope 3: spend (Cat 1/2/4/9) + waste (Cat 5) + travel/commuting (Cat 6/7); Cat 3 auto */}
      <Scope3SpendEntry />
      <Scope3WasteEntry />
      <Scope3TravelEntry />

      {/* Calculate + unified results */}
      <Card
        title="Calculate & download"
        subtitle="Deterministic calculation across all three scopes — a transparent, traceable factor per line."
        className="mt-6"
      >
        <div className="flex flex-wrap gap-3">
          <Button onClick={onCalculate} disabled={busy !== 'idle' || backendUp === false}>
            {busy === 'calc' ? 'Calculating…' : 'Calculate Scope 1, 2 & 3'}
          </Button>
          {calc && (
            <Button variant="outline" onClick={onExport} disabled={exporting}>
              {exporting ? 'Preparing…' : '⬇ Download Excel (all calculations)'}
            </Button>
          )}
        </div>
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}

        {calc && (
          <div className="mt-5">
            <div className="grid gap-3 sm:grid-cols-4">
              <Kpi label="Scope 1" value={calc.scope1_total_t} />
              <Kpi label="Scope 2 (location)" value={calc.scope2_location_t} />
              <Kpi label="Scope 3 (spend)" value={calc.scope3_total_t} />
              <Kpi label="Total (S1+S2+S3)" value={total} strong />
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
                  {calc.results.map((r, i) => (
                    <Fragment key={i}>
                      <tr className="border-t border-surface-border">
                        <td className="px-3 pt-2 align-top">{r.scope}</td>
                        <td className="px-3 pt-2 align-top text-ink">{r.activity_label}</td>
                        <td className="px-3 pt-2 align-top text-ink-soft">{r.raw_input}</td>
                        <td className="px-3 pt-2 text-right align-top font-medium">
                          {r.co2e_t.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-3 pt-2 align-top">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${tierStyle[r.tier]}`}>
                            {r.tier}
                          </span>
                        </td>
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
                <ul className="list-disc space-y-0.5 pl-4">
                  {calc.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Completeness statement across all 15 Scope 3 categories */}
      <Scope3Coverage />

      <div className="mt-6 flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate(ROUTES.scope3Relevance)}>
          ← Scope 3 relevance
        </Button>
        <Button size="lg" onClick={() => navigate(ROUTES.report)}>
          Continue to report →
        </Button>
      </div>
    </PageShell>
  );
}

function Kpi({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className={`card p-4 ${strong ? 'border-accenture-300 bg-accenture-50' : ''}`}>
      <p className="text-xs font-medium text-ink-muted">{label}</p>
      <p className="mt-1 text-xl font-bold text-ink">
        {value.toLocaleString(undefined, { maximumFractionDigits: 1 })}{' '}
        <span className="text-sm font-medium text-ink-muted">tCO₂e</span>
      </p>
    </div>
  );
}
