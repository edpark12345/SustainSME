import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { Button } from '../components/Button';
import { GuideNote } from '../components/GuideNote';
import { EmissionsWorkbench } from '../components/EmissionsWorkbench';
import { ROUTES } from '../routes';

export function Scope1() {
  const navigate = useNavigate();
  return (
    <PageShell
      title="Scope 1 — Direct emissions"
      subtitle="Emissions from sources you own or control. Upload fuel bills and refrigerant/asset lists; the model structures them and you review before calculating."
    >
      <GuideNote
        title="What counts here"
        tips={[
          'Helpful sources: gas / fuel-oil bills, fuel-card totals for company vehicles, AC or refrigerant service records.',
          'The more of these you can provide, the more reliable your result — anything missing is flagged transparently.',
        ]}
      >
        Direct emissions from things you <strong>burn or own</strong> — gas/oil boilers, company
        vehicles, and refrigerant top-ups. Enter what you have; leave the rest blank.
      </GuideNote>

      <EmissionsWorkbench focus="1" />

      <div className="mt-6 flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate(ROUTES.onboarding)}>← Back</Button>
        <Button size="lg" onClick={() => navigate(ROUTES.scope2)}>Continue to Scope 2 →</Button>
      </div>
    </PageShell>
  );
}
