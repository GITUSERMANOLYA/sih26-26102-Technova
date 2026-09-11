import { useState, useEffect } from 'react';
import { Work, RISK_FLAGS } from '@/lib/supabase';
import { formatCurrency } from '@/lib/format';
import { Card, CardHeader, StatCard, RiskBadge, Spinner, PageHeader, EmptyState } from '@/components/ui';
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, Legend, AreaChart, Area, CartesianGrid,
} from 'recharts';
import {
  Wallet, AlertTriangle, CheckCircle2, Clock, TrendingUp, Building2,
  ArrowRight, Activity,
} from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000';

type Page = 'dashboard' | 'works' | 'alerts' | 'analytics' | 'methodology';

interface DashboardProps {
  onNavigate: (page: Page) => void;
  onSelectWork: (workId: string) => void;
}

interface DashboardStats {
  totalWorks: number;
  completedWorks: number;
  inProgressWorks: number;
  totalSanctioned: number;
  totalDisbursed: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  flagCounts: Record<string, number>;
  stateDistribution: { state: string; count: number; highRisk: number }[];
  categoryDistribution: { name: string; value: number }[];
  lifecycleDistribution: { name: string; value: number }[];
  topRiskyWorks: Work[];
  yearlyTrend: { year: string; sanctioned: number; completed: number }[];
}

interface ApiWork {
  [key: string]: any;
}

function value(row: ApiWork, ...keys: string[]) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
      return row[key];
    }
  }
  return null;
}

function numberValue(row: ApiWork, ...keys: string[]) {
  const v = value(row, ...keys);
  if (v === null) return 0;

  const n = Number(String(v).replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function boolValue(row: ApiWork, ...keys: string[]) {
  const v = value(row, ...keys);

  if (typeof v === 'boolean') return v;

  if (v === null) return false;

  const text = String(v).trim().toLowerCase();

  return (
    text === 'true' ||
    text === '1' ||
    text === 'yes' ||
    text === 'y' ||
    text === 'flagged'
  );
}

function normalizeWork(row: ApiWork): Work {
  return {
    work_id: String(
      value(row, 'Work ID', 'Work_ID', 'work_id', 'id', 'ID') || ''
    ),

    work_title: value(row, 'Work Title', 'Work_Title', 'work_title', 'Title') || '',
    lifecycle_stage: value(row, 'lifecycle_stage', 'Lifecycle Stage') || '',
    state: value(row, 'State', 'state') || '',
    work_category: value(row, 'Work Category', 'Work_Category', 'work_category', 'Category') || '',
    ida: value(row, 'IDA', 'ida') || '',
    mp_name: value(row, 'MP Name', 'MP_Name', 'mp_name') || '',
    mp_term: value(row, 'MP Term', 'MP_Term', 'mp_term') || '',
    chamber: value(row, 'Chamber', 'chamber') || '',
    work_description: value(row, 'Work Description', 'Work_Description', 'work_description') || '',
    constituency: value(row, 'Constituency', 'constituency') || '',

    rec_recommended_date: value(
      row,
      'Rec_Recommended date',
      'Rec_Recommended Date',
      'rec_recommended_date'
    ),

    rec_recommended_amount: numberValue(
      row,
      'Rec_Recommended Amount (Rs)',
      'Rec_Recommended amount (Rs)',
      'rec_recommended_amount'
    ),

    san_sanction_date: value(
      row,
      'San_Sanction date',
      'San_Sanction Date',
      'san_sanction_date'
    ),

    san_sanction_amount: numberValue(
      row,
      'San_Sanction Amount (Rs)',
      'San_Sanction amount (Rs)',
      'san_sanction_amount'
    ),

    san_work_status: value(
      row,
      'San_Work Status',
      'San Work Status',
      'san_work_status'
    ) || '',

    comp_completion_date: value(
      row,
      'Comp_Completion date',
      'Comp_Completion Date',
      'comp_completion_date'
    ),

    comp_amount_disbursed: numberValue(
      row,
      'Comp_Amount Disbursed (Rs)',
      'Comp_Amount disbursed (Rs)',
      'comp_amount_disbursed'
    ),

    total_fund_disbursed: numberValue(
      row,
      'Total Fund Disbursed (Rs)',
      'Total_Fund_Disbursed',
      'total_fund_disbursed'
    ),

    num_payments: numberValue(
      row,
      'Num Payments',
      'num_payments'
    ),

    latest_payment_status: value(
      row,
      'Latest Payment Status',
      'latest_payment_status'
    ) || '',

    days_rec_to_san: numberValue(
      row,
      'Days Rec to San',
      'days_rec_to_san'
    ),

    days_san_to_comp: numberValue(
      row,
      'Days San to Comp',
      'days_san_to_comp'
    ),

    san_vs_rec_diff: numberValue(
      row,
      'San vs Rec Diff',
      'san_vs_rec_diff'
    ),

    disb_vs_san_diff: numberValue(
      row,
      'Disb vs San Diff',
      'disb_vs_san_diff'
    ),

    disb_vs_pay_diff: numberValue(
      row,
      'Disb vs Pay Diff',
      'disb_vs_pay_diff'
    ),

    has_comp_image: boolValue(
      row,
      'Has Comp Image',
      'has_comp_image'
    ),

    risk_score: numberValue(
      row,
      'risk_score',
      'Risk Score'
    ),

    risk_tier: value(
      row,
      'risk_tier',
      'Risk Tier'
    ) || 'Low',

    status_group: value(
      row,
      'status_group',
      'Status Group'
    ) || '',

    timeline_flag: boolValue(
      row,
      'timeline_flag',
      'Timeline Flag'
    ),

    cost_outlier_flag: boolValue(
      row,
      'cost_outlier_flag',
      'Cost Outlier Flag'
    ),

    cost_reason: value(
      row,
      'cost_reason',
      'Cost Reason'
    ) || '',

    payment_mismatch_flag: boolValue(
      row,
      'payment_mismatch_flag',
      'Payment Mismatch Flag'
    ),

    duplicate_flag: boolValue(
      row,
      'duplicate_flag',
      'Duplicate Flag'
    ),

    no_asset_evidence_flag: boolValue(
      row,
      'no_asset_evidence_flag',
      'No Asset Evidence Flag'
    ),

    predicted_overrun_flag: boolValue(
      row,
      'predicted_overrun_flag',
      'Predicted Overrun Flag'
    ),

    early_warning_flag: boolValue(
      row,
      'early_warning_flag',
      'Early Warning Flag'
    ),

    predicted_overrun_prob: numberValue(
      row,
      'predicted_overrun_prob',
      'Predicted Overrun Prob'
    ),

    reason: value(
      row,
      'reason',
      'Reason'
    ) || '',
  } as Work;
}

export default function Dashboard({ onNavigate, onSelectWork }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        /*
         * ----------------------------------------------------------
         * FASTAPI DATA SOURCE
         * ----------------------------------------------------------
         *
         * We keep the original Bolt UI untouched.
         * Only the source of the data is changed from Supabase
         * to the FastAPI ML output.
         */

        const dashboardResponse = await fetch(`${API_BASE}/dashboard`);

        if (!dashboardResponse.ok) {
          throw new Error('Failed to load dashboard data');
        }

        const dashboard = await dashboardResponse.json();

        /*
         * Fetch all works from the FastAPI backend.
         *
         * The backend returns max 500 records per request.
         * We therefore paginate automatically.
         */

        const firstResponse = await fetch(
          `${API_BASE}/works?page=1&limit=500`
        );

        if (!firstResponse.ok) {
          throw new Error('Failed to load works');
        }

        const firstPage = await firstResponse.json();

        let allRows: ApiWork[] = firstPage.data || [];

        const totalRecords = Number(firstPage.total || allRows.length);
        const totalPages = Math.ceil(totalRecords / 500);

        if (totalPages > 1) {
          const requests: Promise<Response>[] = [];

          for (let page = 2; page <= totalPages; page++) {
            requests.push(
              fetch(`${API_BASE}/works?page=${page}&limit=500`)
            );
          }

          const responses = await Promise.all(requests);

          const pages = await Promise.all(
            responses.map(async response => {
              if (!response.ok) {
                throw new Error('Failed to load works page');
              }

              return response.json();
            })
          );

          pages.forEach(page => {
            if (Array.isArray(page.data)) {
              allRows.push(...page.data);
            }
          });
        }

        const works = allRows.map(normalizeWork);

        /*
         * ----------------------------------------------------------
         * FINANCIAL TOTALS
         * ----------------------------------------------------------
         */

        const totalSanctioned = works.reduce(
          (sum, work) => sum + (work.san_sanction_amount || 0),
          0
        );

        const totalDisbursed = works.reduce(
          (sum, work) => sum + (work.total_fund_disbursed || 0),
          0
        );

        /*
         * ----------------------------------------------------------
         * RISK COUNTS
         * ----------------------------------------------------------
         */

        const highRiskCount = works.filter(
          work => String(work.risk_tier).toLowerCase() === 'high'
        ).length;

        const mediumRiskCount = works.filter(
          work => String(work.risk_tier).toLowerCase() === 'medium'
        ).length;

        const lowRiskCount = works.filter(
          work => String(work.risk_tier).toLowerCase() === 'low'
        ).length;

        /*
         * ----------------------------------------------------------
         * RISK FLAG COUNTS
         * ----------------------------------------------------------
         */

        const flagCounts: Record<string, number> = {};

        RISK_FLAGS.forEach(flag => {
          flagCounts[flag.key] = works.filter(
            work => Boolean((work as any)[flag.key])
          ).length;
        });

        /*
         * ----------------------------------------------------------
         * STATE DISTRIBUTION
         * ----------------------------------------------------------
         */

        const stateMap = new Map<
          string,
          { count: number; highRisk: number }
        >();

        works.forEach(work => {
          const state = work.state || 'Unknown';

          if (!stateMap.has(state)) {
            stateMap.set(state, {
              count: 0,
              highRisk: 0,
            });
          }

          const entry = stateMap.get(state)!;

          entry.count++;

          if (
            String(work.risk_tier).toLowerCase() === 'high'
          ) {
            entry.highRisk++;
          }
        });

        const stateDistribution = Array.from(
          stateMap.entries()
        )
          .map(([state, stats]) => ({
            state,
            ...stats,
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        /*
         * ----------------------------------------------------------
         * CATEGORY DISTRIBUTION
         * ----------------------------------------------------------
         */

        const categoryMap = new Map<string, number>();

        works.forEach(work => {
          const category = work.work_category || 'Unknown';

          categoryMap.set(
            category,
            (categoryMap.get(category) || 0) + 1
          );
        });

        const categoryDistribution = Array.from(
          categoryMap.entries()
        ).map(([name, value]) => ({
          name,
          value,
        }));

        /*
         * ----------------------------------------------------------
         * LIFECYCLE DISTRIBUTION
         * ----------------------------------------------------------
         */

        const lifecycleMap = new Map<string, number>();

        works.forEach(work => {
          const lifecycle = work.lifecycle_stage || 'Unknown';

          lifecycleMap.set(
            lifecycle,
            (lifecycleMap.get(lifecycle) || 0) + 1
          );
        });

        const lifecycleDistribution = Array.from(
          lifecycleMap.entries()
        ).map(([name, value]) => ({
          name,
          value,
        }));

        /*
         * ----------------------------------------------------------
         * TOP 5 HIGHEST-RISK WORKS
         * ----------------------------------------------------------
         */

        const topRiskyWorks = [...works]
          .sort(
            (a, b) =>
              Number(b.risk_score || 0) -
              Number(a.risk_score || 0)
          )
          .slice(0, 5);

        /*
         * ----------------------------------------------------------
         * YEARLY TREND
         * ----------------------------------------------------------
         */

        const yearMap = new Map<
          string,
          { sanctioned: number; completed: number }
        >();

        works.forEach(work => {
          const sanctionDate = work.san_sanction_date;
          const completionDate = work.comp_completion_date;

          if (sanctionDate) {
            const year = String(sanctionDate).substring(0, 4);

            if (!yearMap.has(year)) {
              yearMap.set(year, {
                sanctioned: 0,
                completed: 0,
              });
            }

            yearMap.get(year)!.sanctioned++;
          }

          if (
            completionDate &&
            String(work.lifecycle_stage).toLowerCase() ===
              'completed'
          ) {
            const year = String(completionDate).substring(0, 4);

            if (!yearMap.has(year)) {
              yearMap.set(year, {
                sanctioned: 0,
                completed: 0,
              });
            }

            yearMap.get(year)!.completed++;
          }
        });

        const yearlyTrend = Array.from(
          yearMap.entries()
        )
          .map(([year, stats]) => ({
            year,
            ...stats,
          }))
          .sort((a, b) =>
            a.year.localeCompare(b.year)
          );

        /*
         * ----------------------------------------------------------
         * FINAL STATS
         * ----------------------------------------------------------
         */

        setStats({
          totalWorks:
            Number(dashboard.total_works) ||
            works.length,

          completedWorks:
            Number(dashboard.completed) ||
            works.filter(work =>
              String(work.status_group)
                .toLowerCase()
                .includes('completed')
            ).length,

          inProgressWorks:
            Number(dashboard.in_progress) ||
            works.filter(work =>
              String(work.status_group)
                .toLowerCase()
                .includes('progress')
            ).length,

          totalSanctioned,

          totalDisbursed,

          highRiskCount,

          mediumRiskCount,

          lowRiskCount,

          flagCounts,

          stateDistribution,

          categoryDistribution,

          lifecycleDistribution,

          topRiskyWorks,

          yearlyTrend,
        });

      } catch (error) {
        console.error(
          'Dashboard loading error:',
          error
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) return <Spinner />;

  if (!stats) {
    return <EmptyState message="No data available" />;
  }

  const riskPieData = [
    {
      name: 'High Risk',
      value: stats.highRiskCount,
      color: '#ef4444',
    },
    {
      name: 'Medium Risk',
      value: stats.mediumRiskCount,
      color: '#f59e0b',
    },
    {
      name: 'Low Risk',
      value: stats.lowRiskCount,
      color: '#10b981',
    },
  ];

  const flagBarData = RISK_FLAGS.map(f => ({
    name: f.label,
    count: stats.flagCounts[f.key] || 0,
    color: f.color,
  }));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Monitoring Dashboard"
        subtitle="AI-powered overview of MPLADS works, fund utilization, and risk indicators"
      >
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
          <Activity className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-medium text-emerald-700">
            Live Data
          </span>
        </div>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Works"
          value={stats.totalWorks.toLocaleString('en-IN')}
          sublabel={`${stats.completedWorks.toLocaleString('en-IN')} completed`}
          icon={<Building2 className="w-5 h-5" />}
          color="blue"
        />

        <StatCard
          label="Total Sanctioned"
          value={formatCurrency(stats.totalSanctioned)}
          sublabel={`${formatCurrency(stats.totalDisbursed)} disbursed`}
          icon={<Wallet className="w-5 h-5" />}
          color="emerald"
        />

        <StatCard
          label="High Risk Cases"
          value={stats.highRiskCount.toLocaleString('en-IN')}
          sublabel={`${(
            (stats.highRiskCount /
              stats.totalWorks) *
            100
          ).toFixed(1)}% of all works`}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="red"
        />

        <StatCard
          label="In Progress"
          value={stats.inProgressWorks.toLocaleString('en-IN')}
          sublabel="Under execution"
          icon={<Clock className="w-5 h-5" />}
          color="amber"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader
            title="Risk Distribution"
            subtitle="Works by AI risk tier"
          />

          <div className="p-4">
            <ResponsiveContainer
              width="100%"
              height={220}
            >
              <PieChart>
                <Pie
                  data={riskPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {riskPieData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.color}
                    />
                  ))}
                </Pie>

                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />

                <Legend
                  wrapperStyle={{
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Risk Flag Breakdown"
            subtitle="Count of works triggering each AI detection rule"
          />

          <div className="p-4">
            <ResponsiveContainer
              width="100%"
              height={220}
            >
              <BarChart
                data={flagBarData}
                layout="vertical"
                margin={{
                  left: 20,
                  right: 20,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                  horizontal={false}
                />

                <XAxis
                  type="number"
                  tick={{ fontSize: 11 }}
                  stroke="#94a3b8"
                />

                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  width={110}
                  stroke="#94a3b8"
                />

                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                  cursor={{
                    fill: '#f8fafc',
                  }}
                />

                <Bar
                  dataKey="count"
                  radius={[0, 4, 4, 0]}
                >
                  {flagBarData.map(
                    (entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.color}
                      />
                    )
                  )}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader
            title="Works by State (Top 10)"
            subtitle="Total works and high-risk count per state"
          />

          <div className="p-4">
            <ResponsiveContainer
              width="100%"
              height={280}
            >
              <BarChart
                data={stats.stateDistribution}
                margin={{
                  left: 0,
                  right: 10,
                  bottom: 60,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                />

                <XAxis
                  dataKey="state"
                  tick={{ fontSize: 10 }}
                  angle={-35}
                  textAnchor="end"
                  height={60}
                  stroke="#94a3b8"
                />

                <YAxis
                  tick={{ fontSize: 11 }}
                  stroke="#94a3b8"
                />

                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                  cursor={{
                    fill: '#f8fafc',
                  }}
                />

                <Legend
                  wrapperStyle={{
                    fontSize: '12px',
                  }}
                />

                <Bar
                  dataKey="count"
                  name="Total Works"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />

                <Bar
                  dataKey="highRisk"
                  name="High Risk"
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Sanction vs. Completion Trend"
            subtitle="Works sanctioned and completed by year"
          />

          <div className="p-4">
            <ResponsiveContainer
              width="100%"
              height={280}
            >
              <AreaChart
                data={stats.yearlyTrend}
                margin={{
                  left: 0,
                  right: 10,
                }}
              >
                <defs>
                  <linearGradient
                    id="gradSan"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="#3b82f6"
                      stopOpacity={0.3}
                    />

                    <stop
                      offset="95%"
                      stopColor="#3b82f6"
                      stopOpacity={0}
                    />
                  </linearGradient>

                  <linearGradient
                    id="gradComp"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="#10b981"
                      stopOpacity={0.3}
                    />

                    <stop
                      offset="95%"
                      stopColor="#10b981"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                />

                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 11 }}
                  stroke="#94a3b8"
                />

                <YAxis
                  tick={{ fontSize: 11 }}
                  stroke="#94a3b8"
                />

                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />

                <Legend
                  wrapperStyle={{
                    fontSize: '12px',
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="sanctioned"
                  name="Sanctioned"
                  stroke="#3b82f6"
                  fill="url(#gradSan)"
                  strokeWidth={2}
                />

                <Area
                  type="monotone"
                  dataKey="completed"
                  name="Completed"
                  stroke="#10b981"
                  fill="url(#gradComp)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Top Risky Works */}
      <Card className="mb-6">
        <CardHeader
          title="Highest-Risk Works"
          subtitle="Top 5 works by AI risk score — click to view full analysis"
          action={
            <button
              onClick={() => onNavigate('alerts')}
              className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              View all alerts
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          }
        />

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wide">
                <th className="text-left px-5 py-3 font-medium">
                  Work ID
                </th>

                <th className="text-left px-5 py-3 font-medium">
                  Title
                </th>

                <th className="text-left px-5 py-3 font-medium">
                  State
                </th>

                <th className="text-left px-5 py-3 font-medium">
                  MP
                </th>

                <th className="text-center px-5 py-3 font-medium">
                  Risk Score
                </th>

                <th className="text-center px-5 py-3 font-medium">
                  Tier
                </th>
              </tr>
            </thead>

            <tbody>
              {stats.topRiskyWorks.map(
                work => (
                  <tr
                    key={work.work_id}
                    onClick={() =>
                      onSelectWork(
                        work.work_id
                      )
                    }
                    className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3 font-mono text-xs text-slate-600">
                      {work.work_id}
                    </td>

                    <td className="px-5 py-3 text-slate-700 max-w-xs truncate">
                      {work.work_title ||
                        '—'}
                    </td>

                    <td className="px-5 py-3 text-slate-600">
                      {work.state || '—'}
                    </td>

                    <td className="px-5 py-3 text-slate-600">
                      {work.mp_name || '—'}
                    </td>

                    <td className="px-5 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-50 text-red-700 font-bold text-xs">
                        {work.risk_score}
                      </span>
                    </td>

                    <td className="px-5 py-3 text-center">
                      <RiskBadge
                        tier={work.risk_tier}
                      />
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Lifecycle & Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader
            title="Work Category Distribution"
            subtitle="Works by MPLADS category"
          />

          <div className="p-4">
            <ResponsiveContainer
              width="100%"
              height={200}
            >
              <PieChart>
                <Pie
                  data={
                    stats.categoryDistribution
                  }
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  dataKey="value"
                  label={({
                    name,
                    percent,
                  }) =>
                    `${name}: ${(
                      (percent || 0) *
                      100
                    ).toFixed(0)}%`
                  }
                  labelLine={false}
                  style={{
                    fontSize: '11px',
                  }}
                >
                  {stats.categoryDistribution.map(
                    (_, i) => (
                      <Cell
                        key={i}
                        fill={
                          [
                            '#3b82f6',
                            '#10b981',
                            '#f59e0b',
                            '#8b5cf6',
                          ][i % 4]
                        }
                      />
                    )
                  )}
                </Pie>

                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border:
                      '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Lifecycle Stage Distribution"
            subtitle="Works by current stage"
          />

          <div className="p-4">
            <ResponsiveContainer
              width="100%"
              height={200}
            >
              <BarChart
                data={
                  stats.lifecycleDistribution
                }
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                />

                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  stroke="#94a3b8"
                />

                <YAxis
                  tick={{ fontSize: 11 }}
                  stroke="#94a3b8"
                />

                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border:
                      '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                  cursor={{
                    fill: '#f8fafc',
                  }}
                />

                <Bar
                  dataKey="value"
                  fill="#6366f1"
                  radius={[
                    4,
                    4,
                    0,
                    0,
                  ]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}