# Sentinel EWS — Loan Default Early Warning System

## Overview

Sentinel EWS is an early warning system that identifies borrowers likely to become delinquent within the next 30 days. It combines repayment history, cash-flow behavior, and account signals to generate risk scores — and uses AI to derive all analyst-facing insights: top risk signals, recommended actions, and flagged indicators.

**Stack:** Angular 21 (frontend) · Node.js/Express (backend) · LLM API (AI insights)

**AI design principle:** Rule-based scoring is used only for internal risk categorization. All signals, actions, and explanations shown in the UI are generated on-demand by the LLM from raw borrower data — never from hardcoded labels.

---

## Quick Start

### Backend

```bash
cd backend
npm install
export LLM_API_TOKEN=your_llm_api_key
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
        ├── GET  /api/borrowers              → Risk-scored borrower list (reasons/action stripped)
        ├── GET  /api/borrowers/:id          → Borrower detail + raw signals
        ├── GET  /api/borrowers/:id/signal   → LLM top signal + action (dashboard, on-demand)
        ├── GET  /api/borrowers/:id/ai-insight → LLM recommended action + flagged signals
        ├── GET  /api/borrowers/:id/alert    → LLM full markdown explanation (AI Alert tab)
        ├── POST /api/query                  → Analyst natural-language query (LLM)
        └── GET  /api/portfolio/summary      → Portfolio analytics + LLM summary
                │
                ▼
        LLM API (external)
```

---

## Sample Data Schema

Each borrower record contains raw financial signals. The LLM derives insights from these — nothing is pre-labelled.

```json
{
  "id": "B005",
  "name": "Deepak Nair",
  "assignedAnalyst": "analyst1",
  "loan": {
    "id": "L005",
    "amount": 1000000,
    "emiAmount": 22000,
    "interestRate": 10.5,
    "tenure": 60,
    "disbursedDate": "2022-08-01",
    "nextDueDate": "2024-06-08",
    "outstandingBalance": 820000,
    "loanType": "Business"
  },
  "repaymentHistory": [
    { "month": "2024-05", "status": "MISSED", "daysDelayed": 42, "amount": 0 },
    { "month": "2024-04", "status": "MISSED", "daysDelayed": 38, "amount": 0 },
    { "month": "2024-03", "status": "PARTIAL", "daysDelayed": 20, "amount": 12000 }
  ],
  "accountSignals": {
    "failedAutoDebits": 7,
    "creditUtilization": 96,
    "monthlyInflows": [
      { "month": "2024-05", "inflow": 18000 },
      { "month": "2024-04", "inflow": 25000 },
      { "month": "2024-03", "inflow": 90000 },
      { "month": "2024-02", "inflow": 90000 },
      { "month": "2024-01", "inflow": 88000 },
      { "month": "2023-12", "inflow": 92000 }
    ],
    "activeLoans": 4,
    "currentDPD": 42,
    "maxDPDLast90Days": 42
  },
  "transactions": [
    { "date": "2024-05-15", "type": "FAILED", "amount": 22000, "description": "EMI Auto-debit Failed" }
  ]
}
```

> `monthlyInflows` is the key income signal. The LLM reads this array and derives the income trend itself — no pre-computed drop percentage is passed.

---

## Risk Scoring Logic

The rule-based scorer (`riskScorer.js`) runs internally to produce a numeric risk score and category. Its output is used for sorting and categorization only — `reasons` and `recommendedAction` from the scorer are **not** sent to the frontend.

### Signals & Weights

| Signal | Max Weight | Description |
|---|---|---|
| Days Past Due (DPD) Trend | 30 | Current + max DPD in 90 days |
| Failed Auto-Debits | 20 | Recent auto-debit failures |
| Income Inflow Drop | 20 | % drop in monthly income vs. average |
| Credit Utilization | 15 | Utilization % across credit lines |
| Payment Behavior | 15 | Missed/partial payment pattern (last 3 months) |

### Score Thresholds

| Range | Category |
|---|---|
| 0–24 | Low |
| 25–49 | Watchlist |
| 50–74 | High Risk |
| 75–100 | Critical |

---

## LLM Integration

All analyst-facing insights are generated on-demand by the configured LLM API. The API key is injected via the `LLM_API_TOKEN` environment variable — never hardcoded.

### Three AI endpoints

| Endpoint | Trigger | Returns |
|---|---|---|
| `GET /borrowers/:id/signal` | Dashboard refresh button (per row) | `{ signal, action, aiGenerated }` — concise top signal + 3–5 word action |
| `GET /borrowers/:id/ai-insight` | Borrower detail page load | `{ recommendedAction: { label, description, urgency }, flaggedSignals: [{ label, detail, severity }] }` |
| `GET /borrowers/:id/alert` | AI Alert tab click | Full markdown explanation (3–4 paragraphs) |

### Grounding safeguards

All prompts include:
> "You MUST use ONLY the data provided below. Do NOT infer, speculate, or add any information not present in this data."

- **Monthly income data** is passed as a raw array (`monthlyInflows`) — the LLM observes the trend itself rather than being told "income dropped 80%."
- **No pre-computed labels** (`reasons`, `recommendedAction` from the scorer) are passed to any LLM prompt.
- **Analyst queries** only pass the specific borrower's data — no cross-borrower context leakage.

---

## Frontend Caching

All AI-generated data is cached in the singleton `ApiService` and survives route navigation:

| Cache | Type | Key |
|---|---|---|
| `borrowersCache$` | `Observable` with `shareReplay(1)` | shared — one HTTP call per session |
| `signalCache` | `Record<borrowerId, {signal, action}>` | per borrower |
| `aiInsightCache` | `Record<borrowerId, insight>` | per borrower |
| `alertCache` | `Record<borrowerId, alertData>` | per borrower |

Call `invalidateBorrowersCache()` or `invalidatePortfolioCache()` on logout to force a fresh fetch.

---

## UI Behavior

### Dashboard (Signal & Action columns)

| State | Signal column | Action column |
|---|---|---|
| Not yet generated | `✦ AI signal` (muted placeholder) | `↻ get AI signal & action` (muted hint) |
| Loading | `Analyzing...` (pulsing) | CSS spinner |
| AI generated | Signal text + `✦ AI` chip | Amber action text |

Click the `↻` refresh button on any row to trigger the LLM call for that borrower. Result is cached — refreshing or navigating back does not re-call the API.

### Borrower Detail (Recommended Action & Flagged Signals)

Both sections show an "AI generate" hint on first visit, a spinner while loading, then the AI output. Data is cached once retrieved. A per-section refresh button forces a new LLM call.

---

## RBAC Design

### Demo Tokens

| Token | Role | Access |
|---|---|---|
| `token-analyst1` | Analyst | B001, B002, B005, B007, B009 |
| `token-analyst2` | Analyst | B003, B004, B006, B008, B010 |
| `token-manager` | Manager | All borrowers |
| `token-borrower-B001` | Borrower | B001 only (own data) |
| `token-borrower-B003` | Borrower | B003 only (own data) |

### Production RBAC Design

1. **Authentication:** JWT tokens (RS256, short expiry) with `userId`, `role`, and `assignedBorrowers[]` claims.
2. **Row-level security:** Analyst's assigned borrowers enforced at DB query layer, not just API layer.
3. **Borrower access:** Restricted token with read-only access to own record; internal scores and analyst notes are not exposed.
4. **Audit logging:** Every data access logged with `userId`, `borrowerId`, `endpoint`, `timestamp`.
5. **LLM calls:** Backend injects borrower data into prompts; the frontend never calls the LLM directly.

---

## Test Scenarios

### Critical risk borrowers
- **B005 (Deepak Nair):** 2 consecutive missed payments, 7 failed debits, income dropped from ₹90k → ₹18k, 4 active loans → Score ~90
- **B003 (Rahul Verma):** 35 DPD current, 5 failed debits, income dropped from ₹55k → ₹28k → Score ~85

### Watchlist / High Risk
- **B001 (Arjun Sharma):** 1 missed, 2 partials, 3 failed debits, income dropped from ₹35k → ₹22k
- **B009 (Karthik Bose):** 2 consecutive partials, 14 DPD, income dropped from ₹38k → ₹30k

### Low risk (baseline)
- **B002 (Priya Mehta):** All paid on time, income growing ₹82k → ₹91k, 0 failed debits
- **B008 (Ananya Krishnan):** 18 months clean history, stable ₹95k income, low utilization

### API calls to test
```bash
# Borrower list (cached after first call)
GET /api/borrowers  [Authorization: Bearer token-analyst1]

# On-demand AI signal for dashboard row
GET /api/borrowers/B005/signal  [analyst/manager only]

# AI recommended action + flagged signals
GET /api/borrowers/B005/ai-insight  [analyst/manager only]

# Full AI explanation
GET /api/borrowers/B003/alert

# Analyst natural-language query
POST /api/query  {"borrowerId":"B005","question":"Why was this borrower flagged?"}

# Portfolio summary
GET /api/portfolio/summary  [analyst/manager only]
```

---

## Edge Case Handling

| Edge Case | Handling |
|---|---|
| No repayment history | Score carries 50% penalty on payment behavior signal |
| < 3 months history | Data quality warning; score marked unreliable |
| Income inflow increased | Income signal scores 0 (no risk contribution) |
| All signals clean | Score 0–24 → Low, no alert |
| LLM API failure | UI shows placeholder/error state; risk score and category still displayed |
| LLM returns malformed JSON | `extractJSON()` strips markdown fences and finds outermost `{}` block; returns `null` on failure |
| Unauthorized borrower access | 403 returned; no data leaked in error message |

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
- LLM calls are synchronous and per-borrower; at scale these would need a queue/batch system

**Trade-offs made:**
- Rule-based scoring over ML: explainable, auditable, no training data required
- AI-only UI design: no pre-computed labels shown; LLM derives all insights from raw data
- Singleton service caching: avoids redundant API calls within a session; invalidated manually on logout

---

## File Structure

```
loan-ews/
├── backend/
│   └── src/
│       ├── index.js                 # Express server entry point
│       ├── data/
│       │   ├── borrowers.js         # Mock borrower records (10 borrowers, raw monthly income data)
│       │   └── users.js             # RBAC user/token map
│       ├── services/
│       │   ├── riskScorer.js        # Rule-based scoring engine (internal use only)
│       │   └── llmService.js        # LLM API integration + prompt builders
│       ├── routes/
│       │   └── api.js               # All API endpoints
│       └── middleware/
│           └── auth.js              # RBAC middleware
└── frontend/
    └── src/app/
        ├── services/
        │   ├── auth.ts              # Auth service + demo users
        │   └── api.ts               # HTTP client service + all AI/borrower caches
        └── components/
            ├── login/               # Role selector / demo login
            ├── dashboard/           # Borrower list, risk table, AI signal/action per row
            ├── borrower-detail/     # Detail view, AI recommended action, flagged signals, alert, query
            ├── analyst-query/       # Free-form NL query console
            └── portfolio-summary/   # Portfolio analytics + AI summary
```
