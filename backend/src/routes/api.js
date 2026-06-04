const express = require("express");
const router = express.Router();
const borrowers = require("../data/borrowers");
const { scoreBorrower, scoreAllBorrowers } = require("../services/riskScorer");
const { generateRiskExplanation, handleAnalystQuery, generatePortfolioSummary } = require("../services/llmService");
const { authenticate, requireRole, canAccessBorrower } = require("../middleware/auth");

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/borrowers
 * Returns all borrowers (filtered by role) sorted by risk score DESC
 */
router.get("/borrowers", (req, res) => {
  try {
    let accessibleBorrowers = borrowers;

    // Filter by role
    if (req.user.role === "borrower") {
      accessibleBorrowers = borrowers.filter(b => b.id === req.user.borrowerId);
    } else if (req.user.role === "analyst") {
      accessibleBorrowers = borrowers.filter(b => req.user.assignedBorrowers.includes(b.id));
    }
    // managers see all

    const results = scoreAllBorrowers(accessibleBorrowers);
    results.sort((a, b) => b.riskScore - a.riskScore);

    // Strip sensitive fields from borrower-level access
    if (req.user.role === "borrower") {
      const stripped = results.map(r => ({
        borrowerId: r.borrowerId,
        borrowerName: r.borrowerName,
        riskCategory: r.riskCategory,
        riskCategoryLabel: r.riskCategoryLabel,
        riskScore: r.riskScore,
        reasons: r.reasons,
        recommendedAction: r.recommendedAction,
        loan: {
          emiAmount: r.loan?.emiAmount,
          nextDueDate: r.loan?.nextDueDate,
          outstandingBalance: r.loan?.outstandingBalance
        }
      }));
      return res.json({ data: stripped, role: req.user.role });
    }

    res.json({ data: results, role: req.user.role, user: { id: req.user.id, name: req.user.name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to score borrowers" });
  }
});

/**
 * GET /api/borrowers/:id
 * Returns full borrower detail with risk assessment
 */
router.get("/borrowers/:id", (req, res) => {
  try {
    const { id } = req.params;
    if (!canAccessBorrower(req.user, id)) {
      return res.status(403).json({ error: "Access denied to this borrower's data" });
    }

    const borrower = borrowers.find(b => b.id === id);
    if (!borrower) return res.status(404).json({ error: "Borrower not found" });

    const riskResult = scoreBorrower(borrower);

    res.json({
      borrower: {
        id: borrower.id,
        name: borrower.name,
        email: req.user.role !== "borrower" ? borrower.email : undefined,
        phone: req.user.role !== "borrower" ? borrower.phone : undefined,
        loan: borrower.loan,
        accountSignals: borrower.accountSignals,
        repaymentHistory: borrower.repaymentHistory,
        transactions: borrower.transactions
      },
      riskAssessment: riskResult
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch borrower" });
  }
});

/**
 * GET /api/borrowers/:id/alert
 * Returns risk alert with LLM-generated explanation
 */
router.get("/borrowers/:id/alert", async (req, res) => {
  try {
    const { id } = req.params;
    if (!canAccessBorrower(req.user, id)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const borrower = borrowers.find(b => b.id === id);
    if (!borrower) return res.status(404).json({ error: "Borrower not found" });

    const riskResult = scoreBorrower(borrower);

    let llmExplanation = null;
    let llmError = null;
    try {
      llmExplanation = await generateRiskExplanation(borrower, riskResult);
    } catch (e) {
      llmError = "LLM explanation unavailable: " + e.message;
    }

    res.json({
      borrowerId: id,
      borrowerName: borrower.name,
      riskAssessment: riskResult,
      llmExplanation,
      llmError,
      generatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate alert" });
  }
});

/**
 * POST /api/query
 * Analyst asks a natural language question about a borrower
 * Body: { borrowerId: "B001", question: "Why was this borrower flagged?" }
 */
router.post("/query", requireRole("analyst", "manager"), async (req, res) => {
  try {
    const { borrowerId, question } = req.body;
    if (!borrowerId || !question) {
      return res.status(400).json({ error: "borrowerId and question are required" });
    }

    if (!canAccessBorrower(req.user, borrowerId)) {
      return res.status(403).json({ error: "Access denied to this borrower's data" });
    }

    const borrower = borrowers.find(b => b.id === borrowerId);
    if (!borrower) return res.status(404).json({ error: "Borrower not found" });

    const riskResult = scoreBorrower(borrower);

    let answer = null;
    let error = null;
    try {
      answer = await handleAnalystQuery(question, borrower, riskResult);
    } catch (e) {
      error = "LLM query failed: " + e.message;
    }

    res.json({
      borrowerId,
      question,
      answer,
      error,
      dataSource: "borrower_record_only",
      queriedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Query failed" });
  }
});

/**
 * GET /api/portfolio/summary
 * Manager-only: portfolio-level risk summary
 */
router.get("/portfolio/summary", requireRole("manager", "analyst"), async (req, res) => {
  try {
    let accessibleBorrowers = borrowers;
    if (req.user.role === "analyst") {
      accessibleBorrowers = borrowers.filter(b => req.user.assignedBorrowers.includes(b.id));
    }

    const allRisks = scoreAllBorrowers(accessibleBorrowers);

    const breakdown = {
      total: allRisks.length,
      critical: allRisks.filter(r => r.riskCategory === "CRITICAL"),
      highRisk: allRisks.filter(r => r.riskCategory === "HIGH_RISK"),
      watchlist: allRisks.filter(r => r.riskCategory === "WATCHLIST"),
      low: allRisks.filter(r => r.riskCategory === "LOW"),
      averageScore: Math.round(allRisks.reduce((s, r) => s + r.riskScore, 0) / allRisks.length),
      totalOutstanding: accessibleBorrowers.reduce((s, b) => s + (b.loan?.outstandingBalance || 0), 0)
    };

    let llmSummary = null;
    let llmError = null;
    try {
      llmSummary = await generatePortfolioSummary(allRisks);
    } catch (e) {
      llmError = "LLM summary unavailable: " + e.message;
    }

    res.json({
      breakdown: {
        ...breakdown,
        critical: breakdown.critical.map(r => ({ id: r.borrowerId, name: r.borrowerName, score: r.riskScore })),
        highRisk: breakdown.highRisk.map(r => ({ id: r.borrowerId, name: r.borrowerName, score: r.riskScore })),
        watchlist: breakdown.watchlist.map(r => ({ id: r.borrowerId, name: r.borrowerName, score: r.riskScore })),
        low: breakdown.low.map(r => ({ id: r.borrowerId, name: r.borrowerName, score: r.riskScore }))
      },
      llmSummary,
      llmError
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Portfolio summary failed" });
  }
});

/**
 * GET /api/health
 * Health check (no auth)
 */
router.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

module.exports = router;
