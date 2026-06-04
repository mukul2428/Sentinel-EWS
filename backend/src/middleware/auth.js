const users = require("../data/users");

/**
 * SIMULATED AUTH MIDDLEWARE
 *
 * In production, this would:
 * 1. Validate a JWT token (signed with RS256, short expiry)
 * 2. Look up the user from a database
 * 3. Attach role + permissions to req.user
 * 4. Enforce row-level security at DB query level
 *
 * For this prototype: token = simple lookup in users map.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authorization header missing or invalid" });
  }

  const token = authHeader.replace("Bearer ", "").trim();
  const user = users[token];

  if (!user) {
    return res.status(401).json({ error: "Invalid token" });
  }

  req.user = user;
  next();
}

/**
 * Role-based access check
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Access denied. Required role: ${roles.join(" or ")}` });
    }
    next();
  };
}

/**
 * Checks if current user can access a specific borrower's data.
 * Borrowers: only their own record.
 * Analysts: only their assigned borrowers.
 * Managers: all borrowers.
 */
function canAccessBorrower(user, borrowerId) {
  if (user.role === "manager") return true;
  if (user.role === "borrower") return user.borrowerId === borrowerId;
  if (user.role === "analyst") return user.assignedBorrowers.includes(borrowerId);
  return false;
}

module.exports = { authenticate, requireRole, canAccessBorrower };
