import { ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between px-5 py-4 border-b border-slate-100">
      <div>
        <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function RiskBadge({ tier, size = 'sm' }: { tier: string; size?: 'sm' | 'md' }) {
  const styles: Record<string, string> = {
    High: 'bg-red-50 text-red-700 border-red-200',
    Medium: 'bg-amber-50 text-amber-700 border-amber-200',
    Low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };
  const sizeClass = size === 'md' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-medium ${styles[tier] || styles.Low} ${sizeClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${tier === 'High' ? 'bg-red-500' : tier === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
      {tier}
    </span>
  );
}

export function StatCard({
  label,
  value,
  sublabel,
  icon,
  color = 'blue',
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  icon?: ReactNode;
  color?: 'blue' | 'red' | 'amber' | 'emerald' | 'slate' | 'purple';
}) {
  const colors: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600',
    red: 'from-red-500 to-red-600',
    amber: 'from-amber-500 to-amber-600',
    emerald: 'from-emerald-500 to-emerald-600',
    slate: 'from-slate-500 to-slate-600',
    purple: 'from-purple-500 to-purple-600',
  };
  return (
    <Card className="overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
            {sublabel && <p className="text-xs text-slate-400 mt-1">{sublabel}</p>}
          </div>
          {icon && (
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colors[color]} flex items-center justify-center text-white`}>
              {icon}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-3 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="mb-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
      <p className="text-sm">{message}</p>
    </div>
  );
}
