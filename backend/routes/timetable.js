const express = require("express");
const router = express.Router();
const { getTimetable, getTodayTimetable } = require("../controllers/timetableController");

// GET /api/timetable         — Full weekly timetable
router.get("/", getTimetable);

// GET /api/timetable/today   — Today's schedule
router.get("/today", getTodayTimetable);

module.exports = router;
