const { TIMETABLE, FACULTY_INFO, getTodayKey } = require("../data/timetable");

// ─── GET /api/timetable ───────────────────────────────────────────────────────
// Full weekly timetable.
const getTimetable = (req, res) => {
  res.json({ success: true, data: TIMETABLE, faculty: FACULTY_INFO });
};

// ─── GET /api/timetable/today ─────────────────────────────────────────────────
// Today's schedule only.
const getTodayTimetable = (req, res) => {
  const dayKey = getTodayKey();

  if (!dayKey) {
    return res.json({ success: true, day: null, message: "It's a weekend — no classes!", data: [] });
  }

  res.json({ success: true, day: dayKey, data: TIMETABLE[dayKey] });
};

module.exports = { getTimetable, getTodayTimetable };
