import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { RadioGroup } from '../components/RadioGroup';
import { GuideNote } from '../components/GuideNote';
import { useAssessment } from '../context/AssessmentContext';
import { ENTITY_SIZES, SECTORS, SECTOR_NACE } from '../data/dummyData';
import { ROUTES } from '../routes';

const CURRENCIES = ['EUR', 'USD', 'GBP', 'INR'];

export function Onboarding() {
  const navigate = useNavigate();
  const { profile, setProfile } = useAssessment();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(ROUTES.scope1);
  };

  return (
    <PageShell
      title="Company onboarding"
      subtitle="Tell us about your company. This profile shapes your benchmarks and decarbonization recommendations."
    >
      <form onSubmit={onSubmit}>
        <GuideNote title="Just the basics to start">
          Your sector and location set your electricity grid factor and who we benchmark you
          against — no sustainability know-how needed. Add what's relevant to your business;
          anything you can't provide, we estimate and flag transparently.
        </GuideNote>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card title="Company details" className="lg:col-span-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="field-label">Company name</label>
                <input
                  className="text-input"
                  value={profile.companyName}
                  onChange={(e) => setProfile({ companyName: e.target.value })}
                />
              </div>
              <div>
                <label className="field-label">Sector</label>
                <select
                  className="text-input"
                  value={profile.sector}
                  onChange={(e) =>
                    setProfile({ sector: e.target.value, naceCode: SECTOR_NACE[e.target.value] ?? '' })
                  }
                >
                  <option value="">Select your sector</option>
                  {SECTORS.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="field-label">Sector code (NACE)</label>
                <input
                  className="text-input bg-surface-subtle text-ink-soft"
                  placeholder="Select a sector above"
                  value={profile.naceCode}
                  readOnly
                />
                <p className="mt-1 text-xs text-ink-muted">
                  Auto-filled from your sector — drives EEIO mapping and the sector benchmark.
                </p>
              </div>
              <div>
                <label className="field-label">Entity size</label>
                <select
                  className="text-input"
                  value={profile.entitySize}
                  onChange={(e) => setProfile({ entitySize: e.target.value })}
                >
                  {ENTITY_SIZES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-ink-muted">
                  Based on employee headcount and annual revenue — used only to choose the right peer
                  group for benchmarking.
                </p>
              </div>
              <div>
                <label className="field-label">Country (headquarters)</label>
                <input
                  className="text-input"
                  placeholder="e.g. India"
                  value={profile.country}
                  onChange={(e) => setProfile({ country: e.target.value })}
                />
                <p className="mt-1 text-xs text-ink-muted">
                  Your head-office country — not every site. It sets the default electricity grid factor.
                </p>
              </div>
              <div>
                <label className="field-label">Region (of headquarters)</label>
                <input
                  className="text-input"
                  placeholder="e.g. Maharashtra"
                  value={profile.region}
                  onChange={(e) => setProfile({ region: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="field-label">
                  Operational boundary — include employee housing / staff colony?
                </label>
                <RadioGroup
                  name="includeEmployeeHousing"
                  value={profile.includeEmployeeHousing}
                  onChange={(v) => setProfile({ includeEmployeeHousing: v })}
                />
                <p className="mt-1 text-xs text-ink-muted">
                  Energy for staff housing sometimes sits on the company's utility bills — decide
                  whether it belongs inside the reporting boundary. Most SMEs exclude it.
                </p>
              </div>
            </div>
          </Card>

          <Card title="Reporting basis">
            <div className="space-y-4">
              <div>
                <label className="field-label">Reporting year</label>
                <select
                  className="text-input"
                  value={profile.reportingYear}
                  onChange={(e) => setProfile({ reportingYear: e.target.value })}
                >
                  {['2024', '2023', '2022'].map((y) => (
                    <option key={y}>{y}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-ink-muted">
                  The 12 months this covers — calendar year (Jan–Dec) unless your data is for a fiscal
                  year (e.g. FY24 = Apr 2023–Mar 2024). This drives which emission factors we apply.
                </p>
              </div>
              <div>
                <label className="field-label">Number of employees</label>
                <input
                  className="text-input"
                  type="number"
                  value={profile.employees}
                  onChange={(e) => setProfile({ employees: e.target.value })}
                />
              </div>
              <div>
                <label className="field-label">Reporting currency</label>
                <select
                  className="text-input"
                  value={profile.revenueCurrency}
                  onChange={(e) => setProfile({ revenueCurrency: e.target.value })}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="field-label">Annual revenue (Mn)</label>
                <input
                  className="text-input"
                  type="number"
                  value={profile.revenue}
                  onChange={(e) => setProfile({ revenue: e.target.value })}
                />
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-6 flex justify-end">
          <Button type="submit" size="lg">
            Continue to Scope 1 →
          </Button>
        </div>
      </form>
    </PageShell>
  );
}
