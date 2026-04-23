import { useEffect, useState } from "react";
import { fetchAnalytics, fetchSubjectAnalytics } from "../api/api";

const SUBJECTS = [
  "Maths", "EVS", "Discrete", "Data", "Physics",
  "Basic ML", "Data Lab", "Physics Lab", "Basic ML Lab",
];

function StatBox({ label, value, color }) {
  return (
    <div className="stat-box">
      <div className="stat-box-label">{label}</div>
      <div className="stat-box-value" style={color ? { color } : {}}>{value}</div>
    </div>
  );
}

export default function Analytics({ refreshKey }) {
  const [overall, setOverall] = useState(null);
  const [subjectStats, setSubjectStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [ovRes, ...subRes] = await Promise.all([
          fetchAnalytics(),
          ...SUBJECTS.map((s) => fetchSubjectAnalytics(s)),
        ]);
        setOverall(ovRes.data);
        const map = {};
        SUBJECTS.forEach((s, i) => { map[s] = subRes[i].data; });
        setSubjectStats(map);
      } catch {
        // silently fail — no network
      }
      setLoading(false);
    }
    load();
  }, [refreshKey]);

  if (loading) return <div className="loader-wrap"><div className="loader" /></div>;

  const isGreen = overall?.percent >= 75;

  return (
    <div>
      {/* Overall summary */}
      <div className="section-title">
        <i className="fa-solid fa-chart-line" />
        Overall Attendance Summary
      </div>
      {overall && (
        <div className="analytics-overview">
          <StatBox label="Total Classes"   value={overall.totalClasses} />
          <StatBox label="Present"         value={overall.totalPresent}  color="var(--green)" />
          <StatBox label="Absent"          value={overall.totalAbsent}   color="var(--red)"   />
          <StatBox label="Overall %"       value={`${overall.percent}%`} color={isGreen ? "var(--green)" : "var(--red)"} />
          <StatBox label="Can Miss"        value={overall.canMiss}       color="var(--yellow)"/>
          <StatBox label="Status"         value={overall.safeStatus}    />
          <StatBox label="Best Subject"    value={overall.bestSubject}   color="var(--green)" />
          <StatBox label="Worst Subject"   value={overall.worstSubject}  color="var(--red)"   />
        </div>
      )}

      {/* Per-subject last 5 */}
      <div className="section-title" style={{ marginTop: 28 }}>
        <i className="fa-solid fa-clock-rotate-left" />
        Recent History (Last 5 per subject)
      </div>
      <div className="cards-grid">
        {SUBJECTS.map((s) => {
          const st = subjectStats[s];
          if (!st) return null;
          const pct = st.percentage;
          return (
            <div key={s} className="subcard">
              <div className="subcard-title">{s}</div>
              <div className={`subcard-percent ${pct >= 75 ? "safe" : "danger"}`}>{pct}%</div>
              <div className="subcard-row">
                <span className="subcard-label">Classes attended</span>
                <span className="subcard-value">{st.present}/{st.total}</span>
              </div>
              <div className="subcard-row">
                <span className="subcard-label">Can miss</span>
                <span className={`subcard-value ${pct >= 75 ? "safe" : "danger"}`}>{st.canMiss}</span>
              </div>
              {st.last5.length > 0 && (
                <div className="last5">
                  {st.last5.map((code, i) => (
                    <span key={i} className={code}>{code}</span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
