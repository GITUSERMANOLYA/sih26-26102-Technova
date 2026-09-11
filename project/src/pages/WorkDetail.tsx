import { useState, useEffect } from 'react';
import { formatCurrency, formatDate, formatPercent } from '@/lib/format';
import {
  Card,
  CardHeader,
  RiskBadge,
  Spinner,
  EmptyState,
} from '@/components/ui';
import {
  ArrowLeft,
  MapPin,
  User,
  Building2,
  Calendar,
  Clock,
  TrendingUp,
  Brain,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

type Page =
  | 'dashboard'
  | 'works'
  | 'alerts'
  | 'analytics'
  | 'methodology';

interface WorkDetailProps {
  workId: string;
  onBack: () => void;
  onNavigate: (page: Page) => void;
}

type RiskFlagKey =
  | 'timeline_flag'
  | 'cost_outlier_flag'
  | 'payment_mismatch_flag'
  | 'duplicate_flag'
  | 'no_asset_evidence_flag'
  | 'predicted_overrun_flag'
  | 'early_warning_flag';

interface RiskFlag {
  key: RiskFlagKey;
  label: string;
  description: string;
  color: string;
}

interface Work {
  work_id: string;
  work_title: string | null;
  work_description: string | null;

  lifecycle_stage: string | null;
  state: string | null;
  work_category: string | null;

  ida: string | null;
  mp_name: string | null;
  mp_term: string | null;
  chamber: string | null;
  constituency: string | null;

  rec_recommended_date: string | null;
  rec_recommended_amount: number | null;

  san_sanction_date: string | null;
  san_sanction_amount: number | null;
  san_work_status: string | null;

  comp_completion_date: string | null;
  comp_amount_disbursed: number | null;

  total_fund_disbursed: number | null;
  num_payments: number | null;
  latest_payment_status: string | null;

  days_rec_to_san: number | null;
  days_san_to_comp: number | null;

  san_vs_rec_diff: number | null;
  disb_vs_san_diff: number | null;
  disb_vs_pay_diff: number | null;

  has_comp_image: boolean;

  risk_score: number;
  risk_tier: string;

  status_group: string | null;

  timeline_flag: boolean;
  cost_outlier_flag: boolean;
  cost_reason: string | null;
  payment_mismatch_flag: boolean;
  duplicate_flag: boolean;
  no_asset_evidence_flag: boolean;
  predicted_overrun_flag: boolean;
  early_warning_flag: boolean;

  predicted_overrun_prob: number | null;
  reason: string | null;
}

const API_BASE = 'http://127.0.0.1:8000';

const RISK_FLAGS: RiskFlag[] = [
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
): any {
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

function toNumber(
  value: any
): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  const number = Number(
    String(value).replace(/,/g, '')
  );

  return Number.isFinite(number)
    ? number
    : null;
}

function toBoolean(
  value: any
): boolean {
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

function normalizeRisk(
  value: any
): string {
  const text = String(value || '')
    .trim()
    .toLowerCase();

  if (text === 'high') return 'High';
  if (text === 'medium') return 'Medium';

  return 'Low';
}

function normalizeWork(
  row: any
): Work {
  return {
    work_id: String(
      getValue(
        row,
        'work_id',
        'Work ID',
        'Work_ID',
        'id',
        'ID'
      ) ?? ''
    ),

    work_title:
      getValue(
        row,
        'work_title',
        'Work Title',
        'Work_Title'
      ),

    work_description:
      getValue(
        row,
        'work_description',
        'Work Description',
        'Work_Description'
      ),

    lifecycle_stage:
      getValue(
        row,
        'lifecycle_stage',
        'Lifecycle Stage',
        'Lifecycle_Stage'
      ),

    state:
      getValue(
        row,
        'state',
        'State'
      ),

    work_category:
      getValue(
        row,
        'work_category',
        'Work Category',
        'Work_Category'
      ),

    ida:
      getValue(
        row,
        'ida',
        'IDA'
      ),

    mp_name:
      getValue(
        row,
        'mp_name',
        'MP Name',
        'MP_Name'
      ),

    mp_term:
      getValue(
        row,
        'mp_term',
        'MP Term',
        'MP_Term'
      ),

    chamber:
      getValue(
        row,
        'chamber',
        'Chamber'
      ),

    constituency:
      getValue(
        row,
        'constituency',
        'Constituency'
      ),

    rec_recommended_date:
      getValue(
        row,
        'rec_recommended_date',
        'Rec Recommended Date',
        'Rec_Recommended_Date'
      ),

    rec_recommended_amount:
      toNumber(
        getValue(
          row,
          'rec_recommended_amount',
          'Rec Recommended Amount',
          'Rec_Recommended_Amount'
        )
      ),

    san_sanction_date:
      getValue(
        row,
        'san_sanction_date',
        'San Sanction Date',
        'San_Sanction_Date'
      ),

    san_sanction_amount:
      toNumber(
        getValue(
          row,
          'san_sanction_amount',
          'San Sanction Amount (Rs)',
          'San_Sanction_Amount',
          'San_Sanction amount (Rs)'
        )
      ),

    san_work_status:
      getValue(
        row,
        'san_work_status',
        'San Work Status',
        'San_Work_Status'
      ),

    comp_completion_date:
      getValue(
        row,
        'comp_completion_date',
        'Comp Completion Date',
        'Comp_Completion_Date'
      ),

    comp_amount_disbursed:
      toNumber(
        getValue(
          row,
          'comp_amount_disbursed',
          'Comp Amount Disbursed',
          'Comp_Amount_Disbursed'
        )
      ),

    total_fund_disbursed:
      toNumber(
        getValue(
          row,
          'total_fund_disbursed',
          'Total Fund Disbursed',
          'Total_Fund_Disbursed'
        )
      ),

    num_payments:
      toNumber(
        getValue(
          row,
          'num_payments',
          'Num Payments',
          'Num_Payments'
        )
      ),

    latest_payment_status:
      getValue(
        row,
        'latest_payment_status',
        'Latest Payment Status',
        'Latest_Payment_Status'
      ),

    days_rec_to_san:
      toNumber(
        getValue(
          row,
          'days_rec_to_san',
          'Days Rec to San',
          'Days_Rec_to_San'
        )
      ),

    days_san_to_comp:
      toNumber(
        getValue(
          row,
          'days_san_to_comp',
          'Days San to Comp',
          'Days_San_to_Comp'
        )
      ),

    san_vs_rec_diff:
      toNumber(
        getValue(
          row,
          'san_vs_rec_diff',
          'San vs Rec Diff',
          'San_vs_Rec_Diff'
        )
      ),

    disb_vs_san_diff:
      toNumber(
        getValue(
          row,
          'disb_vs_san_diff',
          'Disb vs San Diff',
          'Disb_vs_San_Diff'
        )
      ),

    disb_vs_pay_diff:
      toNumber(
        getValue(
          row,
          'disb_vs_pay_diff',
          'Disb vs Pay Diff',
          'Disb_vs_Pay_Diff'
        )
      ),

    has_comp_image:
      toBoolean(
        getValue(
          row,
          'has_comp_image',
          'Has Comp Image',
          'Has_Comp_Image'
        )
      ),

    risk_score:
      toNumber(
        getValue(
          row,
          'risk_score',
          'Risk Score'
        )
      ) ?? 0,

    risk_tier:
      normalizeRisk(
        getValue(
          row,
          'risk_tier',
          'Risk Tier'
        )
      ),

    status_group:
      getValue(
        row,
        'status_group',
        'Status Group',
        'Status_Group'
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

    cost_reason:
      getValue(
        row,
        'cost_reason',
        'Cost Reason',
        'Cost_Reason'
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

    predicted_overrun_prob:
      toNumber(
        getValue(
          row,
          'predicted_overrun_prob',
          'Predicted Overrun Prob',
          'Predicted_Overrun_Prob'
        )
      ),

    reason:
      getValue(
        row,
        'reason',
        'Reason'
      ),
  };
}

export default function WorkDetail({
  workId,
  onBack,
}: WorkDetailProps) {
  const [work, setWork] =
    useState<Work | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        const response =
          await fetch(
            `${API_BASE}/works/${encodeURIComponent(
              workId
            )}`
          );

        if (!response.ok) {
          throw new Error(
            `Failed to load work: ${response.status}`
          );
        }

        const data =
          await response.json();

        setWork(
          normalizeWork(data)
        );
      } catch (error) {
        console.error(
          'Work detail loading error:',
          error
        );

        setWork(null);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [workId]);

  if (loading) {
    return (
      <div className="p-6">
        <Spinner />
      </div>
    );
  }

  if (!work) {
    return (
      <EmptyState message="Work not found" />
    );
  }

  const activeFlags =
    RISK_FLAGS.filter(
      (flag: RiskFlag) =>
        work[
          flag.key
        ]
    );

  const timeline: {
    label: string;
    date: string | null;
    amount: number | null;
    done: boolean;
  }[] = [
    {
      label: 'Recommended',
      date:
        work.rec_recommended_date,
      amount:
        work.rec_recommended_amount,
      done: true,
    },
    {
      label: 'Sanctioned',
      date:
        work.san_sanction_date,
      amount:
        work.san_sanction_amount,
      done:
        !!work.san_sanction_date,
    },
    {
      label: 'Completed',
      date:
        work.comp_completion_date,
      amount:
        work.comp_amount_disbursed,
      done:
        !!work.comp_completion_date,
    },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />

        Back to list
      </button>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between flex-wrap gap-3">

          <div>
            <p className="font-mono text-xs text-slate-500 mb-1">
              {work.work_id}
            </p>

            <h1 className="text-xl font-bold text-slate-800">
              {work.work_title ||
                'Untitled Work'}
            </h1>

            <p className="text-sm text-slate-500 mt-1">
              {work.work_description ||
                ''}
            </p>
          </div>

          <div className="flex items-center gap-3">

            <div className="text-right">
              <p className="text-xs text-slate-500">
                Risk Score
              </p>

              <p className="text-2xl font-bold text-slate-800">
                {work.risk_score}
              </p>
            </div>

            <RiskBadge
              tier={work.risk_tier}
              size="md"
            />
          </div>
        </div>
      </div>

      {/* Key Info Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">

        <Card className="p-4">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <MapPin className="w-4 h-4" />

            <span className="text-xs font-medium uppercase">
              State
            </span>
          </div>

          <p className="text-sm font-semibold text-slate-800">
            {work.state || '—'}
          </p>

          <p className="text-xs text-slate-500">
            {work.constituency || ''}
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <User className="w-4 h-4" />

            <span className="text-xs font-medium uppercase">
              MP
            </span>
          </div>

          <p className="text-sm font-semibold text-slate-800">
            {work.mp_name || '—'}
          </p>

          <p className="text-xs text-slate-500">
            {work.chamber || ''}
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Building2 className="w-4 h-4" />

            <span className="text-xs font-medium uppercase">
              Agency
            </span>
          </div>

          <p className="text-sm font-semibold text-slate-800 truncate">
            {work.ida || '—'}
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Calendar className="w-4 h-4" />

            <span className="text-xs font-medium uppercase">
              Stage
            </span>
          </div>

          <p className="text-sm font-semibold text-slate-800">
            {work.lifecycle_stage ||
              '—'}
          </p>

          <p className="text-xs text-slate-500">
            {work.work_category || ''}
          </p>
        </Card>

      </div>

      {/* Timeline */}
      <Card className="mb-6">

        <CardHeader
          title="Work Lifecycle Timeline"
          subtitle="Progression from recommendation to completion"
        />

        <div className="p-5">

          <div className="flex items-center justify-between relative">

            <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-100" />

            <div
              className="absolute top-5 left-0 h-0.5 bg-blue-500 transition-all"
              style={{
                width: `${
                  (timeline.filter(
                    (t) => t.done
                  ).length /
                    3) *
                  100
                }%`,
              }}
            />

            {timeline.map(
              (step, i) => (
                <div
                  key={i}
                  className="relative z-10 flex flex-col items-center"
                  style={{
                    width: '33%',
                  }}
                >

                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                      step.done
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'bg-white border-slate-200 text-slate-400'
                    }`}
                  >
                    {step.done ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Clock className="w-5 h-5" />
                    )}
                  </div>

                  <p className="text-xs font-medium text-slate-700 mt-2">
                    {step.label}
                  </p>

                  <p className="text-xs text-slate-500">
                    {formatDate(
                      step.date
                    )}
                  </p>

                  {step.amount != null && (
                    <p className="text-xs font-semibold text-slate-700 mt-0.5">
                      {formatCurrency(
                        step.amount
                      )}
                    </p>
                  )}

                </div>
              )
            )}

          </div>

          {(
            work.days_rec_to_san !=
              null ||
            work.days_san_to_comp !=
              null
          ) && (
            <div className="flex justify-center gap-8 mt-4 pt-4 border-t border-slate-50">

              {work.days_rec_to_san !=
                null && (
                <div className="text-center">
                  <p className="text-xs text-slate-500">
                    Rec → Sanction
                  </p>

                  <p className="text-sm font-semibold text-slate-700">
                    {
                      work.days_rec_to_san
                    }{' '}
                    days
                  </p>
                </div>
              )}

              {work.days_san_to_comp !=
                null && (
                <div className="text-center">
                  <p className="text-xs text-slate-500">
                    Sanction → Completion
                  </p>

                  <p className="text-sm font-semibold text-slate-700">
                    {
                      work.days_san_to_comp
                    }{' '}
                    days
                  </p>
                </div>
              )}

            </div>
          )}

        </div>
      </Card>

      {/* Financial Details */}
      <Card className="mb-6">

        <CardHeader
          title="Financial Details"
          subtitle="Fund flow across recommendation, sanction, and disbursement"
        />

        <div className="p-5 grid grid-cols-2 lg:grid-cols-3 gap-4">

          <div>
            <p className="text-xs text-slate-500 mb-1">
              Recommended Amount
            </p>

            <p className="text-lg font-bold text-slate-800">
              {formatCurrency(
                work.rec_recommended_amount
              )}
            </p>

            <p className="text-xs text-slate-400">
              {formatDate(
                work.rec_recommended_date
              )}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-1">
              Sanctioned Amount
            </p>

            <p className="text-lg font-bold text-slate-800">
              {formatCurrency(
                work.san_sanction_amount
              )}
            </p>

            <p className="text-xs text-slate-400">
              {formatDate(
                work.san_sanction_date
              )}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-1">
              Amount Disbursed
            </p>

            <p className="text-lg font-bold text-slate-800">
              {formatCurrency(
                work.comp_amount_disbursed
              )}
            </p>

            <p className="text-xs text-slate-400">
              {formatDate(
                work.comp_completion_date
              )}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-1">
              Total Fund Disbursed
            </p>

            <p className="text-lg font-bold text-slate-800">
              {formatCurrency(
                work.total_fund_disbursed
              )}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-1">
              Number of Payments
            </p>

            <p className="text-lg font-bold text-slate-800">
              {work.num_payments ??
                '—'}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-1">
              Latest Payment Status
            </p>

            <p className="text-sm font-semibold text-slate-800">
              {work.latest_payment_status ||
                '—'}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-1">
              Sanction vs. Recommended
            </p>

            <p
              className={`text-sm font-semibold ${
                (work.san_vs_rec_diff ||
                  0) > 0
                  ? 'text-red-600'
                  : 'text-emerald-600'
              }`}
            >
              {formatCurrency(
                work.san_vs_rec_diff
              )}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-1">
              Disbursed vs. Sanctioned
            </p>

            <p
              className={`text-sm font-semibold ${
                (work.disb_vs_san_diff ||
                  0) > 0
                  ? 'text-red-600'
                  : 'text-emerald-600'
              }`}
            >
              {formatCurrency(
                work.disb_vs_san_diff
              )}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-1">
              Disbursed vs. Payments
            </p>

            <p
              className={`text-sm font-semibold ${
                (work.disb_vs_pay_diff ||
                  0) > 0
                  ? 'text-red-600'
                  : 'text-emerald-600'
              }`}
            >
              {formatCurrency(
                work.disb_vs_pay_diff
              )}
            </p>
          </div>

        </div>
      </Card>

      {/* AI Risk Analysis */}
      <Card className="mb-6">

        <CardHeader
          title="AI Risk Analysis"
          subtitle="Machine learning flags triggered for this work"
          action={
            <Brain className="w-5 h-5 text-blue-500" />
          }
        />

        <div className="p-5">

          {activeFlags.length ===
          0 ? (
            <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg">

              <CheckCircle2 className="w-5 h-5 text-emerald-600" />

              <p className="text-sm text-emerald-700">
                No risk flags triggered.
                This work appears to
                follow normal patterns.
              </p>

            </div>
          ) : (
            <div className="space-y-3">

              {activeFlags.map(
                (flag) => {

                  const Icon =
                    flag.key ===
                    'timeline_flag'
                      ? Clock
                      : flag.key ===
                        'cost_outlier_flag'
                      ? TrendingUp
                      : flag.key ===
                        'payment_mismatch_flag'
                      ? AlertTriangle
                      : flag.key ===
                        'duplicate_flag'
                      ? FileText
                      : flag.key ===
                        'no_asset_evidence_flag'
                      ? XCircle
                      : flag.key ===
                        'predicted_overrun_flag'
                      ? TrendingUp
                      : AlertTriangle;

                  return (
                    <div
                      key={
                        flag.key
                      }
                      className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg"
                    >

                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: `${flag.color}15`,
                          color: flag.color,
                        }}
                      >
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="flex-1">

                        <p className="text-sm font-semibold text-slate-800">
                          {flag.label}
                        </p>

                        <p className="text-xs text-slate-500 mt-0.5">
                          {
                            flag.description
                          }
                        </p>

                        {flag.key ===
                          'cost_outlier_flag' &&
                          work.cost_reason && (
                            <p className="text-xs text-slate-600 mt-1 italic">
                              {
                                work.cost_reason
                              }
                            </p>
                          )}

                        {flag.key ===
                          'early_warning_flag' && (
                          <p className="text-xs text-slate-600 mt-1">
                            Predicted overrun
                            probability:{' '}
                            <span className="font-semibold">
                              {formatPercent(
                                work.predicted_overrun_prob
                              )}
                            </span>
                          </p>
                        )}

                      </div>
                    </div>
                  );
                }
              )}

              <div className="mt-4 p-4 bg-slate-50 rounded-lg">

                <p className="text-xs font-semibold text-slate-600 uppercase mb-1">
                  AI Summary
                </p>

                <p className="text-sm text-slate-700">
                  {work.reason ||
                    'No additional AI explanation is available for this work.'}
                </p>

              </div>

            </div>
          )}

        </div>
      </Card>

      {/* Additional Info */}
      <Card>

        <CardHeader
          title="Additional Information"
          subtitle="Other metadata for this work"
        />

        <div className="p-5 grid grid-cols-2 lg:grid-cols-3 gap-4">

          <div>
            <p className="text-xs text-slate-500 mb-1">
              MP Term
            </p>

            <p className="text-sm font-semibold text-slate-800">
              {work.mp_term ||
                '—'}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-1">
              Work Category
            </p>

            <p className="text-sm font-semibold text-slate-800">
              {work.work_category ||
                '—'}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-1">
              Sanction Status
            </p>

            <p className="text-sm font-semibold text-slate-800">
              {work.san_work_status ||
                '—'}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-1">
              Asset Image Evidence
            </p>

            <p className="text-sm font-semibold text-slate-800">

              {work.has_comp_image ? (
                <span className="flex items-center gap-1 text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" />

                  Available
                </span>
              ) : (
                <span className="flex items-center gap-1 text-red-600">
                  <XCircle className="w-4 h-4" />

                  Not Available
                </span>
              )}

            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-1">
              Status Group
            </p>

            <p className="text-sm font-semibold text-slate-800">
              {work.status_group ||
                '—'}
            </p>
          </div>

        </div>
      </Card>

    </div>
  );
}