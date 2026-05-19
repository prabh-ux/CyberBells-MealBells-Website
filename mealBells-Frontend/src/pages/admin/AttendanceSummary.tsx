import { useState, useRef } from "react";
import {
  Download,
  Percent,
  Users,
  UserX,
  Box,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface AttendanceRow {
  date: string;
  present: number;
  presentDelta: number;
  absent: number;
  totalMeals: number;
  compliance: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const barData = [
  { day: "Mon", value: 210 },
  { day: "Tue", value: 280 },
  { day: "Wed", value: 310 },
  { day: "Thu", value: 260 },
  { day: "Fri", value: 340 },
  { day: "Sat", value: 190 },
  { day: "Sun", value: 150 },
];

const tableRows: AttendanceRow[] = [
  { date: "Oct 24, 2023", present: 248, presentDelta: 11, absent: 42, totalMeals: 290, compliance: 85 },
  { date: "Oct 23, 2023", present: 352, presentDelta: -4, absent: 38, totalMeals: 290, compliance: 92 },
  { date: "Oct 22, 2023", present: 230, presentDelta: 8, absent: 60, totalMeals: 290, compliance: 55 },
];

function DonutChart({
  presentPct,
  hoveredSegment,
  onHover,
}: {
  presentPct: number;
  hoveredSegment: "present" | "absent" | null;
  onHover: (seg: "present" | "absent" | null) => void;
}) {
  const r = 68;
  const cx = 95;
  const cy = 95;
  const circ = 2 * Math.PI * r;
  const absentPct = 100 - presentPct;
  const gap = 4;

  const presentDash = (presentPct / 100) * circ;
  const absentDash = (absentPct / 100) * circ;

  const isHoveringPresent = hoveredSegment === "present";
  const isHoveringAbsent = hoveredSegment === "absent";

  return (
    <svg viewBox="0 0 190 190" className="w-full h-full" style={{ overflow: "visible" }}>
      <defs>
        <filter id="seg-shadow-orange" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="5" floodColor="#f97316" floodOpacity="0.4" />
        </filter>
        <filter id="seg-shadow-gray" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="5" floodColor="#9ca3af" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* Background full track */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="#f3f4f6"
        strokeWidth={22}
      />

      {/* Absent arc (gray) */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={isHoveringAbsent ? "#9ca3af" : "#d1d5db"}
        strokeWidth={isHoveringAbsent ? 26 : 22}
        strokeDasharray={`${absentDash - gap} ${circ}`}
        strokeDashoffset={-(presentDash + gap / 2)}
        strokeLinecap="butt"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{
          cursor: "pointer",
          transition: "stroke-width 0.2s ease, stroke 0.2s ease",
          filter: isHoveringAbsent ? "url(#seg-shadow-gray)" : "none",
        }}
        onMouseEnter={() => onHover("absent")}
        onMouseLeave={() => onHover(null)}
      />

      {/* Present arc (orange)  */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={isHoveringPresent ? "#ea6500" : "#f97316"}
        strokeWidth={isHoveringPresent ? 26 : 22}
        strokeDasharray={`${presentDash - gap} ${circ}`}
        strokeDashoffset={0}
        strokeLinecap="butt"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{
          cursor: "pointer",
          transition: "stroke-width 0.2s ease, stroke 0.2s ease",
          filter: isHoveringPresent ? "url(#seg-shadow-orange)" : "none",
        }}
        onMouseEnter={() => onHover("present")}
        onMouseLeave={() => onHover(null)}
      />

      {/* Centre label */}
      {hoveredSegment === "absent" ? (
        <>
          <text x={cx} y={cy - 10} textAnchor="middle" fontSize={24} fontWeight={700} fill="#374151">
            {absentPct}%
          </text>
          <text x={cx} y={cy + 14} textAnchor="middle" fontSize={13} fill="#9ca3af" fontWeight={500}>
            Absent
          </text>
        </>
      ) : (
        <>
          <text x={cx} y={cy - 10} textAnchor="middle" fontSize={24} fontWeight={700} fill="#111827">
            {presentPct}%
          </text>
          <text x={cx} y={cy + 14} textAnchor="middle" fontSize={13} fill="#6b7280" fontWeight={500}>
            Present
          </text>
        </>
      )}
    </svg>
  );
}

// ─── Compliance Bar ───────────────────────────────────────────────────────────
function ComplianceBar({ value }: { value: number }) {
  const color = value >= 85 ? "#22c55e" : value >= 60 ? "#f97316" : "#ef4444";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  accent,
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
  badge?: string;
}) {
  return (
    <div
      className="relative bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-3 shadow-sm overflow-hidden cursor-pointer group transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
      style={{ borderTop: `3px solid ${accent}` }}
    >
      {badge && (
        <span
          className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: accent + "20", color: accent }}
        >
          {badge}
        </span>
      )}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
        style={{ background: accent + "18", color: accent }}
      >
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-400 mt-0.5 font-medium">{label}</p>
      </div>
    </div>
  );
}

// ─── Filter Select ────────────────────────────────────────────────────────────
function FilterSelect({ label, options }: { label: string; options: string[] }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
        {label}
      </label>
      <select className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 cursor-pointer min-w-[130px] hover:border-orange-300 transition-colors">
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

// ─── Custom SVG Bar Chart ─────────────────────────────────────────────────────
function SolidBarChart({
  data,
}: {
  data: { day: string; value: number }[];
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; day: string; value: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const W = 500;
  const H = 180;
  const paddingBottom = 28;
  const chartH = H - paddingBottom;
  const maxVal = Math.max(...data.map((d) => d.value));
  const barW = W / data.length;

  return (
    <div className="relative w-full h-full">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-full"
        preserveAspectRatio="none"
        onMouseLeave={() => { setHoveredIndex(null); setTooltip(null); }}
      >
        {data.map((d, i) => {
          const barH = (d.value / maxVal) * chartH;
          const x = i * barW;
          const y = chartH - barH;
          const isHovered = hoveredIndex === i;
          const r = 5;

          // Rounded top path: flat bottom, rounded top corners
          const path = `
            M ${x},${y + r}
            Q ${x},${y} ${x + r},${y}
            L ${x + barW - r},${y}
            Q ${x + barW},${y} ${x + barW},${y + r}
            L ${x + barW},${chartH}
            L ${x},${chartH}
            Z
          `;

          return (
            <g key={i}>
              <path
                d={path}
                fill={isHovered ? "#ea6500" : "#f97316"}
                onMouseEnter={() => {
                  setHoveredIndex(i);
                  const svgRect = svgRef.current?.getBoundingClientRect();
                  if (svgRect) {
                    const scaleX = svgRect.width / W;
                    const scaleY = svgRect.height / H;
                    setTooltip({
                      x: (x + barW / 2) * scaleX,
                      y: y * scaleY - 8,
                      day: d.day,
                      value: d.value,
                    });
                  }
                }}
                style={{ cursor: "pointer", transition: "fill 0.15s" }}
              />
              {/* X-axis label */}
              <text
                x={x + barW / 2}
                y={H - 6}
                textAnchor="middle"
                fontSize={11}
                fill="#9ca3af"
              >
                {d.day}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute pointer-events-none bg-white border border-orange-100 rounded-xl px-3 py-2 shadow-lg text-xs -translate-x-1/2 -translate-y-full"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <p className="font-bold text-gray-700">{tooltip.day}</p>
          <p className="text-orange-500 font-semibold mt-0.5">{tooltip.value} present</p>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AttendanceSummary() {
  const [tableOpen, setTableOpen] = useState(true);
  const [hoveredSegment, setHoveredSegment] = useState<"present" | "absent" | null>(null);
  const [hoveredLegend, setHoveredLegend] = useState<"present" | "absent" | null>(null);

  const activeSegment = hoveredSegment || hoveredLegend;

  return (
    <div className="min-h-screen bg-[#F8F9FB] p-4 sm:p-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Attendance Summary</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Real-time meal attendance and meal requirement analytics
          </p>
        </div>
        <button className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 active:scale-95 transition-all text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-orange-500/20 cursor-pointer">
          <Download size={16} />
          Export Report
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-wrap gap-4 items-end">
        <FilterSelect label="Date Range" options={["Last 7 Days", "Last 30 Days", "Last 90 Days"]} />
        <FilterSelect label="Department" options={["All Departments", "Engineering", "HR", "Finance"]} />
        <FilterSelect label="Vendor" options={["All Vendors", "Urban Harvest", "Zen Sushi"]} />
        <FilterSelect label="Meal Type" options={["All Types", "Breakfast", "Lunch", "Dinner"]} />
        <button className="ml-auto border border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300 text-sm font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer">
          Clear Filters
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<Percent size={18} />} label="Attendance Percentage" value="84.2%" accent="#f97316" badge="+2.6%" />
        <StatCard icon={<Users size={18} />} label="Total Present" value="1,248" accent="#f97316" />
        <StatCard icon={<UserX size={18} />} label="Total Absent" value="254" accent="#f97316" />
        <StatCard icon={<Box size={18} />} label="Total Boxes Required" value="1,482" accent="#f97316" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">

        {/* Bar Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-bold text-gray-700">Attendance by Day</h2>
            <button className="text-gray-300 hover:text-gray-500 transition-colors cursor-pointer">
              <MoreHorizontal size={18} />
            </button>
          </div>
          <div className="h-48">
            <SolidBarChart data={barData} />
          </div>
        </div>

        {/* Donut Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-bold text-gray-700">Present vs Absent</h2>
            <button className="text-gray-300 hover:text-gray-500 transition-colors cursor-pointer">
              <MoreHorizontal size={18} />
            </button>
          </div>

          <div className="flex flex-col items-center justify-center">
            <div className="w-48 h-48">
              <DonutChart
                presentPct={84}
                hoveredSegment={activeSegment}
                onHover={setHoveredSegment}
              />
            </div>

            {/* Legend —  syncs with chart */}
            <div className="flex justify-center gap-6 mt-1">
              <div
                className="flex items-center gap-1.5 cursor-pointer select-none group"
                onMouseEnter={() => setHoveredLegend("present")}
                onMouseLeave={() => setHoveredLegend(null)}
              >
                <span
                  className="w-3 h-3 rounded-full inline-block transition-transform duration-150 group-hover:scale-125"
                  style={{
                    backgroundColor: activeSegment === "present" ? "#ea6500" : "#f97316",
                  }}
                />
                <span
                  className="text-xs font-semibold transition-colors"
                  style={{ color: activeSegment === "present" ? "#ea6500" : "#6b7280" }}
                >
                  Present
                </span>
              </div>
              <div
                className="flex items-center gap-1.5 cursor-pointer select-none group"
                onMouseEnter={() => setHoveredLegend("absent")}
                onMouseLeave={() => setHoveredLegend(null)}
              >
                <span
                  className="w-3 h-3 rounded-full inline-block transition-transform duration-150 group-hover:scale-125"
                  style={{
                    backgroundColor: activeSegment === "absent" ? "#9ca3af" : "#e5e7eb",
                  }}
                />
                <span
                  className="text-xs font-semibold transition-colors"
                  style={{ color: activeSegment === "absent" ? "#374151" : "#6b7280" }}
                >
                  Absent
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Attendance Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <button
          onClick={() => setTableOpen((o) => !o)}
          className="w-full flex items-center justify-between px-6 py-4 border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer"
        >
          <span className="text-sm font-bold text-gray-800">Daily Attendance Details</span>
          {tableOpen ? (
            <ChevronUp size={16} className="text-gray-400" />
          ) : (
            <ChevronDown size={16} className="text-gray-400" />
          )}
        </button>

        {tableOpen && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-50">
                    {["Date", "Present", "Absent", "Total Meals", "Compliance", "Action"].map((h) => (
                      <th
                        key={h}
                        className="px-6 py-3.5 text-left text-[13px] font-bold text-gray-400 uppercase tracking-widest"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {tableRows.map((row) => (
                    <tr
                      key={row.date}
                      className="hover:bg-orange-50/30 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4 text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">
                        {row.date}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-gray-900">{row.present}</span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                              row.presentDelta > 0
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-600"
                            }`}
                          >
                            {row.presentDelta > 0 ? "+" : ""}
                            {row.presentDelta}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-medium">{row.absent}</td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">{row.totalMeals}</td>
                      <td className="px-6 py-4 w-36">
                        <ComplianceBar value={row.compliance} />
                      </td>
                      <td className="px-6 py-4">
                        <button className="text-orange-500 hover:text-orange-700 text-xs font-bold transition-colors cursor-pointer hover:underline underline-offset-2">
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 border-t border-gray-50 bg-gray-50/30 flex items-center justify-between">
              <span className="text-xs text-gray-400 font-medium">Showing 3 of 30 days</span>
              <div className="flex gap-1">
                <button className="w-7 h-7 border border-gray-200 rounded-lg flex items-center justify-center text-gray-400 hover:border-orange-400 hover:text-orange-500 transition-all cursor-pointer text-sm">
                  ‹
                </button>
                <button className="w-7 h-7 border border-gray-200 rounded-lg flex items-center justify-center text-gray-400 hover:border-orange-400 hover:text-orange-500 transition-all cursor-pointer text-sm">
                  ›
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}