// authController.js — Signup & Login using MongoDB/Mongoose
const bcrypt = require("bcryptjs");
const jwt    = require("jsonwebtoken");
const User   = require("../models/User");

const JWT_SECRET  = process.env.JWT_SECRET  || "attendanceApp_secret_2024";
const JWT_EXPIRES = process.env.JWT_EXPIRES || "7d";

// Helper: strip password before sending to client
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

    if (!username || !password || !name)
      return res.status(400).json({ error: "username, password, and name are required." });
    if (password.length < 6)
      return res.status(400).json({ error: "Password must be at least 6 characters." });

    const exists = await User.findOne({ username: username.toLowerCase() });
    if (exists)
      return res.status(409).json({ error: "Username already taken. Choose another." });

    const hashed = await bcrypt.hash(password, 10);
    const user   = await User.create({
      username: username.toLowerCase(),
      password: hashed,
      name,
      rollNo:   rollNo || "",
      email:    email  || "",
    });

    const token = jwt.sign(
      { userId: user._id, username: user.username, name: user.name },
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

    if (!username || !password)
      return res.status(400).json({ error: "username and password are required." });

    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user)
      return res.status(401).json({ error: "Invalid username or password." });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ error: "Invalid username or password." });

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
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) return res.status(404).json({ error: "User not found." });
    res.json({ success: true, user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── PUT /api/auth/profile ────────────────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const { name, rollNo, email, bio, linkedin, github, photo } = req.body;
    const userId = req.user.userId;

    if (!name || !name.trim())
      return res.status(400).json({ error: "Name cannot be empty." });

    const updates = {
      name:     name.trim(),
      rollNo:   rollNo    !== undefined ? rollNo.trim()    : undefined,
      email:    email     !== undefined ? email.trim()     : undefined,
      bio:      bio       !== undefined ? bio.trim()       : undefined,
      linkedin: linkedin  !== undefined ? linkedin.trim()  : undefined,
      github:   github    !== undefined ? github.trim()    : undefined,
    };
    // Remove undefined keys so we don't overwrite with undefined
    Object.keys(updates).forEach(k => updates[k] === undefined && delete updates[k]);
    if (photo !== undefined) updates.photo = photo;

    const updated = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updated) return res.status(404).json({ error: "User not found." });
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

    if (!Array.isArray(timetable))
      return res.status(400).json({ error: "timetable must be an array." });
    if (timetable.length > 60)
      return res.status(400).json({ error: "Too many entries (max 60)." });

    const validDays = ["MO","TU","WE","TH","FR","SA","SU"];
    for (const entry of timetable) {
      if (!entry.day || !validDays.includes(entry.day))
        return res.status(400).json({ error: `Invalid day: ${entry.day}` });
      if (!entry.slot || !entry.subject)
        return res.status(400).json({ error: "Each entry needs slot and subject." });
    }

    const updated = await User.findByIdAndUpdate(
      userId,
      { $set: { timetable } },
      { new: true }
    ).select("-password");

    if (!updated) return res.status(404).json({ error: "User not found." });
    res.json({ success: true, user: safeUser(updated) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { signup, login, getMe, updateProfile, updateTimetable };
