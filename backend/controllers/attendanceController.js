const db = require("../config/db");
const { getTodayInfo, computeSubjectStats, computeOverallAnalytics } = require("../utils/attendanceLogic");

// ─── POST /api/attendance ─────────────────────────────────────────────────────
const markAttendance = (req, res) => {
  try {
    const { subject, status } = req.body;
    const userId  = req.user.userId;
    const username = req.user.username;

    if (!subject || !status) {
      return res.status(400).json({ error: "subject and status are required" });
    }

    const validStatuses = ["Present", "Absent", "Miss", "Leave"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${validStatuses.join(", ")}` });
    }

    const todayInfo = getTodayInfo();

    const record = {
      _id:       `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`,
      userId,
      username,
      date:      todayInfo.date,
      day:       todayInfo.day,
      Subject:   subject,
      Status:    status,
      createdAt: new Date().toISOString(),
    };

    db.get("attendance").push(record).write();
    res.status(201).json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── GET /api/attendance ──────────────────────────────────────────────────────
const getAttendance = (req, res) => {
  try {
    const userId  = req.user.userId;
    const records = db.get("attendance").filter({ userId }).value().slice().reverse();
    res.json({ success: true, count: records.length, data: records });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── GET /api/attendance/subject/:subject ─────────────────────────────────────
const getAttendanceBySubject = (req, res) => {
  try {
    const userId  = req.user.userId;
    const { subject } = req.params;
    const records = db.get("attendance").filter({ userId, Subject: subject }).value();
    res.json({ success: true, count: records.length, data: records });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── GET /api/attendance/analytics ───────────────────────────────────────────
const getAnalytics = (req, res) => {
  try {
    const userId  = req.user.userId;
    const records = db.get("attendance").filter({ userId }).value();
    const analytics = computeOverallAnalytics(records);
    res.json({ success: true, data: analytics });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── GET /api/attendance/analytics/subject/:subject ──────────────────────────
const getSubjectAnalytics = (req, res) => {
  try {
    const userId  = req.user.userId;
    const { subject } = req.params;
    const records = db.get("attendance").filter({ userId }).value();
    const stats = computeSubjectStats(records, subject);
    res.json({ success: true, subject, data: stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── DELETE /api/attendance/last/:subject ─────────────────────────────────────
// Deletes the most recent attendance entry for a specific subject
const deleteLastAttendance = (req, res) => {
  try {
    const userId  = req.user.userId;
    const { subject } = req.params;

    // Find all records for this user + subject, sorted by createdAt
    const all = db.get("attendance")
      .filter((r) => r.userId === userId && r.Subject === subject)
      .value()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (all.length === 0) {
      return res.status(404).json({ error: "No attendance records found for this subject." });
    }

    const lastId = all[0]._id;
    db.get("attendance").remove({ _id: lastId }).write();

    res.json({ success: true, message: `Last entry for "${subject}" deleted.`, deletedId: lastId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  markAttendance,
  getAttendance,
  getAttendanceBySubject,
  getAnalytics,
  getSubjectAnalytics,
  deleteLastAttendance,
};
