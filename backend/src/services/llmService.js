const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

const LLM_API_URL = "https://api.anthropic.com/v1/messages";

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
        "x-api-key": getToken(),
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Anthropic API error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    return data.content?.[0]?.text ?? JSON.stringify(data);
  } catch (err) {
    console.error("LLM call failed:", err.message);
    throw err;
  }
}

// Formats monthlyInflows array as a human-readable string for LLM prompts.
// e.g. "₹18,000 (2024-05) → ₹25,000 (2024-04) → ₹90,000 (2024-03)"
function formatMonthlyInflows(signals) {
  if (!signals.monthlyInflows || signals.monthlyInflows.length === 0) return 'N/A';
  return signals.monthlyInflows
    .map(m => `₹${m.inflow.toLocaleString('en-IN')} (${m.month})`)
    .join(' → ');
}

// Strips markdown fences then finds the outermost { } block and parses it.
function extractJSON(raw) {
  const clean = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try { return JSON.parse(clean.slice(start, end + 1)); } catch { return null; }
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
- Monthly Income (newest → oldest): ${formatMonthlyInflows(borrower.accountSignals)}
- Active Loans: ${borrower.accountSignals.activeLoans}

REPAYMENT HISTORY (last 6 months):
${historyText || "No history available"}

RISK ASSESSMENT:
- Risk Score: ${risk.riskScore}/100
- Risk Category: ${risk.riskCategoryLabel}
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

SIGNALS: DPD=${borrower.accountSignals.currentDPD}d, Failed Debits=${borrower.accountSignals.failedAutoDebits}, Utilization=${borrower.accountSignals.creditUtilization}%, Active Loans=${borrower.accountSignals.activeLoans}
Monthly Income (newest → oldest): ${formatMonthlyInflows(borrower.accountSignals)}

REPAYMENT HISTORY:
${historyText || "No history"}

RECENT TRANSACTIONS:
${txText || "No transactions"}

RISK: Score=${risk.riskScore}/100, Category=${risk.riskCategoryLabel}
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
      score: r.riskScore
    }))
  };

  return `You are a portfolio risk manager AI. Summarize the following loan portfolio risk snapshot for a senior manager. Be concise, factual, and highlight top priorities.

STRICT RULE: Use ONLY the data below. Do not add context, market commentary, or any information not provided.

--- PORTFOLIO SNAPSHOT ---
Total Borrowers Assessed: ${summary.total}
Critical: ${summary.critical} | High Risk: ${summary.highRisk} | Watchlist: ${summary.watchlist} | Low Risk: ${summary.low}
Average Risk Score: ${summary.avgScore}/100

CRITICAL CASES:
${summary.criticalCases.map(c => `- ${c.id} (${c.name}): Score ${c.score}/100`).join("\n") || "None"}
--- END DATA ---

Write a 4–5 sentence executive portfolio summary covering: overall risk posture, top concerns, and recommended immediate priorities.`;
}

/**
 * Generates a concise dashboard signal + action via LLM.
 * Returns { signal, action } derived from raw monthly income and account signals.
 */
async function generateDashboardSignal(borrowerData, riskResult) {
  const prompt = buildDashboardSignalPrompt(borrowerData, riskResult);
  const raw = await callLLM(prompt);
  const parsed = extractJSON(raw);
  if (parsed?.signal && parsed?.action) return parsed;
  const lines = raw.trim().split('\n').filter(Boolean);
  return { signal: lines[0] || raw.slice(0, 120), action: '—' };
}

function buildDashboardSignalPrompt(borrower, risk) {
  const signals = borrower.accountSignals;

  return `You are a credit risk analyst AI. Output a JSON object with exactly two fields:

"signal": Pick ONLY the single worst risk indicator. Max 10 words. Just numbers and facts — no combining multiple issues.
  - If income dropped sharply: write exactly "Income dropped from ₹PREV to ₹CURR"
  - If DPD is high: write exactly "Xd past due in last 90 days"
  - If failed debits high: write exactly "X failed auto-debits recently"
  Pick whichever single metric is worst. Do NOT combine them.

"action": 3–5 word verb phrase only (e.g. "Escalate to credit committee").

Reply ONLY with valid JSON: {"signal":"...","action":"..."}

--- DATA ---
DPD now: ${signals.currentDPD}d | Max DPD 90d: ${signals.maxDPDLast90Days}d
Failed Debits: ${signals.failedAutoDebits}
Monthly Income (newest → oldest): ${formatMonthlyInflows(signals)}
Credit Utilization: ${signals.creditUtilization}%
Active Loans: ${signals.activeLoans}
Score: ${risk.riskScore}/100 (${risk.riskCategoryLabel})`;
}

/**
 * Generates AI-powered recommended action + flagged signals for the borrower detail page.
 * Returns { recommendedAction: { label, description, urgency }, flaggedSignals: [{ label, detail, severity }] }
 */
async function generateDetailInsight(borrowerData, riskResult) {
  const prompt = buildDetailInsightPrompt(borrowerData, riskResult);
  const raw = await callLLM(prompt);
  const parsed = extractJSON(raw);
  if (parsed?.recommendedAction && Array.isArray(parsed?.flaggedSignals)) return parsed;
  return null;
}

function buildDetailInsightPrompt(borrower, risk) {
  const s = borrower.accountSignals;
  const history = (borrower.repaymentHistory || []).slice(0, 6)
    .map(h => `${h.month}: ${h.status}${h.daysDelayed > 0 ? ` (${h.daysDelayed}d late)` : ''}${h.amount < (borrower.loan?.emiAmount || 0) && h.status !== 'MISSED' ? `, paid ₹${h.amount} of ₹${borrower.loan?.emiAmount}` : ''}`)
    .join('\n');

  return `You are a credit risk analyst AI. Using ONLY the borrower data below, output a JSON object with exactly two fields:

1. "recommendedAction" — object with:
   - "label": 3–6 word action title
   - "description": 1–2 sentences citing EXACT numbers (₹ amounts, %, days) from the data to justify the action
   - "urgency": "IMMEDIATE" | "HIGH" | "MEDIUM" | "LOW"

2. "flaggedSignals" — array of 2–4 objects, each with:
   - "label": short signal name (e.g. "Income Drop", "Days Past Due")
   - "detail": one sentence with EXACT numbers from the data
   - "severity": "HIGH" | "MEDIUM" | "LOW"

STRICT RULES:
1. Use ONLY the numbers provided below. Do NOT invent, estimate, or add external context.
2. All ₹ amounts, percentages, and day counts must come directly from the data.
3. Only flag signals that represent meaningful risk (non-zero values).
4. Reply ONLY with valid JSON — no markdown, no extra text.

--- BORROWER DATA ---
Name: ${borrower.name}
Loan: ${borrower.loan?.loanType}, ₹${borrower.loan?.amount?.toLocaleString('en-IN')}, EMI ₹${borrower.loan?.emiAmount?.toLocaleString('en-IN')}
Outstanding: ₹${borrower.loan?.outstandingBalance?.toLocaleString('en-IN')} | Next Due: ${borrower.loan?.nextDueDate}

Current DPD: ${s.currentDPD}d | Max DPD last 90d: ${s.maxDPDLast90Days}d
Failed Auto-Debits: ${s.failedAutoDebits}
Monthly Income (newest → oldest): ${formatMonthlyInflows(s)}
Credit Utilization: ${s.creditUtilization}%
Active Loans: ${s.activeLoans}

Repayment History (last 6 months):
${history || 'No history available'}

Risk Score: ${risk.riskScore}/100 (${risk.riskCategoryLabel})
--- END DATA ---

Reply ONLY with JSON:`;
}

module.exports = { generateRiskExplanation, handleAnalystQuery, generatePortfolioSummary, generateDashboardSignal, generateDetailInsight };
