import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/accenture-logo.png';
import { ROUTES } from '../routes';

const navLinks = [
  { label: 'Assessment', to: ROUTES.scope3Relevance },
  { label: 'Results', to: ROUTES.results },
  { label: 'Leadership', to: ROUTES.leadership },
  { label: 'Relationship Manager', to: ROUTES.rm },
];

export function Navbar() {
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-30 border-b border-surface-border bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link to={ROUTES.onboarding} className="flex items-center gap-3">
            <img src={logo} alt="Accenture" className="h-6 w-auto" />
            <span className="hidden text-sm font-semibold text-ink sm:inline">
              <span className="text-accenture">|</span> SustainSME
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => {
              const active = pathname.startsWith(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-accenture-50 text-accenture-700'
                      : 'text-ink-soft hover:bg-surface-subtle hover:text-ink'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accenture-100 text-sm font-semibold text-accenture-700">
            AB
          </div>
          <span className="hidden text-sm font-medium text-ink-soft sm:inline">Hello ABC</span>
        </div>
      </div>
    </header>
  );
}
