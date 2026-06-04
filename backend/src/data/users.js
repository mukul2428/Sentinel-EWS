// Simulated users for RBAC
// In production: replace with JWT-based auth + DB lookup
const users = {
  "token-analyst1": {
    id: "analyst1",
    name: "Ravi Kumar",
    role: "analyst",
    email: "ravi.kumar@lender.com",
    assignedBorrowers: ["B001", "B002", "B005", "B007", "B009"]
  },
  "token-analyst2": {
    id: "analyst2",
    name: "Sneha Patel",
    role: "analyst",
    email: "sneha.patel@lender.com",
    assignedBorrowers: ["B003", "B004", "B006", "B008", "B010"]
  },
  "token-manager": {
    id: "manager1",
    name: "Suresh Agarwal",
    role: "manager",
    email: "suresh.agarwal@lender.com",
    assignedBorrowers: [] // managers see all
  },
  "token-borrower-B001": {
    id: "B001",
    name: "Arjun Sharma",
    role: "borrower",
    email: "arjun.sharma@email.com",
    borrowerId: "B001"
  },
  "token-borrower-B003": {
    id: "B003",
    name: "Rahul Verma",
    role: "borrower",
    email: "rahul.verma@email.com",
    borrowerId: "B003"
  },
  "lw_DhCVxCSL_p4fHllb0vedSC24Kvck-ixBlSZiXt-Cg00": {
    id: "user-token",
    name: "API User",
    role: "manager",
    email: "api@user.com",
    assignedBorrowers: []
  }
};

module.exports = users;
