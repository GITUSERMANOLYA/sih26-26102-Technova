import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Work = {
  work_id: string;
  work_title: string | null;
  lifecycle_stage: string | null;
  state: string | null;
  work_category: string | null;
  ida: string | null;
  mp_name: string | null;
  mp_term: string | null;
  chamber: string | null;
  work_description: string | null;
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
  has_comp_image: boolean | null;
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
  predicted_overrun_prob: number;
  reason: string;
};

export const INDIAN_STATES_AND_UTS = [
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
] as const;

export type RiskFlagKey =
  | 'timeline_flag'
  | 'cost_outlier_flag'
  | 'payment_mismatch_flag'
  | 'duplicate_flag'
  | 'no_asset_evidence_flag'
  | 'predicted_overrun_flag'
  | 'early_warning_flag';

export const RISK_FLAGS: { key: RiskFlagKey; label: string; description: string; color: string }[] = [
  {
    key: 'timeline_flag',
    label: 'Timeline Exceeded',
    description: 'Work took more than 365 days from sanction to completion, exceeding the MPLADS norm.',
    color: '#f59e0b',
  },
  {
    key: 'cost_outlier_flag',
    label: 'Cost Outlier',
    description: 'Isolation Forest detected anomalous cost patterns in sanctioned vs. disbursed amounts.',
    color: '#ef4444',
  },
  {
    key: 'payment_mismatch_flag',
    label: 'Payment Mismatch',
    description: 'Payment was marked successful before the work was verified as complete.',
    color: '#f97316',
  },
  {
    key: 'duplicate_flag',
    label: 'Duplicate Work',
    description: 'TF-IDF cosine similarity above 0.85 with another work description in the same district.',
    color: '#a855f7',
  },
  {
    key: 'no_asset_evidence_flag',
    label: 'No Asset Evidence',
    description: 'Work marked complete but no asset-creation image evidence on record.',
    color: '#6b7280',
  },
  {
    key: 'predicted_overrun_flag',
    label: 'Predicted Overrun',
    description: 'Elapsed time exceeds the 1-year norm and the work is still in progress.',
    color: '#dc2626',
  },
  {
    key: 'early_warning_flag',
    label: 'Early Warning',
    description: 'Random Forest model predicts high probability of overrun before the 1-year mark.',
    color: '#eab308',
  },
];
