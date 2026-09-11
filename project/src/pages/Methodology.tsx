import { Card, CardHeader, PageHeader } from '@/components/ui';
import {
  Brain, GitBranch, AlertTriangle, TrendingUp, Copy, Clock,
  ImageOff, DollarSign, Database, ShieldCheck, Target, Workflow,
} from 'lucide-react';

export default function Methodology() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader
        title="AI Methodology"
        subtitle="How the platform detects anomalies, fraud, and inefficiencies in MPLADS works"
      />

      {/* Overview */}
      <Card className="mb-6">
        <div className="p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Brain className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-800">AI-Powered Detection Pipeline</h2>
              <p className="text-sm text-slate-600 mt-1">
                This platform combines multiple machine learning techniques to identify unusual patterns,
                cost overruns, duplicate works, delayed projects, and potential fund misuse across MPLADS works.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Pipeline */}
      <Card className="mb-6">
        <CardHeader title="Detection Pipeline" subtitle="The five-stage AI pipeline from data ingestion to risk alerts" />
        <div className="p-5 space-y-4">
          {[
            {
              icon: Database,
              title: '1. Data Ingestion & Preprocessing',
              desc: 'Raw MPLADS data is loaded from the MoSPI dashboard dataset. Missing values are handled, dates are parsed, and derived features are computed: days from recommendation to sanction, sanction to completion, and financial differences (sanction vs. recommended, disbursed vs. sanctioned, disbursed vs. payments).',
              color: 'blue',
            },
            {
              icon: GitBranch,
              title: '2. Feature Engineering',
              desc: 'Lifecycle stage is classified (Completed, Sanctioned, Recommended, Unknown). Works are grouped by status. Financial diff features and timeline features are created. Asset evidence (completion image) is flagged. These features feed into the anomaly detection models.',
              color: 'cyan',
            },
            {
              icon: Workflow,
              title: '3. Anomaly Detection (Isolation Forest)',
              desc: 'An Isolation Forest model is trained on cost-related features (sanction vs. recommended diff, disbursed vs. sanctioned diff, disbursed vs. payments diff). Works with anomaly scores above the threshold are flagged as cost outliers. The specific feature driving the anomaly is identified and recorded.',
              color: 'purple',
            },
            {
              icon: Copy,
              title: '4. Duplicate Detection (TF-IDF + Cosine Similarity)',
              desc: 'Work descriptions are vectorized using TF-IDF (Term Frequency-Inverse Document Frequency). Pairwise cosine similarity is computed. Any pair with similarity above 0.85 is flagged as a potential duplicate work — a common indicator of fund misuse through repeated claims for the same project.',
              color: 'amber',
            },
            {
              icon: TrendingUp,
              title: '5. Predictive Overrun Model (Random Forest)',
              desc: 'A Random Forest classifier is trained on completed works to predict whether in-progress works will exceed the 1-year completion norm. Features include days elapsed, sanctioned amount, and category. The model outputs a probability score — works above 0.6 probability trigger an early warning alert.',
              color: 'red',
            },
          ].map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg bg-${step.color}-100 flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 text-${step.color}-600`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm text-slate-800">{step.title}</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Risk Flags */}
      <Card className="mb-6">
        <CardHeader title="Risk Detection Rules" subtitle="Seven AI-powered flags contribute to the composite risk score" />
        <div className="p-5 space-y-3">
          {[
            { icon: Clock, title: 'Timeline Exceeded', desc: 'Flagged when days from sanction to completion exceed 365 days. The MPLADS norm expects works to be completed within one year.', color: 'amber' },
            { icon: TrendingUp, title: 'Cost Outlier (Isolation Forest)', desc: 'Flagged when the Isolation Forest model detects anomalous cost patterns. The specific feature (sanction vs. recommended, disbursed vs. sanctioned, or disbursed vs. payments) driving the anomaly is recorded.', color: 'red' },
            { icon: AlertTriangle, title: 'Payment Mismatch', desc: 'Flagged when payment is marked as successful but the work status is not "Work Completed" — indicating funds may have been released before verification.', color: 'orange' },
            { icon: Copy, title: 'Duplicate Work (TF-IDF Cosine)', desc: 'Flagged when a work description has cosine similarity above 0.85 with another work in the same district — a potential duplicate claim.', color: 'purple' },
            { icon: ImageOff, title: 'No Asset Evidence', desc: 'Flagged when a work is marked complete but no asset-creation image evidence exists on record — a gap in physical verification.', color: 'slate' },
            { icon: TrendingUp, title: 'Predicted Overrun', desc: 'Flagged when elapsed time exceeds the 1-year norm and the work is still in progress — the model predicts it will overrun.', color: 'red' },
            { icon: AlertTriangle, title: 'Early Warning (Random Forest)', desc: 'Flagged when the Random Forest model predicts a high probability (>60%) of overrun before the 1-year mark — enabling proactive intervention.', color: 'yellow' },
          ].map((flag, i) => {
            const Icon = flag.icon;
            return (
              <div key={i} className="flex items-start gap-3 p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
                <div className={`w-8 h-8 rounded-lg bg-${flag.color}-100 flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-4 h-4 text-${flag.color}-600`} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{flag.title}</p>
                  <p className="text-xs text-slate-600 mt-0.5">{flag.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Risk Scoring */}
      <Card className="mb-6">
        <CardHeader title="Composite Risk Scoring" subtitle="How individual flags combine into a risk tier" />
        <div className="p-5">
          <p className="text-sm text-slate-600 mb-4">
            Each triggered flag contributes 1 point to the work's risk score. The total score maps to a risk tier:
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
              <p className="text-2xl font-bold text-emerald-700">0</p>
              <p className="text-sm font-medium text-emerald-700 mt-1">Low Risk</p>
              <p className="text-xs text-emerald-600 mt-1">No flags triggered</p>
            </div>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-center">
              <p className="text-2xl font-bold text-amber-700">1</p>
              <p className="text-sm font-medium text-amber-700 mt-1">Medium Risk</p>
              <p className="text-xs text-amber-600 mt-1">One flag triggered</p>
            </div>
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
              <p className="text-2xl font-bold text-red-700">2+</p>
              <p className="text-sm font-medium text-red-700 mt-1">High Risk</p>
              <p className="text-xs text-red-600 mt-1">Multiple flags triggered</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Stakeholders */}
      <Card className="mb-6">
        <CardHeader title="Decision Support Dashboards" subtitle="Designed for four levels of authority" />
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { icon: Target, title: 'Members of Parliament', desc: 'View works recommended by them, track completion status, and monitor fund utilization for their constituency.' },
            { icon: ShieldCheck, title: 'State Nodal Authorities', desc: 'Oversee works across the state, identify high-risk districts, and coordinate with implementing agencies.' },
            { icon: Database, title: 'District Authorities', desc: 'Monitor implementation at the district level, verify asset creation, and flag duplicate works.' },
            { icon: Brain, title: 'Ministry (MoSPI)', desc: 'National-level overview of scheme implementation, trend analysis, and policy-level decision support.' },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="flex items-start gap-3 p-3 border border-slate-100 rounded-lg">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{s.title}</p>
                  <p className="text-xs text-slate-600 mt-0.5">{s.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Data Source */}
      <Card>
        <CardHeader title="Data Source" subtitle="Where the MPLADS data comes from" />
        <div className="p-5">
          <p className="text-sm text-slate-600">
            The platform analyzes data from the{' '}
            <a
              href="https://mplads.mospi.gov.in/digigov/dashboard.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline font-medium"
            >
              MPLADS Dashboard
            </a>
            {' '}published by the Ministry of Statistics & Programme Implementation (MoSPI). The data includes work
            recommendations, sanctions, expenditures, payments, completion status, and asset creation evidence across
            all states and parliamentary constituencies.
          </p>
        </div>
      </Card>
    </div>
  );
}
