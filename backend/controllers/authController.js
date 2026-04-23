// authController.js — Signup & Login for students
const bcrypt    = require("bcryptjs");
const jwt       = require("jsonwebtoken");
const db        = require("../config/db");

const JWT_SECRET  = process.env.JWT_SECRET  || "attendanceApp_secret_2024";
const JWT_EXPIRES = process.env.JWT_EXPIRES || "7d";

// Helper: build safe user response object
function safeUser(u) {
  return {
    _id:       u._id,
    username:  u.username,
    name:      u.name,
    rollNo:    u.rollNo    || "",
    email:     u.email     || "",
    bio:       u.bio       || "",
    linkedin:  u.linkedin  || "",
    github:    u.github    || "",
    photo:     u.photo     || "",
    timetable: u.timetable || [],
  };
}

// ─── POST /api/auth/signup ────────────────────────────────────────────────────
const signup = async (req, res) => {
  try {
    const { username, password, name, rollNo, email } = req.body;

    if (!username || !password || !name) {
      return res.status(400).json({ error: "username, password, and name are required." });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }

    const exists = db.get("users").find({ username: username.toLowerCase() }).value();
    if (exists) {
      return res.status(409).json({ error: "Username already taken. Choose another." });
    }

    const hashed  = await bcrypt.hash(password, 10);
    const userId  = `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;

    const user = {
      _id:       userId,
      username:  username.toLowerCase(),
      password:  hashed,
      name,
      rollNo:    rollNo   || "",
      email:     email    || "",
      bio:       "",
      linkedin:  "",
      github:    "",
      photo:     "",
      timetable: [],
      createdAt: new Date().toISOString(),
    };

    db.get("users").push(user).write();

    const token = jwt.sign(
      { userId, username: user.username, name: user.name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    res.status(201).json({ success: true, token, user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "username and password are required." });
    }

    const user = db.get("users").find({ username: username.toLowerCase() }).value();
    if (!user) {
      return res.status(401).json({ error: "Invalid username or password." });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: "Invalid username or password." });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username, name: user.name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    res.json({ success: true, token, user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
const getMe = (req, res) => {
  const user = db.get("users").find({ _id: req.user.userId }).value();
  if (!user) return res.status(404).json({ error: "User not found." });
  res.json({ success: true, user: safeUser(user) });
};

// ─── PUT /api/auth/profile ────────────────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const { name, rollNo, email, bio, linkedin, github, photo } = req.body;
    const userId = req.user.userId;
    const user = db.get("users").find({ _id: userId }).value();
    if (!user) return res.status(404).json({ error: "User not found." });
    if (!name || !name.trim()) return res.status(400).json({ error: "Name cannot be empty." });

    const updates = {
      name:     name.trim(),
      rollNo:   rollNo    !== undefined ? rollNo.trim()    : user.rollNo,
      email:    email     !== undefined ? email.trim()     : user.email,
      bio:      bio       !== undefined ? bio.trim()       : user.bio,
      linkedin: linkedin  !== undefined ? linkedin.trim()  : user.linkedin,
      github:   github    !== undefined ? github.trim()    : user.github,
    };
    if (photo !== undefined) updates.photo = photo; // base64 data URL

    db.get("users").find({ _id: userId }).assign(updates).write();
    const updated = db.get("users").find({ _id: userId }).value();

    res.json({ success: true, user: safeUser(updated) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── PUT /api/auth/timetable ──────────────────────────────────────────────────
const updateTimetable = async (req, res) => {
  try {
    const { timetable } = req.body;
    const userId = req.user.userId;

    if (!Array.isArray(timetable)) {
      return res.status(400).json({ error: "timetable must be an array." });
    }
    if (timetable.length > 60) {
      return res.status(400).json({ error: "Too many entries (max 60)." });
    }

    // Validate each entry
    const validDays = ["MO","TU","WE","TH","FR","SA","SU"];
    for (const entry of timetable) {
      if (!entry.day || !validDays.includes(entry.day)) {
        return res.status(400).json({ error: `Invalid day: ${entry.day}` });
      }
      if (!entry.slot || !entry.subject) {
        return res.status(400).json({ error: "Each entry needs slot and subject." });
      }
    }

    const user = db.get("users").find({ _id: userId }).value();
    if (!user) return res.status(404).json({ error: "User not found." });

    db.get("users").find({ _id: userId }).assign({ timetable }).write();
    const updated = db.get("users").find({ _id: userId }).value();

    res.json({ success: true, user: safeUser(updated) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { signup, login, getMe, updateProfile, updateTimetable };
