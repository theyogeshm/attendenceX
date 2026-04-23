// ─────────────────────────────────────────────────────────────────────────────
// api.js — All backend communication.
// The frontend has ZERO business logic. Only API calls live here.
// ─────────────────────────────────────────────────────────────────────────────

const BASE = "/api";

// ─── Attendance ───────────────────────────────────────────────────────────────

/**
 * Mark attendance for a subject.
 * @param {string} subject
 * @param {"Present"|"Absent"|"Miss"|"Leave"} status
 */
export async function markAttendance(subject, status) {
  const res = await fetch(`${BASE}/attendance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subject, status }),
  });
  if (!res.ok) throw new Error("Failed to mark attendance");
  return res.json();
}

/**
 * Delete the most recent attendance record for a subject.
 * @param {string} subject
 */
export async function clearLastAttendance(subject) {
  const res = await fetch(`${BASE}/attendance/last/${encodeURIComponent(subject)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to clear attendance");
  return res.json();
}

/**
 * Fetch all attendance records.
 */
export async function fetchAttendance() {
  const res = await fetch(`${BASE}/attendance`);
  if (!res.ok) throw new Error("Failed to fetch attendance");
  return res.json();
}

/**
 * Fetch overall analytics (uses calculateCanMiss + updateOverallAttendance logic on backend).
 */
export async function fetchAnalytics() {
  const res = await fetch(`${BASE}/attendance/analytics`);
  if (!res.ok) throw new Error("Failed to fetch analytics");
  return res.json();
}

/**
 * Fetch per-subject analytics (uses computeSubjectStats + last5 logic on backend).
 * @param {string} subject
 */
export async function fetchSubjectAnalytics(subject) {
  const res = await fetch(`${BASE}/attendance/analytics/subject/${encodeURIComponent(subject)}`);
  if (!res.ok) throw new Error("Failed to fetch subject analytics");
  return res.json();
}

// ─── Timetable ────────────────────────────────────────────────────────────────

/**
 * Fetch full weekly timetable.
 */
export async function fetchTimetable() {
  const res = await fetch(`${BASE}/timetable`);
  if (!res.ok) throw new Error("Failed to fetch timetable");
  return res.json();
}

/**
 * Fetch today's timetable.
 */
export async function fetchTodayTimetable() {
  const res = await fetch(`${BASE}/timetable/today`);
  if (!res.ok) throw new Error("Failed to fetch today's timetable");
  return res.json();
}
