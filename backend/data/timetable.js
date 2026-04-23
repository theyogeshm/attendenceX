// Timetable data extracted from index.html
// This was hard-coded in the HTML — now served via API

const TIMETABLE = {
  MO: [
    { slot: "8-10",  subject: "Discrete"  },
    { slot: "10-12", subject: ""           },
    { slot: "12-2",  subject: "Data Lab"  },
    { slot: "2-4",   subject: "Physics"   },
  ],
  TU: [
    { slot: "8-10",  subject: "EVS"        },
    { slot: "10-11", subject: "Discrete"   },
    { slot: "11-12", subject: ""           },
    { slot: "12-2",  subject: "Physics Lab"},
    { slot: "2-3",   subject: "Maths"      },
    { slot: "3-4",   subject: ""           },
  ],
  WE: [
    { slot: "8-10",  subject: ""      },
    { slot: "10-11", subject: "Maths" },
    { slot: "11-12", subject: ""      },
    { slot: "12-1",  subject: "Physics"},
    { slot: "1-3",   subject: "Data"  },
    { slot: "3-4",   subject: ""      },
  ],
  TH: [
    { slot: "8-10",  subject: ""      },
    { slot: "10-11", subject: "Data"  },
    { slot: "11-1",  subject: ""      },
    { slot: "1-3",   subject: "Maths" },
    { slot: "3-4",   subject: ""      },
  ],
  FR: [
    { slot: "8-10",  subject: ""          },
    { slot: "10-11", subject: "Discrete"  },
    { slot: "11-12", subject: ""          },
    { slot: "12-1",  subject: "Basic ML"  },
    { slot: "1-2",   subject: ""          },
    { slot: "2-4",   subject: "Basic ML Lab" },
  ],
};

// Faculty info extracted from HTML
const FACULTY_INFO = [
  { code: "AM102",       name: "Maths",        lecture: 3, tutorial: 1, practical: 0, faculty: "Nitika" },
  { code: "AP102",       name: "Physics",       lecture: 3, tutorial: 0, practical: 2, faculty: "Yogendra K Meena" },
  { code: "CS102",       name: "Discrete",      lecture: 3, tutorial: 1, practical: 0, faculty: "Col R Sreejeth" },
  { code: "CS104/DA104", name: "Data",          lecture: 3, tutorial: 0, practical: 2, faculty: "Kavinder, Aanchal (lab)" },
  { code: "SEC-1(CS106)",name: "Basic ML",      lecture: 1, tutorial: 0, practical: 2, faculty: "Anshika, Col R Sreejeth (lab)" },
  { code: "AEC/VAC",     name: "EVS",           lecture: 1, tutorial: 0, practical: 0, faculty: "Ravi" },
];

const DAY_MAP = { 0: null, 1: "MO", 2: "TU", 3: "WE", 4: "TH", 5: "FR", 6: null };

function getTodayKey() {
  return DAY_MAP[new Date().getDay()] || null;
}

module.exports = { TIMETABLE, FACULTY_INFO, getTodayKey };
