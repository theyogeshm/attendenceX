// attendanceController.js — Attendance CRUD using MongoDB/Mongoose
const Attendance = require("../models/Attendance");
const { getTodayInfo, computeSubjectStats, computeOverallAnalytics } = require("../utils/attendanceLogic");

// ─── POST /api/attendance ─────────────────────────────────────────────────────
const markAttendance = async (req, res) => {
  try {
    const { subject, status } = req.body;
    const userId   = req.user.userId;
    const username = req.user.username;

    if (!subject || !status)
      return res.status(400).json({ error: "subject and status are required" });

    const validStatuses = ["Present", "Absent", "Miss", "Leave"];
    if (!validStatuses.includes(status))
      return res.status(400).json({ error: `status must be one of: ${validStatuses.join(", ")}` });

    const todayInfo = getTodayInfo();

    const record = await Attendance.create({
      userId,
      username,
      date:    todayInfo.date,
      day:     todayInfo.day,
      Subject: subject,
      Status:  status,
    });

    res.status(201).json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── GET /api/attendance ──────────────────────────────────────────────────────
const getAttendance = async (req, res) => {
  try {
    const userId  = req.user.userId;
    // Sort newest first so frontend slice(-5) gives last 5 correctly
    const records = await Attendance.find({ userId }).sort({ createdAt: 1 }).lean();
    res.json({ success: true, count: records.length, data: records });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── GET /api/attendance/subject/:subject ─────────────────────────────────────
const getAttendanceBySubject = async (req, res) => {
  try {
    const userId  = req.user.userId;
    const { subject } = req.params;
    const records = await Attendance.find({ userId, Subject: subject }).lean();
    res.json({ success: true, count: records.length, data: records });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── GET /api/attendance/analytics ───────────────────────────────────────────
const getAnalytics = async (req, res) => {
  try {
    const userId  = req.user.userId;
    const records = await Attendance.find({ userId }).lean();
    const analytics = computeOverallAnalytics(records);
    res.json({ success: true, data: analytics });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── GET /api/attendance/analytics/subject/:subject ──────────────────────────
const getSubjectAnalytics = async (req, res) => {
  try {
    const userId  = req.user.userId;
    const { subject } = req.params;
    const records = await Attendance.find({ userId }).lean();
    const stats = computeSubjectStats(records, subject);
    res.json({ success: true, subject, data: stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── DELETE /api/attendance/last/:subject ─────────────────────────────────────
// Deletes the most recent attendance entry for a specific subject
const deleteLastAttendance = async (req, res) => {
  try {
    const userId  = req.user.userId;
    const { subject } = req.params;

    // Find the most recent record for this user + subject
    const last = await Attendance.findOne({ userId, Subject: subject })
      .sort({ createdAt: -1 });

    if (!last)
      return res.status(404).json({ error: "No attendance records found for this subject." });

    await Attendance.findByIdAndDelete(last._id);

    res.json({ success: true, message: `Last entry for "${subject}" deleted.`, deletedId: last._id });
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
