import { useEffect, useState } from 'react';
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { INDIAN_STATES_AND_UTS, supabase } from '@/lib/supabase';

export type DemoRole = {
  id: string;
  label: string;
  description: string;
};

export const DEMO_ROLES: DemoRole[] = [
  {
    id: 'ministry',
    label: 'Ministry Official',
    description: 'See everything across the MPLADS programme',
  },
  {
    id: 'state',
    label: 'State Nodal Authority',
    description: 'See works within one state',
  },
  {
    id: 'district',
    label: 'District Authority',
    description: 'See works within one constituency',
  },
  {
    id: 'mp',
    label: 'Member of Parliament',
    description: 'See your own recommended works',
  },
];

type WorkOption = {
  work_id: string;
  work_title: string | null;
  state: string | null;
  mp_name: string | null;
  constituency: string | null;
  lifecycle_stage: string | null;
  risk_tier: string | null;
  reason: string | null;
};

interface DemoLoginProps {
  onLogin: (role: DemoRole, workId?: string) => void;
}

export default function DemoLogin({ onLogin }: DemoLoginProps) {
  const [selectedRoleId, setSelectedRoleId] = useState(DEMO_ROLES[0].id);
  const [selectedState, setSelectedState] = useState('');
  const [selectedConstituency, setSelectedConstituency] = useState('');
  const [selectedMp, setSelectedMp] = useState('');
  const [selectedWorkId, setSelectedWorkId] = useState('');
  const [workOptions, setWorkOptions] = useState<WorkOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const selectedRole = DEMO_ROLES.find((role) => role.id === selectedRoleId) || DEMO_ROLES[0];
  const backendStates = workOptions.map((work) => work.state).filter((value): value is string => Boolean(value));
  const states = Array.from(new Set([...INDIAN_STATES_AND_UTS, ...backendStates])).sort();
  const constituencies = Array.from(new Set(workOptions.map((work) => work.constituency).filter((value): value is string => Boolean(value)))).sort();
  const mpNames = Array.from(new Set(workOptions.map((work) => work.mp_name).filter((value): value is string => Boolean(value)))).sort();
  const selectedWork = workOptions.find((work) => work.work_id === selectedWorkId);

  useEffect(() => {
    async function loadOptions() {
      const { data } = await supabase
        .from('mplads_works')
        .select('work_id, work_title, state, mp_name, constituency, lifecycle_stage, risk_tier, reason')
        .order('work_id', { ascending: true })
        .range(0, 4999);
      setWorkOptions((data as WorkOption[]) || []);
      setLoadingOptions(false);
    }
    loadOptions();
  }, []);

  const handleRoleChange = (roleId: string) => {
    setSelectedRoleId(roleId);
    setSelectedState('');
    setSelectedConstituency('');
    setSelectedMp('');
  };

  return (
    <div className="min-h-screen bg-[#f5f8fa] text-slate-800">
      <div className="h-12 bg-[#0b0f14] flex items-center justify-end px-5">
        <span className="text-[11px] text-slate-500">DEMO ENVIRONMENT</span>
      </div>

      <main className="max-w-6xl mx-auto px-5 py-14 sm:py-20">
        <div className="flex items-center gap-4 mb-7">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-900/10">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-[28px] sm:text-[34px] font-bold tracking-tight text-[#0f4960]">
              MPLADS Anomaly &amp; Risk Monitor
            </h1>
            <p className="text-sm text-slate-500 mt-1">AI-powered decision support for public development works</p>
          </div>
        </div>

        <div className="bg-white border-l-4 border-[#0f6070] rounded-r-xl px-5 py-4 shadow-sm mb-8">
          <p className="text-sm leading-6 text-slate-700">
            This tool looks through MPLADS government development works and highlights the ones that look risky — unusual costs, missed deadlines, payments released before work was finished, possible duplicate projects, missing proof of completion, and projects likely to run late.
          </p>
          <p className="text-xs text-slate-500 mt-2">This is a temporary demo session. Nothing is saved to your profile.</p>
        </div>

        <section className="max-w-3xl">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Choose a demo access level</h2>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <label htmlFor="demo-role" className="block text-sm font-medium text-slate-700 mb-2">
              Login as
            </label>
            <select
              id="demo-role"
              value={selectedRoleId}
              onChange={(event) => handleRoleChange(event.target.value)}
              className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              {DEMO_ROLES.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.label} ({role.description})
                </option>
              ))}
            </select>

            {selectedRoleId === 'state' && (
              <div className="mt-4">
                <label htmlFor="demo-state" className="block text-sm font-medium text-slate-700 mb-2">Select State</label>
                <select
                  id="demo-state"
                  value={selectedState}
                  onChange={(event) => setSelectedState(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="">Choose a state</option>
                  {states.map((state) => <option key={state} value={state}>{state}</option>)}
                </select>
              </div>
            )}

            {selectedRoleId === 'district' && (
              <div className="mt-4">
                <label htmlFor="demo-constituency" className="block text-sm font-medium text-slate-700 mb-2">Select Constituency</label>
                <select
                  id="demo-constituency"
                  value={selectedConstituency}
                  onChange={(event) => setSelectedConstituency(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="">Choose a constituency</option>
                  {constituencies.map((constituency) => <option key={constituency} value={constituency}>{constituency}</option>)}
                </select>
              </div>
            )}

            {selectedRoleId === 'mp' && (
              <div className="mt-4">
                <label htmlFor="demo-mp" className="block text-sm font-medium text-slate-700 mb-2">Select MP</label>
                <select
                  id="demo-mp"
                  value={selectedMp}
                  onChange={(event) => setSelectedMp(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="">Choose an MP</option>
                  {mpNames.map((mpName) => <option key={mpName} value={mpName}>{mpName}</option>)}
                </select>
              </div>
            )}

            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-lg bg-slate-50 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">{selectedRole.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{selectedRole.description}</p>
              </div>
              <button
                type="button"
                onClick={() => onLogin(selectedRole)}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0f6070] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0b4e5c] focus:outline-none focus:ring-4 focus:ring-cyan-100"
              >
                Enter dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        <section className="max-w-3xl mt-8">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Look at one specific work</h2>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <label htmlFor="work-id" className="block text-sm font-medium text-slate-700 mb-2">Work ID</label>
            <select
              id="work-id"
              value={selectedWorkId}
              disabled={loadingOptions || workOptions.length === 0}
              onChange={(event) => setSelectedWorkId(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
            >
              <option value="">{loadingOptions ? 'Loading work IDs...' : 'Choose a work ID'}</option>
              {workOptions.map((work) => <option key={work.work_id} value={work.work_id}>{work.work_id}</option>)}
            </select>

            {selectedWork && (
              <pre className="mt-4 overflow-x-auto rounded-lg bg-[#0b0f14] p-4 text-xs leading-6 text-slate-200">
                {JSON.stringify({
                  'Work Title': selectedWork.work_title,
                  State: selectedWork.state,
                  'MP Name': selectedWork.mp_name,
                  Status: selectedWork.lifecycle_stage,
                  'Risk Tier': selectedWork.risk_tier,
                  Reason: selectedWork.reason,
                }, null, 2)}
              </pre>
            )}

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                disabled={!selectedWorkId}
                onClick={() => onLogin(selectedRole, selectedWorkId)}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0f6070] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0b4e5c] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Open this work
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
