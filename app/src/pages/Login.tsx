import { useNavigate } from 'react-router-dom';
import logo from '../assets/accenture-logo.png';
import { Button } from '../components/Button';
import { ROUTES } from '../routes';

export function Login() {
  const navigate = useNavigate();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(ROUTES.onboarding);
  };

  return (
    <div className="grid min-h-full lg:grid-cols-2">
      {/* Left: brand panel */}
      <div className="relative hidden flex-col justify-between bg-accenture-700 p-12 text-white lg:flex">
        <img src={logo} alt="Accenture" className="h-7 w-auto self-start brightness-0 invert" />
        <div>
          <h1 className="text-4xl font-bold leading-tight">SustainSME</h1>
          <p className="mt-4 max-w-md text-lg text-accenture-100">
            The SME decarbonization platform — measure Scope 1, 2 & 3 emissions, benchmark your
            ESG score, and act on tailored decarbonization levers.
          </p>
        </div>
        <div className="flex gap-8 text-sm text-accenture-100">
          <div>
            <p className="text-2xl font-bold text-white">15</p>
            <p>Scope 3 categories</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">0–100</p>
            <p>ESG score</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">6+</p>
            <p>Decarb levers</p>
          </div>
        </div>
      </div>

      {/* Right: login form */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <img src={logo} alt="Accenture" className="mb-8 h-6 w-auto lg:hidden" />
          <h2 className="text-2xl font-bold text-ink">Sign in</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Welcome back. Sign in to continue your carbon assessment.
          </p>

          <form className="mt-8 space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="field-label" htmlFor="email">
                Work email
              </label>
              <input
                id="email"
                type="email"
                className="text-input"
                placeholder="you@company.com"
                defaultValue="demo@company.com"
              />
            </div>
            <div>
              <label className="field-label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="text-input"
                placeholder="••••••••"
                defaultValue="demo1234"
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="inline-flex items-center gap-2 text-ink-soft">
                <input type="checkbox" defaultChecked className="accent-accenture" /> Remember me
              </label>
              <a className="font-medium text-accenture-700 hover:underline" href="#">
                Forgot password?
              </a>
            </div>
            <Button type="submit" size="lg" className="w-full">
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-soft">
            New here?{' '}
            <button
              className="font-semibold text-accenture-700 hover:underline"
              onClick={() => navigate(ROUTES.onboarding)}
            >
              Set up your company
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
