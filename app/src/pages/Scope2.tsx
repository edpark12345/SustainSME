import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { Button } from '../components/Button';
import { GuideNote } from '../components/GuideNote';
import { EmissionsWorkbench } from '../components/EmissionsWorkbench';
import { ROUTES } from '../routes';

export function Scope2() {
  const navigate = useNavigate();
  return (
    <PageShell
      title="Scope 2 — Energy indirect emissions"
      subtitle="Emissions from purchased electricity, heat and steam. Upload bills; if some of your power is generated on-site (e.g. your own solar), tell us how much of the total came from the grid — the grid part is what counts here."
    >
      <GuideNote
        title="What counts here"
        tips={[
          "No electricity bill? Add floor area + building type and we'll estimate it (clearly flagged 'estimated').",
          "Don't know your renewable mix? Fine — we use your country's grid average unless you hold a form of renewable-energy certificate (e.g. REC, GO, or a renewable power contract).",
          'If some of your power comes from your own on-site solar or a renewable contract, enter that separately — only grid electricity is charged the grid factor.',
        ]}
      >
        Emissions from the <strong>energy you buy</strong> — mainly electricity. Enter the kWh from
        your bill (or let us estimate it).
      </GuideNote>

      <EmissionsWorkbench focus="2" />

      <div className="mt-6 flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate(ROUTES.scope1)}>← Back</Button>
        <Button size="lg" onClick={() => navigate(ROUTES.scope3Relevance)}>Continue to Scope 3 →</Button>
      </div>
    </PageShell>
  );
}
