import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../app/store";
import {
  fetchSuperWastageVendors,
  fetchSuperWastageSummary,
  fetchSuperWastageChart,
  fetchSuperWastageTable,
  setSuperWastageFilters,
  setSuperWastagePage,
} from "../../slices/superAdmin/superAdminFoodWastageSlice";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import IcDownload          from "../../assets/IcDownload.png";
import IcFilter            from "../../assets/IcFilter.png";
import IcBrain             from "../../assets/IcBrain.png";
import IcArrowUp           from "../../assets/IcArrowUp.png";
import IcArrowDown         from "../../assets/IcArrowDown.png";
import foodWastageFooterBg from "../../assets/foodWastageFooterBg.png";
import CustomTooltip       from "../../components/admin/FoodWastageReport/CustomTooltip";

const PERIODS  = ["Last 7 Days", "Last 14 Days", "Last 30 Days"] as const;
const DAY_MAP: Record<string, 7 | 14 | 30> = {
  "Last 7 Days": 7, "Last 14 Days": 14, "Last 30 Days": 30,
};
const MEAL_OPTIONS  = ["Both", "Veg", "Non-Veg"];
const CHART_LEGEND: [string, string][] = [["#d1d5db", "Expected"], ["#994700", "Delivered"]];
const NAV_ICONS     = ["M15 18l-6-6 6-6", "M9 18l6-6-6-6"];

function badgeClass(n: number) {
  if (n >= 100) return "bg-[#FEE2E2] text-[#B91C1C]";
  if (n >= 30)  return "bg-[#FEF2F2] text-[#DC2626]";
  if (n <= 20)  return "bg-[#F0FDF4] text-[#16A34A]";
  return "bg-[#FFF7ED] text-[#994700]";
}

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className ?? ""}`} />
);

export default function SuperAdminFoodWastagePage() {
  const dispatch = useDispatch<AppDispatch>();

  const { orgOptions, filters: analyticsFilters } =
    useSelector((s: RootState) => s.superAnalytics);
  const activeOrgId = analyticsFilters.orgId;

  const {
    filters, filtersAppliedAt,
    vendors, vendorsLoading,
    summary, summaryLoading,
    chartData, chartLoading,
    tableRows, pagination, tableLoading,
    currentPage,
  } = useSelector((s: RootState) => s.superFoodWastage);

  const [localVendor,   setLocalVendor]   = useState("All Vendors");
  const [localPeriod,   setLocalPeriod]   = useState<typeof PERIODS[number]>("Last 7 Days");
  const [localMealType, setLocalMealType] = useState("Both");

  // Re-fetch vendors when org changes
  useEffect(() => {
    dispatch(fetchSuperWastageVendors(activeOrgId));
    setLocalVendor("All Vendors");

    if (filters.orgId !== activeOrgId || filters.vendor !== "all") {
      dispatch(setSuperWastageFilters({ orgId: activeOrgId, vendor: "all" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, activeOrgId]);

  // Re-fetch data when filters or page change
  useEffect(() => {
    dispatch(fetchSuperWastageSummary(filters));
    dispatch(fetchSuperWastageChart(filters));
    dispatch(fetchSuperWastageTable({ filters, page: currentPage }));
  }, [
    dispatch,
    filters.orgId,
    filters.vendor,
    filters.mealType,
    filters.days,
    currentPage,
    filtersAppliedAt,
  ]);

  const handleApply = () => {
    const vendorObj = vendors.find(v => v.name === localVendor);
    dispatch(setSuperWastageFilters({
      orgId:    activeOrgId,
      vendor:   vendorObj?._id ?? "all",
      mealType: localMealType,
      days:     DAY_MAP[localPeriod] ?? 7,
    }));
  };

  const vendorNames   = ["All Vendors", ...vendors.map(v => v.name)];
  const activeOrgLabel = activeOrgId === "all"
    ? "All Organizations"
    : orgOptions.find(o => o.value === activeOrgId)?.label ?? activeOrgId;

  const statCards = [
    {
      label: "Total Expected",
      value: summaryLoading ? null : (summary?.totalExpected ?? 0).toLocaleString(),
      trend: summary?.wasteTrend != null ? `${Math.abs(summary.wasteTrend)}% vs prev period` : undefined,
      trendBad: (summary?.wasteTrend ?? 0) > 0,
      sub: undefined,
    },
    {
      label: "Total Delivered",
      value: summaryLoading ? null : (summary?.totalDelivered ?? 0).toLocaleString(),
      trend: undefined, trendBad: false,
      sub: summary?.efficiency != null ? `${summary.efficiency}% consumption rate` : undefined,
    },
    {
      label: "Total Eaten",
      value: summaryLoading ? null : (summary?.totalEaten ?? 0).toLocaleString(),
      trend: undefined, trendBad: false, sub: undefined,
    },
    {
      label: "Avg Wastage",
      value: summaryLoading ? null : `${summary?.avgWastagePercent ?? 0}%`,
      trend: summary?.wasteTrend != null ? `${summary.wasteTrend > 0 ? "+" : ""}${summary.wasteTrend}% trend` : undefined,
      trendBad: (summary?.wasteTrend ?? 0) > 0,
      sub: undefined,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F5] font-[var(--font-manrope)]">
      <div className="mx-auto w-full px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5">

        {/* Title + Filters */}
        <div className="flex flex-col md:grid md:grid-cols-2 gap-4">
          <div className="md:mt-auto">
            <h1 className="text-2xl sm:text-[32px] font-bold text-[var(--text-primary)] tracking-tight">
              Food Wastage Report
            </h1>
            <p className="text-xs sm:text-base text-[#64748B] mt-1 font-[var(--font-inter)]">
              {activeOrgId === "all"
                ? "Combined wastage analysis across all organizations."
                : `Wastage analysis for: ${activeOrgLabel}`}
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="grid grid-cols-2 gap-3 mb-3">
              {/* Vendor */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-[#94A3B8] mb-1 font-[var(--font-inter)]">
                  Vendor
                </label>
                {vendorsLoading ? (
                  <Skeleton className="h-[38px] w-full" />
                ) : (
                  <select
                    value={localVendor}
                    onChange={e => setLocalVendor(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 h-[38px] outline-none focus:border-orange-400 bg-white text-gray-700"
                  >
                    {vendorNames.map(v => <option key={v}>{v}</option>)}
                  </select>
                )}
              </div>

              {/* Period */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-[#94A3B8] mb-1 font-[var(--font-inter)]">
                  Period
                </label>
                <select
                  value={localPeriod}
                  onChange={e => setLocalPeriod(e.target.value as typeof PERIODS[number])}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 h-[38px] outline-none focus:border-orange-400 bg-white text-gray-700"
                >
                  {PERIODS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div className="flex items-end gap-2 sm:gap-3">
              {/* Meal Type */}
              <div className="flex-1">
                <label className="block text-xs font-bold uppercase tracking-widest text-[#94A3B8] mb-1 font-[var(--font-inter)]">
                  Meal Type
                </label>
                <select
                  value={localMealType}
                  onChange={e => setLocalMealType(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 h-[38px] outline-none focus:border-orange-400 bg-white text-gray-700"
                >
                  {MEAL_OPTIONS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>

              <button
                onClick={handleApply}
                className="flex items-center gap-1.5 bg-[var(--brand)] hover:opacity-90 text-white font-semibold text-sm px-4 h-[38px] rounded-lg font-[var(--font-inter)]"
              >
                <img src={IcFilter} alt="" className="w-3.5 h-3.5 brightness-0 invert" />
                Apply
              </button>
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {statCards.map(({ label, value, trend, trendBad, sub }) => (
            <div key={label} className="bg-white rounded-xl p-3 sm:p-4 flex flex-col gap-1.5 shadow-sm">
              <span className="text-[10px] sm:text-xs font-bold text-[var(--text-label)] uppercase tracking-wide font-[var(--font-inter)]">
                {label}
              </span>
              {value == null
                ? <Skeleton className="h-8 w-24 mt-1" />
                : <p className="text-2xl sm:text-3xl font-medium text-[var(--text-primary)] font-[var(--font-manrope)]">{value}</p>
              }
              {trend && (
                <span className={`text-[10px] sm:text-xs font-semibold font-[var(--font-inter)] flex items-center gap-1 ${trendBad ? "text-[#BA1A1A]" : "text-[var(--brand)]"}`}>
                  <img src={trendBad ? IcArrowUp : IcArrowDown} alt="" className="w-3 h-3" />
                  {trend}
                </span>
              )}
              {sub && (
                <span className="text-[10px] sm:text-sm font-semibold font-[var(--font-inter)] flex items-center gap-1.5 text-[#94A3B8]">
                  {sub}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col gap-3 mb-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-[var(--text-primary)]">
                Expected vs Actual Meals
              </h2>
              <p className="text-xs text-[var(--text-label)] mt-0.5 font-[var(--font-inter)]">
                Daily meal distribution for the selected period
              </p>
            </div>
            <div className="flex items-center gap-4 sm:gap-5 shrink-0">
              {CHART_LEGEND.map(([color, lbl]) => (
                <span key={lbl} className="flex items-center gap-1.5 text-xs text-[var(--text-label)] font-bold font-[var(--font-inter)]">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: color }} />
                  {lbl}
                </span>
              ))}
            </div>
          </div>

          {chartLoading ? (
            <Skeleton className="h-44 sm:h-52 mt-4 w-full" />
          ) : (
            <>
              <div className="h-44 sm:h-52 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="day" hide />
                    <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} domain={["auto","auto"]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="Expected" stroke="#d1d5db" strokeWidth={2}
                      dot={{ r: 4, fill: "#d1d5db", strokeWidth: 0 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="Delivered" stroke="#994700" strokeWidth={2.5}
                      dot={{ r: 4, fill: "#994700", strokeWidth: 0 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-around pl-4 mt-2">
                {chartData.map(({ day, Expected, Delivered }) => (
                  <div key={day} className="flex flex-col items-center gap-0.5 flex-1">
                    <div className="flex gap-0.5 sm:gap-1">
                      <span className="text-[9px] sm:text-xs text-gray-400">{Expected}</span>
                      <span className="text-[9px] sm:text-xs text-[var(--brand)] font-semibold">{Delivered}</span>
                    </div>
                    <span className="text-[9px] sm:text-xs font-semibold text-gray-500">{day}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex flex-col gap-2 p-4 sm:p-5 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm sm:text-base font-semibold text-[var(--text-primary)]">
              Detailed Wastage Log
            </h2>
            <button className="flex items-center gap-2 text-sm font-bold text-[var(--brand)] hover:opacity-80 font-[var(--font-inter)]">
              <img src={IcDownload} alt="" className="w-4 h-4" /> Export Report
            </button>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[500px]">
              <div className="grid grid-cols-6 gap-2 px-4 sm:px-5 py-2.5 bg-[#F5F5F5] border-b border-[var(--divider)]">
                {["Date","Expected","Delivered","Eaten","Wastage","Wastage %"].map(h => (
                  <span key={h} className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[var(--text-label)] font-[var(--font-inter)]">
                    {h}
                  </span>
                ))}
              </div>

              {tableLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="grid grid-cols-6 gap-2 px-4 sm:px-5 py-3 border-b border-[var(--divider)]">
                      {Array.from({ length: 6 }).map((_, j) => <Skeleton key={j} className="h-4 w-full" />)}
                    </div>
                  ))
                : tableRows.length === 0
                  ? (
                    <div className="py-10 text-center text-sm text-[var(--text-label)] font-[var(--font-inter)]">
                      No data found for the selected filters.
                    </div>
                  )
                  : tableRows.map((row, i) => (
                      <div key={i} className="grid grid-cols-6 gap-2 px-4 sm:px-5 py-3 border-b border-[var(--divider)] last:border-0 items-center">
                        <span className="text-xs sm:text-sm font-bold text-[var(--text-primary)] font-[var(--font-inter)] whitespace-nowrap">{row.date}</span>
                        <span className="text-xs sm:text-sm text-[var(--text-label)] font-medium font-[var(--font-inter)]">{row.expected}</span>
                        <span className="text-xs sm:text-sm text-[var(--text-label)] font-medium font-[var(--font-inter)]">{row.delivered}</span>
                        <span className="text-xs sm:text-sm text-[var(--text-label)] font-medium font-[var(--font-inter)]">{row.eaten}</span>
                        <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold w-fit ${badgeClass(row.wastageCount)}`}>
                          {row.wastageCount}
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-[var(--text-primary)] font-[var(--font-inter)]">{row.wastagePercent}%</span>
                      </div>
                    ))
              }
            </div>
          </div>

          {/* Pagination */}
          <div className="flex flex-col items-center gap-3 p-4 sm:p-5 sm:flex-row sm:justify-between">
            <span className="text-xs sm:text-sm text-[var(--text-label)] font-medium font-[var(--font-inter)]">
              {pagination
                ? `Showing ${(currentPage - 1) * pagination.limit + 1} to ${Math.min(currentPage * pagination.limit, pagination.total)} of ${pagination.total} days`
                : "Loading…"}
            </span>
            <div className="flex items-center gap-2">
              {NAV_ICONS.map((d, i) => {
                const isFirst  = i === 0;
                const disabled = isFirst
                  ? currentPage <= 1
                  : currentPage >= (pagination?.totalPages ?? 1);
                return (
                  <button
                    key={i}
                    disabled={disabled}
                    onClick={() => dispatch(setSuperWastagePage(currentPage + (isFirst ? -1 : 1)))}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border)] hover:bg-[var(--page-bg)] ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d={d} />
                    </svg>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          <div className="relative rounded-xl overflow-hidden min-h-44 sm:min-h-52">
            <img src={foodWastageFooterBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="relative z-10 p-5 sm:p-6 flex flex-col justify-end h-full">
              <h3 className="text-base sm:text-lg text-white mb-2 sm:mb-3 font-[var(--font-manrope)]">
                Optimize Your Next Week
              </h3>
              <p className="text-xs sm:text-sm text-[#CBD5E1] font-[var(--font-inter)] leading-relaxed mb-4 sm:mb-5 max-w-sm">
                {summary?.wasteTrend != null && summary.wasteTrend > 0
                  ? `Wastage is up ${summary.wasteTrend}% vs the previous period${activeOrgId !== "all" ? ` for ${activeOrgLabel}` : " across all organizations"}. Consider reducing orders or sending reminders.`
                  : "Based on current wastage patterns, reducing Thursday's lunch order by 15% could save significantly this month."}
              </p>
              <button className="w-fit bg-[var(--brand)] hover:opacity-90 text-white text-sm px-5 py-2 rounded-lg font-[var(--font-inter)]">
                Adjust Orders
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 sm:p-6 shadow-sm flex flex-col items-center text-center justify-center gap-3 sm:gap-4">
            <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-full bg-amber-50 flex items-center justify-center">
              <img src={IcBrain} alt="" className="w-[55%] h-[55%] object-contain" />
            </div>
            <h3 className="text-sm sm:text-base font-[var(--font-manrope)] text-[var(--text-primary)]">AI Insight</h3>
            <p className="text-xs sm:text-sm text-[var(--text-label)] font-[var(--font-inter)] leading-relaxed max-w-xs">
              {summary
                ? summary.avgWastagePercent > 15
                  ? `Average wastage is at ${summary.avgWastagePercent}%${activeOrgId !== "all" ? ` for ${activeOrgLabel}` : ""}  — above the 15% threshold. Consider a 'Confirm Lunch' notification to reduce over-ordering.`
                  : `Wastage is well-controlled at ${summary.avgWastagePercent}%${activeOrgId !== "all" ? ` for ${activeOrgLabel}` : ""}. Keep tracking daily to catch spikes early.`
                : "Wastage typically peaks on Thursdays. Consider a 'Confirm Lunch' notification for Thursdays."}
            </p>
            <button className="text-sm font-bold text-[var(--brand)] hover:opacity-75 font-[var(--font-inter)]">
              Enable Notifications
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}