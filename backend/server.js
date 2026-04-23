require("dotenv").config();
const express = require("express");
const cors    = require("cors");

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: "*" })); // Allow all origins (localhost:3000, 5173, etc.)
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth",       require("./routes/auth"));
app.use("/api/attendance", require("./routes/attendance"));
app.use("/api/timetable",  require("./routes/timetable"));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    message: "Attendance API is running 🚀",
    endpoints: {
      auth:       { signup: "POST /api/auth/signup", login: "POST /api/auth/login", me: "GET /api/auth/me" },
      attendance: { mark: "POST /api/attendance", all: "GET /api/attendance", analytics: "GET /api/attendance/analytics" },
      timetable:  { week: "GET /api/timetable",   today: "GET /api/timetable/today" },
    },
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📁 Data stored in data/db.json`);
});
