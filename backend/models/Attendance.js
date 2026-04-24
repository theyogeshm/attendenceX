// Attendance.js — Mongoose schema for attendance records
const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema(
  {
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    username: { type: String, required: true },
    date:     { type: String, required: true },  // "dd/mm/yyyy"
    day:      { type: String, required: true },  // "Monday", etc.
    Subject:  { type: String, required: true },  // kept as "Subject" to match frontend
    Status:   {
      type: String,
      required: true,
      enum: ["Present", "Absent", "Miss", "Leave"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Attendance", AttendanceSchema);
