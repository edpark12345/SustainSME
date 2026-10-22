import { useNavigate } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PageShell } from '../components/PageShell';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { ResultsNav } from '../components/ResultsNav';
import { useAssessment } from '../context/AssessmentContext';
import { ROUTES } from '../routes';
import {
  EMISSIONS_TREND,
  SCOPE3_BREAKDOWN,
  SCOPE_TOTALS,
} from '../data/dummyData';
import { fmtNumber as fmt, tooltipTco2e } from '../lib/chartFormat';

export function Results() {
  const navigate = useNavigate();
  const { profile, calc } = useAssessment();

  // Use real computed Scope 1 & 2 when the user has run a calculation; Scope 3
  // remains illustrative (not computed in this iteration).
  const live = calc != null;
  const scopeTotals = live
    ? [
        { scope: 'Scope 1', label: 'Direct', value: calc.scope1_total_t, color: '#A100FF' },
        { scope: 'Scope 2', label: 'Energy (indirect)', value: calc.scope2_location_t, color: '#C285FF' },
        { scope: 'Scope 3', label: 'Value chain (illustrative)', value: SCOPE_TOTALS[2].value, color: '#7A7A88' },
      ]
    : SCOPE_TOTALS;
  const total = scopeTotals.reduce((s, x) => s + x.value, 0);

  return (
    <PageShell
      title="Company emissions dashboard"
      subtitle={`${profile.companyName} · ${profile.sector} · Reporting year ${profile.reportingYear}`}
      headerAction={
        <Button onClick={() => navigate(ROUTES.report)}>Download PDF report</Button>
      }
    >
      <ResultsNav />

      <div className={`mb-4 rounded-lg border px-4 py-2.5 text-sm ${live ? 'border-positive/30 bg-positive/5 text-ink-soft' : 'border-accenture-100 bg-accenture-50 text-accenture-800'}`}>
        {live
          ? 'Scope 1 & 2 below are computed from your uploaded documents. Scope 3 is illustrative until the value-chain module is added.'
          : 'Showing illustrative demo data. Upload documents on the Scope 1 & 2 screens and run a calculation to see live figures here.'}
      </div>

      {/* KPI strip */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total emissions" value={`${fmt(total)}`} unit="tCO₂e" accent />
        {scopeTotals.map((s) => (
          <KpiCard
            key={s.scope}
            label={`${s.scope} · ${s.label}`}
            value={fmt(s.value)}
            unit="tCO₂e"
            dot={s.color}
            share={`${((s.value / total) * 100).toFixed(0)}% of total`}
          />
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Emissions by scope" subtitle="tCO₂e, reporting year 2024">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scopeTotals} margin={{ top: 8, right: 16, bottom: 4, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EDEBF2" vertical={false} />
                <XAxis dataKey="scope" tick={{ fontSize: 12, fill: '#7A7A88' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 12, fill: '#7A7A88' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v / 1000}k`}
                />
                <Tooltip formatter={tooltipTco2e()} cursor={{ fill: '#F6ECFF' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={64}>
                  {scopeTotals.map((s) => (
                    <Cell key={s.scope} fill={s.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Emissions trend" subtitle="Stacked tCO₂e by scope, 2021–2024">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={EMISSIONS_TREND} margin={{ top: 8, right: 16, bottom: 4, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EDEBF2" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#7A7A88' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 12, fill: '#7A7A88' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v / 1000}k`}
                />
                <Tooltip formatter={tooltipTco2e()} cursor={{ fill: '#F6ECFF' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="scope1" stackId="a" name="Scope 1" fill="#A100FF" radius={[0, 0, 0, 0]} />
                <Bar dataKey="scope2" stackId="a" name="Scope 2" fill="#C285FF" />
                <Bar dataKey="scope3" stackId="a" name="Scope 3" fill="#D9D7E0" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card title="Scope 3 breakdown by category" subtitle="tCO₂e across relevant categories" className="mt-6">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={SCOPE3_BREAKDOWN}
              margin={{ top: 4, right: 32, bottom: 4, left: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#EDEBF2" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 12, fill: '#7A7A88' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v / 1000}k`}
              />
              <YAxis
                type="category"
                dataKey="category"
                width={160}
                tick={{ fontSize: 11, fill: '#4A4A57' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip formatter={tooltipTco2e()} cursor={{ fill: '#F6ECFF' }} />
              <Bar dataKey="value" fill="#A100FF" radius={[0, 6, 6, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="mt-6 flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate(ROUTES.scope3Relevance)}>
          ← Back to assessment
        </Button>
        <Button size="lg" onClick={() => navigate(ROUTES.esg)}>
          View ESG score →
        </Button>
      </div>
    </PageShell>
  );
}

function KpiCard({
  label,
  value,
  unit,
  share,
  dot,
  accent,
}: {
  label: string;
  value: string;
  unit: string;
  share?: string;
  dot?: string;
  accent?: boolean;
}) {
  return (
    <div className={`card p-5 ${accent ? 'bg-accenture text-white' : ''}`}>
      <div className="flex items-center gap-2">
        {dot && <span className="h-2.5 w-2.5 rounded-full" style={{ background: dot }} />}
        <p className={`text-xs font-medium ${accent ? 'text-accenture-100' : 'text-ink-muted'}`}>
          {label}
        </p>
      </div>
      <p className="mt-2 text-2xl font-bold">
        {value} <span className={`text-sm font-medium ${accent ? 'text-accenture-100' : 'text-ink-muted'}`}>{unit}</span>
      </p>
      {share && <p className={`text-xs ${accent ? 'text-accenture-100' : 'text-ink-muted'}`}>{share}</p>}
    </div>
  );
}
