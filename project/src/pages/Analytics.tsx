import { useState, useEffect } from 'react';
import { Card, CardHeader, Spinner, PageHeader } from '@/components/ui';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import { formatCurrency } from '@/lib/format';

const API_BASE = 'https://technova-backend-0gpp.onrender.com';

interface ApiWork {
  [key: string]: any;
}

function getValue(row: ApiWork, ...keys: string[]) {
  for (const key of keys) {
    if (
      row[key] !== undefined &&
      row[key] !== null &&
      row[key] !== ''
    ) {
      return row[key];
    }
  }

  return null;
}

function getNumber(row: ApiWork, ...keys: string[]) {
  const value = getValue(row, ...keys);

  if (value === null) return 0;

  const number = Number(
    String(value).replace(/,/g, '')
  );

  return Number.isFinite(number) ? number : 0;
}

function getBoolean(row: ApiWork, ...keys: string[]) {
  const value = getValue(row, ...keys);

  if (typeof value === 'boolean') {
    return value;
  }

  if (value === null) {
    return false;
  }

  const text = String(value)
    .trim()
    .toLowerCase();

  return (
    text === 'true' ||
    text === '1' ||
    text === 'yes' ||
    text === 'y' ||
    text === 'flagged'
  );
}

function normalizeRisk(value: any) {
  const text = String(value || '')
    .trim()
    .toLowerCase();

  if (text === 'high') return 'High';
  if (text === 'medium') return 'Medium';
  return 'Low';
}

export default function Analytics() {
  const [loading, setLoading] = useState(true);

  const [stateRiskData, setStateRiskData] =
    useState<any[]>([]);

  const [mpRiskData, setMpRiskData] =
    useState<any[]>([]);

  const [scatterData, setScatterData] =
    useState<any[]>([]);

  const [categoryRiskData, setCategoryRiskData] =
    useState<any[]>([]);

  const [radarData, setRadarData] =
    useState<any[]>([]);

  useEffect(() => {
    async function load() {
      try {
        /*
         * ----------------------------------------------------------
         * LOAD DATA FROM FASTAPI
         * ----------------------------------------------------------
         *
         * We intentionally sample different pages instead of only
         * taking the first 2,000 rows.
         *
         * This prevents Analytics from being dominated by whichever
         * risk tier happens to appear first in scored_works.csv.
         *
         * Page 1   -> beginning of dataset
         * Page 20  -> middle section
         * Page 40  -> later section
         * Page 60  -> later section
         * Page 80  -> later section
         *
         * Each page contains 500 records.
         */

        const pagesToFetch = [
          1,
          20,
          40,
          60,
          80,
        ];

        const responses = await Promise.all(
          pagesToFetch.map(page =>
            fetch(
              `${API_BASE}/works?page=${page}&limit=500`
            )
          )
        );

        const pages = await Promise.all(
          responses.map(async response => {
            if (!response.ok) {
              throw new Error(
                'Failed to load analytics data'
              );
            }

            return response.json();
          })
        );

        const data: ApiWork[] = [];

        pages.forEach(page => {
          if (Array.isArray(page.data)) {
            data.push(...page.data);
          }
        });

        /*
         * ----------------------------------------------------------
         * STATE VS RISK
         * ----------------------------------------------------------
         */

        const stateMap = new Map<
          string,
          {
            state: string;
            high: number;
            medium: number;
            low: number;
            total: number;
          }
        >();

        data.forEach(r => {
          const state =
            getValue(
              r,
              'State',
              'state'
            ) || 'Unknown';

          if (!stateMap.has(state)) {
            stateMap.set(state, {
              state,
              high: 0,
              medium: 0,
              low: 0,
              total: 0,
            });
          }

          const entry =
            stateMap.get(state)!;

          entry.total++;

          const risk = normalizeRisk(
            getValue(
              r,
              'risk_tier',
              'Risk Tier'
            )
          );

          if (risk === 'High') {
            entry.high++;
          } else if (risk === 'Medium') {
            entry.medium++;
          } else {
            entry.low++;
          }
        });

        setStateRiskData(
          Array.from(stateMap.values())
            .sort(
              (a, b) =>
                b.high - a.high
            )
            .slice(0, 10)
        );

        /*
         * ----------------------------------------------------------
         * MP VS RISK
         * ----------------------------------------------------------
         */

        const mpMap = new Map<
          string,
          {
            mp: string;
            total: number;
            high: number;
            avgRisk: number;
          }
        >();

        data.forEach(r => {
          const mp =
            getValue(
              r,
              'MP Name',
              'MP_Name',
              'mp_name'
            ) || 'Unknown';

          if (!mpMap.has(mp)) {
            mpMap.set(mp, {
              mp,
              total: 0,
              high: 0,
              avgRisk: 0,
            });
          }

          const entry =
            mpMap.get(mp)!;

          entry.total++;

          const risk = normalizeRisk(
            getValue(
              r,
              'risk_tier',
              'Risk Tier'
            )
          );

          if (risk === 'High') {
            entry.high++;
          }

          entry.avgRisk += getNumber(
            r,
            'risk_score',
            'Risk Score'
          );
        });

        setMpRiskData(
          Array.from(mpMap.values())
            .map(e => ({
              ...e,
              avgRisk:
                e.total > 0
                  ? e.avgRisk / e.total
                  : 0,
            }))
            .sort(
              (a, b) =>
                b.high - a.high
            )
            .slice(0, 10)
        );

        /*
         * ----------------------------------------------------------
         * SANCTIONED VS DISBURSED
         * ----------------------------------------------------------
         */

        const scatter = data
          .filter(r => {
            const sanctioned =
              getValue(
                r,
                'San_Sanction Amount (Rs)',
                'San_Sanction amount (Rs)',
                'san_sanction_amount'
              );

            const disbursed =
              getValue(
                r,
                'Total Fund Disbursed (Rs)',
                'Total_Fund_Disbursed',
                'total_fund_disbursed'
              );

            return (
              sanctioned !== null &&
              disbursed !== null
            );
          })
          .map(r => ({
            x: getNumber(
              r,
              'San_Sanction Amount (Rs)',
              'San_Sanction amount (Rs)',
              'san_sanction_amount'
            ),

            y: getNumber(
              r,
              'Total Fund Disbursed (Rs)',
              'Total_Fund_Disbursed',
              'total_fund_disbursed'
            ),

            risk: normalizeRisk(
              getValue(
                r,
                'risk_tier',
                'Risk Tier'
              )
            ),

            state:
              getValue(
                r,
                'State',
                'state'
              ) || 'Unknown',
          }))
          .slice(0, 500);

        setScatterData(scatter);

        /*
         * ----------------------------------------------------------
         * CATEGORY VS RISK
         * ----------------------------------------------------------
         */

        const catMap = new Map<
          string,
          {
            category: string;
            high: number;
            medium: number;
            low: number;
          }
        >();

        data.forEach(r => {
          const category =
            getValue(
              r,
              'Work Category',
              'Work_Category',
              'work_category',
              'Category'
            ) || 'Unknown';

          if (!catMap.has(category)) {
            catMap.set(category, {
              category,
              high: 0,
              medium: 0,
              low: 0,
            });
          }

          const entry =
            catMap.get(category)!;

          const risk = normalizeRisk(
            getValue(
              r,
              'risk_tier',
              'Risk Tier'
            )
          );

          if (risk === 'High') {
            entry.high++;
          } else if (risk === 'Medium') {
            entry.medium++;
          } else {
            entry.low++;
          }
        });

        setCategoryRiskData(
          Array.from(
            catMap.values()
          )
        );

        /*
         * ----------------------------------------------------------
         * FLAG DISTRIBUTION BY LIFECYCLE
         * ----------------------------------------------------------
         */

        const lcMap = new Map<
          string,
          Record<string, number>
        >();

        const flagKeys = [
          'timeline_flag',
          'cost_outlier_flag',
          'payment_mismatch_flag',
          'duplicate_flag',
          'no_asset_evidence_flag',
          'predicted_overrun_flag',
          'early_warning_flag',
        ];

        data.forEach(r => {
          const lifecycle =
            getValue(
              r,
              'lifecycle_stage',
              'Lifecycle Stage'
            ) || 'Unknown';

          if (!lcMap.has(lifecycle)) {
            lcMap.set(
              lifecycle,
              {}
            );

            flagKeys.forEach(key => {
              lcMap.get(
                lifecycle
              )![key] = 0;
            });
          }

          flagKeys.forEach(key => {
            if (
              getBoolean(
                r,
                key
              )
            ) {
              lcMap.get(
                lifecycle
              )![key]++;
            }
          });
        });

        const radar =
          RISK_FLAG_LABELS.map(
            flag => {
              const entry: any = {
                flag:
                  flag.shortLabel,
              };

              lcMap.forEach(
                (flags, lifecycle) => {
                  entry[lifecycle] =
                    flags[flag.key] ||
                    0;
                }
              );

              return entry;
            }
          );

        setRadarData(radar);

      } catch (error) {
        console.error(
          'Analytics loading error:',
          error
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return <Spinner />;
  }

  const scatterColors: Record<
    string,
    string
  > = {
    High: '#ef4444',
    Medium: '#f59e0b',
    Low: '#10b981',
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Advanced Analytics"
        subtitle="Multi-dimensional analysis of MPLADS works, risk patterns, and fund utilization"
      />

      {/* State Risk Analysis */}
      <Card className="mb-6">
        <CardHeader
          title="Risk Distribution by State (Top 10)"
          subtitle="High, medium, and low risk works across states"
        />

        <div className="p-4">
          <ResponsiveContainer
            width="100%"
            height={320}
          >
            <BarChart
              data={stateRiskData}
              margin={{
                bottom: 60,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f1f5f9"
              />

              <XAxis
                dataKey="state"
                tick={{
                  fontSize: 10,
                }}
                angle={-35}
                textAnchor="end"
                height={60}
                stroke="#94a3b8"
              />

              <YAxis
                tick={{
                  fontSize: 11,
                }}
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

              <Legend
                wrapperStyle={{
                  fontSize: '12px',
                }}
              />

              <Bar
                dataKey="high"
                name="High Risk"
                stackId="a"
                fill="#ef4444"
                radius={[
                  0,
                  0,
                  0,
                  0,
                ]}
              />

              <Bar
                dataKey="medium"
                name="Medium Risk"
                stackId="a"
                fill="#f59e0b"
                radius={[
                  0,
                  0,
                  0,
                  0,
                ]}
              />

              <Bar
                dataKey="low"
                name="Low Risk"
                stackId="a"
                fill="#10b981"
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

      {/* MP Risk Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader
            title="Top MPs by High-Risk Works"
            subtitle="Members of Parliament with most flagged works"
          />

          <div className="p-4">
            <ResponsiveContainer
              width="100%"
              height={280}
            >
              <BarChart
                data={mpRiskData}
                layout="vertical"
                margin={{
                  left: 30,
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
                  tick={{
                    fontSize: 11,
                  }}
                  stroke="#94a3b8"
                />

                <YAxis
                  type="category"
                  dataKey="mp"
                  tick={{
                    fontSize: 9,
                  }}
                  width={100}
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
                  dataKey="high"
                  name="High Risk Works"
                  fill="#ef4444"
                  radius={[
                    0,
                    4,
                    4,
                    0,
                  ]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Risk by Work Category"
            subtitle="Distribution of risk tiers across MPLADS categories"
          />

          <div className="p-4">
            <ResponsiveContainer
              width="100%"
              height={280}
            >
              <BarChart
                data={categoryRiskData}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                />

                <XAxis
                  dataKey="category"
                  tick={{
                    fontSize: 10,
                  }}
                  stroke="#94a3b8"
                />

                <YAxis
                  tick={{
                    fontSize: 11,
                  }}
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

                <Legend
                  wrapperStyle={{
                    fontSize: '12px',
                  }}
                />

                <Bar
                  dataKey="high"
                  name="High"
                  stackId="a"
                  fill="#ef4444"
                />

                <Bar
                  dataKey="medium"
                  name="Medium"
                  stackId="a"
                  fill="#f59e0b"
                />

                <Bar
                  dataKey="low"
                  name="Low"
                  stackId="a"
                  fill="#10b981"
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

      {/* Scatter Plot */}
      <Card className="mb-6">
        <CardHeader
          title="Sanctioned vs. Disbursed Amount"
          subtitle="Each point is a work — color-coded by risk tier (sample of 500)"
        />

        <div className="p-4">
          <ResponsiveContainer
            width="100%"
            height={350}
          >
            <ScatterChart
              margin={{
                left: 10,
                right: 20,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f1f5f9"
              />

              <XAxis
                type="number"
                dataKey="x"
                name="Sanctioned"
                tickFormatter={v =>
                  formatCurrency(v)
                }
                tick={{
                  fontSize: 10,
                }}
                stroke="#94a3b8"
              />

              <YAxis
                type="number"
                dataKey="y"
                name="Disbursed"
                tickFormatter={v =>
                  formatCurrency(v)
                }
                tick={{
                  fontSize: 10,
                }}
                stroke="#94a3b8"
              />

              <ZAxis
                range={[30, 30]}
              />

              <Tooltip
                cursor={{
                  strokeDasharray:
                    '3 3',
                }}
                contentStyle={{
                  borderRadius: '8px',
                  border:
                    '1px solid #e2e8f0',
                  fontSize: '12px',
                }}
                formatter={value =>
                  formatCurrency(
                    Number(value)
                  )
                }
                labelFormatter={() => ''}
              />

              <Legend
                wrapperStyle={{
                  fontSize: '12px',
                }}
              />

              {[
                'High',
                'Medium',
                'Low',
              ].map(tier => (
                <Scatter
                  key={tier}
                  name={tier}
                  data={scatterData.filter(
                    d =>
                      d.risk === tier
                  )}
                  fill={
                    scatterColors[
                      tier
                    ]
                  }
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Radar Chart */}
      <Card>
        <CardHeader
          title="Flag Distribution by Lifecycle Stage"
          subtitle="Which AI flags fire most at each lifecycle stage"
        />

        <div className="p-4">
          <ResponsiveContainer
            width="100%"
            height={350}
          >
            <RadarChart
              data={radarData}
            >
              <PolarGrid
                stroke="#e2e8f0"
              />

              <PolarAngleAxis
                dataKey="flag"
                tick={{
                  fontSize: 10,
                }}
                stroke="#64748b"
              />

              <PolarRadiusAxis
                tick={{
                  fontSize: 10,
                }}
                stroke="#94a3b8"
              />

              {radarData.length >
                0 &&
                Object.keys(
                  radarData[0]
                )
                  .filter(
                    k =>
                      k !== 'flag'
                  )
                  .map(
                    (
                      lifecycle,
                      i
                    ) => (
                      <Radar
                        key={
                          lifecycle
                        }
                        name={
                          lifecycle
                        }
                        dataKey={
                          lifecycle
                        }
                        stroke={
                          [
                            '#3b82f6',
                            '#10b981',
                            '#f59e0b',
                            '#8b5cf6',
                          ][
                            i % 4
                          ]
                        }
                        fill={
                          [
                            '#3b82f6',
                            '#10b981',
                            '#f59e0b',
                            '#8b5cf6',
                          ][
                            i % 4
                          ]
                        }
                        fillOpacity={
                          0.15
                        }
                        strokeWidth={
                          2
                        }
                      />
                    )
                  )}

              <Legend
                wrapperStyle={{
                  fontSize: '12px',
                }}
              />

              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border:
                    '1px solid #e2e8f0',
                  fontSize: '12px',
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

const RISK_FLAG_LABELS = [
  {
    key: 'timeline_flag',
    shortLabel: 'Timeline',
  },
  {
    key: 'cost_outlier_flag',
    shortLabel: 'Cost Outlier',
  },
  {
    key: 'payment_mismatch_flag',
    shortLabel: 'Pay Mismatch',
  },
  {
    key: 'duplicate_flag',
    shortLabel: 'Duplicate',
  },
  {
    key: 'no_asset_evidence_flag',
    shortLabel: 'No Asset',
  },
  {
    key: 'predicted_overrun_flag',
    shortLabel: 'Pred. Overrun',
  },
  {
    key: 'early_warning_flag',
    shortLabel: 'Early Warning',
  },
];
