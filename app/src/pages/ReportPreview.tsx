import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/accenture-logo.png';
import { PageShell } from '../components/PageShell';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ResultsNav } from '../components/ResultsNav';
import { api } from '../lib/apiClient';
import { useAssessment } from '../context/AssessmentContext';
import { ESG_SCORE, LEVERS, SCOPE_TOTALS } from '../data/dummyData';
import { ROUTES } from '../routes';

const fmt = (n: number) => n.toLocaleString('en-US');

export function ReportPreview() {
  const navigate = useNavigate();
  const { profile, bundle } = useAssessment();
  const total = SCOPE_TOTALS.reduce((s, x) => s + x.value, 0);

  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backendUp, setBackendUp] = useState<boolean | null>(null);

  useEffect(() => {
    api.ping().then(setBackendUp);
  }, []);

  const onExportXlsx = async () => {
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

  return (
    <PageShell
      title="Reports & downloads"
      subtitle="Download the full, fully-documented calculations, or a board-ready summary report."
    >
      <ResultsNav />

      {/* Download options (not printed) */}
      <Card title="Download your results" className="no-print mb-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col rounded-lg border border-surface-border p-4">
            <p className="text-sm font-semibold text-ink">All calculations (Excel)</p>
            <p className="mt-1 flex-1 text-xs text-ink-muted">
              Every emission line with its formula, factor, data-quality tier and source — a
              transparent, fully-documented workbook to share with your bank (screening-grade;
              Scope 1, 2 &amp; 3).
            </p>
            <div className="mt-3">
              <Button onClick={onExportXlsx} disabled={exporting || backendUp === false}>
                {exporting ? 'Preparing…' : '⬇ Download all calculations (Excel)'}
              </Button>
            </div>
          </div>
          <div className="flex flex-col rounded-lg border border-surface-border p-4">
            <p className="text-sm font-semibold text-ink">High-level report (PDF)</p>
            <p className="mt-1 flex-1 text-xs text-ink-muted">
              A board-ready one-page summary — footprint by scope, ESG score and priority actions.
              Opens your browser's print dialog; choose “Save as PDF”.
            </p>
            <div className="mt-3">
              <Button variant="outline" onClick={() => window.print()}>
                🖨 Download / print report (PDF)
              </Button>
            </div>
          </div>
        </div>
        {backendUp === false && (
          <p className="mt-3 text-xs text-danger">
            Backend not reachable — the Excel export needs it. Start{' '}
            <code>backend/start-backend.bat</code>, then try again.
          </p>
        )}
        {error && <p className="mt-3 text-xs text-danger">{error}</p>}
      </Card>

      {/* A4-ish paper preview — this is the only part that prints */}
      <div className="mx-auto max-w-3xl print-area">
        <div className="card overflow-hidden">
          {/* Cover band */}
          <div className="bg-accenture-700 px-10 py-10 text-white">
            <img src={logo} alt="Accenture" className="h-6 w-auto brightness-0 invert" />
            <p className="mt-8 text-sm uppercase tracking-widest text-accenture-100">
              Carbon & ESG Assessment Report
            </p>
            <h2 className="mt-1 text-3xl font-bold">{profile.companyName}</h2>
            <p className="mt-1 text-accenture-100">
              {profile.sector} · {profile.country} · Reporting year {profile.reportingYear}
            </p>
          </div>

          <div className="space-y-8 px-10 py-8">
            <section>
              <h3 className="text-sm font-bold uppercase tracking-wide text-accenture-700">
                1 · Executive summary
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {profile.companyName} generated an estimated{' '}
                <strong className="text-ink">{fmt(total)} tCO₂e</strong> across Scopes 1–3 in{' '}
                {profile.reportingYear}. The company's ESG score is{' '}
                <strong className="text-ink">{ESG_SCORE.overall}/100 ({ESG_SCORE.rating})</strong>,
                placing it in the {ESG_SCORE.percentile}th percentile of sector peers. Implementing
                the prioritized levers below could reduce annual emissions by up to{' '}
                <strong className="text-ink">
                  {fmt(LEVERS.reduce((s, l) => s + l.reductionPotential, 0))} tCO₂e
                </strong>
                .
              </p>
            </section>

            <section>
              <h3 className="text-sm font-bold uppercase tracking-wide text-accenture-700">
                2 · Emissions by scope
              </h3>
              <table className="mt-3 w-full text-sm">
                <tbody>
                  {SCOPE_TOTALS.map((s) => (
                    <tr key={s.scope} className="border-b border-surface-border">
                      <td className="py-2">
                        <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full align-middle" style={{ background: s.color }} />
                        {s.scope} — {s.label}
                      </td>
                      <td className="py-2 text-right font-medium text-ink">{fmt(s.value)} tCO₂e</td>
                      <td className="py-2 text-right text-ink-muted">{((s.value / total) * 100).toFixed(0)}%</td>
                    </tr>
                  ))}
                  <tr>
                    <td className="py-2 font-bold text-ink">Total</td>
                    <td className="py-2 text-right font-bold text-ink">{fmt(total)} tCO₂e</td>
                    <td className="py-2 text-right text-ink-muted">100%</td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section>
              <h3 className="text-sm font-bold uppercase tracking-wide text-accenture-700">
                3 · Priority decarbonization levers
              </h3>
              <ol className="mt-3 space-y-2">
                {LEVERS.slice(0, 4).map((l, i) => (
                  <li key={l.id} className="flex items-start gap-3 text-sm">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accenture-50 text-xs font-bold text-accenture-700">
                      {i + 1}
                    </span>
                    <span className="text-ink-soft">
                      <strong className="text-ink">{l.title}</strong> ({l.scope}) —{' '}
                      {fmt(l.reductionPotential)} tCO₂e/yr, {l.payback} payback.
                    </span>
                  </li>
                ))}
              </ol>
            </section>

            <p className="border-t border-surface-border pt-4 text-[11px] text-ink-muted">
              Prepared by Accenture · SustainSME platform. Figures in this preview are illustrative
              demo data and not a certified greenhouse-gas inventory.
            </p>
          </div>
        </div>
      </div>

      <div className="no-print mt-6 flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate(ROUTES.levers)}>
          ← Levers
        </Button>
        <Button size="lg" onClick={() => navigate(ROUTES.leadership)}>
          Go to Leadership dashboard →
        </Button>
      </div>
    </PageShell>
  );
}
