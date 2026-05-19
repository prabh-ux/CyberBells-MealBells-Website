import { useState, useRef, useEffect } from "react";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import uploadIconWhite from "../../assets/uploadIconWhite.png";
import userIconUrl from "../../assets/userIconUrl.png";
import vendorIconUrl from "../../assets/vendorIconUrl.png";
import checkIconUrl from "../../assets/checkIconUrl.png";
import mealsIconUrl from "../../assets/mealsIconUrl.png";
import growth from "../../assets/growth.png";
import minusUrl from "../../assets/minusUrl.png";
import arrowUpUrl from "../../assets/arrowUpUrl.png";
import arrowDownUrl from "../../assets/arrowDownUrl.png";
import dropDown from "../../assets/dropDown.png";
import searchIcon from "../../assets/searchIcon.png";
import filterIcon from "../../assets/filterIcon.png";
import actionBtns from "../../assets/actionBtns.png";

// ── Meals bar data ────────────────────────────────────────────────────────────
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

function getMax(data: { count: number }[]) {
  return Math.max(...data.map((d) => d.count));
}

function barColor(count: number, max: number) {
  const pct = (count / max) * 100;
  if (pct >= 95) return "#994700";
  if (pct >= 80) return "#FDBA74";
  if (pct >= 72) return "#FDBA74";
  if (pct >= 60) return "#FED7AA";
  if (pct >= 58) return "#FFF7ED";
  if (pct >= 54) return "#FFF7ED";
  return "#FFEDD5";
}

// ── Attendance stacked data ───────────────────────────────────────────────────
const attendanceData = [
  { day: "01", present: 89, gap: 2, absent: 11 },
  { day: "02", present: 84, gap: 2, absent: 16 },
  { day: "03", present: 91, gap: 2, absent: 9 },
  { day: "04", present: 87, gap: 2, absent: 13 },
  { day: "05", present: 93, gap: 2, absent: 7 },
  { day: "06", present: 78, gap: 2, absent: 22 },
];

// ── Activity log ──────────────────────────────────────────────────────────────
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

const ALL_STATUSES = ["All", "Success", "Pending", "Critical"];

const statusStyle: Record<string, string> = {
  Success: "bg-[#DCFCE7] text-[#15803D]",
  Pending: "bg-[#FEF9C3] text-[#A16207]",
  Critical: "bg-[#FFE4E6] text-[#BE123C]",
};

const PAGE_SIZE = 3;

// ── Custom bar shapes ─────────────────────────────────────────────────────────
const RoundedBar = (props: any) => {
  const { x, y, width, height, fill } = props;
  if (!height || height <= 0) return null;
  const radius = 8;
  return (
    <path
      d={`M${x + radius},${y} h${width - 2 * radius} a${radius},${radius} 0 0 1 ${radius},${radius} v${height - radius} h-${width} v-${height - radius} a${radius},${radius} 0 0 1 ${radius},-${radius}z`}
      fill={fill}
    />
  );
};
const BarTooltipContent = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none">
      <p className="font-semibold mb-0.5">{label}</p>
      <p>Delivered: <span className="text-[#FF7A00] font-bold">{payload[0]?.value}</span></p>
    </div>
  );
};

const AttendanceTooltipContent = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none">
      <p className="font-semibold mb-1">{label}</p>
      {payload.filter((p: any) => p.dataKey !== "gap").map((p: any) => (
        <p key={p.dataKey}>
          {p.dataKey === "present" ? "Present" : "Absent"}:{" "}
          <span className="text-[#FF7A00] font-bold">{p.value}%</span>
        </p>
      ))}
    </div>
  );
};
const RoundedStackedBar = (props: any) => {
  const { x, y, width, height, fill, isTop } = props;
  if (!height || height <= 0) return null;
  const r = isTop ? 8 : 0;
  return (
    <path
      d={`M${x + r},${y} h${width - 2 * r} a${r},${r} 0 0 1 ${r},${r} v${height - r} h-${width} v-${height - r} a${r},${r} 0 0 1 ${r},-${r}z`}
      fill={fill}
    />
  );
};

const AbsentBar = (props: any) => <RoundedStackedBar {...props} fill="#E5E7EB" isTop={true} />;
const MiddleBar = (props: any) => {
  const { x, y, width } = props;
  return <rect x={x} y={y - 4} width={width} height={4} fill="#ffffff" />;
};
const PresentBar = (props: any) => <RoundedStackedBar {...props} fill="#994700" isTop={false} />;

// ── Export helper ─────────────────────────────────────────────────────────────
function exportToCSV(data: typeof activities) {
  const headers = ["Date", "Time", "Name", "Email", "Action", "Status"];
  const rows = data.map((a) => [a.date, a.time, a.name, a.email, a.action, a.status]);
  const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "activity-log.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AnalyticsDashboard() {
  const [mealRange, setMealRange] = useState("Last 7 Days");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeStatus, setActiveStatus] = useState("All");
  const filterRef = useRef<HTMLDivElement>(null);

  // Close filter dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const mealsData = ALL_MEALS_DATA[mealRange];
  const mealsMax = getMax(mealsData);

  // Filter by search + status
  const filtered = activities.filter((a) => {
    const matchesSearch =
      !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.action.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = activeStatus === "All" || a.status === activeStatus;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  // Clamp page when filters change
  const safePage = Math.min(page, Math.max(0, totalPages - 1));
  const paginated = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(0);
  };

  const handleStatusFilter = (status: string) => {
    setActiveStatus(status);
    setPage(0);
    setFilterOpen(false);
  };

  return (
    <div className="min-h-full bg-[#F5F5F5] p-4 sm:p-6 lg:p-7 font-(--font-inter)">
      <div className="flex flex-col gap-5 lg:gap-6">

        {/* ── HEADER ───────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-[22px] sm:text-[28px] lg:text-[32px] font-bold font-(--font-manrope) text-(--text-primary) tracking-tight leading-tight">
              Analytics Dashboard
            </h1>
            <p className="text-[#6B7280] text-[13px] sm:text-[16px] mt-1">
              Real-time overview of MealBells operations and user activity.
            </p>
          </div>
          <button
            onClick={() => exportToCSV(activities)}
            className="flex items-center gap-2 bg-(--brand) hover:bg-[#A34800] transition-colors text-white text-[13px] sm:text-[15px] font-semibold px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl shrink-0 self-start sm:self-auto"
          >
            <img src={uploadIconWhite} alt="export" width="13" height="13" />
            Export Data
          </button>
        </div>

        {/* ── STAT CARDS ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: "TOTAL USERS",    icon: userIconUrl,   value: "1,284", note: "+12.5% vs last month", noteColor: "#16A34A", noteIcon: growth     },
            { label: "TOTAL VENDORS",  icon: vendorIconUrl, value: "42",    note: "Stable performance",   noteColor: "#EA580C", noteIcon: minusUrl    },
            { label: "MEALS TODAY",    icon: mealsIconUrl,  value: "856",   note: "94% delivery rate",    noteColor: "#16A34A", noteIcon: arrowUpUrl  },
            { label: "ATTENDANCE %",   icon: checkIconUrl,  value: "92.4%", note: "-2.1% from average",  noteColor: "#DC2626", noteIcon: arrowDownUrl },
          ].map((card) => (
            <div key={card.label} className="bg-white rounded-2xl p-3 sm:p-5 flex flex-col gap-2 sm:gap-4">
              <div className="flex items-center justify-between">
                <span className="text-[9px] sm:text-[12px] font-semibold text-[#6B7280] tracking-widest leading-tight">
                  {card.label}
                </span>
                <div className="w-[26px] h-[26px] sm:w-[32px] sm:h-[32px] bg-[#FFF3E8] rounded-xl flex items-center justify-center shrink-0">
                  <img src={card.icon} alt={card.label} width="26" height="26" />
                </div>
              </div>
              <div>
                <div className="text-[20px] sm:text-[28px] lg:text-[32px] font-(--font-manrope) font-bold text-[#0E0E0E] leading-none">
                  {card.value}
                </div>
                <div className="flex items-center gap-1 mt-1.5">
                  <img src={card.noteIcon} alt="trend" width="11" height="11" />
                  <span className="text-[10px] sm:text-[12px] font-bold leading-tight" style={{ color: card.noteColor }}>
                    {card.note}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── CHARTS ROW ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Meals Delivered */}
          <div className="bg-white rounded-2xl p-4 sm:p-6">
            <div className="flex flex-col min-[480px]:flex-row min-[480px]:items-center justify-between mb-4 sm:mb-6 gap-2 sm:gap-3">
              <h2 className="text-[16px] sm:text-[22px] lg:text-[24px] font-semibold text-(--text-primary) leading-snug">
                Meals Delivered This Week
              </h2>
              <div className="relative shrink-0">
                <select
                  value={mealRange}
                  onChange={(e) => setMealRange(e.target.value)}
                  className="appearance-none border border-[#E5E7EB] rounded-xl px-3 py-1.5 pr-7 text-[12px] sm:text-[14px] text-(--text-primary) font-medium focus:outline-none bg-white cursor-pointer"
                >
                  <option>Last 7 Days</option>
                  <option>Last 14 Days</option>
                  <option>Last 30 Days</option>
                </select>
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
                  <img src={dropDown} alt="▾" width="10" height="10" />
                </span>
              </div>
            </div>
            <div style={{ height: 180, outline: 'none' }} className="sm:!h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart  data={mealsData} barCategoryGap="20%" barGap={4}>
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9CA3AF", fontSize: 10, fontWeight: 500 }}
                  />
                 <Tooltip content={<BarTooltipContent />} cursor={{ fill: "rgba(255,122,0,0.05)" }} />

                  <Bar dataKey="count" shape={<RoundedBar />} radius={[8, 8, 0, 0]}>
                    {mealsData.map((entry, index) => (
                      <Cell key={index} fill={barColor(entry.count, mealsMax)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Daily Attendance Trend */}
          <div className="bg-white rounded-2xl p-4 sm:p-6">
            <div className="flex flex-col min-[480px]:flex-row min-[480px]:items-center justify-between mb-4 sm:mb-6 gap-2 sm:gap-3">
              <h2 className="text-[16px] sm:text-[22px] lg:text-[24px] font-semibold text-(--text-primary)">
                Daily Attendance Trend
              </h2>
              <div className="flex items-center gap-4 shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#994700] inline-block" />
                  <span className="text-[12px] sm:text-[16px] text-[#6B7280]">Present</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E5E7EB] inline-block" />
                  <span className="text-[12px] sm:text-[16px] text-[#80746b]">Absent</span>
                </div>
              </div>
            </div>
            <div style={{ height: 180  }} className="sm:!h-[220px] focus:outline-none">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceData} barCategoryGap="20%" stackOffset="none">
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9CA3AF", fontSize: 10, fontWeight: 500 }}
                  />
                <Tooltip content={<AttendanceTooltipContent />} cursor={{ fill: "rgba(255,122,0,0.05)" }} />

                  <Bar dataKey="present" stackId="a" fill="#994700" shape={<PresentBar />} />
                  <Bar dataKey="gap"     stackId="a" fill="#ffffff"  shape={<MiddleBar />} />
                  <Bar dataKey="absent"  stackId="a" fill="#E5E7EB"  shape={<AbsentBar />} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ── RECENT ACTIVITY ──────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 pt-5 sm:pt-6 pb-4 sm:pb-5 gap-3">
            <h2 className="text-[18px] sm:text-[24px] font-semibold text-[#0E0E0E]">
              Recent Activity
            </h2>
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative flex-1 sm:flex-none">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <img src={searchIcon} alt="search" width="14" height="14" />
                </span>
                <input
                  type="text"
                  placeholder="Search activity..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full sm:w-[180px] lg:w-[220px] pl-8 pr-4 py-[7px] border border-[#E5E7EB] rounded-xl text-[13px] text-[#374151] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-orange-200 bg-white"
                />
              </div>

              {/* Filter with dropdown */}
              <div className="relative shrink-0" ref={filterRef}>
                <button
                  onClick={() => setFilterOpen(!filterOpen)}
                  className={`flex items-center gap-2 border px-4 py-[7px] rounded-xl text-[13px] font-medium transition-colors bg-white shrink-0 ${
                    activeStatus !== "All"
                      ? "border-[#F97316] text-[#EA580C]"
                      : "border-[#E5E7EB] text-[#374151] hover:bg-gray-50"
                  }`}
                >
                  <img src={filterIcon} alt="filter" width="14" height="14" />
                  <span className="hidden sm:inline">
                    {activeStatus === "All" ? "Filter" : activeStatus}
                  </span>
                  {activeStatus !== "All" && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F97316] inline-block" />
                  )}
                </button>

                {filterOpen && (
                  <div className="absolute right-0 top-full mt-1.5 bg-white border border-[#E5E7EB] rounded-xl shadow-md z-20 py-1.5 min-w-[130px]">
                    {ALL_STATUSES.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleStatusFilter(s)}
                        className={`w-full text-left px-4 py-2 text-[13px] font-medium hover:bg-gray-50 transition-colors flex items-center gap-2 ${
                          activeStatus === s ? "text-[#EA580C]" : "text-[#374151]"
                        }`}
                      >
                        {s !== "All" && (
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusStyle[s] || ""}`}>
                            {s}
                          </span>
                        )}
                        {s === "All" && <span>All statuses</span>}
                        {activeStatus === s && <span className="ml-auto text-[#EA580C]">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Desktop table (md+) ── */}
          <div className="hidden md:block overflow-x-auto">
            <div className="min-w-[600px]">
              <div className="grid grid-cols-[1.1fr_1.8fr_1.5fr_1fr_0.3fr] gap-4 bg-[#F5F5F5] px-6 py-3 border-b border-[#F3F4F6]">
                {["DATE & TIME", "USER", "ACTION", "STATUS", "ACTIONS"].map((h) => (
                  <span key={h} className="text-[11px] font-bold text-[#6B7280] tracking-widest uppercase">
                    {h}
                  </span>
                ))}
              </div>
              <div className="divide-y divide-[#F3F4F6]">
                {paginated.length === 0 ? (
                  <div className="px-6 py-10 text-center text-[14px] text-[#9CA3AF]">
                    No activities match your search or filter.
                  </div>
                ) : (
                  paginated.map((a, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-[1.1fr_1.8fr_1.5fr_1fr_0.3fr] gap-4 items-center px-6 py-4 hover:bg-gray-50/60 transition-colors"
                    >
                      <div>
                        <p className="text-[14px] font-semibold text-(--text-primary) leading-snug">{a.date}</p>
                        <p className="text-[12px] text-[#9CA3AF] mt-0.5">{a.time}</p>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                          style={{ backgroundColor: a.bgColor, color: a.color }}
                        >
                          {a.initials}
                        </div>
                        <div>
                          <p className="text-[14px] font-bold text-(--text-primary) leading-snug">{a.name}</p>
                          <p className="text-[12px] text-[#6B7280] mt-0.5">{a.email}</p>
                        </div>
                      </div>
                      <span className="text-[14px] text-(--text-primary)">{a.action}</span>
                      <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[12px] font-semibold w-fit ${statusStyle[a.status]}`}>
                        {a.status}
                      </span>
                      <button className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors">
                        <img src={actionBtns} alt="more" width="4" height="16" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* ── Mobile cards (< md) ── */}
          <div className="md:hidden divide-y divide-[#F3F4F6]">
            {paginated.length === 0 ? (
              <div className="px-4 py-10 text-center text-[13px] text-[#9CA3AF]">
                No activities match your search or filter.
              </div>
            ) : (
              paginated.map((a, i) => (
                <div key={i} className="px-4 py-4 hover:bg-gray-50/60 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                        style={{ backgroundColor: a.bgColor, color: a.color }}
                      >
                        {a.initials}
                      </div>
                      <div>
                        <p className="text-[14px] font-bold text-[#0E0E0E] leading-snug">{a.name}</p>
                        <p className="text-[11px] text-[#9CA3AF]">{a.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${statusStyle[a.status]}`}>
                        {a.status}
                      </span>
                      <button className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-gray-100 transition-colors">
                        <img src={actionBtns} alt="more" width="4" height="14" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[13px] text-[#374151]">{a.action}</span>
                    <span className="text-[11px] text-[#9CA3AF] whitespace-nowrap">{a.date} · {a.time}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-t border-[#F3F4F6] bg-[#F9FAFB] rounded-b-2xl">
            <span className="text-[12px] sm:text-[14px] text-[#6B7280]">
              {filtered.length === 0
                ? "No results"
                : `Showing ${Math.min(PAGE_SIZE, filtered.length - safePage * PAGE_SIZE)} of ${filtered.length} activities`}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={safePage === 0}
                className="w-8 h-8 sm:w-9 sm:h-9 border border-[#E5E7EB] rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-30"
              >
                <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
                  <path d="M6 1L1 6L6 11" stroke="#1A1C1C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <span className="text-[13px] text-[#6B7280] min-w-[40px] text-center">
                {totalPages > 0 ? `${safePage + 1} / ${totalPages}` : "—"}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={safePage >= totalPages - 1}
                className="w-8 h-8 sm:w-9 sm:h-9 border border-[#E5E7EB] rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-30"
              >
                <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
                  <path d="M1 1L6 6L1 11" stroke="#1A1C1C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}