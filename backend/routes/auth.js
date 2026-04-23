// routes/auth.js
const express    = require("express");
const router     = express.Router();
const auth       = require("../middleware/auth");
const { signup, login, getMe, updateProfile, updateTimetable } = require("../controllers/authController");

// POST /api/auth/signup
router.post("/signup", signup);

// POST /api/auth/login
router.post("/login", login);

// GET  /api/auth/me  (protected)
router.get("/me", auth, getMe);

// PUT  /api/auth/profile  (protected) — update name, bio, social, photo
router.put("/profile", auth, updateProfile);

// PUT  /api/auth/timetable  (protected) — update per-user timetable
router.put("/timetable", auth, updateTimetable);

module.exports = router;
