# TRACE AI

**Transparent Risk Analysis for Constituency Expenditure**

AI-powered anomaly, fraud, and inefficiency detection for MPLADS (Members of Parliament Local Area Development Scheme) fund utilization — built for **Smart India Hackathon 2026**, Problem Statement **SIH26102**.

---

## Problem

MPLADS moves thousands of development works and large sums of public money through sanction, payment, and completion stages with no automated cross-checking. This lets cost overruns, duplicate claims, and payment-before-verification go undetected until manual audit — often years later.

## Solution

TRACE AI continuously monitors MPLADS work records and flags risk in real time:

- **AI Anomaly Detection** — unusual spending, cost anomalies, and payment–progress mismatches
- **Predictive Risk Analysis** — flags likely delays and cost overruns before they happen
- **Risk-Based Alerts** — a 0–100 explainable risk score per work
- **Explainable AI (SHAP)** — shows exactly why a work was flagged

## Tech Stack

| Layer | Technology |
|---|---|
| Language | Python, TypeScript |
| ML / Detection Engine | Isolation Forest, TF-IDF cosine similarity, Random Forest, SHAP, rule engine |
| Backend | FastAPI (REST / JSON) |
| Storage | Supabase (PostgreSQL) |
| Frontend | React, Vite, Tailwind CSS, Recharts |

## Detection Pipeline

1. **Data ingestion** — MPLADS sanction, payment, and completion records
2. **Preprocessing & cleaning** — normalization, deduplication
3. **Rule-based checks** — missing utilization certificates, >365-day delays
4. **Parallel ML detection** — Isolation Forest (cost anomalies), TF-IDF cosine similarity (duplicate works), timeline analysis
5. **Risk scoring** — weighted 0–100 score with SHAP-based explanation
6. **Dashboard** — role-based views for MPs, District/State Authorities, and the Ministry (MoSPI)

## Project Structure

```
project/       React + TypeScript frontend (Vite)
backend/       FastAPI service + ML pipeline
```

## Getting Started

### Frontend
```bash
cd project
npm install
npm run build   # or `npm run dev` for local development
```

Create a `.env` file in `project/` with:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Backend
```bash
cd backend
pip install -r requirements.txt
python main.py
```

## Team

**Technova** — Smart India Hackathon 2026, SIH26102

## References

- [MPLADS Official Portal](https://mplads.mospi.gov.in)
- [MPLADS eSAKSHI Dashboard](https://mplads.mospi.gov.in/digigov/dashboard.html)
- Lundberg & Lee, "A Unified Approach to Interpreting Model Predictions" (SHAP), NeurIPS 2017
- Liu, Ting & Zhou, "Isolation Forest," IEEE ICDM 2008
