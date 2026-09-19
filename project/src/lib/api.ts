import type { Work } from './supabase';

const API_BASE = 'https://technova-backend-0gpp.onrender.com/';


// ============================================================
// HELPERS
// ============================================================

function toBool(value: any): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  if (value == null) {
    return false;
  }

  return ['true', '1', 'yes', 'y', 't'].includes(
    String(value).trim().toLowerCase()
  );
}


function toNumber(value: any): number {
  if (value == null || value === '') {
    return 0;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}


// ============================================================
// WORK MAPPER
// ============================================================

function mapWork(raw: any): Work {
  return {
    work_id:
      raw['Work ID'] ??
      raw.work_id ??
      '',

    work_title:
      raw['Work Title'] ??
      raw.work_title ??
      null,

    lifecycle_stage:
      raw['Lifecycle Stage'] ??
      raw.lifecycle_stage ??
      null,

    state:
      raw['State'] ??
      raw.state ??
      null,

    work_category:
      raw['Work Category'] ??
      raw.work_category ??
      null,

    ida:
      raw['IDA'] ??
      raw.ida ??
      null,

    mp_name:
      raw['MP Name'] ??
      raw.mp_name ??
      null,

    mp_term:
      raw['MP Term'] ??
      raw.mp_term ??
      null,

    chamber:
      raw['Chamber'] ??
      raw.chamber ??
      null,

    work_description:
      raw['Work Description'] ??
      raw.work_description ??
      null,

    constituency:
      raw['Constituency'] ??
      raw.constituency ??
      null,

    rec_recommended_date:
      raw['Rec_Recommended date'] ??
      raw.rec_recommended_date ??
      null,

    rec_recommended_amount:
      raw['Rec_Recommended Amount (Rs)'] ??
      raw.rec_recommended_amount ??
      null,

    san_sanction_date:
      raw['San_Sanction Date'] ??
      raw.san_sanction_date ??
      null,

    san_sanction_amount:
      raw['San_Sanction Amount (Rs)'] ??
      raw.san_sanction_amount ??
      null,

    san_work_status:
      raw['San_Work Status'] ??
      raw.san_work_status ??
      null,

    comp_completion_date:
      raw['Comp_Completion Date'] ??
      raw.comp_completion_date ??
      null,

    comp_amount_disbursed:
      raw['Comp_Amount Disbursed (Rs)'] ??
      raw.comp_amount_disbursed ??
      null,

    total_fund_disbursed:
      raw['Total_Fund_Disbursed'] ??
      raw.total_fund_disbursed ??
      null,

    num_payments:
      raw['Num_Payments'] ??
      raw.num_payments ??
      null,

    latest_payment_status:
      raw['Latest_Payment_Status'] ??
      raw.latest_payment_status ??
      null,

    days_rec_to_san:
      raw['Days Recommended to Sanctioned'] ??
      raw.days_rec_to_san ??
      null,

    days_san_to_comp:
      raw['Days Sanctioned to Completed'] ??
      raw.days_san_to_comp ??
      null,

    san_vs_rec_diff:
      raw['Sanction vs Recommended Amount Diff'] ??
      raw.san_vs_rec_diff ??
      null,

    disb_vs_san_diff:
      raw['Disbursed vs Sanctioned Amount Diff'] ??
      raw.disb_vs_san_diff ??
      null,

    disb_vs_pay_diff:
      raw['Disbursed vs Total Payments Diff'] ??
      raw.disb_vs_pay_diff ??
      null,

    has_comp_image:
      toBool(raw['Comp_Image']) ||
      toBool(raw.has_comp_image),

    risk_score:
      toNumber(
        raw.risk_score
      ),

    risk_tier:
      raw.risk_tier ??
      'Low',

    status_group:
      raw.status_group ??
      null,

    timeline_flag:
      toBool(raw.timeline_flag),

    cost_outlier_flag:
      toBool(raw.cost_outlier_flag),

    cost_reason:
      raw.cost_reason ??
      null,

    payment_mismatch_flag:
      toBool(raw.payment_mismatch_flag),

    duplicate_flag:
      toBool(raw.duplicate_flag),

    no_asset_evidence_flag:
      toBool(raw.no_asset_evidence_flag),

    predicted_overrun_flag:
      toBool(raw.predicted_overrun_flag),

    early_warning_flag:
      toBool(raw.early_warning_flag),

    predicted_overrun_prob:
      toNumber(
        raw.predicted_overrun_prob
      ),

    reason:
      raw.reason ??
      '',
  };
}


// ============================================================
// DASHBOARD
// ============================================================

export async function getDashboard() {
  const response = await fetch(
    `${API_BASE}/dashboard`
  );

  if (!response.ok) {
    throw new Error(
      'Failed to load dashboard'
    );
  }

  return response.json();
}


// ============================================================
// RISK DISTRIBUTION
// ============================================================

export async function getRiskDistribution() {
  const response = await fetch(
    `${API_BASE}/risk-distribution`
  );

  if (!response.ok) {
    throw new Error(
      'Failed to load risk distribution'
    );
  }

  return response.json();
}


// ============================================================
// WORKS
// ============================================================

export async function getWorks(
  params: {
    page?: number;
    limit?: number;
    risk?: string;
    state?: string;
    status?: string;
    search?: string;
    flag?: string;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
  } = {}
) {
  const query =
    new URLSearchParams();

  if (params.page) {
    query.set(
      'page',
      String(params.page)
    );
  }

  if (params.limit) {
    query.set(
      'limit',
      String(params.limit)
    );
  }

  if (params.risk) {
    query.set(
      'risk',
      params.risk
    );
  }

  if (params.state) {
    query.set(
      'state',
      params.state
    );
  }

  if (params.status) {
    query.set(
      'status',
      params.status
    );
  }

  if (params.search) {
    query.set(
      'search',
      params.search
    );
  }

  if (params.flag) {
    query.set(
      'flag',
      params.flag
    );
  }

  if (params.sortBy) {
    query.set(
      'sort_by',
      params.sortBy
    );
  }

  if (params.sortDir) {
    query.set(
      'sort_dir',
      params.sortDir
    );
  }

  const response = await fetch(
    `${API_BASE}/works?${query.toString()}`
  );

  if (!response.ok) {
    throw new Error(
      'Failed to load works'
    );
  }

  const result =
    await response.json();

  return {
    ...result,

    data: Array.isArray(result.data)
      ? result.data.map(mapWork)
      : [],
  };
}


// ============================================================
// SINGLE WORK
// ============================================================

export async function getWork(
  workId: string
) {
  const response = await fetch(
    `${API_BASE}/works/${encodeURIComponent(
      workId
    )}`
  );

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }

    throw new Error(
      'Failed to load work'
    );
  }

  const result =
    await response.json();

  return mapWork(result);
}


// ============================================================
// HIGH-RISK WORKS
// ============================================================

export async function getHighRisk(
  limit = 100
) {
  const response = await fetch(
    `${API_BASE}/high-risk?limit=${limit}`
  );

  if (!response.ok) {
    throw new Error(
      'Failed to load high-risk works'
    );
  }

  const result =
    await response.json();

  return {
    ...result,

    data: Array.isArray(result.data)
      ? result.data.map(mapWork)
      : [],
  };
}


// ============================================================
// STATES
// ============================================================

export async function getStates() {
  const response = await fetch(
    `${API_BASE}/states`
  );

  if (!response.ok) {
    throw new Error(
      'Failed to load states'
    );
  }

  return response.json();
}


// ============================================================
// CATEGORIES
// ============================================================

export async function getCategories() {
  const response = await fetch(
    `${API_BASE}/categories`
  );

  if (!response.ok) {
    throw new Error(
      'Failed to load categories'
    );
  }

  return response.json();
}


// ============================================================
// STATE SUMMARY
// ============================================================

export async function getStateSummary() {
  const response = await fetch(
    `${API_BASE}/state-summary`
  );

  if (!response.ok) {
    throw new Error(
      'Failed to load state summary'
    );
  }

  return response.json();
}
