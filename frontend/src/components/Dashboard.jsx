import { useEffect, useState } from "react";
import { fetchTodayTimetable } from "../api/api";

// Today's day name for card highlighting (mirrors jss.js DOMContentLoaded logic)
const TODAY_NUM = new Date().getDay();
const DAY_MAP = { 1: "MO", 2: "TU", 3: "WE", 4: "TH", 5: "FR" };
const TODAY_KEY = DAY_MAP[TODAY_NUM] || null;

// All weekly cards exactly as defined in index.html
const WEEKLY_CARDS = [
  { day: "MO", label: "Monday",    subject: "Discrete"     },
  { day: "MO", label: "Monday",    subject: "Data Lab"     },
  { day: "MO", label: "Monday",    subject: "Physics"      },
  { day: "TU", label: "Tuesday",   subject: "EVS"          },
  { day: "TU", label: "Tuesday",   subject: "Discrete"     },
  { day: "TU", label: "Tuesday",   subject: "Physics Lab"  },
  { day: "TU", label: "Tuesday",   subject: "Maths"        },
  { day: "WE", label: "Wednesday", subject: "Maths"        },
  { day: "WE", label: "Wednesday", subject: "Physics"      },
  { day: "WE", label: "Wednesday", subject: "Data"         },
  { day: "TH", label: "Thursday",  subject: "Data"         },
  { day: "TH", label: "Thursday",  subject: "Maths"        },
  { day: "FR", label: "Friday",    subject: "Discrete"     },
  { day: "FR", label: "Friday",    subject: "Basic ML"     },
  { day: "FR", label: "Friday",    subject: "Basic ML Lab" },
];

const STATUSES = [
  { key: "Present", cls: "btn-present" },
  { key: "Absent",  cls: "btn-absent"  },
  { key: "Miss",    cls: "btn-miss"    },
  { key: "Leave",   cls: "btn-leave"   },
];

export default function Dashboard({ onMark }) {
  const [todaySubjects, setTodaySubjects] = useState([]);

  useEffect(() => {
    fetchTodayTimetable()
      .then((d) => setTodaySubjects(d.data?.map((s) => s.subject).filter(Boolean) || []))
      .catch(() => {});
  }, []);

  return (
    <div>
      {TODAY_KEY ? (
        <div style={{ marginBottom: 18, padding: "10px 16px", background: "rgba(108,99,255,0.1)", borderRadius: 10, border: "1px solid var(--border)", fontSize: "0.85rem", color: "var(--accent2)" }}>
          <i className="fa-solid fa-sun" style={{ marginRight: 8 }} />
          Today's classes:{" "}
          <strong>{todaySubjects.length > 0 ? todaySubjects.join(" · ") : "No classes today 🎉"}</strong>
        </div>
      ) : (
        <div style={{ marginBottom: 18, padding: "10px 16px", background: "rgba(34,197,94,0.08)", borderRadius: 10, border: "1px solid var(--border)", fontSize: "0.85rem", color: "var(--green)" }}>
          <i className="fa-solid fa-couch" style={{ marginRight: 8 }} />
          It's a weekend — enjoy your break! 🏖️
        </div>
      )}

      <div className="section-title">
        <i className="fa-solid fa-table-columns" />
        Mark Attendance
        <span className="section-subtitle">Click a status to record</span>
      </div>

      {/* Filter to today's subjects only — mirrors jss.js DOMContentLoaded day-card logic */}
      {!TODAY_KEY ? (
        <div style={{ textAlign: "center", padding: "48px", color: "var(--muted)", fontSize: "0.9rem" }}>
          <i className="fa-solid fa-couch" style={{ fontSize: "2rem", marginBottom: 12, display: "block", color: "var(--accent)" }} />
          It's a weekend! No attendance to mark.
        </div>
      ) : (
        <div className="cards-grid">
          {WEEKLY_CARDS
            .filter((card) => card.day === TODAY_KEY)
            .map((card, i) => (
              <div key={i} className="card active-day">
                <div className="card-day">{card.label}</div>
                <div className="card-subject">{card.subject}</div>
                <div className="card-actions">
                  {STATUSES.map((s) => (
                    <button
                      key={s.key}
                      className={`btn ${s.cls}`}
                      onClick={() => onMark(card.subject, s.key)}
                    >
                      {s.key}
                    </button>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
