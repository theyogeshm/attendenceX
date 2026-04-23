// attendanceLogic.js — Pure business logic (no DOM), used by the backend controllers.
const REQUIRED_PERCENT = 75;

function calculateCanMiss(present, total) {
  if (total === 0) return 0;
  const maxTotalAllowed = Math.floor((present * 100) / REQUIRED_PERCENT);
  const canMiss = maxTotalAllowed - total;
  return canMiss > 0 ? canMiss : 0;
}

function getTodayInfo() {
  const today = new Date();
  return {
    date: today.toLocaleDateString("en-GB"),
    day:  today.toLocaleDateString("en-US", { weekday: "long" }),
  };
}

// Fields use capital Subject/Status to match the Google Sheets format in jss.js
function computeSubjectStats(records, subject) {
  let p = 0, a = 0, m = 0, l = 0;

  records.forEach((row) => {
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

  const last5 = records
    .filter((r) => r.Subject === subject)
    .slice(-5)
    .map((r) => {
      if (r.Status === "Present") return "P";
      if (r.Status === "Absent")  return "A";
      if (r.Status === "Miss")    return "M";
      if (r.Status === "Leave")   return "L";
      return "";
    });

  return { present: p, absent: a, miss: m, leave: l, total, percentage, canMiss, last5 };
}

function computeOverallAnalytics(records) {
  let totalPresent = 0;
  let totalAbsent  = 0;
  const subjectMap = {};

  records.forEach((row) => {
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

  return {
    totalClasses, totalPresent, totalAbsent, percent, canMiss,
    bestSubject: bestSub, worstSubject: worstSub,
    safeStatus: percent >= 75 ? "SAFE ✅" : "DANGER ❌",
    perSubject: subjectMap,
  };
}

module.exports = { calculateCanMiss, getTodayInfo, computeSubjectStats, computeOverallAnalytics };
