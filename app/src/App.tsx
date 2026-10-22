import { Route, Routes } from 'react-router-dom';
import { ROUTES } from './routes';
import { Login } from './pages/Login';
import { Onboarding } from './pages/Onboarding';
import { Scope1 } from './pages/Scope1';
import { Scope2 } from './pages/Scope2';
import { Scope3Relevance } from './pages/Scope3Relevance';
import { Scope3Questionnaire } from './pages/Scope3Questionnaire';
import { Results } from './pages/Results';
import { AllCalculations } from './pages/AllCalculations';
import { EsgScore } from './pages/EsgScore';
import { Levers } from './pages/Levers';
import { ReportPreview } from './pages/ReportPreview';
import { LeadershipDashboard } from './pages/LeadershipDashboard';
import { RmDashboard } from './pages/RmDashboard';

export default function App() {
  return (
    <Routes>
      <Route path={ROUTES.login} element={<Login />} />
      <Route path={ROUTES.onboarding} element={<Onboarding />} />
      <Route path={ROUTES.scope1} element={<Scope1 />} />
      <Route path={ROUTES.scope2} element={<Scope2 />} />
      <Route path={ROUTES.scope3Relevance} element={<Scope3Relevance />} />
      <Route path="/scope-3/category/:id" element={<Scope3Questionnaire />} />
      <Route path={ROUTES.results} element={<Results />} />
      <Route path={ROUTES.calculations} element={<AllCalculations />} />
      <Route path={ROUTES.esg} element={<EsgScore />} />
      <Route path={ROUTES.levers} element={<Levers />} />
      <Route path={ROUTES.report} element={<ReportPreview />} />
      <Route path={ROUTES.leadership} element={<LeadershipDashboard />} />
      <Route path={ROUTES.rm} element={<RmDashboard />} />
      <Route path="*" element={<Login />} />
    </Routes>
  );
}
