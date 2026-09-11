/*
# Create MPLADS Works Table with AI Risk Scoring

1. Purpose
- Stores MPLADS work records with all lifecycle, financial, and AI-generated risk fields.
- This is a single-tenant public dashboard (no sign-in) for government monitoring.

2. New Table: mplads_works
- work_id (text, primary key) — unique identifier like WS/MP001/2023-2024/103702
- work_title (text) — category of work
- lifecycle_stage (text) — Completed, Sanctioned, Recommended, Unknown
- state (text) — Indian state where work is executed
- work_category (text) — e.g. Normal/Others
- ida (text) — Implementing District Agency
- mp_name (text) — Member of Parliament who recommended the work
- mp_term (text) — e.g. 2022-28
- chamber (text) — Lok Sabha / Rajya Sabha
- work_description (text) — detailed description of the work
- constituency (text) — parliamentary constituency
- rec_recommended_date (date) — when MP recommended the work
- rec_recommended_amount (numeric) — recommended amount in Rs
- san_sanction_date (date) — when work was sanctioned
- san_sanction_amount (numeric) — sanctioned amount in Rs
- san_work_status (text) — status at sanction stage
- comp_completion_date (date) — when work was completed
- comp_amount_disbursed (numeric) — amount disbursed at completion
- total_fund_disbursed (numeric) — total funds disbursed
- num_payments (integer) — number of payment transactions
- latest_payment_status (text) — Payment Success / Payment In-Progress
- days_rec_to_san (integer) — days from recommendation to sanction
- days_san_to_comp (integer) — days from sanction to completion
- san_vs_rec_diff (numeric) — sanction minus recommended amount
- disb_vs_san_diff (numeric) — disbursed minus sanctioned amount
- disb_vs_pay_diff (numeric) — disbursed minus total payments
- has_comp_image (boolean) — whether asset creation image evidence exists

3. AI Risk Fields
- risk_score (integer) — composite count of triggered flags
- risk_tier (text) — Low / Medium / High
- status_group (text) — Completed / In Progress
- timeline_flag (boolean) — exceeded 1-year completion norm
- cost_outlier_flag (boolean) — Isolation Forest detected cost anomaly
- cost_reason (text) — which cost feature drove the flag
- payment_mismatch_flag (boolean) — payment released before work verified complete
- duplicate_flag (boolean) — similar to another work description (TF-IDF cosine > 0.85)
- no_asset_evidence_flag (boolean) — marked complete with no asset image
- predicted_overrun_flag (boolean) — elapsed time exceeds norm, still in progress
- early_warning_flag (boolean) — model predicts overrun before 1-year mark
- predicted_overrun_prob (numeric) — RandomForest probability of overrun
- reason (text) — human-readable explanation of all triggered flags

4. Security
- RLS enabled, anon+authenticated CRUD (public government dashboard data).
*/

CREATE TABLE IF NOT EXISTS mplads_works (
  work_id text PRIMARY KEY,
  work_title text,
  lifecycle_stage text,
  state text,
  work_category text,
  ida text,
  mp_name text,
  mp_term text,
  chamber text,
  work_description text,
  constituency text,
  rec_recommended_date date,
  rec_recommended_amount numeric,
  san_sanction_date date,
  san_sanction_amount numeric,
  san_work_status text,
  comp_completion_date date,
  comp_amount_disbursed numeric,
  total_fund_disbursed numeric,
  num_payments integer,
  latest_payment_status text,
  days_rec_to_san integer,
  days_san_to_comp integer,
  san_vs_rec_diff numeric,
  disb_vs_san_diff numeric,
  disb_vs_pay_diff numeric,
  has_comp_image boolean,
  risk_score integer DEFAULT 0,
  risk_tier text DEFAULT 'Low',
  status_group text,
  timeline_flag boolean DEFAULT false,
  cost_outlier_flag boolean DEFAULT false,
  cost_reason text,
  payment_mismatch_flag boolean DEFAULT false,
  duplicate_flag boolean DEFAULT false,
  no_asset_evidence_flag boolean DEFAULT false,
  predicted_overrun_flag boolean DEFAULT false,
  early_warning_flag boolean DEFAULT false,
  predicted_overrun_prob numeric DEFAULT 0,
  reason text DEFAULT 'No issues detected'
);

ALTER TABLE mplads_works ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_works" ON mplads_works;
CREATE POLICY "anon_select_works" ON mplads_works FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_works" ON mplads_works;
CREATE POLICY "anon_insert_works" ON mplads_works FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_works" ON mplads_works;
CREATE POLICY "anon_update_works" ON mplads_works FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_works" ON mplads_works;
CREATE POLICY "anon_delete_works" ON mplads_works FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_mplads_works_state ON mplads_works(state);
CREATE INDEX IF NOT EXISTS idx_mplads_works_risk_tier ON mplads_works(risk_tier);
CREATE INDEX IF NOT EXISTS idx_mplads_works_lifecycle ON mplads_works(lifecycle_stage);
CREATE INDEX IF NOT EXISTS idx_mplads_works_mp_name ON mplads_works(mp_name);
CREATE INDEX IF NOT EXISTS idx_mplads_works_category ON mplads_works(work_category);
