export default function Sidebar({ activePage, onNavigate, isOpen }) {
  const links = [
    { id: "dashboard",   icon: "fa-table-columns",    label: "Dashboard"  },
    { id: "attendance",  icon: "fa-clipboard-check",  label: "Attendance" },
    { id: "analytics",  icon: "fa-chart-line",        label: "Analytics"  },
    { id: "timetable",  icon: "fa-calendar-days",     label: "Timetable"  },
  ];

  return (
    <div className={`sidebar${isOpen ? " open" : ""}`}>
      <div className="sidebar-brand">
        <i className="fa-solid fa-graduation-cap" />
        AttendanceX
      </div>

      <nav>
        {links.map((l) => (
          <a
            key={l.id}
            href="#"
            className={activePage === l.id ? "active" : ""}
            onClick={(e) => { e.preventDefault(); onNavigate(l.id); }}
          >
            <i className={`fa-solid ${l.icon}`} />
            {l.label}
          </a>
        ))}
      </nav>

      <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)" }}>
        <a
          href="#"
          style={{ color: "var(--muted)", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "10px" }}
          onClick={(e) => { e.preventDefault(); }}
        >
          <i className="fa-solid fa-right-from-bracket" />
          Yogesh Kumar
        </a>
      </div>
    </div>
  );
}
