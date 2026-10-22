import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PageShell } from '../components/PageShell';
import { Card } from '../components/Card';
import {
  ENTITY_SIZES,
  COUNTRIES,
  PORTFOLIO_PROFILE,
  TOP_EMITTERS,
  TOP_RMS,
} from '../data/dummyData';
import { tooltipPercentNamed, tooltipTco2e } from '../lib/chartFormat';

const barColor = (pct: number) => (pct >= 60 ? '#1FA971' : pct >= 40 ? '#E6A700' : '#D64545');

export function LeadershipDashboard() {
  return (
    <PageShell
      title="Leadership dashboard"
      subtitle="Portfolio-level view of emissions and relationship-manager engagement across the book."
    >
      {/* Filters */}
      <div className="card mb-6 flex flex-wrap items-end gap-4 p-5">
        <Filter label="Country" options={COUNTRIES} />
        <Filter label="Entity Size" options={ENTITY_SIZES} value="Mid-corporate" />
        <div>
          <label className="field-label">Mid-corporate cust. engaged</label>
          <div className="rounded-lg border border-surface-border bg-surface-subtle px-4 py-2 text-sm font-semibold text-ink">
            15
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Portfolio level emission profile" subtitle="Share of emissions by scope across the portfolio">
          <div className="flex items-center gap-6">
            <div className="h-60 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={PORTFOLIO_PROFILE}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {PORTFOLIO_PROFILE.map((d) => (
                      <Cell key={d.name} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={tooltipPercentNamed} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="space-y-2">
              {PORTFOLIO_PROFILE.map((d) => (
                <li key={d.name} className="flex items-center gap-2 text-sm">
                  <span className="h-3 w-3 rounded-sm" style={{ background: d.color }} />
                  <span className="text-ink-soft">{d.name}</span>
                  <span className="font-semibold text-ink">{d.value}%</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <Card title="Top emitters" subtitle="by emissions (tCO₂e)">
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={TOP_EMITTERS}
                margin={{ top: 0, right: 56, bottom: 0, left: 8 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="company"
                  width={72}
                  tick={{ fontSize: 11, fill: '#4A4A57' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip formatter={tooltipTco2e()} cursor={{ fill: '#F6ECFF' }} />
                <Bar dataKey="value" fill="#A100FF" radius={[0, 4, 4, 0]} barSize={12}>
                  {TOP_EMITTERS.map((_, i) => (
                    <Cell key={i} fill={i === 4 ? '#6A00AB' : '#A100FF'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card title="Top engaging relationship managers" subtitle="by % of customers engaged" className="mt-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border text-left text-xs text-ink-muted">
              <th className="py-2 font-semibold">RM Name</th>
              <th className="py-2 font-semibold">Percentage of customers engaged</th>
            </tr>
          </thead>
          <tbody>
            {TOP_RMS.map((rm) => (
              <tr key={rm.name} className="border-b border-surface-border">
                <td className="py-3 font-medium text-ink">{rm.name}</td>
                <td className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-2.5 max-w-md flex-1 overflow-hidden rounded-full bg-surface-subtle">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${rm.engaged}%`, background: barColor(rm.engaged) }}
                      />
                    </div>
                    <span className="w-10 text-right font-semibold text-ink">{rm.engaged}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </PageShell>
  );
}

function Filter({ label, options, value }: { label: string; options: string[]; value?: string }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <select className="text-input min-w-[160px]" defaultValue={value ?? options[0]}>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}
