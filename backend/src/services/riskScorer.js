/**
 * RISK SCORING ENGINE
 * Rule-based heuristic scoring. Weights and thresholds documented below.
 * No ML model required - signals are deterministic and auditable.
 *
 * SCORE RANGE: 0–100 (higher = more risk)
 * CATEGORIES:
 *   0–24   → Low
 *   25–49  → Watchlist
 *   50–74  → High Risk
 *   75–100 → Critical
 */

const WEIGHTS = {
  DPD_TREND: 30,         // Days past due trend (most important)
  FAILED_AUTO_DEBITS: 20, // Failed auto-debits in last 30 days
  INFLOW_DROP: 20,       // Income inflow drop %
  CREDIT_UTILIZATION: 15, // Credit utilization %
  PAYMENT_BEHAVIOR: 15   // Partial/missed payments pattern
};

const THRESHOLDS = {
  CATEGORY: {
    LOW: 25,
    WATCHLIST: 50,
    HIGH_RISK: 75
  },
  DPD: {
    NONE: 0,
    LOW: 7,
    MEDIUM: 15,
    HIGH: 30,
    CRITICAL: 45
  },
  FAILED_DEBITS: {
    LOW: 1,
    MEDIUM: 3,
    HIGH: 5
  },
  INFLOW_DROP: {
    LOW: 15,
    MEDIUM: 30,
    HIGH: 50
  },
  UTILIZATION: {
    LOW: 40,
    MEDIUM: 60,
    HIGH: 80
  }
};

function scoreDPD(signals) {
  const { currentDPD, maxDPDLast90Days } = signals;
  const dpd = Math.max(currentDPD, maxDPDLast90Days);
  if (dpd >= THRESHOLDS.DPD.CRITICAL) return WEIGHTS.DPD_TREND;
  if (dpd >= THRESHOLDS.DPD.HIGH) return WEIGHTS.DPD_TREND * 0.85;
  if (dpd >= THRESHOLDS.DPD.MEDIUM) return WEIGHTS.DPD_TREND * 0.6;
  if (dpd >= THRESHOLDS.DPD.LOW) return WEIGHTS.DPD_TREND * 0.3;
  return 0;
}

function scoreFailedDebits(signals) {
  const { failedAutoDebits } = signals;
  if (failedAutoDebits >= THRESHOLDS.FAILED_DEBITS.HIGH) return WEIGHTS.FAILED_AUTO_DEBITS;
  if (failedAutoDebits >= THRESHOLDS.FAILED_DEBITS.MEDIUM) return WEIGHTS.FAILED_AUTO_DEBITS * 0.65;
  if (failedAutoDebits >= THRESHOLDS.FAILED_DEBITS.LOW) return WEIGHTS.FAILED_AUTO_DEBITS * 0.3;
  return 0;
}

function scoreInflowDrop(signals) {
  const { inflowDropPercent } = signals;
  if (inflowDropPercent <= 0) return 0; // income increased, no risk from this signal
  if (inflowDropPercent >= THRESHOLDS.INFLOW_DROP.HIGH) return WEIGHTS.INFLOW_DROP;
  if (inflowDropPercent >= THRESHOLDS.INFLOW_DROP.MEDIUM) return WEIGHTS.INFLOW_DROP * 0.65;
  if (inflowDropPercent >= THRESHOLDS.INFLOW_DROP.LOW) return WEIGHTS.INFLOW_DROP * 0.3;
  return 0;
}

function scoreCreditUtilization(signals) {
  const { creditUtilization } = signals;
  if (creditUtilization >= THRESHOLDS.UTILIZATION.HIGH) return WEIGHTS.CREDIT_UTILIZATION;
  if (creditUtilization >= THRESHOLDS.UTILIZATION.MEDIUM) return WEIGHTS.CREDIT_UTILIZATION * 0.6;
  if (creditUtilization >= THRESHOLDS.UTILIZATION.LOW) return WEIGHTS.CREDIT_UTILIZATION * 0.25;
  return 0;
}

function scorePaymentBehavior(repaymentHistory) {
  if (!repaymentHistory || repaymentHistory.length === 0) return WEIGHTS.PAYMENT_BEHAVIOR * 0.5; // insufficient history penalty
  const last3 = repaymentHistory.slice(0, 3);
  let score = 0;
  const missedCount = last3.filter(p => p.status === "MISSED").length;
  const partialCount = last3.filter(p => p.status === "PARTIAL").length;
  const delayedCount = last3.filter(p => p.daysDelayed > 7).length;

  // Deteriorating pattern: increasing misses/partials = higher risk
  if (missedCount >= 2) score += WEIGHTS.PAYMENT_BEHAVIOR;
  else if (missedCount === 1 && partialCount >= 1) score += WEIGHTS.PAYMENT_BEHAVIOR * 0.75;
  else if (partialCount >= 2) score += WEIGHTS.PAYMENT_BEHAVIOR * 0.6;
  else if (missedCount === 1) score += WEIGHTS.PAYMENT_BEHAVIOR * 0.5;
  else if (partialCount === 1) score += WEIGHTS.PAYMENT_BEHAVIOR * 0.35;
  else if (delayedCount >= 2) score += WEIGHTS.PAYMENT_BEHAVIOR * 0.2;

  return Math.min(score, WEIGHTS.PAYMENT_BEHAVIOR);
}

function getRiskCategory(score) {
  if (score >= THRESHOLDS.CATEGORY.HIGH_RISK) return "CRITICAL";
  if (score >= THRESHOLDS.CATEGORY.WATCHLIST) return "HIGH_RISK";
  if (score >= THRESHOLDS.CATEGORY.LOW) return "WATCHLIST";
  return "LOW";
}

function getRecommendedAction(category, signals, repaymentHistory) {
  const hasCurrentDPD = signals.currentDPD > 0;
  const criticalInflow = signals.inflowDropPercent > 50;

  switch (category) {
    case "CRITICAL":
      if (hasCurrentDPD && criticalInflow) {
        return {
          action: "RESTRUCTURING_REVIEW",
          label: "Initiate Restructuring Review",
          description: "Severe DPD with critical income drop. Escalate to credit committee for loan restructuring or settlement options.",
          urgency: "IMMEDIATE"
        };
      }
      return {
        action: "PROACTIVE_CALL",
        label: "Proactive Collections Call",
        description: "Immediate outreach by senior collections agent. Explore payment plan or hardship relief.",
        urgency: "IMMEDIATE"
      };
    case "HIGH_RISK":
      return {
        action: "PAYMENT_PLAN_OFFER",
        label: "Offer Payment Plan",
        description: "Contact borrower with structured payment plan options before next due date.",
        urgency: "HIGH"
      };
    case "WATCHLIST":
      if (signals.failedAutoDebits >= 2) {
        return {
          action: "PROACTIVE_CALL",
          label: "Proactive Outreach Call",
          description: "Verify payment method and confirm upcoming EMI. Offer assistance if needed.",
          urgency: "MEDIUM"
        };
      }
      return {
        action: "SOFT_REMINDER",
        label: "Send Soft Reminder",
        description: "Automated reminder via SMS/email ahead of due date. Monitor for next 7 days.",
        urgency: "LOW"
      };
    default:
      return {
        action: "MONITORING",
        label: "Routine Monitoring",
        description: "No immediate action required. Continue standard monitoring cycle.",
        urgency: "NONE"
      };
  }
}

function buildRiskReasons(breakdown, signals, repaymentHistory) {
  const reasons = [];

  if (breakdown.dpdScore > 0) {
    const dpd = Math.max(signals.currentDPD, signals.maxDPDLast90Days);
    reasons.push({
      signal: "DAYS_PAST_DUE",
      label: "Days Past Due",
      detail: `${dpd} days past due in last 90 days`,
      severity: dpd >= 30 ? "HIGH" : dpd >= 15 ? "MEDIUM" : "LOW"
    });
  }

  if (breakdown.failedDebitScore > 0) {
    reasons.push({
      signal: "FAILED_AUTO_DEBITS",
      label: "Failed Auto-Debits",
      detail: `${signals.failedAutoDebits} failed auto-debit attempt(s) recently`,
      severity: signals.failedAutoDebits >= 5 ? "HIGH" : signals.failedAutoDebits >= 3 ? "MEDIUM" : "LOW"
    });
  }

  if (breakdown.inflowScore > 0) {
    reasons.push({
      signal: "INCOME_INFLOW_DROP",
      label: "Income Drop",
      detail: `Monthly inflow dropped ${signals.inflowDropPercent.toFixed(0)}% (from ₹${signals.avgMonthlyInflow.toLocaleString()} to ₹${signals.lastMonthInflow.toLocaleString()})`,
      severity: signals.inflowDropPercent >= 50 ? "HIGH" : signals.inflowDropPercent >= 30 ? "MEDIUM" : "LOW"
    });
  }

  if (breakdown.utilizationScore > 0) {
    reasons.push({
      signal: "HIGH_CREDIT_UTILIZATION",
      label: "High Credit Utilization",
      detail: `Credit utilization at ${signals.creditUtilization}% (above healthy 40% threshold)`,
      severity: signals.creditUtilization >= 80 ? "HIGH" : signals.creditUtilization >= 60 ? "MEDIUM" : "LOW"
    });
  }

  if (breakdown.behaviorScore > 0) {
    const last3 = repaymentHistory.slice(0, 3);
    const missedCount = last3.filter(p => p.status === "MISSED").length;
    const partialCount = last3.filter(p => p.status === "PARTIAL").length;
    let detail = "";
    if (missedCount > 0) detail += `${missedCount} missed payment(s) `;
    if (partialCount > 0) detail += `${partialCount} partial payment(s) `;
    detail += "in last 3 months";
    reasons.push({
      signal: "PAYMENT_BEHAVIOR",
      label: "Deteriorating Payment Pattern",
      detail: detail.trim(),
      severity: missedCount >= 2 ? "HIGH" : "MEDIUM"
    });
  }

  if (signals.activeLoans >= 3) {
    reasons.push({
      signal: "MULTIPLE_LOANS",
      label: "Multiple Active Loans",
      detail: `Borrower has ${signals.activeLoans} active loans indicating high debt load`,
      severity: signals.activeLoans >= 4 ? "HIGH" : "MEDIUM"
    });
  }

  return reasons;
}

function calculateInsufficientHistoryFlag(repaymentHistory) {
  if (!repaymentHistory || repaymentHistory.length === 0) return { flag: true, message: "No repayment history available" };
  if (repaymentHistory.length < 3) return { flag: true, message: `Only ${repaymentHistory.length} month(s) of history — score may be less reliable` };
  return { flag: false, message: null };
}

function scoreBorrower(borrower) {
  const accountSignals = borrower.accountSignals || {};
  const repaymentHistory = borrower.repaymentHistory || [];

  const dpdScore = scoreDPD(accountSignals);
  const failedDebitScore = scoreFailedDebits(accountSignals);
  const inflowScore = scoreInflowDrop(accountSignals);
  const utilizationScore = scoreCreditUtilization(accountSignals);
  const behaviorScore = scorePaymentBehavior(repaymentHistory);

  const totalScore = Math.min(
    Math.round(dpdScore + failedDebitScore + inflowScore + utilizationScore + behaviorScore),
    100
  );

  const breakdown = { dpdScore, failedDebitScore, inflowScore, utilizationScore, behaviorScore };
  const category = getRiskCategory(totalScore);
  const reasons = buildRiskReasons(breakdown, accountSignals, repaymentHistory);
  const recommendedAction = getRecommendedAction(category, accountSignals, repaymentHistory);
  const historyFlag = calculateInsufficientHistoryFlag(repaymentHistory);

  // Scenario simulation: what if next EMI is missed?
  const scenarioScore = Math.min(totalScore + 20, 100);
  const scenarioCategory = getRiskCategory(scenarioScore);

  return {
    borrowerId: borrower.id,
    borrowerName: borrower.name,
    riskScore: totalScore,
    riskCategory: category,
    riskCategoryLabel: getCategoryLabel(category),
    reasons,
    recommendedAction,
    scoreBreakdown: {
      daysPassDue: Math.round(dpdScore),
      failedAutoDebits: Math.round(failedDebitScore),
      incomeInflowDrop: Math.round(inflowScore),
      creditUtilization: Math.round(utilizationScore),
      paymentBehavior: Math.round(behaviorScore)
    },
    dataQualityFlag: historyFlag,
    scenario: {
      label: "If next EMI is missed",
      projectedScore: scenarioScore,
      projectedCategory: scenarioCategory,
      projectedCategoryLabel: getCategoryLabel(scenarioCategory)
    },
    scoredAt: new Date().toISOString()
  };
}

function getCategoryLabel(category) {
  const labels = {
    LOW: "Low Risk",
    WATCHLIST: "Watchlist",
    HIGH_RISK: "High Risk",
    CRITICAL: "Critical"
  };
  return labels[category] || category;
}

function scoreAllBorrowers(borrowers) {
  return borrowers.map(b => ({
    ...scoreBorrower(b),
    loan: b.loan,
    email: b.email,
    phone: b.phone,
    assignedAnalyst: b.assignedAnalyst
  }));
}

module.exports = { scoreBorrower, scoreAllBorrowers, THRESHOLDS, WEIGHTS };
