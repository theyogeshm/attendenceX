const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema(
  {
    date:    { type: String, required: true },   // "dd/mm/yyyy" — format from getTodayInfo()
    day:     { type: String, required: true },   // "Monday", "Tuesday", etc.
    subject: { type: String, required: true },   // "Maths", "Physics", etc.
    status:  {
      type: String,
      required: true,
      enum: ["Present", "Absent", "Miss", "Leave"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Attendance", AttendanceSchema);
