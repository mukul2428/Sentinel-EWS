const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

const LLM_API_URL = "https://llm-wrapper-741152993481.asia-south1.run.app/llm/query";

// Token injected via env variable. Never hardcoded.
function getToken() {
  const token = process.env.LLM_API_TOKEN;
  if (!token) throw new Error("LLM_API_TOKEN environment variable not set");
  return token;
}

/**
 * Generates a grounded natural-language explanation for a borrower's risk alert.
 * GROUNDING SAFEGUARD: LLM is instructed strictly to use ONLY provided data.
 * It cannot invent signals, extrapolate trends, or reference external factors.
 */
async function generateRiskExplanation(borrowerData, riskResult) {
  const prompt = buildExplanationPrompt(borrowerData, riskResult);
  return callLLM(prompt);
}

/**
 * Handles analyst natural-language query about a specific borrower.
 * Only passes that borrower's data — prevents cross-borrower leakage.
 */
async function handleAnalystQuery(question, borrowerData, riskResult) {
  const prompt = buildQueryPrompt(question, borrowerData, riskResult);
  return callLLM(prompt);
}

/**
 * Generates portfolio-level summary for managers.
 */
async function generatePortfolioSummary(allRiskResults) {
  const prompt = buildPortfolioPrompt(allRiskResults);
  return callLLM(prompt);
}

async function callLLM(prompt) {
  try {
    const response = await fetch(LLM_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getToken()}`
      },
      body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`LLM API error ${response.status}: ${errText}`);
    }

    const data = await response.json();

    // Handle response format variations
    if (data.response) return data.response;
    if (data.content) return data.content;
    if (data.text) return data.text;
    if (typeof data === "string") return data;

    return JSON.stringify(data);
  } catch (err) {
    console.error("LLM call failed:", err.message);
    throw err;
  }
}

function buildExplanationPrompt(borrower, risk) {
  const history = (borrower.repaymentHistory || []).slice(0, 6);
  const historyText = history.map(h =>
    `- ${h.month}: ${h.status}${h.daysDelayed > 0 ? `, ${h.daysDelayed} days late` : ""}${h.amount < (borrower.loan?.emiAmount || 0) && h.status !== "MISSED" ? `, paid ₹${h.amount} of ₹${borrower.loan?.emiAmount}` : ""}`
  ).join("\n");

  return `You are a credit risk analyst AI. Your job is to explain a borrower's early warning alert in plain, professional English.

STRICT RULE: You MUST use ONLY the data provided below. Do NOT infer, speculate, or add any information not present in this data. Do NOT reference market conditions, industry trends, or anything beyond what is given. If data is missing or unclear, say so explicitly.

--- BORROWER DATA ---
Borrower ID: ${borrower.id}
Name: ${borrower.name}
Loan Type: ${borrower.loan?.loanType || 'N/A'}
Loan Amount: ₹${borrower.loan?.amount?.toLocaleString() || 'N/A'}
EMI Amount: ₹${borrower.loan?.emiAmount?.toLocaleString() || 'N/A'}
Outstanding Balance: ₹${borrower.loan?.outstandingBalance?.toLocaleString() || 'N/A'}
Next Due Date: ${borrower.loan?.nextDueDate || 'N/A'}

ACCOUNT SIGNALS:
- Current Days Past Due: ${borrower.accountSignals.currentDPD}
- Max DPD in last 90 days: ${borrower.accountSignals.maxDPDLast90Days}
- Failed Auto-Debits: ${borrower.accountSignals.failedAutoDebits}
- Credit Utilization: ${borrower.accountSignals.creditUtilization}%
- Avg Monthly Inflow: ₹${borrower.accountSignals.avgMonthlyInflow?.toLocaleString()}
- Last Month Inflow: ₹${borrower.accountSignals.lastMonthInflow?.toLocaleString()}
- Income Drop %: ${borrower.accountSignals.inflowDropPercent}%
- Active Loans: ${borrower.accountSignals.activeLoans}

REPAYMENT HISTORY (last 6 months):
${historyText || "No history available"}

RISK ASSESSMENT:
- Risk Score: ${risk.riskScore}/100
- Risk Category: ${risk.riskCategoryLabel}
- Top Risk Signals: ${risk.reasons.map(r => r.label + ': ' + r.detail).join('; ')}
- Recommended Action: ${risk.recommendedAction.label} — ${risk.recommendedAction.description}

--- END OF DATA ---

Write a concise 3–4 sentence explanation (for a credit analyst) of:
1. Why this borrower was flagged
2. What the key risk signals indicate
3. What action is recommended and why

FORMAT YOUR RESPONSE AS MARKDOWN with:
- A ## heading for the borrower name and risk category
- Bullet points (- ) for key signals
- **bold** for emphasis on critical numbers`;
}

function buildQueryPrompt(question, borrower, risk) {
  const history = (borrower.repaymentHistory || []).slice(0, 6);
  const historyText = history.map(h =>
    `- ${h.month}: ${h.status}${h.daysDelayed > 0 ? `, ${h.daysDelayed} days late` : ""}, paid ₹${h.amount}`
  ).join("\n");

  const transactions = (borrower.transactions || []).slice(0, 5);
  const txText = transactions.map(t =>
    `- ${t.date}: ${t.type} ₹${t.amount} (${t.description})`
  ).join("\n");

  return `You are a credit risk analyst AI assistant. Answer ONLY based on the data provided below for borrower ${borrower.id}. 

STRICT RULES:
1. Answer ONLY using information present in this data
2. If the question asks about something not in the data, say "This information is not available in the provided data"
3. Do NOT speculate, infer future behavior, or reference anything outside this dataset
4. Be concise and factual

--- BORROWER DATA: ${borrower.id} ---
Name: ${borrower.name}
Loan Type: ${borrower.loan?.loanType}, Amount: ₹${borrower.loan?.amount?.toLocaleString()}, EMI: ₹${borrower.loan?.emiAmount?.toLocaleString()}
Outstanding: ₹${borrower.loan?.outstandingBalance?.toLocaleString()}, Next Due: ${borrower.loan?.nextDueDate}

SIGNALS: DPD=${borrower.accountSignals.currentDPD}d, Failed Debits=${borrower.accountSignals.failedAutoDebits}, Utilization=${borrower.accountSignals.creditUtilization}%, Income Drop=${borrower.accountSignals.inflowDropPercent}%, Active Loans=${borrower.accountSignals.activeLoans}

REPAYMENT HISTORY:
${historyText || "No history"}

RECENT TRANSACTIONS:
${txText || "No transactions"}

RISK: Score=${risk.riskScore}/100, Category=${risk.riskCategoryLabel}
Flagged Signals: ${risk.reasons.map(r => r.detail).join('; ')}
Recommended Action: ${risk.recommendedAction.label}
--- END DATA ---

ANALYST QUESTION: ${question}

Answer concisely and cite only from the data above.`;
}

function buildPortfolioPrompt(allRisks) {
  const summary = {
    total: allRisks.length,
    critical: allRisks.filter(r => r.riskCategory === "CRITICAL").length,
    highRisk: allRisks.filter(r => r.riskCategory === "HIGH_RISK").length,
    watchlist: allRisks.filter(r => r.riskCategory === "WATCHLIST").length,
    low: allRisks.filter(r => r.riskCategory === "LOW").length,
    avgScore: Math.round(allRisks.reduce((s, r) => s + r.riskScore, 0) / allRisks.length),
    criticalCases: allRisks.filter(r => r.riskCategory === "CRITICAL").map(r => ({
      id: r.borrowerId,
      name: r.borrowerName,
      score: r.riskScore,
      topReason: r.reasons[0]?.detail || "N/A"
    }))
  };

  return `You are a portfolio risk manager AI. Summarize the following loan portfolio risk snapshot for a senior manager. Be concise, factual, and highlight top priorities.

STRICT RULE: Use ONLY the data below. Do not add context, market commentary, or any information not provided.

--- PORTFOLIO SNAPSHOT ---
Total Borrowers Assessed: ${summary.total}
Critical: ${summary.critical} | High Risk: ${summary.highRisk} | Watchlist: ${summary.watchlist} | Low Risk: ${summary.low}
Average Risk Score: ${summary.avgScore}/100

CRITICAL CASES:
${summary.criticalCases.map(c => `- ${c.id} (${c.name}): Score ${c.score}/100 — ${c.topReason}`).join("\n") || "None"}
--- END DATA ---

Write a 4–5 sentence executive portfolio summary covering: overall risk posture, top concerns, and recommended immediate priorities.`;
}

module.exports = { generateRiskExplanation, handleAnalystQuery, generatePortfolioSummary };
