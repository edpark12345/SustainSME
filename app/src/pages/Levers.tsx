import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { Button } from '../components/Button';
import { ResultsNav } from '../components/ResultsNav';
import { LEVERS, type Lever, type LeverImpact } from '../data/dummyData';
import { ROUTES } from '../routes';

const impactStyles: Record<LeverImpact, string> = {
  High: 'bg-positive/10 text-positive',
  Medium: 'bg-warning/10 text-warning',
  Low: 'bg-ink-muted/10 text-ink-soft',
};

const fmt = (n: number) => n.toLocaleString('en-US');

export function Levers() {
  const navigate = useNavigate();
  const totalPotential = LEVERS.reduce((s, l) => s + l.reductionPotential, 0);

  return (
    <PageShell
      title="Decarbonization levers"
      subtitle="Prioritized actions to reduce your emissions, with estimated reduction potential and payback."
    >
      <ResultsNav />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="card bg-accenture p-5 text-white">
          <p className="text-xs font-medium text-accenture-100">Combined reduction potential</p>
          <p className="mt-1 text-2xl font-bold">
            {fmt(totalPotential)} <span className="text-sm text-accenture-100">tCO₂e/yr</span>
          </p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-medium text-ink-muted">Levers identified</p>
          <p className="mt-1 text-2xl font-bold text-ink">{LEVERS.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-medium text-ink-muted">Quick wins (&lt; 2 yr payback)</p>
          <p className="mt-1 text-2xl font-bold text-ink">
            {LEVERS.filter((l) => l.payback.includes('<') || l.payback.startsWith('1')).length}
          </p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {LEVERS.map((lever) => (
          <LeverCard key={lever.id} lever={lever} />
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate(ROUTES.esg)}>
          ← ESG score
        </Button>
        <Button size="lg" onClick={() => navigate(ROUTES.report)}>
          Generate PDF report →
        </Button>
      </div>
    </PageShell>
  );
}

function LeverCard({ lever }: { lever: Lever }) {
  return (
    <div className="card flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="inline-flex rounded-md bg-accenture-50 px-2 py-0.5 text-xs font-semibold text-accenture-700">
            {lever.scope}
          </span>
          <h3 className="mt-2 text-base font-semibold text-ink">{lever.title}</h3>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${impactStyles[lever.impact]}`}>
          {lever.impact} impact
        </span>
      </div>
      <p className="mt-2 flex-1 text-sm text-ink-soft">{lever.description}</p>

      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-surface-border pt-4 text-center">
        <Stat label="Reduction" value={`${fmt(lever.reductionPotential)}`} sub="tCO₂e/yr" />
        <Stat label="Of total" value={`${lever.reductionPct}%`} />
        <Stat label="Payback" value={lever.payback} sub={`${lever.capex} capex`} />
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="text-sm font-bold text-ink">{value}</p>
      {sub && <p className="text-[11px] text-ink-muted">{sub}</p>}
    </div>
  );
}
