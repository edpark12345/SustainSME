import { Card } from './Card';
import type { ActivityBundle, ProvenanceFields } from '../types';

type Focus = '1' | '2';

const fmt = (n?: number | null) => (n == null ? '—' : n.toLocaleString('en-US'));

function ConfidenceBadge({ c }: { c?: number | null }) {
  if (c == null) return <span className="text-ink-muted">—</span>;
  const pct = Math.round(c * 100);
  const style = c >= 0.85 ? 'bg-positive/10 text-positive' : c >= 0.6 ? 'bg-warning/10 text-warning' : 'bg-danger/10 text-danger';
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${style}`}>{pct}%</span>;
}

/** Compact source + notes line shown under each summary table. */
function Notes({ items }: { items: { label: string; p: ProvenanceFields }[] }) {
  const withNotes = items.filter((i) => i.p.notes || i.p.source_doc);
  if (!withNotes.length) return null;
  return (
    <ul className="mt-2 space-y-1 text-[11px] text-ink-muted">
      {withNotes.map((i, idx) => (
        <li key={idx}>
          <span className="font-medium text-ink-soft">{i.label}</span>
          {i.p.source_doc && <span className="ml-1 rounded bg-surface-subtle px-1 py-0.5">{i.p.source_doc}</span>}
          {i.p.notes && <span className="ml-1 italic">— {i.p.notes}</span>}
        </li>
      ))}
    </ul>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: (string | number | React.ReactNode)[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-surface-border">
      <table className="w-full text-left text-xs">
        <thead className="bg-surface-subtle text-ink-soft">
          <tr>{headers.map((h) => <th key={h} className="px-3 py-2 font-semibold whitespace-nowrap">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-surface-border">
              {r.map((c, j) => <td key={j} className="px-3 py-2 text-ink whitespace-nowrap">{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ExtractionSummary({ bundle, focus }: { bundle: ActivityBundle; focus: Focus }) {
  const b = bundle;
  const hasS2 = b.scope2_electricity.length || b.scope2_thermal.length;
  const hasS1 = b.scope1_stationary.length || b.scope1_mobile.length || b.scope1_fugitive.length;
  const relevant = focus === '2' ? hasS2 : hasS1;
  if (!relevant) return null;

  return (
    <Card
      title="Extracted & structured data — review"
      subtitle="What the model read from your documents. Confirm it below before calculating."
    >
      <div className="space-y-6">
        {/* Boundary */}
        {(b.boundary.reporting_year || b.boundary.sites.length > 0) && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-ink">Company &amp; boundary</h3>
            <Table
              headers={['Reporting year', 'Site', 'Country', 'Region', 'Tenure', 'Employee housing in scope?']}
              rows={
                b.boundary.sites.length
                  ? b.boundary.sites.map((s) => [
                      b.boundary.reporting_year ?? '—', s.name, s.country, s.region ?? '—',
                      s.tenure ?? '—', s.include_employee_housing == null ? '—' : s.include_employee_housing ? 'Yes' : 'No',
                    ])
                  : [[b.boundary.reporting_year ?? '—', '—', '—', '—', '—', '—']]
              }
            />
          </div>
        )}

        {/* Scope 2 */}
        {focus === '2' && b.scope2_electricity.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-ink">Electricity ({b.scope2_electricity.length})</h3>
            <Table
              headers={['Site', 'Period', 'Total kWh', 'Grid kWh', 'On-site solar', 'Renewable (contract)', 'Supplier', 'Tariff', 'Certificate', 'Conf.']}
              rows={b.scope2_electricity.map((a) => [
                a.site ?? '—', a.period ?? '—', fmt(a.total_kwh), fmt(a.grid_kwh), fmt(a.captive_solar_kwh),
                fmt(a.openaccess_renewable_kwh), a.supplier ?? '—', a.tariff ?? '—', a.green_instrument ?? '—',
                <ConfidenceBadge c={a.confidence} />,
              ])}
            />
            <Notes items={b.scope2_electricity.map((a) => ({ label: `${a.site ?? 'Electricity'}${a.period ? ` · ${a.period}` : ''}`, p: a }))} />
          </div>
        )}
        {focus === '2' && b.scope2_thermal.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-ink">Heat / steam / cooling ({b.scope2_thermal.length})</h3>
            <Table
              headers={['Site', 'Period', 'Carrier', 'Energy kWh', 'Conf.']}
              rows={b.scope2_thermal.map((a) => [a.site ?? '—', a.period ?? '—', a.carrier, fmt(a.energy_kwh), <ConfidenceBadge c={a.confidence} />])}
            />
          </div>
        )}

        {/* Scope 1 */}
        {focus === '1' && b.scope1_stationary.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-ink">Stationary combustion ({b.scope1_stationary.length})</h3>
            <Table
              headers={['Site', 'Fuel', 'Quantity', 'Unit', 'Conf.']}
              rows={b.scope1_stationary.map((a) => [a.site ?? '—', a.fuel_type, fmt(a.quantity), a.unit ?? '—', <ConfidenceBadge c={a.confidence} />])}
            />
            <Notes items={b.scope1_stationary.map((a) => ({ label: `${a.fuel_type}${a.site ? ` · ${a.site}` : ''}`, p: a }))} />
          </div>
        )}
        {focus === '1' && b.scope1_mobile.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-ink">Mobile combustion ({b.scope1_mobile.length})</h3>
            <Table
              headers={['Fleet / vehicle', 'Fuel', 'Quantity', 'Unit', 'Conf.']}
              rows={b.scope1_mobile.map((a) => [a.vehicle_or_fleet ?? '—', a.fuel_type, fmt(a.quantity), a.unit ?? '—', <ConfidenceBadge c={a.confidence} />])}
            />
          </div>
        )}
        {focus === '1' && b.scope1_fugitive.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-ink">Fugitive — refrigerants ({b.scope1_fugitive.length})</h3>
            <Table
              headers={['Equipment', 'Refrigerant', 'Refill kg', 'Charge kg', 'Tonnage TR', 'Conf.']}
              rows={b.scope1_fugitive.map((a) => [a.equipment ?? '—', a.refrigerant_type ?? '—', fmt(a.refill_kg), fmt(a.charge_kg), fmt(a.tonnage_tr), <ConfidenceBadge c={a.confidence} />])}
            />
            <Notes items={b.scope1_fugitive.map((a) => ({ label: `${a.refrigerant_type ?? 'refrigerant'}${a.equipment ? ` · ${a.equipment}` : ''}`, p: a }))} />
          </div>
        )}
      </div>
    </Card>
  );
}
