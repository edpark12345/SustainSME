import { useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { PageShell } from '../components/PageShell';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import {
  COMPANY_SCOPE_SPLIT,
  COUNTRIES,
  ENTITY_SIZES,
  FINANCIAL_PRODUCTS,
  PORTFOLIO_COMPANIES,
  REGIONS,
  SECTORS,
} from '../data/dummyData';
import { fmtNumber as fmt, tooltipTco2eNamed } from '../lib/chartFormat';
type Tab = 'emissions' | 'products';

export function RmDashboard() {
  const [tab, setTab] = useState<Tab>('emissions');
  const [selected, setSelected] = useState(PORTFOLIO_COMPANIES[0].name);

  return (
    <PageShell
      title="Relationship manager dashboard"
      subtitle="Drill into a portfolio company's emission profile and matched sustainable-finance products."
      headerAction={<Button>Record new engagement</Button>}
    >
      {/* Filters + tab toggle */}
      <div className="card mb-6 p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-wrap items-end gap-4">
            <Filter label="Country" options={COUNTRIES} />
            <Filter label="Region" options={REGIONS} />
            <Filter label="Sector" options={SECTORS} value="Construction" />
            <Filter label="Entity Size" options={ENTITY_SIZES} value="Mid-corporate" />
          </div>
          <div className="flex gap-2">
            <TabButton active={tab === 'emissions'} onClick={() => setTab('emissions')}>
              Emission Profile
            </TabButton>
            <TabButton active={tab === 'products'} onClick={() => setTab('products')}>
              New Financial Products
            </TabButton>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Portfolio company list */}
        <Card
          title={`Portfolio companies in ${REGIONS[0]} | Construction | Mid-corporate`}
          action={<span className="text-xs text-ink-muted">↕ Sort</span>}
        >
          <ul className="divide-y divide-surface-border">
            {PORTFOLIO_COMPANIES.map((c) => {
              const active = c.name === selected;
              return (
                <li key={c.name}>
                  <button
                    onClick={() => setSelected(c.name)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-sm transition-colors ${
                      active
                        ? 'bg-accenture-50 ring-1 ring-accenture-300'
                        : 'hover:bg-surface-subtle'
                    }`}
                  >
                    <span className={`font-medium ${active ? 'text-accenture-700' : 'text-ink'}`}>
                      {c.name}
                    </span>
                    <span className="text-ink-soft">{fmt(c.emissions)} tCO₂e</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>

        {/* Right panel: emissions donut OR financial products */}
        {tab === 'emissions' ? (
          <Card title={`Total Emissions, 2024 | ${selected}`}>
            <div className="flex flex-col items-center">
              <p className="text-xs text-ink-muted">Total Emissions (tCO₂e)</p>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={COMPANY_SCOPE_SPLIT}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={2}
                    >
                      {COMPANY_SCOPE_SPLIT.map((d) => (
                        <Cell key={d.name} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={tooltipTco2eNamed} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="flex gap-5">
                {COMPANY_SCOPE_SPLIT.map((d) => (
                  <li key={d.name} className="flex items-center gap-2 text-xs">
                    <span className="h-3 w-3 rounded-sm" style={{ background: d.color }} />
                    <span className="text-ink-soft">{d.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        ) : (
          <Card title={`Potential New Financial Products | ${selected}`}>
            <FinancialProductsPanel />
          </Card>
        )}
      </div>
    </PageShell>
  );
}

function FinancialProductsPanel() {
  const [activeLever, setActiveLever] = useState(FINANCIAL_PRODUCTS[0].lever);
  const current = FINANCIAL_PRODUCTS.find((p) => p.lever === activeLever)!;

  return (
    <div className="grid gap-5 sm:grid-cols-[180px_1fr]">
      <div className="flex flex-col gap-2">
        {FINANCIAL_PRODUCTS.map((p) => {
          const active = p.lever === activeLever;
          return (
            <button
              key={p.lever}
              onClick={() => setActiveLever(p.lever)}
              className={`rounded-lg px-3 py-2 text-left text-xs font-semibold transition-colors ${
                active
                  ? 'bg-accenture text-white'
                  : 'border border-surface-border bg-white text-accenture-700 hover:border-accenture'
              }`}
            >
              {p.lever}
            </button>
          );
        })}
      </div>

      <div>
        <p className="text-sm text-ink-soft">
          <span className="font-semibold text-ink">Description:</span> {current.description}
        </p>
        <p className="mt-2 text-sm">
          <span className="font-semibold text-ink">Applicability:</span>{' '}
          <span className="text-ink-soft">{current.applicability}</span>
        </p>
        <div className="mt-4 overflow-hidden rounded-lg border border-surface-border">
          <p className="bg-surface-subtle px-3 py-2 text-xs font-semibold text-ink-soft">
            Potential New Financial Product Offerings
          </p>
          <ul className="divide-y divide-surface-border">
            {current.offerings.map((o) => (
              <li key={o} className="px-3 py-2 text-sm text-ink">
                {o}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
        active
          ? 'border border-accenture-300 bg-accenture-50 text-accenture-700'
          : 'border border-surface-border bg-white text-ink-soft hover:bg-surface-subtle'
      }`}
    >
      {children}
    </button>
  );
}

function Filter({ label, options, value }: { label: string; options: string[]; value?: string }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <select className="text-input min-w-[150px]" defaultValue={value ?? options[0]}>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}
