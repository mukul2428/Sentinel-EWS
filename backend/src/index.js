require('dotenv').config();
const express = require("express");
const cors = require("cors");
const apiRoutes = require("./routes/api");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check without auth
app.get("/health", (req, res) => res.json({ status: "ok" }));

// All API routes
app.use("/api", apiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Loan EWS Backend running on http://localhost:${PORT}`);
  console.log(`📋 API Docs:`);
  console.log(`   GET  /api/borrowers            - List borrowers (role-filtered)`);
  console.log(`   GET  /api/borrowers/:id         - Borrower detail + risk`);
  console.log(`   GET  /api/borrowers/:id/alert   - Risk alert + LLM explanation`);
  console.log(`   POST /api/query                 - Analyst LLM query`);
  console.log(`   GET  /api/portfolio/summary     - Portfolio summary`);
  console.log(`\n🔑 Demo Tokens:`);
  console.log(`   Analyst 1:  token-analyst1`);
  console.log(`   Analyst 2:  token-analyst2`);
  console.log(`   Manager:    token-manager`);
  console.log(`   Borrower:   token-borrower-B001\n`);
});

module.exports = app;
