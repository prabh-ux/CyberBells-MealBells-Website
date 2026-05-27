export // ── Meals bar data ────────────────────────────────────────────────────────────
const ALL_MEALS_DATA: Record<string, { day: string; count: number }[]> = {
  "Last 7 Days": [
    { day: "MON", count: 187 },
    { day: "TUE", count: 224 },
    { day: "WED", count: 198 },
    { day: "THU", count: 271 },
    { day: "FRI", count: 312 },
    { day: "SAT", count: 243 },
    { day: "SUN", count: 134 },
  ],
  "Last 14 Days": [
    { day: "W1 M", count: 165 },
    { day: "W1 T", count: 201 },
    { day: "W1 W", count: 189 },
    { day: "W1 T", count: 245 },
    { day: "W1 F", count: 290 },
    { day: "W1 S", count: 220 },
    { day: "W1 S", count: 110 },
    { day: "W2 M", count: 187 },
    { day: "W2 T", count: 224 },
    { day: "W2 W", count: 198 },
    { day: "W2 T", count: 271 },
    { day: "W2 F", count: 312 },
    { day: "W2 S", count: 243 },
    { day: "W2 S", count: 134 },
  ],
  "Last 30 Days": [
    { day: "W1", count: 1166 },
    { day: "W2", count: 1254 },
    { day: "W3", count: 1198 },
    { day: "W4", count: 1312 },
  ],
};

export // ── Attendance stacked data ───────────────────────────────────────────────────
const attendanceData = [
  { day: "01", present: 89, gap: 2, absent: 11 },
  { day: "02", present: 84, gap: 2, absent: 16 },
  { day: "03", present: 91, gap: 2, absent: 9 },
  { day: "04", present: 87, gap: 2, absent: 13 },
  { day: "05", present: 93, gap: 2, absent: 7 },
  { day: "06", present: 78, gap: 2, absent: 22 },
];


export // ── Activity log ──────────────────────────────────────────────────────────────
const activities = [
  {
    date: "Oct 24, 2023", time: "12:45 PM", initials: "SJ",
    color: "#2563EB", bgColor: "#DBEAFE",
    name: "Sarah Jenkins", email: "sarah.j@company.com",
    action: "Meal Choice Updated", status: "Success",
  },
  {
    date: "Oct 24, 2023", time: "11:20 AM", initials: "MK",
    color: "#EA580C", bgColor: "#FFEDD5",
    name: "Michael K.", email: "m.knight@vendor.com",
    action: "Menu Inventory Sync", status: "Pending",
  },
  {
    date: "Oct 24, 2023", time: "09:15 AM", initials: "DL",
    color: "#9333EA", bgColor: "#F3E8FF",
    name: "David Lee", email: "david.lee@company.com",
    action: "Refund Requested", status: "Critical",
  },
  {
    date: "Oct 23, 2023", time: "04:52 PM", initials: "AM",
    color: "#0EA5E9", bgColor: "#E0F2FE",
    name: "Alex Morgan", email: "alex.morgan@company.com",
    action: "New User Registered", status: "Success",
  },
  {
    date: "Oct 23, 2023", time: "02:30 PM", initials: "RW",
    color: "#10B981", bgColor: "#D1FAE5",
    name: "Rita Walsh", email: "r.walsh@vendor.com",
    action: "Vendor Profile Updated", status: "Success",
  },
  {
    date: "Oct 23, 2023", time: "11:05 AM", initials: "JP",
    color: "#8B5CF6", bgColor: "#EDE9FE",
    name: "Jordan Peterson", email: "j.peterson@company.com",
    action: "Attendance Marked Late", status: "Pending",
  },
  {
    date: "Oct 22, 2023", time: "03:18 PM", initials: "DC",
    color: "#F97316", bgColor: "#FFEDD5",
    name: "David Chen", email: "david.chen@company.com",
    action: "Meal Delivery Failed", status: "Critical",
  },
  {
    date: "Oct 22, 2023", time: "10:00 AM", initials: "NB",
    color: "#14B8A6", bgColor: "#CCFBF1",
    name: "Nina Brooks", email: "n.brooks@company.com",
    action: "Report Exported", status: "Success",
  },
];