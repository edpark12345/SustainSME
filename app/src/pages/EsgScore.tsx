import { useNavigate } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PageShell } from '../components/PageShell';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { ResultsNav } from '../components/ResultsNav';
import { GaugeChart } from '../components/GaugeChart';
import { ESG_SCORE } from '../data/dummyData';
import { ROUTES } from '../routes';

export function EsgScore() {
  const navigate = useNavigate();

  return (
    <PageShell
      title="ESG score"
      subtitle="A 0–100 score across Environmental, Social and Governance pillars, benchmarked against sector peers."
    >
      <ResultsNav />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Overall ESG score">
          <div className="flex flex-col items-center py-2">
            <GaugeChart value={ESG_SCORE.overall} rating={ESG_SCORE.rating} />
            <p className="mt-4 text-center text-sm text-ink-soft">
              You score in the{' '}
              <span className="font-semibold text-accenture-700">{ESG_SCORE.percentile}th percentile</span>{' '}
              of your sector.
            </p>
          </div>
        </Card>

        <Card title="Pillar sub-scores" subtitle="E / S / G out of 100" className="lg:col-span-2">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-4">
              {ESG_SCORE.sub.map((p) => (
                <div key={p.pillar}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-ink">{p.pillar}</span>
                    <span className="font-semibold text-ink">{p.score}</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-subtle">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${p.score}%`, background: p.color }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={ESG_SCORE.sub.map((s) => ({ pillar: s.pillar.slice(0, 3), score: s.score, color: s.color }))}
                  margin={{ top: 8, right: 8, bottom: 4, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#EDEBF2" vertical={false} />
                  <XAxis dataKey="pillar" tick={{ fontSize: 12, fill: '#7A7A88' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#7A7A88' }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#F6ECFF' }} />
                  <ReferenceLine
                    y={ESG_SCORE.peerAverage}
                    stroke="#7A7A88"
                    strokeDasharray="4 4"
                    label={{ value: 'Peer avg', fontSize: 10, fill: '#7A7A88', position: 'insideTopRight' }}
                  />
                  <Bar dataKey="score" radius={[6, 6, 0, 0]} barSize={48}>
                    {ESG_SCORE.sub.map((s) => (
                      <Cell key={s.pillar} fill={s.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Benchmark label="Your score" value={ESG_SCORE.overall} highlight />
        <Benchmark label="Sector peer average" value={ESG_SCORE.peerAverage} />
        <Benchmark label="Top quartile" value={ESG_SCORE.topQuartile} />
      </div>

      <div className="mt-6 flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate(ROUTES.results)}>
          ← Emissions
        </Button>
        <Button size="lg" onClick={() => navigate(ROUTES.levers)}>
          See decarbonization levers →
        </Button>
      </div>
    </PageShell>
  );
}

function Benchmark({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`card p-5 ${highlight ? 'border-accenture-300 bg-accenture-50' : ''}`}>
      <p className="text-xs font-medium text-ink-muted">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${highlight ? 'text-accenture-700' : 'text-ink'}`}>{value}</p>
    </div>
  );
}
