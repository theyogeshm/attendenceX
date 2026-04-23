import { useEffect, useState } from "react";
import { fetchTimetable } from "../api/api";

const DAY_LABELS = { MO: "Monday", TU: "Tuesday", WE: "Wednesday", TH: "Thursday", FR: "Friday" };
const TODAY_MAP  = { 1: "MO", 2: "TU", 3: "WE", 4: "TH", 5: "FR" };
const TODAY_KEY  = TODAY_MAP[new Date().getDay()] || null;

const SLOTS = ["8-9", "9-10", "10-11", "11-12", "12-1", "1-2", "2-3", "3-4"];

// Hard timetable data (same as in HTML + backend)
const TT_ROWS = [
  { day: "MO", cells: ["Discrete","Discrete","","","Data Lab","Data Lab","Physics","Physics"] },
  { day: "TU", cells: ["EVS","EVS","Discrete","","Physics Lab","Physics Lab","Maths",""] },
  { day: "WE", cells: ["","","Maths","","Physics","Data","Data",""] },
  { day: "TH", cells: ["","","Data","","","Maths","Maths",""] },
  { day: "FR", cells: ["","","Discrete","","Basic ML","","Basic ML Lab","Basic ML Lab"] },
];

const FACULTY = [
  { code: "AM102",        name: "Maths",     L: 3, T: 1, P: 0, faculty: "Nitika" },
  { code: "AP102",        name: "Physics",   L: 3, T: 0, P: 2, faculty: "Yogendra K Meena" },
  { code: "CS102",        name: "Discrete",  L: 3, T: 1, P: 0, faculty: "Col R Sreejeth" },
  { code: "CS104/DA104",  name: "Data",      L: 3, T: 0, P: 2, faculty: "Kavinder, Aanchal (lab)" },
  { code: "SEC-1(CS106)", name: "Basic ML",  L: 1, T: 0, P: 2, faculty: "Anshika, Col R Sreejeth (lab)" },
  { code: "AEC/VAC",      name: "EVS",       L: 1, T: 0, P: 0, faculty: "Ravi" },
];

export default function Timetable() {
  return (
    <div>
      {/* Weekly timetable */}
      <div className="section-title">
        <i className="fa-solid fa-calendar-days" />
        Weekly Timetable
      </div>
      <div className="table-wrap" style={{ marginBottom: 28 }}>
        <table>
          <thead>
            <tr>
              <th></th>
              {SLOTS.map((s) => <th key={s}>{s}</th>)}
            </tr>
          </thead>
          <tbody>
            {TT_ROWS.map(({ day, cells }) => (
              <tr key={day} className={day === TODAY_KEY ? "today-row" : ""}>
                <td>{day}</td>
                {cells.map((c, i) => <td key={i}>{c}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Faculty info */}
      <div className="section-title">
        <i className="fa-solid fa-chalkboard-user" />
        Faculty Info
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Subject</th>
              <th>L</th>
              <th>T</th>
              <th>P</th>
              <th>Faculty</th>
            </tr>
          </thead>
          <tbody>
            {FACULTY.map((f) => (
              <tr key={f.code}>
                <td>{f.code}</td>
                <td>{f.name}</td>
                <td>{f.L}</td>
                <td>{f.T}</td>
                <td>{f.P}</td>
                <td>{f.faculty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
