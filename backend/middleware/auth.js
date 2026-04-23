// auth.js — Auth middleware: verifies JWT token on protected routes
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "attendanceApp_secret_2024";

module.exports = function authMiddleware(req, res, next) {
  const header = req.headers["authorization"] || "";
  const token  = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "No token. Please login first." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { userId, username, name }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
};
