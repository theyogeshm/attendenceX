require("dotenv").config();
const express   = require("express");
const cors      = require("cors");
const connectDB = require("./config/db");

const app = express();

// ─── Connect to MongoDB ───────────────────────────────────────────────────────
connectDB();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "10mb" })); // 10mb for base64 profile photos

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth",       require("./routes/auth"));
app.use("/api/attendance", require("./routes/attendance"));
app.use("/api/timetable",  require("./routes/timetable"));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    message: "Attendance API is running 🚀 (MongoDB)",
    endpoints: {
      auth:       { signup: "POST /api/auth/signup", login: "POST /api/auth/login", me: "GET /api/auth/me" },
      attendance: { mark: "POST /api/attendance", all: "GET /api/attendance", deleteLast: "DELETE /api/attendance/last/:subject" },
      timetable:  { week: "GET /api/timetable", today: "GET /api/timetable/today" },
    },
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
