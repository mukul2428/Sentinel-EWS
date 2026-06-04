# Sentinel EWS — Loan Default Early Warning System

## Overview

Sentinel EWS is an early warning system that identifies borrowers likely to become delinquent within the next 30 days. It combines repayment history, cash-flow behavior, and account signals to generate risk alerts with explanations and recommended actions.

**Stack:** Angular 21 (frontend) + Node.js/Express (backend) + LLM wrapper (AI explanations)

---

## Quick Start

### Backend

```bash
cd backend
npm install
export LLM_API_TOKEN=your_token_here
node src/index.js
# Runs on http://localhost:3000
```

### Frontend

```bash
cd frontend
npm install
npx ng serve
# Runs on http://localhost:4200
```

Open `http://localhost:4200` and select a demo user to log in.

---

## System Architecture

```
Angular Frontend (port 4200)
        │
        ▼
Node.js / Express Backend (port 3000)
        │
        ├── /api/borrowers         → Risk-scored borrower list
        ├── /api/borrowers/:id     → Borrower detail + signals
        ├── /api/borrowers/:id/alert → LLM-generated explanation
        ├── /api/query             → Analyst NL query (LLM)
        └── /api/portfolio/summary → Portfolio-level analysis
                │
                ▼
        LLM Wrapper API (external)
        https://llm-wrapper-741152993481.asia-south1.run.app
```

---

## Sample Data Schema

```json
{
  "id": "B001",
  "name": "Arjun Sharma",
  "assignedAnalyst": "analyst1",
  "loan": {
    "id": "L001",
    "amount": 500000,
    "emiAmount": 12500,
    "interestRate": 12.5,
    "tenure": 48,
    "disbursedDate": "2023-06-01",
    "nextDueDate": "2024-06-15",
    "outstandingBalance": 420000,
    "loanType": "Personal"
  },
  "repaymentHistory": [
    { "month": "2024-05", "status": "PAID", "daysDelayed": 0, "amount": 12500 },
    { "month": "2024-04", "status": "PARTIAL", "daysDelayed": 12, "amount": 8000 },
    { "month": "2024-01", "status": "MISSED", "daysDelayed": 30, "amount": 0 }
  ],
  "accountSignals": {
    "failedAutoDebits": 3,
    "creditUtilization": 82,
    "avgMonthlyInflow": 35000,
    "lastMonthInflow": 22000,
    "inflowDropPercent": 37,
    "activeLoans": 2,
    "currentDPD": 0,
    "maxDPDLast90Days": 30
  },
  "transactions": [
    { "date": "2024-05-15", "type": "FAILED", "amount": 12500, "description": "EMI Auto-debit Failed" }
  ]
}
```

---

## Risk Scoring Logic

### Signals & Weights

| Signal | Max Weight | Description |
|---|---|---|
| Days Past Due (DPD) Trend | 30 | Current + max DPD in 90 days |
| Failed Auto-Debits | 20 | Recent auto-debit failures |
| Income Inflow Drop | 20 | % drop in monthly income vs. average |
| Credit Utilization | 15 | Utilization % across credit lines |
| Payment Behavior | 15 | Missed/partial payment pattern (last 3 months) |

### Thresholds

**DPD Scoring:**
- 0 days → 0 pts
- 7–14 days → 9 pts (30%)
- 15–29 days → 18 pts (60%)
- 30–44 days → 25.5 pts (85%)
- 45+ days → 30 pts (100%)

**Failed Auto-Debits:**
- 0 → 0 pts
- 1 → 6 pts (30%)
- 3 → 13 pts (65%)
- 5+ → 20 pts (100%)

**Income Inflow Drop:**
- 0–15% → 0 pts
- 15–29% → 6 pts (30%)
- 30–49% → 13 pts (65%)
- 50%+ → 20 pts (100%)

**Credit Utilization:**
- 0–40% → 0 pts
- 40–60% → 3.75 pts (25%)
- 60–80% → 9 pts (60%)
- 80%+ → 15 pts (100%)

**Category Thresholds:**
- 0–24 → Low
- 25–49 → Watchlist
- 50–74 → High Risk
- 75–100 → Critical

### Recommended Actions by Category

| Category | Action | Urgency |
|---|---|---|
| Critical (DPD + income drop) | Restructuring Review | Immediate |
| Critical | Proactive Collections Call | Immediate |
| High Risk | Payment Plan Offer | High |
| Watchlist (failed debits ≥ 2) | Proactive Call | Medium |
| Watchlist | Soft Reminder | Low |
| Low | Routine Monitoring | None |

---

## LLM Integration & Grounding Safeguards

All LLM calls are strictly grounded:

1. **Explanation generation:** Borrower data is passed verbatim in the prompt. The LLM is instructed it MUST NOT infer, speculate, or add information beyond what is provided.

2. **Analyst queries:** Each query only passes the specific borrower's data — no cross-borrower context leakage.

3. **Portfolio summary:** Aggregated scores are passed; no individual borrower PII included.

**Prompt grounding constraint (applied to all calls):**
> "You MUST use ONLY the data provided below. Do NOT infer, speculate, or add any information not present in this data. If data is missing or unclear, say so explicitly."

---

## RBAC Design

### Prototype (simulated)

Tokens map directly to users in `backend/src/data/users.js`. Role is embedded in the user record.

### Demo Tokens

| Token | Role | Access |
|---|---|---|
| `token-analyst1` | Analyst | B001, B002, B005, B007, B009 |
| `token-analyst2` | Analyst | B003, B004, B006, B008, B010 |
| `token-manager` | Manager | All borrowers |
| `token-borrower-B001` | Borrower | B001 only (own data) |
| `token-borrower-B003` | Borrower | B003 only (own data) |

### Production RBAC Design

In a real implementation:

1. **Authentication:** JWT tokens (RS256, short expiry) issued at login by an auth service. Tokens carry `userId`, `role`, and `assignedBorrowers[]` claims.

2. **Row-level security:** Analyst's assigned borrowers enforced at DB query layer — not just at API layer. An analyst cannot enumerate other borrower IDs via query manipulation.

3. **Borrower access:** Borrowers receive a separate, restricted token that grants read-only access to their own record and sanitized risk explanation (no internal scores or analyst notes exposed).

4. **Audit logging:** Every data access logged with `userId`, `borrowerId`, `endpoint`, `timestamp`. Sensitive field access (income, DPD) logged separately for compliance.

5. **Data isolation:** PII (name, phone, email) stored encrypted. Analysts query via borrower IDs — no ability to search by personal details.

6. **LLM calls:** Backend injects the borrower data; the frontend never calls the LLM directly. LLM prompt contents are logged and auditable.

---

## Edge Case Handling

| Edge Case | Handling |
|---|---|
| No repayment history | Flagged as insufficient history; score carries 50% penalty on payment behavior signal |
| < 3 months history | Data quality warning shown; score marked unreliable |
| Income inflow increased | Inflow drop signal scores 0 (no risk contribution) |
| All signals clean | Score 0–24 → Low, no alert generated |
| LLM API failure | Alert returns `llmError` field; risk score/reasons still shown |
| Unauthorized borrower access | 403 returned; no data leaked in error message |

---

## Test Scenarios

### High severity (Critical)
- **B005 (Deepak Nair):** 2 consecutive missed payments, 7 failed debits, 80% income drop, 4 active loans → Score ~90
- **B003 (Rahul Verma):** 35 DPD current, 5 failed debits, 49% income drop → Score ~85

### Medium severity (High Risk / Watchlist)
- **B001 (Arjun Sharma):** 1 missed, 2 partial, 3 failed debits, 37% income drop → Watchlist/High
- **B009 (Karthik Bose):** 2 consecutive partials, 14 DPD, rising delays → Watchlist

### Low severity (Low)
- **B002 (Priya Mehta):** All paid on time, income growing, 0 failed debits → Score ~0
- **B008 (Ananya Krishnan):** 18 months clean history, low utilization → Score ~1

### Analyst queries to test
```
GET /api/borrowers?Authorization=Bearer token-analyst1
GET /api/borrowers/B003/alert
POST /api/query {"borrowerId":"B005","question":"Why was this borrower flagged?"}
GET /api/portfolio/summary
```

---

## Assumptions & Limitations

**Assumptions:**
- All data is mock/static; in production this would be ingested from loan management and CBS systems
- Scoring weights are manually calibrated; production would use logistic regression or gradient boosting on historical delinquency data
- "30 days to delinquency" window is approximated by DPD trend + cash flow signals, not a trained probability score

**Limitations:**
- No time-series ML model; rule-based scoring can miss complex interaction patterns
- Credit utilization is a single-point metric; trend would be more informative
- No external bureau data (CIBIL, Experian) integrated — signals are internal only
- LLM explanations depend on wrapper availability; degradation fallback is the raw signals display

**Trade-offs made:**
- Rule-based over ML: explainable, auditable, deployable without training data
- Heuristic thresholds over statistical cutoffs: faster to validate with domain experts
- Simulated auth over real JWT: reduces scope without compromising architecture demonstration

---

## File Structure

```
loan-ews/
├── backend/
│   └── src/
│       ├── index.js                 # Express server
│       ├── data/
│       │   ├── borrowers.js         # Mock borrower records (10 borrowers)
│       │   └── users.js             # RBAC user/token map
│       ├── services/
│       │   ├── riskScorer.js        # Rule-based scoring engine
│       │   └── llmService.js        # LLM wrapper integration
│       ├── routes/
│       │   └── api.js               # All API endpoints
│       └── middleware/
│           └── auth.js              # RBAC middleware
└── frontend/
    └── src/app/
        ├── services/
        │   ├── auth.ts              # Auth service + demo users
        │   └── api.ts               # HTTP client service
        └── components/
            ├── login/               # Role selector / demo login
            ├── dashboard/           # Borrower list, risk table, filters
            ├── borrower-detail/     # Full detail, signals, AI alert, query
            ├── analyst-query/       # Free-form NL query console
            └── portfolio-summary/   # Portfolio analytics + AI summary
```
