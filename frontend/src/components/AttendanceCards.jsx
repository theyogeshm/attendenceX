import { useEffect, useState } from "react";
import { fetchSubjectAnalytics } from "../api/api";

const SUBJECTS = [
  "Maths", "EVS", "Discrete", "Data", "Physics",
  "Basic ML", "Data Lab", "Physics Lab", "Basic ML Lab",
];

function SubjectCard({ subject, onClear }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubjectAnalytics(subject)
      .then((d) => setStats(d.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, [subject]);

  if (loading) return (
    <div className="subcard" style={{ minHeight: 160 }}>
      <div className="subcard-title">{subject}</div>
      <div className="loader-wrap" style={{ padding: 24 }}><div className="loader" /></div>
    </div>
  );

  if (!stats) return null;

  const pct = stats.percentage;
  const pctClass = pct >= 75 ? "safe" : "danger";

  return (
    <div className="subcard">
      <div className="subcard-title">{subject}</div>
      <div className={`subcard-percent ${pctClass}`}>{pct}%</div>

      <div className="subcard-row">
        <span className="subcard-label">Present</span>
        <span className="subcard-value" style={{ color: "var(--green)" }}>{stats.present}</span>
      </div>
      <div className="subcard-row">
        <span className="subcard-label">Absent</span>
        <span className="subcard-value" style={{ color: "var(--red)" }}>{stats.absent}</span>
      </div>
      <div className="subcard-row">
        <span className="subcard-label">Miss</span>
        <span className="subcard-value" style={{ color: "var(--yellow)" }}>{stats.miss}</span>
      </div>
      <div className="subcard-row">
        <span className="subcard-label">Leave</span>
        <span className="subcard-value" style={{ color: "var(--blue)" }}>{stats.leave}</span>
      </div>
      <div className="subcard-row">
        <span className="subcard-label">Can miss</span>
        <span className={`subcard-value ${pctClass}`}>{stats.canMiss} more</span>
      </div>

      {/* ── Clear 1 Attendance ─────────────────────────────────────── */}
      <div
        className="subcard-row"
        style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)" }}
      >
        <span className="subcard-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <i className="fa-solid fa-rotate-left" style={{ color: "var(--red)", fontSize: "0.75rem" }} />
          Clear 1 attendance
        </span>
        <button
          className="btn-clear-one"
          onClick={() => onClear && onClear(subject)}
          title={`Remove last attendance entry for ${subject}`}
        >
          <i className="fa-solid fa-trash-can" />
          {" "}Clear
        </button>
      </div>

      {stats.last5.length > 0 && (
        <div className="last5" style={{ marginTop: 12 }}>
          {stats.last5.map((code, i) => (
            <span key={i} className={code}>{code}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AttendanceCards({ refreshKey, onClear }) {
  return (
    <div>
      <div className="section-title">
        <i className="fa-solid fa-clipboard-check" />
        Subject-wise Attendance
        <span className="section-subtitle">Live from backend</span>
      </div>
      <div className="cards-grid">
        {SUBJECTS.map((s) => (
          <SubjectCard key={`${s}-${refreshKey}`} subject={s} onClear={onClear} />
        ))}
      </div>
    </div>
  );
}
