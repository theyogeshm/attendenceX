const PAGE_TITLES = {
  dashboard:  "Dashboard",
  attendance: "Attendance",
  analytics:  "Analytics",
  timetable:  "Timetable",
};

export default function Header({ page, onMenuToggle }) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="topbar">
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <button className="mobile-menu-btn" onClick={onMenuToggle}>
          <i className="fa-solid fa-bars" />
        </button>
        <h1>{PAGE_TITLES[page] || page}</h1>
      </div>
      <div className="topbar-right">
        <span style={{ color: "var(--muted)", fontSize: "0.8rem", display: "none" }} className="desktop-date">
          {today}
        </span>
        <a href="https://chatgpt.com" target="_blank" rel="noreferrer" title="ChatGPT">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg"
            alt="ChatGPT"
            style={{ width: 24, height: 24, opacity: 0.7, transition: "opacity 0.2s" }}
            onMouseEnter={(e) => (e.target.style.opacity = 1)}
            onMouseLeave={(e) => (e.target.style.opacity = 0.7)}
          />
        </a>
        <div className="topbar-avatar" title="Yogesh Kumar">YK</div>
      </div>
    </div>
  );
}
