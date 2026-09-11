import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const STATES = [
  'Uttar Pradesh', 'Bihar', 'Maharashtra', 'Tamil Nadu', 'West Bengal',
  'Karnataka', 'Rajasthan', 'Gujarat', 'Andhra Pradesh', 'Madhya Pradesh',
  'Kerala', 'Punjab', 'Haryana', 'Odisha', 'Telangana',
  'Jharkhand', 'Chhattisgarh', 'Assam', 'Delhi', 'Uttarakhand',
];

const WORK_TITLES = [
  'Construction of roads, link roads, pathways or culverts',
  'Installation of solar street lighting',
  'Construction of school classrooms',
  'Installation of multi-gym equipment',
  'Construction of community hall',
  'Construction of drainage system',
  'Installation of hand pumps',
  'Construction of public toilet complex',
  'Construction ofanganwadi center',
  'Installation of high mast LED lights',
  'Construction of bus shelter',
  'Construction of cremation ground',
  'Construction of check dam',
  'Installation of transformers',
  'Construction of village pond',
  'Construction of playground',
  'Construction of library building',
  'Construction of primary health center',
  'Construction of market shed',
  'Construction of approach road',
];

const WORK_CATEGORIES = ['Normal/Others', 'SCP', 'TSP', 'Special Category'];

const CHAMBERS = [
  'Lok Sabha (Elected, Constituency-based)',
  'Rajya Sabha (Elected MP)',
];

const MP_NAMES = [
  'Shri Rajesh Kumar', 'Shri Anand Sharma', 'Smt Priya Devi', 'Shri Ramesh Yadav',
  'Shri Vijay Singh', 'Smt Sunita Devi', 'Shri Arjun Mehta', 'Shri Pradeep Rao',
  'Smt Lakshmi Bai', 'Shri Mohan Lal', 'Shri Deepak Verma', 'Smt Asha Gupta',
  'Shri Sanjay Patel', 'Shri Krishna Murthy', 'Smt Ratna Singh',
  'Shri Harish Chandra', 'Shri Imran Khan', 'Smt Meena Kumari',
  'Shri Suresh Reddy', 'Shri Gopal Das',
];

const IDA_TEMPLATES = [
  'DISTRICT MAGISTRATE', 'DISTRICT PLANNING OFFICER', 'DEPUTY COMMISSIONER',
  'DISTRICT COLLECTOR', 'CHIEF EXECUTIVE OFFICER',
];

const CONSTITUENCIES = [
  'MACHHLISHAHR(SC)', 'AZAMGARH', 'GHAZIPUR', 'GORAKHPUR', 'KANPUR',
  'VARANASI', 'LUCKNOW', 'ALLAHABAD', 'MEERUT', 'ALIGARH',
  'PATNA SAHIB', 'DARBHANGA', 'MADHEPURA', 'SASARAM', 'VALMIKI NAGAR',
];

const SAN_STATUSES = ['Physical Inspection', 'Work Completed', 'Work In Progress', 'Sanctioned'];

const PAYMENT_STATUSES = ['Payment Success', 'Payment In-Progress'];

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min, max) => Math.random() * (max - min) + min;

function generateIDA(state) {
  const city = state.split(' ')[0].toUpperCase();
  const template = rand(IDA_TEMPLATES);
  return `${city}(${template} ${city}_IDA)`;
}

function generateWorkId(i) {
  const mpNum = String(randInt(1, 500)).padStart(3, '0');
  const year = rand(['2023-2024', '2022-2023', '2024-2025', '2021-2022']);
  const workNum = String(randInt(100, 999999)).padStart(1, '0');
  return `WS/MP${mpNum}/${year}/${workNum}`;
}

function generateWork() {
  const state = rand(STATES);
  const lifecycle = (() => {
    const r = Math.random();
    if (r < 0.75) return 'Completed';
    if (r < 0.92) return 'Sanctioned';
    if (r < 0.99) return 'Recommended';
    return 'Unknown';
  })();

  const isCompleted = lifecycle === 'Completed';
  const isSanctioned = lifecycle === 'Sanctioned' || isCompleted;
  const isRecommended = lifecycle === 'Recommended';

  const recDate = new Date(2021, randInt(0, 47), randInt(1, 28));
  let sanDate = null;
  let compDate = null;

  if (isSanctioned) {
    sanDate = new Date(recDate.getTime() + randInt(1, 400) * 86400000);
  }
  if (isCompleted) {
    compDate = new Date((sanDate || recDate).getTime() + randInt(30, 950) * 86400000);
  }

  const recAmount = randFloat(50000, 5000000);
  const sanAmount = isSanctioned ? recAmount + randFloat(-recAmount * 0.1, recAmount * 0.05) : null;
  const compAmount = isCompleted ? (sanAmount || recAmount) + randFloat(-500000, 200000) : null;

  const daysRecToSan = isSanctioned ? Math.round((sanDate - recDate) / 86400000) : null;
  const daysSanToComp = isCompleted ? Math.round((compDate - sanDate) / 86400000) : null;

  const totalFundDisbursed = isCompleted ? randFloat(50000, 5000000) : null;
  const numPayments = isCompleted ? randInt(1, 40) : null;
  const latestPayStatus = isCompleted ? rand(PAYMENT_STATUSES) : null;
  const hasCompImage = isCompleted ? Math.random() > 0.28 : false;

  const sanVsRecDiff = isSanctioned ? (sanAmount - recAmount) : null;
  const disbVsSanDiff = isCompleted && sanAmount && compAmount ? (compAmount - sanAmount) : null;
  const disbVsPayDiff = isCompleted && totalFundDisbursed ? randFloat(0, 10000000) : null;

  // AI Risk flags
  const timelineFlag = isCompleted && daysSanToComp > 365;
  const costOutlierFlag = isCompleted && Math.abs(disbVsSanDiff || 0) > 100000 && Math.random() > 0.85;
  const costReason = costOutlierFlag
    ? (Math.abs(disbVsSanDiff || 0) > Math.abs(disbVsPayDiff || 0)
      ? 'Disbursed vs Sanctioned Amount Diff drove the flag'
      : 'Disbursed vs Total Payments Diff drove the flag')
    : null;

  const paymentMismatchFlag = isCompleted
    && latestPayStatus === 'Payment Success'
    && Math.random() > 0.75
    && rand(SAN_STATUSES) !== 'Work Completed';

  const duplicateFlag = isCompleted && Math.random() > 0.92;
  const noAssetEvidenceFlag = isCompleted && !hasCompImage;

  // For in-progress works
  const elapsedDays = !isCompleted && sanDate
    ? Math.floor((Date.now() - sanDate.getTime()) / 86400000)
    : null;
  const predictedOverrunFlag = !isCompleted && elapsedDays > 365;
  const predictedOverrunProb = !isCompleted ? randFloat(0, 1) : 0;
  const earlyWarningFlag = !isCompleted && predictedOverrunProb > 0.6 && elapsedDays < 365;

  // Composite risk
  let riskScore = 0;
  if (timelineFlag) riskScore++;
  if (costOutlierFlag) riskScore++;
  if (paymentMismatchFlag) riskScore++;
  if (duplicateFlag) riskScore++;
  if (noAssetEvidenceFlag) riskScore++;
  if (predictedOverrunFlag) riskScore++;
  if (earlyWarningFlag) riskScore++;

  const riskTier = riskScore === 0 ? 'Low' : riskScore <= 1 ? 'Medium' : 'High';
  const statusGroup = isCompleted ? 'Completed' : 'In Progress';

  // Build reason
  const reasons = [];
  if (timelineFlag) reasons.push('Exceeded 1-year completion norm');
  if (costOutlierFlag) reasons.push(`Cost outlier — ${costReason}`);
  if (paymentMismatchFlag) reasons.push('Payment released before work verified complete');
  if (duplicateFlag) reasons.push('Similar to another work description');
  if (noAssetEvidenceFlag) reasons.push('Marked complete with no asset-creation evidence (no image on record)');
  if (predictedOverrunFlag) reasons.push('Elapsed time exceeds norm, still in progress');
  if (earlyWarningFlag) reasons.push(`Model predicts overrun risk (${Math.round(predictedOverrunProb * 100)}%) before 1-year mark`);
  const reason = reasons.length > 0 ? reasons.join('; ') : 'No issues detected';

  return {
    work_id: generateWorkId(),
    work_title: rand(WORK_TITLES),
    lifecycle_stage: lifecycle,
    state,
    work_category: rand(WORK_CATEGORIES),
    ida: generateIDA(state),
    mp_name: rand(MP_NAMES),
    mp_term: rand(['2022-28', '2019-25', '2024-30']),
    chamber: rand(CHAMBERS),
    work_description: `${rand(WORK_TITLES)} in ${state} under MPLADS scheme`,
    constituency: rand(CONSTITUENCIES),
    rec_recommended_date: recDate.toISOString().split('T')[0],
    rec_recommended_amount: Math.round(recAmount),
    san_sanction_date: sanDate ? sanDate.toISOString().split('T')[0] : null,
    san_sanction_amount: sanAmount ? Math.round(sanAmount) : null,
    san_work_status: isSanctioned ? rand(SAN_STATUSES) : null,
    comp_completion_date: compDate ? compDate.toISOString().split('T')[0] : null,
    comp_amount_disbursed: compAmount ? Math.round(compAmount) : null,
    total_fund_disbursed: totalFundDisbursed ? Math.round(totalFundDisbursed) : null,
    num_payments: numPayments,
    latest_payment_status: latestPayStatus,
    days_rec_to_san: daysRecToSan,
    days_san_to_comp: daysSanToComp,
    san_vs_rec_diff: sanVsRecDiff ? Math.round(sanVsRecDiff) : null,
    disb_vs_san_diff: disbVsSanDiff ? Math.round(disbVsSanDiff) : null,
    disb_vs_pay_diff: disbVsPayDiff ? Math.round(disbVsPayDiff) : null,
    has_comp_image: hasCompImage,
    risk_score: riskScore,
    risk_tier: riskTier,
    status_group: statusGroup,
    timeline_flag: timelineFlag,
    cost_outlier_flag: costOutlierFlag,
    cost_reason: costReason,
    payment_mismatch_flag: paymentMismatchFlag,
    duplicate_flag: duplicateFlag,
    no_asset_evidence_flag: noAssetEvidenceFlag,
    predicted_overrun_flag: predictedOverrunFlag,
    early_warning_flag: earlyWarningFlag,
    predicted_overrun_prob: Math.round(predictedOverrunProb * 1000) / 1000,
    reason,
  };
}

async function insertBatch(records) {
  const { error } = await supabase.from('mplads_works').insert(records);
  if (error) {
    console.error('Insert error:', error.message);
    return false;
  }
  return true;
}

async function main() {
  const TOTAL = 2000;
  const BATCH_SIZE = 200;
  const workIds = new Set();

  console.log(`Generating ${TOTAL} MPLADS work records...`);

  for (let batch = 0; batch < Math.ceil(TOTAL / BATCH_SIZE); batch++) {
    const records = [];
    for (let i = 0; i < BATCH_SIZE && batch * BATCH_SIZE + i < TOTAL; i++) {
      let work = generateWork();
      // Ensure unique work_id
      while (workIds.has(work.work_id)) {
        work.work_id = generateWorkId();
      }
      workIds.add(work.work_id);
      records.push(work);
    }
    const success = await insertBatch(records);
    if (success) {
      console.log(`Inserted batch ${batch + 1}/${Math.ceil(TOTAL / BATCH_SIZE)} (${records.length} records)`);
    } else {
      console.error(`Batch ${batch + 1} failed`);
    }
  }

  console.log('Data generation complete!');
}

main().catch(console.error);
