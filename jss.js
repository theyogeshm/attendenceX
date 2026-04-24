// ═══════════════════════════════════════════════════════════════════════════════
// jss.js — Main frontend logic for Attendance Tracker
// Backend API: http://localhost:5000
// ═══════════════════════════════════════════════════════════════════════════════

const API_BASE = "https://attendencex.onrender.com/api";

// ─── Token helpers ────────────────────────────────────────────────────────────
function getToken()           { return localStorage.getItem("att_token"); }
function saveToken(t)         { localStorage.setItem("att_token", t); }
function clearToken()         { localStorage.removeItem("att_token"); }
function saveCurrentUser(u)   { localStorage.setItem("att_user", JSON.stringify(u)); }
function getCurrentUser()     { try { return JSON.parse(localStorage.getItem("att_user")); } catch { return null; } }
function clearCurrentUser()   { localStorage.removeItem("att_user"); }

// Shared fetch with auth header
async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(API_BASE + path, { ...options, headers });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Server error");
  return json;
}

// ─────────────────────────────────────────────────────────────────────────────
// CALENDAR
// ─────────────────────────────────────────────────────────────────────────────
const monthYear = document.getElementById("monthYear");
const datesDiv  = document.getElementById("dates");
const prevBtn   = document.getElementById("prev");
const nextBtn   = document.getElementById("next");
let calDate     = new Date();

const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function renderCalendar() {
  datesDiv.innerHTML = "";
  const year     = calDate.getFullYear();
  const month    = calDate.getMonth();
  monthYear.innerText = `${months[month]} ${year}`;
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let startDay = firstDay === 0 ? 6 : firstDay - 1;
  for (let i = 0; i < startDay; i++) datesDiv.innerHTML += `<span></span>`;
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = d === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
    datesDiv.innerHTML += `<span class="${isToday ? "today" : ""}">${d}</span>`;
  }
}

prevBtn.onclick = () => { calDate.setMonth(calDate.getMonth() - 1); renderCalendar(); };
nextBtn.onclick = () => { calDate.setMonth(calDate.getMonth() + 1); renderCalendar(); };
renderCalendar();

// ─────────────────────────────────────────────────────────────────────────────
// ATTENDANCE DATA
// ─────────────────────────────────────────────────────────────────────────────
let attendanceData = [];

async function loadAttendance() {
  if (!getToken()) return; // not logged in
  try {
    const res = await apiFetch("/attendance");
    attendanceData = res.data || [];
    console.log("Attendance loaded ✅", attendanceData.length, "records");
    updateAllSubjectCards();
    updateOverallAttendance();
    updateLast5Attendance();
  } catch (err) {
    console.error("Error loading attendance ❌", err.message);
  }
}

function getTodayInfo() {
  const today = new Date();
  return {
    date: today.toLocaleDateString("en-GB"),
    day:  today.toLocaleDateString("en-US", { weekday: "long" }),
  };
}

async function markAttendance(subject, status) {
  if (!getToken()) {
    openPopOk("Login Required", "Please login first to mark attendance.");
    return;
  }
  const todayInfo = getTodayInfo();
  try {
    await apiFetch("/attendance", {
      method: "POST",
      body: JSON.stringify({ subject, status }),
    });
    console.log("Attendance sent ✅", subject, status);
    await loadAttendance(); // refresh data
  } catch (err) {
    console.error("Failed to mark attendance ❌", err.message);
    openPopOk("Error", "Could not save attendance. Is the backend running?");
  }
}

async function clearLastAttendance(subject) {
  if (!getToken()) {
    openPopOk("Login Required", "Please login first.");
    return;
  }
  openPop(
    "Clear 1 Attendance",
    `Remove the most recent attendance entry for "${subject}"?`,
    async () => {
      try {
        await apiFetch(`/attendance/last/${encodeURIComponent(subject)}`, { method: "DELETE" });
        showToast(`Last entry for ${subject} removed 🗑️`, "success");
        await loadAttendance();
      } catch (err) {
        openPopOk("Error", err.message || "No records to clear or request failed.");
      }
    }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ON LOAD — Day filtering, timetable highlight
// ─────────────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  // ── Prevent Chrome autofill on search bar ──────────────────────────
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.setAttribute("readonly", true);
    searchInput.addEventListener("focus", () => searchInput.removeAttribute("readonly"));
    searchInput.addEventListener("blur",  () => { if (!searchInput.value) searchInput.setAttribute("readonly", true); });
    setTimeout(() => { if (searchInput.value) searchInput.value = ""; }, 300);
  }

  const today    = new Date().getDay();
  const dayMap   = { 1: "MO", 2: "TU", 3: "WE", 4: "TH", 5: "FR" };
  const todayName = dayMap[today];

  // Timetable row highlight
  document.querySelectorAll(".timetable tr").forEach((row) => {
    row.classList.remove("today-row");
    const dayCell = row.querySelector("td");
    if (dayCell && dayCell.innerText.trim() === todayName) {
      row.classList.add("today-row");
    }
  });

  // Dashboard day-cards
  document.querySelectorAll(".card").forEach((card) => {
    card.classList.remove("active");
    if (card.dataset.day === todayName) card.classList.add("active");
  });

  // Timetable page: today's subjects
  if (todayName) buildTodaySubjectCards(todayName);

  // Popup buttons
  document.getElementById("yesBtn").onclick = function () { if (yesCallback) yesCallback(); };
  document.getElementById("noBtn").onclick  = closePop;
  document.getElementById("okBtn").onclick  = closePop;
});

// ─────────────────────────────────────────────────────────────────────────────
// PAGE NAVIGATION
// ─────────────────────────────────────────────────────────────────────────────
function showPage(pageId, el = null) {
  document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));
  const target = document.getElementById(pageId);
  if (target) target.classList.add("active");
  document.querySelectorAll(".nav a").forEach((a) => a.classList.remove("active"));
  if (el) el.classList.add("active");
  // close mobile nav when a page is selected
  closeMobileNav();
}

window.onload = () => {
  // Restore dark mode
  if (localStorage.getItem("darkMode") === "on") {
    document.body.classList.add("dark");
    const lbl = document.getElementById("darkModeLabel");
    if (lbl) lbl.textContent = "Dark Mode ON — Click to turn off";
  }

  // Render default dashboard + attendance (shown even before login)
  const today     = new Date().getDay();
  const dayMapW   = { 1:"MO", 2:"TU", 3:"WE", 4:"TH", 5:"FR" };
  const todayCodeW = dayMapW[today];
  renderDashboardCards(todayCodeW);
  renderAttendanceSubcards();
  renderSubjectsSection();
  renderAnalyticsSubcards();

  // Load faculty info from localStorage (or defaults)
  loadFacultyData();

  // Restore session — fetch fresh user from server so timetable is always current
  const savedUser = getCurrentUser();
  if (savedUser && getToken()) {
    // Show from localStorage immediately (instant UI)
    showProfileFor(savedUser);
    // Then refresh from server in background to get latest timetable
    apiFetch("/auth/me")
      .then((res) => {
        if (res && res.user) {
          saveCurrentUser(res.user);
          loadTimetableFromUser(res.user); // re-render with fresh timetable
        }
      })
      .catch(() => { /* network error — stale localStorage already shown */ });
    loadAttendance();
  } else {
    updateHeaderAvatar(null);
  }

  const dashLink = document.querySelector('.nav a[data-page="dashboard"]');
  showPage("dashboard", dashLink);
};


// ─────────────────────────────────────────────────────────────────────────────
// ATTENDANCE CALCULATIONS
// ─────────────────────────────────────────────────────────────────────────────
const REQUIRED_PERCENT = 75;

function calculateCanMiss(present, total) {
  if (total === 0) return 0;
  const maxTotalAllowed = Math.floor((present * 100) / REQUIRED_PERCENT);
  const canMiss = maxTotalAllowed - total;
  return canMiss > 0 ? canMiss : 0;
}

function updateAllSubjectCards() {
  document.querySelectorAll(".subcard").forEach((card) => {
    const subject = card.dataset.subject;
    if (!subject) return;
    let p = 0, a = 0, m = 0, l = 0;
    attendanceData.forEach((row) => {
      if (row.Subject === subject) {
        if (row.Status === "Present") p++;
        if (row.Status === "Absent")  a++;
        if (row.Status === "Miss")    m++;
        if (row.Status === "Leave")   l++;
      }
    });
    const total      = p + a;
    const percentage = total === 0 ? 0 : Math.round((p / total) * 100);
    const canMiss    = calculateCanMiss(p, total);

    const pEl    = card.querySelector(".count.p");
    const aEl    = card.querySelector(".count.a");
    const mEl    = card.querySelector(".count.m");
    const lEl    = card.querySelector(".count.l");
    const perEl  = card.querySelector(".att-per");
    const missEl = card.querySelector(".can-miss");

    if (pEl)    pEl.innerText    = p;
    if (aEl)    aEl.innerText    = a;
    if (mEl)    mEl.innerText    = m;
    if (lEl)    lEl.innerText    = l;
    if (perEl)  perEl.innerText  = percentage + "%";
    if (missEl) missEl.innerText = canMiss;
  });
}

function updateOverallAttendance() {
  let totalPresent = 0, totalAbsent = 0;
  const subjectMap = {};

  attendanceData.forEach((row) => {
    const subject = row.Subject;
    if (!subject) return;
    if (!subjectMap[subject]) subjectMap[subject] = { p: 0, a: 0 };
    if (row.Status === "Present") { subjectMap[subject].p++; totalPresent++; }
    if (row.Status === "Absent")  { subjectMap[subject].a++; totalAbsent++;  }
  });

  const totalClasses = totalPresent + totalAbsent;
  const percent      = totalClasses === 0 ? 0 : Math.round((totalPresent / totalClasses) * 100);
  const canMiss      = calculateCanMiss(totalPresent, totalClasses);

  let bestSub = "-", worstSub = "-", bestPer = -1, worstPer = 101;
  Object.keys(subjectMap).forEach((sub) => {
    const { p, a } = subjectMap[sub];
    const t = p + a;
    if (t === 0) return;
    const per = Math.round((p / t) * 100);
    if (per > bestPer)  { bestPer  = per; bestSub  = sub; }
    if (per < worstPer) { worstPer = per; worstSub = sub; }
  });

  const status = percent >= 75 ? "SAFE ✅" : "DANGER ❌";

  document.querySelector(".ana-total").innerText    = totalClasses;
  document.querySelector(".ana-present").innerText  = totalPresent;
  document.querySelector(".ana-absent").innerText   = totalAbsent;
  document.querySelector(".ana-percent").innerText  = percent + "%";
  document.querySelector(".ana-status").innerText   = status;
  document.querySelector(".ana-canmiss").innerText  = canMiss;
  document.querySelector(".best-sub").innerText     = bestSub;
  document.querySelector(".worst-sub").innerText    = worstSub;
}

function updateLast5Attendance() {
  document.querySelectorAll(".subcard").forEach((card) => {
    const subject = card.dataset.subject;
    const box     = card.querySelector(".last5");
    if (!subject || !box) return;
    box.innerHTML = "";
    const last5 = attendanceData.filter((r) => r.Subject === subject).slice(-5);
    last5.forEach((r) => {
      let code = "";
      if (r.Status === "Present") code = "P";
      if (r.Status === "Absent")  code = "A";
      if (r.Status === "Miss")    code = "M";
      if (r.Status === "Leave")   code = "L";
      const span = document.createElement("span");
      span.innerText = code;
      span.classList.add(code);
      box.appendChild(span);
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// POPUP
// ─────────────────────────────────────────────────────────────────────────────
let yesCallback = null;

function openPop(title, message, onYes) {
  document.getElementById("popTitle").innerText   = title;
  document.getElementById("popMessage").innerText = message;
  yesCallback = onYes;
  document.getElementById("yesBtn").classList.remove("hidden");
  document.getElementById("noBtn").classList.remove("hidden");
  document.getElementById("okBtn").classList.add("hidden");
  document.getElementById("popup").classList.remove("hidden");
}

function openPopOk(title, message) {
  document.getElementById("popTitle").innerText   = title;
  document.getElementById("popMessage").innerText = message;
  document.getElementById("yesBtn").classList.add("hidden");
  document.getElementById("noBtn").classList.add("hidden");
  document.getElementById("okBtn").classList.remove("hidden");
  document.getElementById("popup").classList.remove("hidden");
}

function closePop() {
  document.getElementById("popup").classList.add("hidden");
  yesCallback = null;
}

// ─────────────────────────────────────────────────────────────────────────────
// MISC ACTIONS
// ─────────────────────────────────────────────────────────────────────────────
function logout() {
  openPop("Logout", "Escape before reality loads 😂", () => {
    clearToken();
    clearCurrentUser();
    // Reset profile UI
    const wall = document.getElementById("profileLoginWall");
    const info = document.getElementById("profileInfo");
    if (wall) wall.style.display = "";
    if (info) info.style.display = "none";
    // Clear attendance
    attendanceData = [];
    updateAllSubjectCards();
    updateOverallAttendance();
    updateLast5Attendance();
    openPopOk("Logged out", "You have successfully escaped 🏃‍♂️💨");
  });
}

function changelang() {
  openPopOk("Change Language?", "Changing the language won't fix the lack of understanding 😌");
}
function notify() {
  openPopOk("Reminder", "No alarm works on your future 😂");
}

// ─────────────────────────────────────────────────────────────────────────────
// DARK MODE TOGGLE
// ─────────────────────────────────────────────────────────────────────────────
function toggleDarkMode(e) {
  e.preventDefault();
  const isDark = document.body.classList.toggle("dark");
  localStorage.setItem("darkMode", isDark ? "on" : "off");
  const lbl = document.getElementById("darkModeLabel");
  if (lbl) lbl.textContent = isDark ? "Dark Mode ON — Click to turn off" : "Dark Mode - See your future, it's already dark";
}

// ─────────────────────────────────────────────────────────────────────────────
// TIMETABLE — TODAY'S SUBJECTS
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_TIMETABLE_DATA = {
  MO: ["Discrete", "Data Lab", "Physics"],
  TU: ["EVS", "Discrete", "Physics Lab", "Maths"],
  WE: ["Maths", "Physics", "Data"],
  TH: ["Data", "Maths"],
  FR: ["Discrete", "Basic ML", "Basic ML Lab"],
};

// Default slot-by-slot entries matching the hardcoded HTML timetable
const DEFAULT_TIMETABLE_ENTRIES = [
  { day:"MO", slot:"8-9",   subject:"Discrete",     room:"" },
  { day:"MO", slot:"12-1",  subject:"Data Lab",     room:"" },
  { day:"MO", slot:"2-3",   subject:"Physics",      room:"" },
  { day:"TU", slot:"8-9",   subject:"EVS",          room:"" },
  { day:"TU", slot:"10-11", subject:"Discrete",     room:"" },
  { day:"TU", slot:"12-1",  subject:"Physics Lab",  room:"" },
  { day:"TU", slot:"2-3",   subject:"Maths",        room:"" },
  { day:"WE", slot:"10-11", subject:"Maths",        room:"" },
  { day:"WE", slot:"12-1",  subject:"Physics",      room:"" },
  { day:"WE", slot:"1-2",   subject:"Data",         room:"" },
  { day:"TH", slot:"10-11", subject:"Data",         room:"" },
  { day:"TH", slot:"1-2",   subject:"Maths",        room:"" },
  { day:"FR", slot:"10-11", subject:"Discrete",     room:"" },
  { day:"FR", slot:"12-1",  subject:"Basic ML",     room:"" },
  { day:"FR", slot:"2-3",   subject:"Basic ML Lab", room:"" },
];

// Per-user custom timetable (array of {day, slot, subject, room})
let userTimetable = [];

function buildTodaySubjectCards(todayCode) {
  const container = document.getElementById("todayCardsContainer");
  if (!container) return;
  container.innerHTML = "";

  let subjects = [];
  if (userTimetable.length > 0) {
    // Use the user's custom timetable
    subjects = [...new Set(
      userTimetable.filter((e) => e.day === todayCode).map((e) => e.subject)
    )];
  } else {
    subjects = DEFAULT_TIMETABLE_DATA[todayCode] || [];
  }

  if (subjects.length === 0) {
    container.innerHTML = '<div style="color:#888;font-size:16px;padding:8px;">No classes today 🎉</div>';
    return;
  }
  subjects.forEach((sub) => {
    const card = document.createElement("div");
    card.className = "today-sub-card";
    card.textContent = sub;
    container.appendChild(card);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// TIMETABLE — RENDER TABLE FROM USER DATA
// ─────────────────────────────────────────────────────────────────────────────
const TT_SLOTS  = ["8-9", "9-10", "10-11", "11-12", "12-1", "1-2", "2-3", "3-4"];
const TT_DAYS   = ["MO", "TU", "WE", "TH", "FR"];

function renderTimetableTable(timetable) {
  const tbody = document.getElementById("weekTimetableBody");
  if (!tbody) return;
  if (!timetable || timetable.length === 0) {
    // restore static default (leave innerHTML as is)
    return;
  }

  tbody.innerHTML = "";
  TT_DAYS.forEach((day) => {
    const tr = document.createElement("tr");
    tr.dataset.day = day;

    // Today highlight
    const todayMap = { 1:"MO", 2:"TU", 3:"WE", 4:"TH", 5:"FR" };
    if (day === todayMap[new Date().getDay()]) tr.classList.add("today-row");

    const dayTd = document.createElement("td");
    dayTd.textContent = day;
    tr.appendChild(dayTd);

    TT_SLOTS.forEach((slot) => {
      const entry = timetable.find((e) => e.day === day && e.slot === slot);
      const td = document.createElement("td");
      td.textContent = entry ? entry.subject : "";
      if (entry && entry.room) td.title = entry.room;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}

function loadTimetableFromUser(user) {
  if (user && user.timetable && user.timetable.length > 0) {
    userTimetable = user.timetable;
    renderTimetableTable(userTimetable);
  } else {
    userTimetable = [];
    // keep default static table
  }
  // Refresh today cards on timetable page
  const today    = new Date().getDay();
  const dayMap   = { 1:"MO", 2:"TU", 3:"WE", 4:"TH", 5:"FR" };
  const todayCode = dayMap[today];
  if (todayCode) buildTodaySubjectCards(todayCode);
  // Refresh dashboard + attendance/analytics
  renderDashboardCards(todayCode);
  renderAttendanceSubcards();
  renderSubjectsSection();
  renderAnalyticsSubcards();
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD — DYNAMIC CARDS
// ─────────────────────────────────────────────────────────────────────────────
const DAY_NAMES = { MO:"Monday", TU:"Tuesday", WE:"Wednesday", TH:"Thursday", FR:"Friday", SA:"Saturday" };

// Default dataset when user has no custom timetable
const DEFAULT_SCHEDULE = [
  { day:"MO", subject:"Discrete"  },
  { day:"MO", subject:"Data Lab"  },
  { day:"MO", subject:"Physics"   },
  { day:"TU", subject:"EVS"       },
  { day:"TU", subject:"Discrete"  },
  { day:"TU", subject:"Physics Lab"},
  { day:"TU", subject:"Maths"     },
  { day:"WE", subject:"Maths"     },
  { day:"WE", subject:"Physics"   },
  { day:"WE", subject:"Data"      },
  { day:"TH", subject:"Data"      },
  { day:"TH", subject:"Maths"     },
  { day:"FR", subject:"Discrete"  },
  { day:"FR", subject:"Basic ML"  },
  { day:"FR", subject:"Basic ML Lab"},
];

function renderDashboardCards(todayCode) {
  const section  = document.getElementById("dashboard");
  const emptyMsg = document.getElementById("dashboardEmptyMsg");
  if (!section) return;

  // Remove previously generated dynamic cards
  section.querySelectorAll(".card.dynamic-card").forEach((c) => c.remove());

  const source   = userTimetable.length > 0 ? userTimetable : DEFAULT_SCHEDULE;
  const todayEntries = source.filter((e) => e.day === todayCode);

  if (todayEntries.length === 0) {
    if (emptyMsg) emptyMsg.style.display = "";
    return;
  }
  if (emptyMsg) emptyMsg.style.display = "none";

  // Deduplicate: show only ONE card per unique subject (even if subject has multiple time slots)
  const seen = new Set();
  const uniqueEntries = todayEntries.filter((e) => {
    if (seen.has(e.subject)) return false;
    seen.add(e.subject);
    return true;
  });

  uniqueEntries.forEach((entry) => {
    const card = document.createElement("div");
    card.className = "card dynamic-card active";
    card.dataset.day = entry.day;
    const subEscaped = entry.subject.replace(/'/g, "\\'");
    card.innerHTML = `
      <div class="day">${DAY_NAMES[entry.day] || entry.day}</div>
      <div class="sub">${entry.subject}</div>
      <div class="btn">
        <button class="present" onclick="markAttendance('${subEscaped}','Present')">Present</button>
        <button class="absent"  onclick="markAttendance('${subEscaped}','Absent')">Absent</button>
        <button class="miss"    onclick="markAttendance('${subEscaped}','Miss')">Miss</button>
        <button class="leave"   onclick="markAttendance('${subEscaped}','Leave')">Leave</button>
      </div>`;
    section.appendChild(card);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ATTENDANCE — DYNAMIC SUBCARDS
// ─────────────────────────────────────────────────────────────────────────────
function renderAttendanceSubcards() {
  const section  = document.getElementById("attendance");
  const emptyMsg = document.getElementById("attendanceEmptyMsg");
  if (!section) return;

  // Remove previously generated subcards
  section.querySelectorAll(".subcard.dynamic-subcard").forEach((c) => c.remove());

  const source = userTimetable.length > 0 ? userTimetable : DEFAULT_SCHEDULE;
  // Unique subjects preserving order
  const subjects = [...new Set(source.map((e) => e.subject))];

  if (subjects.length === 0) {
    if (emptyMsg) emptyMsg.style.display = "";
    return;
  }
  if (emptyMsg) emptyMsg.style.display = "none";

  subjects.forEach((sub) => {
    const subEscaped = sub.replace(/'/g, "\\'");
    const card = document.createElement("div");
    card.className  = "subcard dynamic-subcard";
    card.dataset.subject = sub;
    card.innerHTML = `
      <div class="sub2">${sub}</div>
      <div class="lists">
        <div class="p1">Present : <span class="count p">0</span></div>
        <div class="a1">Absent  : <span class="count a">0</span></div>
        <div class="m1">Miss    : <span class="count m">0</span></div>
        <div class="l1">Leave   : <span class="count l">0</span></div>
        <div class="att1">Attendance :<span class="att-per">0%</span></div>
        <div class="clear1-row" onclick="clearLastAttendance('${subEscaped}')" title="Remove last attendance entry">
          Clear 1 Attendance
          <span class="clear1-badge"><i class="fa-solid fa-trash-can"></i> Clear</span>
        </div>
        <div class="ho1">Can miss <span class="can-miss">0</span> lecture</div>
      </div>`;
    section.appendChild(card);
  });

  // Refresh counts immediately
  updateAllSubjectCards();
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBJECTS — DYNAMIC SECTION
// ─────────────────────────────────────────────────────────────────────────────
function renderSubjectsSection() {
  const section  = document.getElementById("subjects");
  const emptyMsg = document.getElementById("subjectsEmptyMsg");
  if (!section) return;

  // Remove previously generated subject cards
  section.querySelectorAll(".subcard.dynamic-sub-card").forEach((c) => c.remove());

  const source   = userTimetable.length > 0 ? userTimetable : DEFAULT_SCHEDULE;
  const subjects = [...new Set(source.map((e) => e.subject))];

  if (subjects.length === 0) {
    if (emptyMsg) emptyMsg.style.display = "";
    return;
  }
  if (emptyMsg) emptyMsg.style.display = "none";

  // Icons to cycle through for variety
  const icons = [
    "fa-file-lines", "fa-book-open", "fa-file-circle-check",
    "fa-clipboard-list", "fa-file-pen", "fa-chalkboard-user",
  ];
  const linkLabels = ["Syllabus", "Books", "Assignments", "PYQs"];

  subjects.forEach((sub) => {
    const card = document.createElement("div");
    card.className       = "subcard dynamic-sub-card";
    card.dataset.subject = sub;

    const linksHtml = linkLabels.map((label, i) => `
      <li>
        <a href="#" onclick="return false;">
          <i class="fa-solid ${icons[i % icons.length]}"></i>${label}
        </a>
      </li>`).join("");

    card.innerHTML = `
      <div class="sub2">${sub}</div>
      <div class="lists">
        <ul>${linksHtml}</ul>
      </div>`;
    section.appendChild(card);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ANALYTICS — DYNAMIC SUBJECT SUBCARDS (last-5 history)
// ─────────────────────────────────────────────────────────────────────────────
function renderAnalyticsSubcards() {
  const section  = document.getElementById("analytics");
  const emptyMsg = document.getElementById("analyticsEmptyMsg");
  if (!section) return;

  // Remove previously generated analytics cards (keep the overall summary card)
  section.querySelectorAll(".subcard.dynamic-ana-card").forEach((c) => c.remove());

  const source   = userTimetable.length > 0 ? userTimetable : DEFAULT_SCHEDULE;
  const subjects = [...new Set(source.map((e) => e.subject))];

  if (subjects.length === 0) {
    if (emptyMsg) emptyMsg.style.display = "";
    return;
  }
  if (emptyMsg) emptyMsg.style.display = "none";

  subjects.forEach((sub) => {
    const card = document.createElement("div");
    card.className       = "subcard dynamic-ana-card";
    card.dataset.subject = sub;
    card.innerHTML = `
      <div class="sub2">${sub}</div>
      <div class="last5"></div>`;
    section.appendChild(card);
  });

  // Immediately populate last-5 dots
  updateLast5Attendance();
}


// ─────────────────────────────────────────────────────────────────────────────
// TIMETABLE EDIT MODAL
// ─────────────────────────────────────────────────────────────────────────────
function openTimetableModal() {
  if (!getToken()) {
    showToast("Please login to edit your timetable.", "error");
    return;
  }
  const container = document.getElementById("ttRowsContainer");
  container.innerHTML = "";

  if (userTimetable.length === 0) {
    // Start with two blank rows as a helpful prompt
    addTimetableRow();
    addTimetableRow();
  } else {
    userTimetable.forEach((entry) => addTimetableRow(entry));
  }

  document.getElementById("timetableModal").classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeTimetableModal() {
  document.getElementById("timetableModal").classList.add("hidden");
  document.body.style.overflow = "";
}

function restoreDefaultTimetable() {
  const container = document.getElementById("ttRowsContainer");
  container.innerHTML = "";
  DEFAULT_TIMETABLE_ENTRIES.forEach((entry) => addTimetableRow(entry));
  showToast("Default timetable loaded — click Save to apply.", "success");
}

function restoreDefaultFacultyInfo() {
  const container = document.getElementById("facultyRowsContainer");
  container.innerHTML = "";
  DEFAULT_FACULTY_DATA.forEach((entry) => addFacultyRow(entry));
  showToast("Default faculty info loaded — click Save to apply.", "success");
}

function addTimetableRow(entry = {}) {
  const container = document.getElementById("ttRowsContainer");
  const row = document.createElement("div");
  row.className = "tt-row";

  const dayOptions = ["MO","TU","WE","TH","FR","SA"]
    .map((d) => `<option value="${d}" ${entry.day === d ? "selected" : ""}>${d}</option>`)
    .join("");

  const slotOptions = TT_SLOTS
    .map((s) => `<option value="${s}" ${entry.slot === s ? "selected" : ""}>${s}</option>`)
    .join("");

  row.innerHTML = `
    <select class="tt-select tt-day">${dayOptions}</select>
    <select class="tt-select tt-slot">${slotOptions}</select>
    <input class="tt-input tt-subject" type="text" placeholder="Subject" value="${entry.subject || ""}" />
    <input class="tt-input tt-room"    type="text" placeholder="Room (opt)" value="${entry.room || ""}" />
    <button class="tt-remove-btn" onclick="this.parentElement.remove()" title="Remove"><i class="fa-solid fa-xmark"></i></button>
  `;
  container.appendChild(row);
}

async function saveTimetable() {
  const rows = document.querySelectorAll(".tt-row");
  const timetable = [];
  let valid = true;

  rows.forEach((row) => {
    const day     = row.querySelector(".tt-day").value;
    const slot    = row.querySelector(".tt-slot").value;
    const subject = row.querySelector(".tt-subject").value.trim();
    const room    = row.querySelector(".tt-room").value.trim();
    if (!subject) { valid = false; return; }
    timetable.push({ day, slot, subject, room });
  });

  if (!valid) {
    showToast("Please fill in the Subject for every row (or remove empty rows).", "error");
    return;
  }

  try {
    const res = await apiFetch("/auth/timetable", {
      method: "PUT",
      body: JSON.stringify({ timetable }),
    });
    saveCurrentUser(res.user);
    userTimetable = res.user.timetable || [];
    renderTimetableTable(userTimetable);
    // rebuild all sections from new timetable
    const today = new Date().getDay();
    const dm = { 1:"MO", 2:"TU", 3:"WE", 4:"TH", 5:"FR" };
    if (dm[today]) buildTodaySubjectCards(dm[today]);
    renderDashboardCards(dm[today]);
    renderAttendanceSubcards();
    renderSubjectsSection();
    renderAnalyticsSubcards();
    closeTimetableModal();
    showToast("Timetable saved! 🎉");
  } catch (err) {
    showToast(err.message || "Failed to save timetable.", "error");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FACULTY INFO — EDIT MODAL
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_FACULTY_DATA = [
  { code: "AM102",        name: "Maths",    lec: "3", tut: "1", prac: "0", faculty: "Nitika" },
  { code: "AP102",        name: "Physics",  lec: "3", tut: "0", prac: "2", faculty: "Yogendra K Meena" },
  { code: "CS102",        name: "Discrete", lec: "3", tut: "1", prac: "0", faculty: "Col R Sreejeth" },
  { code: "CS104/DA104",  name: "Data",     lec: "3", tut: "0", prac: "2", faculty: "Kavinder , Aanchal (lab)" },
  { code: "SEC-1(CS106)", name: "Basic ML", lec: "1", tut: "0", prac: "2", faculty: "Anshika , Col R Sreejeth (lab)" },
  { code: "AEC/VAC",      name: "EVS",      lec: "1", tut: "0", prac: "0", faculty: "Ravi" },
];

let userFacultyData = [];

function loadFacultyData() {
  try {
    const saved = localStorage.getItem("faculty_info");
    userFacultyData = saved ? JSON.parse(saved) : DEFAULT_FACULTY_DATA;
  } catch {
    userFacultyData = DEFAULT_FACULTY_DATA;
  }
  renderFacultyTable();
}

function renderFacultyTable() {
  const tbody = document.getElementById("facultyTableBody");
  if (!tbody) return;
  const data = userFacultyData.length > 0 ? userFacultyData : DEFAULT_FACULTY_DATA;
  tbody.innerHTML = data.map((row) => `
    <tr>
      <td>${row.code}</td>
      <td>${row.name}</td>
      <td>${row.lec}</td>
      <td>${row.tut}</td>
      <td>${row.prac}</td>
      <td>${row.faculty}</td>
    </tr>`).join("");
}

function openFacultyModal() {
  const container = document.getElementById("facultyRowsContainer");
  container.innerHTML = "";
  const data = userFacultyData.length > 0 ? userFacultyData : DEFAULT_FACULTY_DATA;
  if (data.length === 0) {
    addFacultyRow();
  } else {
    data.forEach((entry) => addFacultyRow(entry));
  }
  document.getElementById("facultyModal").classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeFacultyModal() {
  document.getElementById("facultyModal").classList.add("hidden");
  document.body.style.overflow = "";
}

function addFacultyRow(entry = {}) {
  const container = document.getElementById("facultyRowsContainer");
  const row = document.createElement("div");
  row.className = "tt-row faculty-row";
  row.innerHTML = `
    <input class="tt-input fi-code"    type="text" placeholder="Code"         value="${entry.code    || ""}" />
    <input class="tt-input fi-name"    type="text" placeholder="Subject Name" value="${entry.name    || ""}" />
    <input class="tt-input fi-lec"     type="text" placeholder="Lec"          value="${entry.lec     || ""}" style="width:60px;" />
    <input class="tt-input fi-tut"     type="text" placeholder="Tut"          value="${entry.tut     || ""}" style="width:60px;" />
    <input class="tt-input fi-prac"    type="text" placeholder="Prac"         value="${entry.prac    || ""}" style="width:60px;" />
    <input class="tt-input fi-faculty" type="text" placeholder="Faculty Name" value="${entry.faculty || ""}" />
    <button class="tt-remove-btn" onclick="this.parentElement.remove()" title="Remove"><i class="fa-solid fa-xmark"></i></button>
  `;
  container.appendChild(row);
}

function saveFacultyInfo() {
  const rows = document.querySelectorAll(".faculty-row");
  const data = [];
  let valid = true;

  rows.forEach((row) => {
    const code    = row.querySelector(".fi-code").value.trim();
    const name    = row.querySelector(".fi-name").value.trim();
    const lec     = row.querySelector(".fi-lec").value.trim();
    const tut     = row.querySelector(".fi-tut").value.trim();
    const prac    = row.querySelector(".fi-prac").value.trim();
    const faculty = row.querySelector(".fi-faculty").value.trim();
    if (!name && !faculty) { valid = false; return; }
    data.push({ code, name, lec, tut, prac, faculty });
  });

  if (!valid) {
    showToast("Please fill in Subject Name and Faculty for every row (or remove empty rows).", "error");
    return;
  }

  userFacultyData = data;
  localStorage.setItem("faculty_info", JSON.stringify(data));
  renderFacultyTable();
  closeFacultyModal();
  showToast("Faculty info saved! 🎉");
}

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE — BACKEND AUTH (Signup / Login / Logout)
// ─────────────────────────────────────────────────────────────────────────────
function showAuthForm(formType) {
  const loginForm  = document.getElementById("profileLoginForm");
  const signupForm = document.getElementById("profileSignupForm");
  const tabLogin   = document.getElementById("tabLogin");
  const tabSignup  = document.getElementById("tabSignup");
  if (formType === "signup") {
    if (loginForm)  loginForm.style.display  = "none";
    if (signupForm) signupForm.style.display = "";
    if (tabLogin)  tabLogin.classList.remove("active");
    if (tabSignup) tabSignup.classList.add("active");
  } else {
    if (loginForm)  loginForm.style.display  = "";
    if (signupForm) signupForm.style.display = "none";
    if (tabLogin)  tabLogin.classList.add("active");
    if (tabSignup) tabSignup.classList.remove("active");
  }
}

async function doProfileLogin() {
  const username = document.getElementById("loginUser")?.value.trim();
  const password = document.getElementById("loginPass")?.value.trim();
  const errEl    = document.getElementById("loginErr");
  if (errEl) errEl.textContent = "";

  if (!username || !password) {
    if (errEl) errEl.textContent = "Please enter username and password.";
    return;
  }

  try {
    const res = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    saveToken(res.token);
    saveCurrentUser(res.user);
    showProfileFor(res.user);
    await loadAttendance();
  } catch (err) {
    if (errEl) errEl.textContent = err.message || "Login failed.";
  }
}

async function doProfileSignup() {
  const name     = document.getElementById("signupName")?.value.trim();
  const username = document.getElementById("signupUser")?.value.trim();
  const password = document.getElementById("signupPass")?.value.trim();
  const rollNo   = document.getElementById("signupRoll")?.value.trim();
  const email    = document.getElementById("signupEmail")?.value.trim();
  const errEl    = document.getElementById("signupErr");
  if (errEl) errEl.textContent = "";

  if (!name || !username || !password) {
    if (errEl) errEl.textContent = "Name, username, and password are required.";
    return;
  }
  if (password.length < 6) {
    if (errEl) errEl.textContent = "Password must be at least 6 characters.";
    return;
  }

  try {
    const res = await apiFetch("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ name, username, password, rollNo, email }),
    });
    saveToken(res.token);
    saveCurrentUser(res.user);
    showProfileFor(res.user);
    await loadAttendance();
  } catch (err) {
    if (errEl) errEl.textContent = err.message || "Signup failed.";
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function updateHeaderAvatar(user) {
  const img      = document.getElementById("headerAvatarImg");
  const initials = document.getElementById("headerAvatarInitials");
  if (!img || !initials) return;
  if (user && user.photo) {
    img.src = user.photo;
    img.style.display = "";
    initials.style.display = "none";
  } else {
    img.style.display = "none";
    initials.textContent = user ? getInitials(user.name) : "?";
    initials.style.display = "";
  }
}

function showProfileFor(user) {
  const wall = document.getElementById("profileLoginWall");
  const info = document.getElementById("profileInfo");
  if (wall) wall.style.display = "none";
  if (info) info.style.display = "";

  // Text fields
  const nameEl  = document.getElementById("profileName");
  const userEl  = document.getElementById("profileUsername");
  const rollEl  = document.getElementById("profileRoll");
  const emailEl = document.getElementById("profileEmail");
  const bioEl   = document.getElementById("profileBio");
  if (nameEl)  nameEl.textContent  = user.name     || "Student";
  if (userEl)  userEl.textContent  = "@" + (user.username || "");
  if (rollEl)  rollEl.textContent  = user.rollNo   || "N/A";
  if (emailEl) emailEl.textContent = user.email    || "N/A";
  if (bioEl)   bioEl.textContent   = user.bio      || "No bio yet.";

  // Social links
  const socialEl    = document.getElementById("profileSocial");
  const socialLabel = document.getElementById("profileSocialLabel");
  if (socialEl) {
    socialEl.innerHTML = "";
    if (user.linkedin) socialEl.innerHTML += `<a href="${user.linkedin}" target="_blank" rel="noopener" style="font-size:28px;margin-right:10px;"><i class="fa-brands fa-linkedin"></i></a>`;
    if (user.github)   socialEl.innerHTML += `<a href="${user.github}"   target="_blank" rel="noopener" style="font-size:28px;"><i class="fa-brands fa-github"></i></a>`;
    if (socialLabel) socialLabel.style.display = (user.linkedin || user.github) ? "" : "none";
  }

  // Photo / initials
  const photoEl    = document.getElementById("profilePhoto");
  const initialsEl = document.getElementById("profileInitialsBig");
  if (user.photo) {
    if (photoEl)    { photoEl.src = user.photo; photoEl.style.display = ""; }
    if (initialsEl) initialsEl.style.display = "none";
  } else {
    if (photoEl)    photoEl.style.display = "none";
    if (initialsEl) { initialsEl.textContent = getInitials(user.name); initialsEl.style.display = ""; }
  }

  // Sync header
  updateHeaderAvatar(user);

  // Load timetable from user data
  loadTimetableFromUser(user);
}

// ─── Profile Edit ─────────────────────────────────────────────────────────────
let pendingPhoto = null;

function toggleProfileEdit(editing) {
  const viewMode = document.getElementById("profileViewMode");
  const editMode = document.getElementById("profileEditMode");
  if (!viewMode || !editMode) return;

  if (editing) {
    const user = getCurrentUser();
    if (user) {
      document.getElementById("editName").value     = user.name     || "";
      document.getElementById("editRoll").value     = user.rollNo   || "";
      document.getElementById("editEmail").value    = user.email    || "";
      document.getElementById("editBio").value      = user.bio      || "";
      document.getElementById("editLinkedin").value = user.linkedin || "";
      document.getElementById("editGithub").value   = user.github   || "";
      // Avatar preview
      const prev = document.getElementById("editAvatarPreview");
      const init = document.getElementById("editAvatarInitials");
      if (user.photo) {
        if (prev) { prev.src = user.photo; prev.style.display = ""; }
        if (init) init.style.display = "none";
      } else {
        if (prev) prev.style.display = "none";
        if (init) { init.textContent = getInitials(user.name); init.style.display = ""; }
      }
    }
    pendingPhoto = null;
    document.getElementById("editProfileErr").textContent = "";
    viewMode.style.display = "none";
    editMode.style.display = "";
  } else {
    viewMode.style.display = "";
    editMode.style.display = "none";
    document.getElementById("editProfileErr").textContent = "";
    // reset file input
    const fi = document.getElementById("photoFileInput");
    if (fi) fi.value = "";
    pendingPhoto = null;
  }
}

function handlePhotoSelect(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    openPopOk("Invalid File", "Please select an image file.");
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    pendingPhoto = e.target.result;
    const prev = document.getElementById("editAvatarPreview");
    const init = document.getElementById("editAvatarInitials");
    if (prev) { prev.src = pendingPhoto; prev.style.display = ""; }
    if (init) init.style.display = "none";
  };
  reader.readAsDataURL(file);
}

async function saveProfileChanges() {
  const errEl = document.getElementById("editProfileErr");
  if (errEl) errEl.textContent = "";

  const name     = document.getElementById("editName")?.value.trim();
  const rollNo   = document.getElementById("editRoll")?.value.trim();
  const email    = document.getElementById("editEmail")?.value.trim();
  const bio      = document.getElementById("editBio")?.value.trim();
  const linkedin = document.getElementById("editLinkedin")?.value.trim();
  const github   = document.getElementById("editGithub")?.value.trim();

  if (!name) { if (errEl) errEl.textContent = "Name cannot be empty."; return; }

  const payload = { name, rollNo, email, bio, linkedin, github };
  if (pendingPhoto !== null) payload.photo = pendingPhoto;

  try {
    const res = await apiFetch("/auth/profile", { method: "PUT", body: JSON.stringify(payload) });
    saveCurrentUser(res.user);
    pendingPhoto = null;
    // Reset file input
    const fi = document.getElementById("photoFileInput");
    if (fi) fi.value = "";
    showProfileFor(res.user);
    toggleProfileEdit(false);
    openPopOk("Saved! 🎉", "Your profile has been updated successfully.");
  } catch (err) {
    if (errEl) errEl.textContent = err.message || "Failed to save.";
  }
}


function doProfileLogout() {
  clearToken();
  clearCurrentUser();
  attendanceData = [];
  const wall = document.getElementById("profileLoginWall");
  const info = document.getElementById("profileInfo");
  if (wall) { wall.style.display = ""; }
  if (info) { info.style.display = "none"; }
  updateHeaderAvatar(null);
  // reset forms
  ["loginUser","loginPass","signupName","signupUser","signupPass","signupRoll","signupEmail"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  ["loginErr","signupErr"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.textContent = "";
  });
  showAuthForm("login");
  updateAllSubjectCards();
  updateOverallAttendance();
  updateLast5Attendance();
}

// ─────────────────────────────────────────────────────────────────────────────
// TOAST NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────
function showToast(msg, type = "success") {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<i class="fa-solid fa-${type === "success" ? "circle-check" : "circle-xmark"}"></i> ${msg}`;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("toast-show"));
  setTimeout(() => {
    toast.classList.remove("toast-show");
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

// ─────────────────────────────────────────────────────────────────────────────
// MOBILE NAV — HAMBURGER
// ─────────────────────────────────────────────────────────────────────────────
function toggleMobileNav() {
  const navEl   = document.querySelector(".nav");
  const overlay = document.getElementById("navOverlay");
  if (!navEl) return;
  const isOpen = navEl.classList.toggle("open");
  if (overlay) overlay.classList.toggle("show", isOpen);
}

function closeMobileNav() {
  const navEl   = document.querySelector(".nav");
  const overlay = document.getElementById("navOverlay");
  if (navEl)   navEl.classList.remove("open");
  if (overlay) overlay.classList.remove("show");
}

document.addEventListener("DOMContentLoaded", () => {
  const overlay = document.getElementById("navOverlay");
  if (overlay) overlay.addEventListener("click", closeMobileNav);
});
