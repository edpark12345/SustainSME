import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { DataUpload } from '../components/DataUpload';
import { ROUTES } from '../routes';

interface InputRow {
  label: string;
  unit: string;
  placeholder: string;
}

const sections: { title: string; hint: string; rows: InputRow[] }[] = [
  {
    title: 'Stationary combustion',
    hint: 'Fuels burned in fixed equipment you own or control (boilers, furnaces, generators).',
    rows: [
      { label: 'Natural gas', unit: 'm³', placeholder: 'e.g. 240,000' },
      { label: 'Diesel (generators)', unit: 'Litres', placeholder: 'e.g. 18,500' },
      { label: 'LPG', unit: 'kg', placeholder: 'e.g. 6,200' },
    ],
  },
  {
    title: 'Mobile combustion',
    hint: 'Fuels burned in owned/controlled vehicles — cars, trucks, forklifts.',
    rows: [
      { label: 'Petrol (fleet)', unit: 'Litres', placeholder: 'e.g. 32,000' },
      { label: 'Diesel (fleet)', unit: 'Litres', placeholder: 'e.g. 54,000' },
    ],
  },
  {
    title: 'Fugitive emissions',
    hint: 'Refrigerant and other gas leaks from owned equipment.',
    rows: [
      { label: 'Refrigerant R-410A top-up', unit: 'kg', placeholder: 'e.g. 120' },
      { label: 'CO₂ (fire suppression)', unit: 'kg', placeholder: 'e.g. 40' },
    ],
  },
];

export function Scope1() {
  const navigate = useNavigate();

  return (
    <PageShell
      title="Scope 1 — Direct emissions"
      subtitle="Emissions from sources your company owns or controls. Upload your records, or enter the activity data manually below."
    >
      <Card
        title="Upload your records"
        subtitle="Fuel consumption logs, gas/diesel delivery invoices, refrigerant or AC inventory lists."
        className="mb-6"
      >
        <DataUpload
          accept=".xlsx,.xls,.csv,.pdf"
          mapsTo="Scope 1 · fuels & refrigerants"
          hint="Spreadsheets are parsed here; PDF invoices are queued for server-side extraction."
        />
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {sections.map((section) => (
          <Card key={section.title} title={section.title} subtitle={section.hint}>
            <div className="space-y-4">
              {section.rows.map((row) => (
                <div key={row.label}>
                  <label className="field-label">{row.label}</label>
                  <div className="flex">
                    <input className="text-input rounded-r-none" placeholder={row.placeholder} />
                    <span className="inline-flex items-center rounded-r-lg border border-l-0 border-surface-border bg-surface-subtle px-3 text-xs font-medium text-ink-soft">
                      {row.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate(ROUTES.onboarding)}>
          ← Back
        </Button>
        <Button size="lg" onClick={() => navigate(ROUTES.scope2)}>
          Continue to Scope 2 →
        </Button>
      </div>
    </PageShell>
  );
}
