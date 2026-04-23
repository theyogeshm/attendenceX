// routes/attendance.js — All routes are protected (require JWT)
const express  = require("express");
const router   = express.Router();
const auth     = require("../middleware/auth");
const {
  markAttendance,
  getAttendance,
  getAttendanceBySubject,
  getAnalytics,
  getSubjectAnalytics,
  deleteLastAttendance,
} = require("../controllers/attendanceController");

// All attendance routes require login
router.use(auth);

// POST   /api/attendance
router.post("/", markAttendance);

// GET    /api/attendance
router.get("/", getAttendance);

// GET    /api/attendance/analytics
router.get("/analytics", getAnalytics);

// GET    /api/attendance/analytics/subject/:subject
router.get("/analytics/subject/:subject", getSubjectAnalytics);

// GET    /api/attendance/subject/:subject
router.get("/subject/:subject", getAttendanceBySubject);

// DELETE /api/attendance/last/:subject  — removes the most recent entry for a subject
router.delete("/last/:subject", deleteLastAttendance);

module.exports = router;
