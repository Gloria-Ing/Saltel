import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './contexts/AppContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import TasksPage from './pages/TasksPage';
import NewTaskPage from './pages/NewTaskPage';
import WorkingPlanPage from './pages/WorkingPlanPage';
import ReportsPage from './pages/ReportsPage';
import RequisitionPage from './pages/RequisitionPage';
import PaymentsPage from './pages/PaymentsPage';
import PerformancePage from './pages/PerformancePage';
import TeamPage from './pages/TeamPage';
import SalaryPage from './pages/SalaryPage';
import LeavePage from './pages/LeavePage';
import SitesPage from './pages/SitesPage';
import ChatPage from './pages/ChatPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import ProfilePage from './pages/ProfilePage';
import DAFFinancePage from './pages/DAFFinancePage';
import PromotionsPage from './pages/PromotionsPage';
import AIAssistantPage from './pages/AIAssistantPage';
import AttendancePage from './pages/AttendancePage';

const BASE = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

function AppRoutes() {
  const { currentUser } = useApp();
  if (!currentUser) return <LoginPage />;
  return (
    <Layout>
      <Routes>
        <Route path="/"              element={<Dashboard />} />
        <Route path="/tasks"         element={<TasksPage />} />
        <Route path="/tasks/new"     element={<NewTaskPage />} />
        <Route path="/working-plan"  element={<WorkingPlanPage />} />
        <Route path="/attendance"    element={<AttendancePage />} />
        <Route path="/reports"       element={<ReportsPage />} />
        <Route path="/requisitions"  element={<RequisitionPage />} />
        <Route path="/payments"      element={<PaymentsPage />} />
        <Route path="/performance"   element={<PerformancePage />} />
        <Route path="/team"          element={<TeamPage />} />
        <Route path="/salary"        element={<SalaryPage />} />
        <Route path="/leave"         element={<LeavePage />} />
        <Route path="/sites"         element={<SitesPage />} />
        <Route path="/chat"          element={<ChatPage />} />
        <Route path="/announcements" element={<AnnouncementsPage />} />
        <Route path="/profile"       element={<ProfilePage />} />
        <Route path="/daf-finance"   element={<DAFFinancePage />} />
        <Route path="/promotions"    element={<PromotionsPage />} />
        <Route path="/ai-assistant"  element={<AIAssistantPage />} />
        <Route path="*"              element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <AppProvider>
      <BrowserRouter basename={BASE}>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
