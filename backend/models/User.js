// User.js — Mongoose schema for registered students
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username:  { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:  { type: String, required: true },
    name:      { type: String, required: true, trim: true },
    rollNo:    { type: String, default: "" },
    email:     { type: String, default: "" },
    bio:       { type: String, default: "" },
    linkedin:  { type: String, default: "" },
    github:    { type: String, default: "" },
    photo:     { type: String, default: "" }, // base64 data URL
    timetable: { type: Array,  default: [] }, // [{day, slot, subject, room}]
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
