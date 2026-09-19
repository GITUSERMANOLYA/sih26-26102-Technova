import { useState, useEffect, useCallback } from 'react';
import { formatCurrency } from '@/lib/format';
import {
  Card,
  RiskBadge,
  Spinner,
  PageHeader,
  EmptyState,
} from '@/components/ui';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Clock,
  TrendingUp,
  FileText,
  XCircle,
  Brain,
} from 'lucide-react';

interface RiskAlertsProps {
  onSelectWork: (workId: string) => void;
}

type RiskFlagKey =
  | 'timeline_flag'
  | 'cost_outlier_flag'
  | 'payment_mismatch_flag'
  | 'duplicate_flag'
  | 'no_asset_evidence_flag'
  | 'predicted_overrun_flag'
  | 'early_warning_flag';

interface Work {
  work_id: string;
  work_title: string | null;
  lifecycle_stage: string | null;
  state: string | null;
  mp_name: string | null;
  san_sanction_amount: number;
  risk_score: number;
  risk_tier: string;

  timeline_flag: boolean;
  cost_outlier_flag: boolean;
  payment_mismatch_flag: boolean;
  duplicate_flag: boolean;
  no_asset_evidence_flag: boolean;
  predicted_overrun_flag: boolean;
  early_warning_flag: boolean;
}

const API_BASE = 'https://technova-backend-0gpp.onrender.com';

const PAGE_SIZE = 15;
const API_PAGE_SIZE = 500;

const RISK_FLAGS: {
  key: RiskFlagKey;
  label: string;
  description: string;
  color: string;
}[] = [
  {
    key: 'timeline_flag',
    label: 'Timeline Exceeded',
    description:
      'Work took more than 365 days from sanction to completion, exceeding the MPLADS norm.',
    color: '#f59e0b',
  },
  {
    key: 'cost_outlier_flag',
    label: 'Cost Outlier',
    description:
      'Isolation Forest detected anomalous cost patterns in sanctioned vs. disbursed amounts.',
    color: '#ef4444',
  },
  {
    key: 'payment_mismatch_flag',
    label: 'Payment Mismatch',
    description:
      'Payment was marked successful before the work was verified as complete.',
    color: '#f97316',
  },
  {
    key: 'duplicate_flag',
    label: 'Duplicate Work',
    description:
      'TF-IDF cosine similarity above 0.85 with another work description in the same district.',
    color: '#a855f7',
  },
  {
    key: 'no_asset_evidence_flag',
    label: 'No Asset Evidence',
    description:
      'Work marked complete but no asset-creation image evidence on record.',
    color: '#6b7280',
  },
  {
    key: 'predicted_overrun_flag',
    label: 'Predicted Overrun',
    description:
      'Elapsed time exceeds the 1-year norm and the work is still in progress.',
    color: '#dc2626',
  },
  {
    key: 'early_warning_flag',
    label: 'Early Warning',
    description:
      'Random Forest model predicts high probability of overrun before the 1-year mark.',
    color: '#eab308',
  },
];

function getValue(
  row: any,
  ...keys: string[]
) {
  for (const key of keys) {
    if (
      row?.[key] !== undefined &&
      row?.[key] !== null &&
      row?.[key] !== ''
    ) {
      return row[key];
    }
  }

  return null;
}

function toNumber(value: any): number {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return 0;
  }

  const number = Number(
    String(value).replace(/,/g, '')
  );

  return Number.isFinite(number)
    ? number
    : 0;
}

function toBoolean(value: any): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (
    value === null ||
    value === undefined
  ) {
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

function normalizeRisk(value: any): string {
  const text = String(value || '')
    .trim()
    .toLowerCase();

  if (text === 'high') {
    return 'High';
  }

  if (text === 'medium') {
    return 'Medium';
  }

  return 'Low';
}

function normalizeWork(row: any): Work {
  return {
    work_id: String(
      getValue(
        row,
        'work_id',
        'Work_ID',
        'Work ID',
        'id',
        'ID'
      ) ?? ''
    ),

    work_title:
      getValue(
        row,
        'work_title',
        'Work_Title',
        'Work Title',
        'Work'
      ) ?? null,

    lifecycle_stage:
      getValue(
        row,
        'lifecycle_stage',
        'Lifecycle Stage',
        'Lifecycle_Stage'
      ) ?? null,

    state:
      getValue(
        row,
        'state',
        'State'
      ) ?? null,

    mp_name:
      getValue(
        row,
        'mp_name',
        'MP Name',
        'MP_Name'
      ) ?? null,

    san_sanction_amount:
      toNumber(
        getValue(
          row,
          'san_sanction_amount',
          'San_Sanction Amount (Rs)',
          'San_Sanction amount (Rs)',
          'San_Sanction_Amount'
        )
      ),

    risk_score:
      toNumber(
        getValue(
          row,
          'risk_score',
          'Risk Score'
        )
      ),

    risk_tier:
      normalizeRisk(
        getValue(
          row,
          'risk_tier',
          'Risk Tier'
        )
      ),

    timeline_flag:
      toBoolean(
        getValue(
          row,
          'timeline_flag',
          'Timeline Flag'
        )
      ),

    cost_outlier_flag:
      toBoolean(
        getValue(
          row,
          'cost_outlier_flag',
          'Cost Outlier Flag'
        )
      ),

    payment_mismatch_flag:
      toBoolean(
        getValue(
          row,
          'payment_mismatch_flag',
          'Payment Mismatch Flag'
        )
      ),

    duplicate_flag:
      toBoolean(
        getValue(
          row,
          'duplicate_flag',
          'Duplicate Flag'
        )
      ),

    no_asset_evidence_flag:
      toBoolean(
        getValue(
          row,
          'no_asset_evidence_flag',
          'No Asset Evidence Flag'
        )
      ),

    predicted_overrun_flag:
      toBoolean(
        getValue(
          row,
          'predicted_overrun_flag',
          'Predicted Overrun Flag'
        )
      ),

    early_warning_flag:
      toBoolean(
        getValue(
          row,
          'early_warning_flag',
          'Early Warning Flag'
        )
      ),
  };
}

function isFlagged(
  work: Work,
  flag: RiskFlagKey
): boolean {
  return work[flag];
}

export default function RiskAlerts({
  onSelectWork,
}: RiskAlertsProps) {
  const [activeFlag, setActiveFlag] =
    useState<
      RiskFlagKey | 'all'
    >('all');

  const [allWorks, setAllWorks] =
    useState<Work[]>([]);

  const [works, setWorks] =
    useState<Work[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [page, setPage] =
    useState(0);

  const [flagCounts, setFlagCounts] =
    useState<
      Record<string, number>
    >({});

  /*
   * LOAD ALL RECORDS FROM FASTAPI
   *
   * Backend allows maximum 500 records
   * per request, so we fetch all pages.
   */
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        /*
         * First request tells us the total number
         * of records available.
         */
        const firstResponse =
          await fetch(
            `${API_BASE}/works?page=1&limit=${API_PAGE_SIZE}`
          );

        if (!firstResponse.ok) {
          throw new Error(
            `Backend returned ${firstResponse.status}`
          );
        }

        const firstResult =
          await firstResponse.json();

        const firstData =
          Array.isArray(firstResult.data)
            ? firstResult.data
            : [];

        const totalRecords =
          Number(
            firstResult.total || 0
          );

        /*
         * Calculate how many API pages are needed.
         */
        const totalApiPages =
          Math.ceil(
            totalRecords /
              API_PAGE_SIZE
          );

        /*
         * Fetch remaining pages.
         */
        const remainingRequests =
          [];

        for (
          let apiPage = 2;
          apiPage <=
            totalApiPages;
          apiPage++
        ) {
          remainingRequests.push(
            fetch(
              `${API_BASE}/works?page=${apiPage}&limit=${API_PAGE_SIZE}`
            ).then(
              async response => {
                if (!response.ok) {
                  throw new Error(
                    `Page ${apiPage} failed with ${response.status}`
                  );
                }

                return response.json();
              }
            )
          );
        }

        const remainingResults =
          await Promise.all(
            remainingRequests
          );

        /*
         * Combine every page.
         */
        const allRawRows: any[] = [
          ...firstData,
        ];

        for (
          const result of remainingResults
        ) {
          if (
            Array.isArray(
              result.data
            )
          ) {
            allRawRows.push(
              ...result.data
            );
          }
        }

        const normalized: Work[] =
          allRawRows.map(
            (row: any) =>
              normalizeWork(row)
          );

        setAllWorks(
          normalized
        );

        /*
         * Calculate actual counts from
         * the complete dataset.
         */
        const counts: Record<
          string,
          number
        > = {};

        RISK_FLAGS.forEach(
          (flag) => {
            counts[flag.key] =
              normalized.filter(
                (work: Work) =>
                  isFlagged(
                    work,
                    flag.key
                  )
              ).length;
          }
        );

        counts.all =
          normalized.filter(
            (work: Work) =>
              work.risk_tier ===
              'High'
          ).length;

        setFlagCounts(
          counts
        );

        console.log(
          `Risk Alerts: loaded ${normalized.length} records`
        );
      } catch (error) {
        console.error(
          'Risk Alerts loading error:',
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  /*
   * FILTER + SORT
   */
  const loadWorks =
    useCallback(() => {
      let filtered: Work[];

      if (
        activeFlag === 'all'
      ) {
        filtered =
          allWorks.filter(
            (work: Work) =>
              work.risk_tier ===
              'High'
          );
      } else {
        filtered =
          allWorks.filter(
            (work: Work) =>
              isFlagged(
                work,
                activeFlag
              )
          );
      }

      filtered.sort(
        (a: Work, b: Work) =>
          b.risk_score -
          a.risk_score
      );

      const start =
        page * PAGE_SIZE;

      const end =
        start + PAGE_SIZE;

      setWorks(
        filtered.slice(
          start,
          end
        )
      );
    }, [
      allWorks,
      activeFlag,
      page,
    ]);

  useEffect(() => {
    loadWorks();
  }, [loadWorks]);

  useEffect(() => {
    setPage(0);
  }, [activeFlag]);

  /*
   * TOTAL FILTERED RECORDS
   */
  const total =
    activeFlag === 'all'
      ? allWorks.filter(
          (work: Work) =>
            work.risk_tier ===
            'High'
        ).length
      : allWorks.filter(
          (work: Work) =>
            isFlagged(
              work,
              activeFlag
            )
        ).length;

  const totalPages =
    Math.ceil(
      total / PAGE_SIZE
    );

  const flagIcons: Record<
    RiskFlagKey,
    typeof Clock
  > = {
    timeline_flag: Clock,
    cost_outlier_flag:
      TrendingUp,
    payment_mismatch_flag:
      AlertTriangle,
    duplicate_flag:
      FileText,
    no_asset_evidence_flag:
      XCircle,
    predicted_overrun_flag:
      TrendingUp,
    early_warning_flag:
      AlertTriangle,
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Risk Alerts"
        subtitle="AI-detected anomalies, fraud indicators, and inefficiencies requiring attention"
      />

      {/* Flag Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() =>
            setActiveFlag('all')
          }
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            activeFlag === 'all'
              ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />

          All High Risk

          <span
            className={`text-xs px-1.5 py-0.5 rounded-full ${
              activeFlag === 'all'
                ? 'bg-red-500'
                : 'bg-slate-100'
            }`}
          >
            {flagCounts.all ||
              0}
          </span>
        </button>

        {RISK_FLAGS.map(
          (flag) => {
            const Icon =
              flagIcons[
                flag.key
              ];

            const active =
              activeFlag ===
              flag.key;

            return (
              <button
                key={flag.key}
                onClick={() =>
                  setActiveFlag(
                    flag.key
                  )
                }
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'text-white shadow-md'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
                style={
                  active
                    ? {
                        backgroundColor:
                          flag.color,
                        boxShadow: `0 4px 12px ${flag.color}30`,
                      }
                    : {}
                }
              >
                <Icon className="w-4 h-4" />

                {flag.label}

                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    active
                      ? 'bg-white/20'
                      : 'bg-slate-100'
                  }`}
                >
                  {flagCounts[
                    flag.key
                  ] || 0}
                </span>
              </button>
            );
          }
        )}
      </div>

      {/* Flag Description */}
      {activeFlag !==
        'all' && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-2">
          <Brain className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />

          <div>
            <p className="text-sm font-medium text-slate-800">
              {
                RISK_FLAGS.find(
                  (flag) =>
                    flag.key ===
                    activeFlag
                )?.label
              }
            </p>

            <p className="text-xs text-slate-600 mt-0.5">
              {
                RISK_FLAGS.find(
                  (flag) =>
                    flag.key ===
                    activeFlag
                )?.description
              }
            </p>
          </div>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="py-10">
          <Spinner />
        </div>
      ) : works.length ===
        0 ? (
        <EmptyState message="No alerts found for this filter" />
      ) : (
        <>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wide">
                    <th className="text-left px-4 py-3 font-medium">
                      Work ID
                    </th>

                    <th className="text-left px-4 py-3 font-medium">
                      Title
                    </th>

                    <th className="text-left px-4 py-3 font-medium">
                      State
                    </th>

                    <th className="text-left px-4 py-3 font-medium">
                      MP
                    </th>

                    <th className="text-left px-4 py-3 font-medium">
                      Stage
                    </th>

                    <th className="text-right px-4 py-3 font-medium">
                      Sanctioned
                    </th>

                    <th className="text-center px-4 py-3 font-medium">
                      Flags
                    </th>

                    <th className="text-center px-4 py-3 font-medium">
                      Risk
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {works.map(
                    (work: Work) => {
                      const triggeredFlags =
                        RISK_FLAGS.filter(
                          (flag) =>
                            isFlagged(
                              work,
                              flag.key
                            )
                        );

                      return (
                        <tr
                          key={
                            work.work_id
                          }
                          onClick={() =>
                            onSelectWork(
                              work.work_id
                            )
                          }
                          className="border-b border-slate-50 hover:bg-red-50/20 cursor-pointer transition-colors"
                        >
                          <td className="px-4 py-3 font-mono text-xs text-slate-600">
                            {
                              work.work_id
                            }
                          </td>

                          <td className="px-4 py-3 text-slate-700 max-w-xs truncate">
                            {work.work_title ||
                              '—'}
                          </td>

                          <td className="px-4 py-3 text-slate-600 text-xs">
                            {work.state ||
                              '—'}
                          </td>

                          <td className="px-4 py-3 text-slate-600 text-xs">
                            {work.mp_name ||
                              '—'}
                          </td>

                          <td className="px-4 py-3 text-xs">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs ${
                                work.lifecycle_stage ===
                                'Completed'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : work.lifecycle_stage ===
                                    'Sanctioned'
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'bg-slate-50 text-slate-600'
                              }`}
                            >
                              {work.lifecycle_stage ||
                                '—'}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-right text-slate-700 text-xs">
                            {formatCurrency(
                              work.san_sanction_amount
                            )}
                          </td>

                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {triggeredFlags
                                .slice(
                                  0,
                                  3
                                )
                                .map(
                                  (
                                    flag
                                  ) => (
                                    <span
                                      key={
                                        flag.key
                                      }
                                      className="w-2 h-2 rounded-full"
                                      style={{
                                        backgroundColor:
                                          flag.color,
                                      }}
                                      title={
                                        flag.label
                                      }
                                    />
                                  )
                                )}

                              {triggeredFlags.length >
                                3 && (
                                <span className="text-xs text-slate-400">
                                  +
                                  {triggeredFlags.length -
                                    3}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <span className="text-xs font-bold text-slate-400">
                                {
                                  work.risk_score
                                }
                              </span>

                              <RiskBadge
                                tier={
                                  work.risk_tier
                                }
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-slate-500">
              Showing{' '}
              {page *
                  PAGE_SIZE +
                1}
              –
              {Math.min(
                (page + 1) *
                  PAGE_SIZE,
                total
              )}{' '}
              of{' '}
              {total.toLocaleString(
                'en-IN'
              )}
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setPage(
                    (
                      currentPage
                    ) =>
                      Math.max(
                        0,
                        currentPage -
                          1
                      )
                  )
                }
                disabled={
                  page === 0
                }
                className="flex items-center gap-1 px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />

                Prev
              </button>

              <span className="text-sm text-slate-600 px-2">
                {page + 1} /{' '}
                {totalPages ||
                  1}
              </span>

              <button
                onClick={() =>
                  setPage(
                    (
                      currentPage
                    ) =>
                      Math.min(
                        Math.max(
                          0,
                          totalPages -
                            1
                        ),
                        currentPage +
                          1
                      )
                  )
                }
                disabled={
                  totalPages === 0 ||
                  page >=
                    totalPages - 1
                }
                className="flex items-center gap-1 px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next

                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
