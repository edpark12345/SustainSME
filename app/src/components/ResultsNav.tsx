import { Link, useLocation } from 'react-router-dom';
import { ROUTES } from '../routes';

const tabs = [
  { label: 'Emissions', to: ROUTES.results },
  { label: 'All calculations', to: ROUTES.calculations },
  { label: 'ESG Score', to: ROUTES.esg },
  { label: 'Decarbonization Levers', to: ROUTES.levers },
  { label: 'PDF Report', to: ROUTES.report },
];

export function ResultsNav() {
  const { pathname } = useLocation();
  return (
    <div className="mb-6 flex flex-wrap gap-1 rounded-lg border border-surface-border bg-white p-1">
      {tabs.map((t) => {
        const active = pathname === t.to;
        return (
          <Link
            key={t.to}
            to={t.to}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              active ? 'bg-accenture text-white' : 'text-ink-soft hover:bg-surface-subtle'
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
