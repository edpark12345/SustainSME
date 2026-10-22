import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { RadioGroup } from '../components/RadioGroup';
import { DataUpload } from '../components/DataUpload';
import { ROUTES } from '../routes';
import type { YesNo } from '../types';

export function Scope2() {
  const navigate = useNavigate();
  const [hasMarketData, setHasMarketData] = useState<YesNo>('no');

  return (
    <PageShell
      title="Scope 2 — Energy indirect emissions"
      subtitle="Emissions from purchased electricity, heat and steam. Upload your bills and meter data, or enter values manually below."
    >
      <Card
        title="Upload your records"
        subtitle="Electricity & heat bills, meter / consumption exports. For electricity, we split grid vs on-site / open-access renewable."
        className="mb-6"
      >
        <DataUpload
          accept=".xlsx,.xls,.csv,.pdf"
          mapsTo="Scope 2 · electricity & heat"
          hint="Meter/consumption spreadsheets are parsed here; PDF utility bills are queued for server-side extraction."
        />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Purchased electricity" subtitle="Location-based method uses your country's grid factor.">
          <div className="space-y-4">
            <div>
              <label className="field-label">Total electricity consumed</label>
              <div className="flex">
                <input className="text-input rounded-r-none" placeholder="e.g. 4,200,000" defaultValue="4,200,000" />
                <span className="inline-flex items-center rounded-r-lg border border-l-0 border-surface-border bg-surface-subtle px-3 text-xs font-medium text-ink-soft">
                  kWh
                </span>
              </div>
            </div>
            <div>
              <label className="field-label">Grid region</label>
              <select className="text-input" defaultValue="Netherlands">
                <option>Netherlands</option>
                <option>Belgium</option>
                <option>Germany</option>
                <option>France</option>
              </select>
            </div>
            <div>
              <p className="field-label">Do you have a supplier-specific (market-based) emission factor?</p>
              <RadioGroup name="market-based" value={hasMarketData} onChange={setHasMarketData} />
            </div>
            {hasMarketData === 'yes' && (
              <div>
                <label className="field-label">Supplier emission factor</label>
                <div className="flex">
                  <input className="text-input rounded-r-none" placeholder="e.g. 0.21" />
                  <span className="inline-flex items-center rounded-r-lg border border-l-0 border-surface-border bg-surface-subtle px-3 text-xs font-medium text-ink-soft">
                    kgCO₂e/kWh
                  </span>
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card title="Purchased heat & steam" subtitle="District heating or steam bought from a third party.">
          <div className="space-y-4">
            <div>
              <label className="field-label">Purchased heat</label>
              <div className="flex">
                <input className="text-input rounded-r-none" placeholder="e.g. 120,000" />
                <span className="inline-flex items-center rounded-r-lg border border-l-0 border-surface-border bg-surface-subtle px-3 text-xs font-medium text-ink-soft">
                  kWh
                </span>
              </div>
            </div>
            <div>
              <label className="field-label">Purchased steam</label>
              <div className="flex">
                <input className="text-input rounded-r-none" placeholder="e.g. 0" />
                <span className="inline-flex items-center rounded-r-lg border border-l-0 border-surface-border bg-surface-subtle px-3 text-xs font-medium text-ink-soft">
                  kWh
                </span>
              </div>
            </div>
            <div className="rounded-lg bg-accenture-50 p-3 text-sm text-accenture-800">
              Tip: if you buy renewable electricity through a green tariff or PPA, you can record it
              under the market-based method for a lower Scope 2 figure.
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate(ROUTES.scope1)}>
          ← Back
        </Button>
        <Button size="lg" onClick={() => navigate(ROUTES.scope3Relevance)}>
          Continue to Scope 3 →
        </Button>
      </div>
    </PageShell>
  );
}
