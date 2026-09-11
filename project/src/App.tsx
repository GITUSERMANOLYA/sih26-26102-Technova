import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Dashboard from '@/pages/Dashboard';
import WorksExplorer from '@/pages/WorksExplorer';
import WorkDetail from '@/pages/WorkDetail';
import RiskAlerts from '@/pages/RiskAlerts';
import Analytics from '@/pages/Analytics';
import Methodology from '@/pages/Methodology';
import DemoLogin, { DemoRole } from '@/pages/DemoLogin';

type Page = 'dashboard' | 'works' | 'alerts' | 'analytics' | 'methodology';

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [selectedWorkId, setSelectedWorkId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [role, setRole] = useState<DemoRole | null>(null);

  useEffect(() => {
    const handler = () => setSidebarOpen(false);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const handleLogin = (selectedRole: DemoRole, workId?: string) => {
    setRole(selectedRole);
    setSelectedWorkId(workId || null);
    setPage('dashboard');
  };

  const handleLogout = () => {
    setRole(null);
    setSelectedWorkId(null);
    setSidebarOpen(false);
  };

  const navigateToWork = (workId: string) => {
    setSelectedWorkId(workId);
  };

  const closeWorkDetail = () => {
    setSelectedWorkId(null);
  };

  const navigate = (p: Page) => {
    setPage(p);
    setSelectedWorkId(null);
    setSidebarOpen(false);
  };

  if (!role) {
    return <DemoLogin onLogin={handleLogin} />;
  }

  let content;
  if (selectedWorkId) {
    content = <WorkDetail workId={selectedWorkId} onBack={closeWorkDetail} onNavigate={navigate} />;
  } else {
    switch (page) {
      case 'dashboard':
        content = <Dashboard onNavigate={navigate} onSelectWork={navigateToWork} />;
        break;
      case 'works':
        content = <WorksExplorer onSelectWork={navigateToWork} />;
        break;
      case 'alerts':
        content = <RiskAlerts onSelectWork={navigateToWork} />;
        break;
      case 'analytics':
        content = <Analytics />;
        break;
      case 'methodology':
        content = <Methodology />;
        break;
      default:
        content = <Dashboard onNavigate={navigate} onSelectWork={navigateToWork} />;
    }
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar
        currentPage={page}
        onNavigate={navigate}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        role={role}
        onLogout={handleLogout}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-slate-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-semibold text-slate-800">MPLADS AI Monitor</span>
          <div className="w-10" />
        </header>
        <main className="flex-1 overflow-y-auto">{content}</main>
      </div>
    </div>
  );
}
