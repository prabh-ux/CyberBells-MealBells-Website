import { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../app/store";
import {
  Download, Percent, Users, UtensilsCrossed, Box,
  ChevronDown, ChevronUp, MoreHorizontal,
} from "lucide-react";
import DropDown from "../../components/shared/DropDown";
import {
  fetchAnalyticsSummary,
  fetchMealsChart,
  fetchAttendanceChart,
  fetchFilterOptions,
  setFilters,
  resetFilters,
  cacheKey,
} from "../../slices/adminAnalyticsSlice";
import { DEPARTMENTS } from "../../data/UserManagement";

const MEAL_TYPES    = ["Veg", "Non-Veg", "Both"];
const ROWS_PER_PAGE = 7;

const DATE_LABEL_TO_DAYS: Record<string, 7 | 14 | 30> = {
  "Last 7 Days":  7,
  "Last 14 Days": 14,
  "Last 30 Days": 30,
};
const DAYS_TO_DATE_LABEL: Record<number, string> = {
  7:  "Last 7 Days",
  14: "Last 14 Days",
  30: "Last 30 Days",
};

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-100 rounded-xl ${className}`} />;
}

function DonutChart({
  presentPct, hoveredSegment, onHover,
}: {
  presentPct: number;
  hoveredSegment: "present" | "absent" | null;
  onHover: (seg: "present" | "absent" | null) => void;
}) {
  const r = 68, cx = 95, cy = 95;
  const circ = 2 * Math.PI * r;
  const absentPct = 100 - presentPct;
  const gap = 4;
  const presentDash = (presentPct / 100) * circ;
  const absentDash  = (absentPct  / 100) * circ;
  const isHP = hoveredSegment === "present";
  const isHA = hoveredSegment === "absent";
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
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth={22} />
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke={isHA ? "#9ca3af" : "#d1d5db"} strokeWidth={isHA ? 26 : 22}
        strokeDasharray={`${absentDash - gap} ${circ}`}
        strokeDashoffset={-(presentDash + gap / 2)}
        strokeLinecap="butt" transform={`rotate(-90 ${cx} ${cy})`}
        style={{ cursor: "pointer", transition: "stroke-width 0.2s, stroke 0.2s", filter: isHA ? "url(#seg-shadow-gray)" : "none" }}
        onMouseEnter={() => onHover("absent")} onMouseLeave={() => onHover(null)} />
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke={isHP ? "#ea6500" : "#f97316"} strokeWidth={isHP ? 26 : 22}
        strokeDasharray={`${presentDash - gap} ${circ}`}
        strokeDashoffset={0}
        strokeLinecap="butt" transform={`rotate(-90 ${cx} ${cy})`}
        style={{ cursor: "pointer", transition: "stroke-width 0.2s, stroke 0.2s", filter: isHP ? "url(#seg-shadow-orange)" : "none" }}
        onMouseEnter={() => onHover("present")} onMouseLeave={() => onHover(null)} />
      {hoveredSegment === "absent" ? (
        <>
          <text x={cx} y={cy - 10} textAnchor="middle" fontSize={24} fontWeight={700} fill="#374151">{absentPct}%</text>
          <text x={cx} y={cy + 14} textAnchor="middle" fontSize={13} fill="#9ca3af" fontWeight={500}>Absent</text>
        </>
      ) : (
        <>
          <text x={cx} y={cy - 10} textAnchor="middle" fontSize={24} fontWeight={700} fill="#111827">{presentPct}%</text>
          <text x={cx} y={cy + 14} textAnchor="middle" fontSize={13} fill="#6b7280" fontWeight={500}>Present</text>
        </>
      )}
    </svg>
  );
}

function ComplianceBar({ value }: { value: number }) {
  const color = value >= 85 ? "#22c55e" : value >= 60 ? "#f97316" : "#ef4444";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-semibold text-gray-500 w-8 text-right">{value}%</span>
    </div>
  );
}

function StatCard({ icon, label, value, accent, badge, loading }: {
  icon: React.ReactNode; label: string; value: string;
  accent: string; badge?: string; loading?: boolean;
}) {
  if (loading) return <Skeleton className="h-28" />;
  return (
    <div className="relative bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-3 shadow-sm overflow-hidden cursor-pointer group transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
      style={{ borderTop: `3px solid ${accent}` }}>
      {badge && (
        <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: accent + "20", color: accent }}>{badge}</span>
      )}
      <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
        style={{ background: accent + "18", color: accent }}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-400 mt-0.5 font-medium">{label}</p>
      </div>
    </div>
  );
}

function SolidBarChart({ data, loading }: {
  data: { day: string; count: number; fullDate: string }[];
  loading: boolean;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; day: string; value: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  if (loading) return <Skeleton className="w-full h-full" />;
  if (!data?.length) return (
    <div className="w-full h-full flex items-center justify-center text-sm text-gray-400">No data</div>
  );

  const W = 500, H = 180, paddingBottom = 28, chartH = H - paddingBottom;
  const maxVal = Math.max(...data.map(d => d.count), 1);
  const barW   = W / data.length;

  return (
    <div className="relative w-full h-full">
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none"
        onMouseLeave={() => { setHoveredIndex(null); setTooltip(null); }}>
        {data.map((d, i) => {
          const barH = (d.count / maxVal) * chartH;
          const x = i * barW, y = chartH - barH, r = 5;
          const path = `M ${x},${y+r} Q ${x},${y} ${x+r},${y} L ${x+barW-r},${y} Q ${x+barW},${y} ${x+barW},${y+r} L ${x+barW},${chartH} L ${x},${chartH} Z`;
          return (
            <g key={d.fullDate}>
              <path d={path} fill={hoveredIndex === i ? "#ea6500" : "#f97316"}
                onMouseEnter={() => {
                  setHoveredIndex(i);
                  const rect = svgRef.current?.getBoundingClientRect();
                  if (rect) setTooltip({ x: (x + barW / 2) * (rect.width / W), y: y * (rect.height / H) - 8, day: d.day, value: d.count });
                }}
                style={{ cursor: "pointer", transition: "fill 0.15s" }} />
              <text x={x + barW / 2} y={H - 6} textAnchor="middle" fontSize={11} fill="#9ca3af">{d.day}</text>
            </g>
          );
        })}
      </svg>
      {tooltip && (
        <div className="absolute pointer-events-none bg-white border border-orange-100 rounded-xl px-3 py-2 shadow-lg text-xs -translate-x-1/2 -translate-y-full"
          style={{ left: tooltip.x, top: tooltip.y }}>
          <p className="font-bold text-gray-700">{tooltip.day}</p>
          <p className="text-orange-500 font-semibold mt-0.5">{tooltip.value} meals</p>
        </div>
      )}
    </div>
  );
}

function ActiveFilterBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-orange-500 text-white text-[9px] font-bold">
      {count}
    </span>
  );
}

export default function AttendanceSummary() {
  const dispatch = useDispatch<AppDispatch>();

  const {
    filters,
    vendorOptions, filterOptionsLoading,
    summary, summaryLoading,
    mealsChart, mealsLoading,
    attendanceChart, attendanceLoading,
  } = useSelector((state: RootState) => state.analytics);

  const [tableOpen,      setTableOpen]      = useState(true);
  const [hoveredSegment, setHoveredSegment] = useState<"present" | "absent" | null>(null);
  const [hoveredLegend,  setHoveredLegend]  = useState<"present" | "absent" | null>(null);
  const [tablePage,      setTablePage]      = useState(0);

  // Load vendor dropdown once on mount
  useEffect(() => {
    dispatch(fetchFilterOptions());
  }, [dispatch]);

  // Re-fetch ALL data whenever filters change (summary + charts)
  useEffect(() => {
    const key = cacheKey(filters);
    dispatch(fetchAnalyticsSummary(filters));           // always re-fetch summary with filters
    if (!mealsChart[key])      dispatch(fetchMealsChart(filters));
    if (!attendanceChart[key]) dispatch(fetchAttendanceChart(filters));
    setTablePage(0);
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDateRange  = (label: string) => dispatch(setFilters({ days: DATE_LABEL_TO_DAYS[label] }));
  const handleDepartment = (val: string)   => dispatch(setFilters({ department: val === "All Departments" ? "all" : val }));
  const handleVendor     = (val: string)   => dispatch(setFilters({ vendorId: val === "All Vendors" ? "all" : val }));
  const handleMealType   = (val: string)   => dispatch(setFilters({ mealType: val === "All Types" ? "all" : val }));
  const handleClear      = ()              => dispatch(resetFilters());

  const activeSegment  = hoveredSegment || hoveredLegend;
  const key            = cacheKey(filters);
  const mealsData      = mealsChart[key]      ?? [];
  const attendanceData = attendanceChart[key] ?? [];
  const donutPct       = summary?.attendancePct ?? 0;

  const totalPages = Math.ceil(attendanceData.length / ROWS_PER_PAGE);
  const pagedRows  = attendanceData.slice(tablePage * ROWS_PER_PAGE, (tablePage + 1) * ROWS_PER_PAGE);

  const growthBadge = summary?.userGrowthPct != null
    ? `${summary.userGrowthPct > 0 ? "+" : ""}${summary.userGrowthPct}%`
    : undefined;

  const activeFilterCount = [
    filters.department !== "all",
    filters.vendorId   !== "all",
    filters.mealType   !== "all",
  ].filter(Boolean).length;

  const vendorDropdownOptions = ["All Vendors", ...vendorOptions.map(v => v.label)];
  const selectedVendorLabel   = filters.vendorId === "all"
    ? "All Vendors"
    : (vendorOptions.find(v => v.value === filters.vendorId)?.label ?? "All Vendors");
  const departmentOptions  = ["All Departments", ...DEPARTMENTS.map(d => d)];
  const selectedDepartment = filters.department === "all" ? "All Departments" : filters.department;
  const mealTypeOptions    = ["All Types", ...MEAL_TYPES];
  const selectedMealType   = filters.mealType === "all" ? "All Types" : filters.mealType;

  return (
    <div className="min-h-screen bg-[#F8F9FB] p-4 sm:p-8 font-sans">

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Attendance Summary</h1>
          <p className="text-sm text-gray-400 mt-0.5">Real-time meal attendance and meal requirement analytics</p>
        </div>
        <button className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 active:scale-95 transition-all text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-orange-500/20 cursor-pointer">
          <Download size={16} /> Export Report
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date Range</label>
          <DropDown value={DAYS_TO_DATE_LABEL[filters.days]} options={["Last 7 Days", "Last 14 Days", "Last 30 Days"]} onChange={handleDateRange} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Department {filters.department !== "all" && <ActiveFilterBadge count={1} />}
          </label>
          <DropDown value={selectedDepartment} options={departmentOptions} onChange={handleDepartment} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Vendor {filters.vendorId !== "all" && <ActiveFilterBadge count={1} />}
          </label>
          <DropDown
            value={selectedVendorLabel}
            options={filterOptionsLoading ? ["Loading…"] : vendorDropdownOptions}
            onChange={(label) => {
              if (label === "All Vendors") { handleVendor("All Vendors"); return; }
              const match = vendorOptions.find(v => v.label === label);
              if (match) dispatch(setFilters({ vendorId: match.value }));
            }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Meal Type {filters.mealType !== "all" && <ActiveFilterBadge count={1} />}
          </label>
          <DropDown value={selectedMealType} options={mealTypeOptions} onChange={handleMealType} />
        </div>
        <button onClick={handleClear}
          className={`ml-auto border text-sm font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer
            ${activeFilterCount > 0 ? "border-orange-300 text-orange-500 hover:bg-orange-50" : "border-gray-200 text-gray-400 hover:bg-gray-50"}`}>
          Clear Filters
          {activeFilterCount > 0 && (
            <span className="ml-1.5 text-[10px] font-bold bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">{activeFilterCount}</span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<Percent size={18} />} label="Attendance %" accent="#f97316"
value={summary ? `${summary.attendancePct ?? 0}%` : "0%"}
 badge={growthBadge} loading={summaryLoading} />
        <StatCard icon={<Users size={18} />} label="Total Users" accent="#f97316"
          value={summary ? summary.totalUsers.toLocaleString() : "—"} loading={summaryLoading} />
        <StatCard icon={<UtensilsCrossed size={18} />} label="Meals Today" accent="#f97316"
          value={summary ? summary.mealsToday.toLocaleString() : "—"} loading={summaryLoading} />
        <StatCard icon={<Box size={18} />} label="Total Vendors" accent="#f97316"
          value={summary ? summary.totalVendors.toLocaleString() : "—"} loading={summaryLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-bold text-gray-700">Meals by Day</h2>
            <button className="text-gray-300 hover:text-gray-500 transition-colors cursor-pointer"><MoreHorizontal size={18} /></button>
          </div>
          <div className="h-48"><SolidBarChart data={mealsData} loading={mealsLoading} /></div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-bold text-gray-700">Present vs Absent</h2>
            <button className="text-gray-300 hover:text-gray-500 transition-colors cursor-pointer"><MoreHorizontal size={18} /></button>
          </div>
          {summaryLoading ? (
            <Skeleton className="w-48 h-48 rounded-full mx-auto mt-2" />
          ) : (
            <div className="flex flex-col items-center justify-center">
              <div className="w-48 h-48">
                <DonutChart presentPct={donutPct} hoveredSegment={activeSegment} onHover={setHoveredSegment} />
              </div>
              <div className="flex justify-center gap-6 mt-1">
                {([
                  { key: "present" as const, color: "#f97316", hoverColor: "#ea6500", label: "Present" },
                  { key: "absent"  as const, color: "#e5e7eb", hoverColor: "#9ca3af", label: "Absent"  },
                ]).map(({ key, color, hoverColor, label }) => (
                  <div key={key} className="flex items-center gap-1.5 cursor-pointer select-none group"
                    onMouseEnter={() => setHoveredLegend(key)} onMouseLeave={() => setHoveredLegend(null)}>
                    <span className="w-3 h-3 rounded-full inline-block transition-transform duration-150 group-hover:scale-125"
                      style={{ backgroundColor: activeSegment === key ? hoverColor : color }} />
                    <span className="text-xs font-semibold transition-colors"
                      style={{ color: activeSegment === key ? (key === "present" ? "#ea6500" : "#374151") : "#6b7280" }}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <button onClick={() => setTableOpen(o => !o)}
          className="w-full flex items-center justify-between px-6 py-4 border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer">
          <span className="text-sm font-bold text-gray-800">Daily Attendance Details</span>
          {tableOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </button>
        {tableOpen && (
          <>
            {attendanceLoading ? (
              <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-50">
                      {["Date", "Present %", "Absent %", "Compliance", ""].map(h => (
                        <th key={h} className="px-6 py-3.5 text-left text-[13px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {pagedRows.length === 0 ? (
                      <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400">No attendance data for this period.</td></tr>
                    ) : pagedRows.map(row => (
                      <tr key={row.fullDate} className="hover:bg-orange-50/30 transition-colors cursor-pointer group">
                        <td className="px-6 py-4 text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">{row.day}, {row.fullDate}</td>
                        <td className="px-6 py-4"><span className="text-sm font-bold text-gray-900">{row.present}%</span></td>
                        <td className="px-6 py-4 text-sm text-gray-600 font-medium">{row.absent}%</td>
                        <td className="px-6 py-4 w-44"><ComplianceBar value={row.present} /></td>
                        <td className="px-6 py-4">
                          <button className="text-orange-500 hover:text-orange-700 text-xs font-bold transition-colors cursor-pointer hover:underline underline-offset-2">View Details</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="px-6 py-3 border-t border-gray-50 bg-gray-50/30 flex items-center justify-between">
              <span className="text-xs text-gray-400 font-medium">Showing {pagedRows.length} of {attendanceData.length} days</span>
              <div className="flex gap-1">
                <button onClick={() => setTablePage(p => Math.max(0, p - 1))} disabled={tablePage === 0}
                  className="w-7 h-7 border border-gray-200 rounded-lg flex items-center justify-center text-gray-400 hover:border-orange-400 hover:text-orange-500 transition-all cursor-pointer text-sm disabled:opacity-40 disabled:cursor-not-allowed">‹</button>
                <button onClick={() => setTablePage(p => Math.min(totalPages - 1, p + 1))} disabled={tablePage >= totalPages - 1}
                  className="w-7 h-7 border border-gray-200 rounded-lg flex items-center justify-center text-gray-400 hover:border-orange-400 hover:text-orange-500 transition-all cursor-pointer text-sm disabled:opacity-40 disabled:cursor-not-allowed">›</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}