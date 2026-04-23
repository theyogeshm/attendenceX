// db.js — File-based database using lowdb (no MongoDB required)
const low      = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const path     = require("path");

const adapter = new FileSync(path.join(__dirname, "../data/db.json"));
const db      = low(adapter);

// Default structure: users + per-user attendance
db.defaults({ users: [], attendance: [] }).write();

module.exports = db;
