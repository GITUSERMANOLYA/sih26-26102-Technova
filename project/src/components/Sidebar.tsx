import { ShieldCheck, LayoutDashboard, Search, AlertTriangle, BarChart3, Brain, X, LogOut, UserCircle } from 'lucide-react';
import type { DemoRole } from '@/pages/DemoLogin';

type Page = 'dashboard' | 'works' | 'alerts' | 'analytics' | 'methodology';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  open: boolean;
  onClose: () => void;
  role: DemoRole | null;
  onLogout: () => void;
}

const navItems: { id: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'works', label: 'Works Explorer', icon: Search },
  { id: 'alerts', label: 'Risk Alerts', icon: AlertTriangle },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'methodology', label: 'AI Methodology', icon: Brain },
];

export default function Sidebar({ currentPage, onNavigate, open, onClose, role, onLogout }: SidebarProps) {
  return (
    <>
      {open && (
        <div className="lg:hidden fixed inset-0 bg-slate-900/50 z-40" onClick={onClose} />
      )}
      <aside
        className={`${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } fixed lg:static z-50 w-64 h-full bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300`}
      >
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-sm leading-tight">MPLADS</h1>
              <p className="text-xs text-slate-400">AI Monitor</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {role && (
          <div className="px-3 py-3 border-t border-slate-700/50">
            <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-slate-800/50">
              <UserCircle className="w-8 h-8 text-slate-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{role.label}</p>
                <p className="text-[10px] text-slate-500 truncate">{role.description}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        )}

        <div className="px-5 py-4 border-t border-slate-700/50">
          <div className="text-xs text-slate-500 leading-relaxed">
            <p className="font-semibold text-slate-400 mb-1">MoSPI · DIID</p>
            <p>Members of Parliament Local Area Development Scheme</p>
            <p className="mt-2 text-slate-600">AI-Powered Monitoring & Analytics</p>
          </div>
        </div>
      </aside>
    </>
  );
}
