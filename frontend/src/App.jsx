import { useState } from "react";
import "./index.css";
import { ToastProvider, useToast } from "./context/ToastContext";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import AttendanceCards from "./components/AttendanceCards";
import Analytics from "./components/Analytics";
import Timetable from "./components/Timetable";
import Popup from "./components/Popup";
import { markAttendance, clearLastAttendance } from "./api/api";

function AppInner() {
  const toast = useToast();
  const [page, setPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Popup state
  const [popup, setPopup] = useState(null);

  const closeSidebar = () => setSidebarOpen(false);

  // Called when user clicks attendance button on Dashboard
  const handleMark = (subject, status) => {
    setPopup({
      title: "Mark Attendance",
      message: `Mark "${subject}" as ${status} for today?`,
      okOnly: false,
      onYes: async () => {
        try {
          await markAttendance(subject, status);
          toast(`${subject} marked as ${status} ✅`, "success");
          setRefreshKey((k) => k + 1);
        } catch {
          toast("Failed to mark attendance ❌", "error");
        }
      },
    });
  };

  // Called when user clicks "Clear 1 Attendance" on a subject card
  const handleClear = (subject) => {
    setPopup({
      title: "Clear 1 Attendance",
      message: `Remove the most recent attendance entry for "${subject}"?`,
      okOnly: false,
      onYes: async () => {
        try {
          await clearLastAttendance(subject);
          toast(`Last entry for ${subject} removed 🗑️`, "success");
          setRefreshKey((k) => k + 1);
        } catch {
          toast("No records to clear or failed ❌", "error");
        }
      },
    });
  };

  const navigate = (p) => {
    setPage(p);
    setSidebarOpen(false);
  };

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <Sidebar activePage={page} onNavigate={navigate} isOpen={sidebarOpen} />

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          onClick={closeSidebar}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 99,
          }}
        />
      )}

      <div className="main-content">
        <Header page={page} onMenuToggle={() => setSidebarOpen((o) => !o)} />

        <div className="page-body">
          {page === "dashboard"  && <Dashboard onMark={handleMark} />}
          {page === "attendance" && <AttendanceCards refreshKey={refreshKey} onClear={handleClear} />}
          {page === "analytics"  && <Analytics refreshKey={refreshKey} />}
          {page === "timetable"  && <Timetable />}
        </div>
      </div>

      {/* Confirmation popup */}
      {popup && (
        <Popup
          title={popup.title}
          message={popup.message}
          okOnly={popup.okOnly}
          onYes={popup.onYes}
          onClose={() => setPopup(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}
