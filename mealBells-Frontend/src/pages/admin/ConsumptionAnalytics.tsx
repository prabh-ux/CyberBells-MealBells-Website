import { useState, useEffect, useMemo, useCallback } from "react";
import { useDispatch, useSelector }                   from "react-redux";
import { Utensils, Flame, Users2, CalendarDays, Download, Loader2 } from "lucide-react";
import DropDown                from "../../components/shared/DropDown";
import type { RootState, AppDispatch } from "../../app/store";
import {
  fetchAnalyticsSummary,
  fetchMealsChart,
  cacheKey,
  DEFAULT_FILTERS,
}                              from "../../slices/adminAnalyticsSlice";
import {
  fetchConsumptionBreakdown,
  fetchLiveFeed,
  setConsumptionFilters,
  timeFrameToDays,
}                              from "../../slices/ConsumptionSliceAdmin";

// ── Helpers ───────────────────────────────────────────────────────────────────

const buildSvgPath = (
  points: number[],
  svgW  = 700,
  svgH  = 200,
  padX  = 20,
  padY  = 20,
): string => {
  if (!points.length) return "";
  const max = Math.max(...points, 1);
  const min = 0;
  const coords = points.map((v, i) => {
    const x = padX + (i / Math.max(points.length - 1, 1)) * (svgW - padX * 2);
    const y = svgH - padY - ((v - min) / (max - min || 1)) * (svgH - padY * 2);
    return [x, y] as [number, number];
  });
  if (coords.length === 1) return `M ${coords[0][0]} ${coords[0][1]}`;
  let d = `M ${coords[0][0]} ${coords[0][1]}`;
  for (let i = 1; i < coords.length; i++) {
    const prev = coords[i - 1];
    const curr = coords[i];
    const cpx  = (prev[0] + curr[0]) / 2;
    d += ` Q ${cpx} ${prev[1]}, ${curr[0]} ${curr[1]}`;
  }
  return d;
};

const heatColor = (count: number, max: number): string => {
  if (max === 0) return "bg-[#fff7ed]";
  const ratio = count / max;
  if (ratio === 0)     return "bg-[#fff7ed]";
  if (ratio <= 0.25)   return "bg-[#fff2e6]";
  if (ratio <= 0.50)   return "bg-[#fed7aa]";
  if (ratio <= 0.75)   return "bg-[#ffb066]";
  return "bg-[#ff7a00]";
};

const TIME_FRAMES  = ["This Month", "This Week", "Today"] as const;
const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const BAR_MAX_HEIGHT = 150;

// ── Component ─────────────────────────────────────────────────────────────────

export default function ConsumptionAnalytics() {
  const dispatch = useDispatch<AppDispatch>();

  const [timeFrame,    setTimeFrame]    = useState<typeof TIME_FRAMES[number]>("This Month");
  // FIX: replaced "vegan" with "both" in the hover state type
  const [hoveredSlice, setHoveredSlice] = useState<"veg" | "nonveg" | "both" | null>(null);
  const [hoveredBar,   setHoveredBar]   = useState<number | null>(null);

  const summary          = useSelector((s: RootState) => s.analytics.summary);
  const summaryLoading   = useSelector((s: RootState) => s.analytics.summaryLoading);
  const mealsChart       = useSelector((s: RootState) => s.analytics.mealsChart);
  const breakdown        = useSelector((s: RootState) => s.consumption.breakdown);
  const breakdownLoading = useSelector((s: RootState) => s.consumption.breakdownLoading);
  const liveFeed         = useSelector((s: RootState) => s.consumption.liveFeed);
  const liveFeedLoading  = useSelector((s: RootState) => s.consumption.liveFeedLoading);

  const days             = useMemo(() => timeFrameToDays(timeFrame), [timeFrame]);
const analyticsFilters = useMemo(
  () => ({ ...DEFAULT_FILTERS, days: (days === 1 ? 7 : days) as 7 | 14 | 30 }),
  [days]
);  const chartKey         = useMemo(() => cacheKey(analyticsFilters), [analyticsFilters]);
  const chartData        = mealsChart[chartKey] ?? [];

  useEffect(() => {
    dispatch(fetchAnalyticsSummary(analyticsFilters));
    if (!mealsChart[chartKey]) {
      dispatch(fetchMealsChart(analyticsFilters));
    }
    dispatch(setConsumptionFilters({ days }));
    dispatch(fetchConsumptionBreakdown({ days, department: "all", vendorId: "all" }));
  }, [days]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    dispatch(fetchLiveFeed(20));
    const id = setInterval(() => dispatch(fetchLiveFeed(20)), 30_000);
    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTimeFrameChange = useCallback((tf: string) => {
    setTimeFrame(tf as typeof TIME_FRAMES[number]);
  }, []);

  const last7      = chartData.slice(-7);
  const maxCount   = Math.max(...last7.map(d => d.count), 1);
  const barHeights = last7.map(d => Math.max(4, Math.round((d.count / maxCount) * BAR_MAX_HEIGHT)));

  const linePath = buildSvgPath(chartData.map(d => d.count));

  // ── Meal type breakdown — safely derived ──────────────────────────────────
  const mb = breakdown?.mealTypeBreakdown;

  // FIX: use bothPct/bothCount — "Both" is the third dishType, not "Vegan"
  const nonVegPct = mb?.nonVeg ?? 0;
  const vegPct    = mb?.veg    ?? 0;
  const bothPct   = mb?.both   ?? 0;   // FIX: was mb?.vegan

  // FIX: Donut center — uses "both" slice key instead of "vegan"
  const donutCenter = useMemo(() => {
    if (!mb) return { count: "0", label: "Total" };
    if (hoveredSlice === "nonveg") return { count: (mb.nonVegCount ?? 0).toLocaleString(), label: "Non-Veg" };
    if (hoveredSlice === "veg")    return { count: (mb.vegCount    ?? 0).toLocaleString(), label: "Vegetarian" };
    if (hoveredSlice === "both")   return { count: (mb.bothCount   ?? 0).toLocaleString(), label: "Both" };  // FIX: was "vegan"→"Vegan"
    return { count: (mb.total ?? 0).toLocaleString(), label: "Total" };
  }, [hoveredSlice, mb]);

  const heatmapRows = breakdown?.heatmap ?? [];
  const heatmapMax  = Math.max(...heatmapRows.flatMap(r => r.counts), 1);

  const totalConsumed     = chartData.reduce((s, d) => s + d.count, 0);
  const leastDayName      = breakdown?.leastActiveDay?.name  ?? "—";
  const mostDeptName      = breakdown?.mostActiveDept?.name  ?? "—";
  const mostDeptCount     = breakdown?.mostActiveDept?.count ?? 0;
  const topDishName       = breakdown?.topDish?.name         ?? "—";
  const topDishPopularity = breakdown?.topDish?.popularity   ?? 0;

  const isLoading = summaryLoading || breakdownLoading;

  const stats = [
    {
      title:      "Total Consumption",
      value:      isLoading ? "…" : `${totalConsumed.toLocaleString()} Meals`,
      badge:      summary?.userGrowthPct != null
                    ? `${summary.userGrowthPct > 0 ? "+" : ""}${summary.userGrowthPct}%${summary.userGrowthPct >= 0 ? "↑" : "↓"}`
                    : "—",
      badgeColor: (summary?.userGrowthPct ?? 0) >= 0 ? "text-[#c25e1a]" : "text-[#b91c1c]",
      icon:       <Utensils className="w-5 h-5 text-[#934411]" />,
      bg:         "bg-[#fdf2ec]",
    },
    {
      title:      "Highest Demand Dish",
      value:      isLoading ? "…" : topDishName,
      badge:      isLoading ? "—" : `Popularity: ${topDishPopularity}%`,
      badgeColor: "text-slate-500",
      icon:       <Flame className="w-5 h-5 text-[#3b82f6]" />,
      bg:         "bg-[#eff6ff]",
    },
    {
      title:      "Most Active Dept",
      value:      isLoading ? "…" : mostDeptName,
      badge:      isLoading ? "—" : `${mostDeptCount.toLocaleString()} Meals`,
      badgeColor: "text-[#0284c7]",
      icon:       <Users2 className="w-5 h-5 text-[#0284c7]" />,
      bg:         "bg-[#f0f9ff]",
    },
    {
      title:      "Least Active Day",
      value:      isLoading ? "…" : leastDayName,
      badge:      isLoading ? "—" : "Fewest meals",
      badgeColor: "text-[#b91c1c]",
      icon:       <CalendarDays className="w-5 h-5 text-[#b91c1c]" />,
      bg:         "bg-[#fef2f2]",
    },
  ];

  return (
    <div className="min-h-screen bg-[#fcfcfc] p-4 md:p-6 cursor-pointer select-none overflow-y-auto">
      <div className="max-w-7xl mx-auto">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Consumption Analytics</h1>
            <p className="text-sm text-gray-400 mt-1">
              Detailed breakdown of food utilization and employee demand across MealMom hubs.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Time Frame:</span>
              <DropDown
                value={timeFrame}
                options={[...TIME_FRAMES]}
                onChange={handleTimeFrameChange}
              />
            </div>
            <button className="bg-[#934411] hover:bg-[#7a380e] text-white px-4 py-2 rounded-xl text-xs font-medium shadow flex items-center gap-2">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-transform hover:scale-[1.01]"
            >
              <div className="flex items-center justify-between mb-5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.bg}`}>
                  {item.icon}
                </div>
                <span className={`text-[11px] font-bold tracking-tight ${item.badgeColor}`}>
                  {item.badge}
                </span>
              </div>
              <p className="text-[12px] font-semibold text-[#8a5d45] mb-2">{item.title}</p>
              {isLoading ? (
                <div className="h-6 w-32 bg-gray-100 animate-pulse rounded" />
              ) : (
                <h3 className="text-[20px] font-bold text-gray-900 leading-none tracking-tight">
                  {item.value}
                </h3>
              )}
            </div>
          ))}
        </div>

        {/* ── Charts Row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">

          {/* Line Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-800 text-sm">Meals Consumed Over Time</h2>
              <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#934411]" /> Total
                </div>
                {chartData.length > 0 && (
                  <span className="text-[11px] text-gray-300">
                    {chartData[0]?.fullDate} → {chartData[chartData.length - 1]?.fullDate}
                  </span>
                )}
              </div>
            </div>

            {chartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
              </div>
            ) : (
              <div className="relative h-64 w-full overflow-hidden mt-8">
                <svg viewBox="0 0 700 220" className="w-full h-full">
                  {[55, 110, 165].map(y => (
                    <line key={y} x1="20" y1={y} x2="680" y2={y}
                      stroke="#f1f5f9" strokeWidth="1" />
                  ))}
                  {linePath && (
                    <path d={linePath} fill="none" stroke="#934411"
                      strokeWidth="2.5" strokeLinecap="round" />
                  )}
                  {chartData.map((d, i) => {
                    const counts = chartData.map(x => x.count);
                    const max    = Math.max(...counts, 1);
                    const x      = 20 + (i / Math.max(chartData.length - 1, 1)) * 660;
                    const y      = 200 - 20 - (d.count / max) * 160;
                    return (
                      <circle key={i} cx={x} cy={y} r="3"
                        fill="white" stroke="#934411" strokeWidth="2" />
                    );
                  })}
                </svg>
                <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 text-[11px] font-medium text-gray-400">
                  {chartData.map((d, i) =>
                    (i % Math.ceil(chartData.length / 7) === 0 || i === chartData.length - 1)
                      ? <span key={i}>{d.day}</span>
                      : <span key={i} />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Donut Chart */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
            {/* FIX: updated title — no more "Vegan", third category is "Both" */}
            <h2 className="font-bold text-gray-800 text-sm mb-6">Veg vs Non-Veg Consumption</h2>

            {breakdownLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
              </div>
            ) : (
              <>
                <div className="flex justify-center items-center flex-1">
                  <div className="relative w-44 h-44 flex items-center justify-center">
                    <svg viewBox="0 0 42 42"
                      className="w-full h-full transform -rotate-90 select-none outline-none">
                      {/* FIX: show placeholder ring when all 0% */}
                      {(nonVegPct + vegPct + bothPct === 0) ? (
                        <circle cx="21" cy="21" r="15.915"
                          fill="none" stroke="#e2e8f0" strokeWidth="5.8"
                          strokeDasharray="100 0"
                        />
                      ) : (
                        <>
                          {/* FIX: third slice is "Both" (gray-300), was "Vegan" */}
                          <circle cx="21" cy="21" r="15.915"
                            fill="none" stroke="#e2e8f0" strokeWidth="5.8"
                            strokeDasharray={`${bothPct} ${100 - bothPct}`}
                            strokeDashoffset="0"
                            className="cursor-pointer transition-all duration-200 hover:stroke-gray-300"
                            onMouseEnter={() => setHoveredSlice("both")}   // FIX: was "vegan"
                            onMouseLeave={() => setHoveredSlice(null)}
                          />
                          <circle cx="21" cy="21" r="15.915"
                            fill="none" stroke="#934411" strokeWidth="5.8"
                            strokeDasharray={`${vegPct} ${100 - vegPct}`}
                            strokeDashoffset={`-${bothPct}`}               // FIX: was veganPct
                            className="cursor-pointer transition-all duration-200 hover:opacity-90"
                            onMouseEnter={() => setHoveredSlice("veg")}
                            onMouseLeave={() => setHoveredSlice(null)}
                          />
                          <circle cx="21" cy="21" r="15.915"
                            fill="none" stroke="#ff7a00" strokeWidth="5.8"
                            strokeDasharray={`${nonVegPct} ${100 - nonVegPct}`}
                            strokeDashoffset={`-${bothPct + vegPct}`}      // FIX: was veganPct + vegPct
                            className="cursor-pointer transition-all duration-200 hover:opacity-90"
                            onMouseEnter={() => setHoveredSlice("nonveg")}
                            onMouseLeave={() => setHoveredSlice(null)}
                          />
                        </>
                      )}
                    </svg>
                    <div className="absolute w-[104px] h-[104px] bg-white rounded-full flex flex-col items-center justify-center pointer-events-none">
                      <h3 className="text-2xl font-extrabold text-gray-800 transition-all duration-150">
                        {breakdownLoading ? "…" : donutCenter.count}
                      </h3>
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                        {donutCenter.label}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-3 text-xs font-medium text-gray-500">
                  {/* FIX: third row is "Both" using mb.bothCount — was "Vegan"/mb.veganCount */}
                  {[
                    { color: "bg-[#ff7a00]", label: "Non-Veg", pct: `${nonVegPct}%`, count: mb?.nonVegCount ?? 0 },
                    { color: "bg-[#934411]", label: "Veg",     pct: `${vegPct}%`,    count: mb?.vegCount    ?? 0 },
                    { color: "bg-gray-300",  label: "Both",    pct: `${bothPct}%`,   count: mb?.bothCount   ?? 0 },
                  ].map(({ color, label, pct, count }) => (
                    <div key={label} className="flex items-center justify-between p-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${color}`} />{label}
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-gray-700">{pct}</span>
                        <span className="ml-1 text-gray-400">({count.toLocaleString()})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Bottom Row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">

          {/* Heat Map */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden">
            <h2 className="font-bold text-gray-800 text-sm mb-6">Most Active Departments by Day</h2>

            {breakdownLoading ? (
              <div className="h-40 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
              </div>
            ) : heatmapRows.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">No data available</p>
            ) : (
              <div className="w-full overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <div className="min-w-[340px]">
                  <div className="grid grid-cols-8 gap-2 mb-3 text-center">
                    <div />
                    {DAYS_OF_WEEK.map(day => (
                      <span key={day} className="text-[11px] font-medium text-gray-400">{day}</span>
                    ))}
                  </div>
                  <div className="space-y-3">
                    {heatmapRows.map(row => (
                      <div key={row.dept} className="grid grid-cols-8 gap-2 items-center">
                        <span className="text-xs font-medium text-gray-500 text-left pr-2 truncate" title={row.dept}>
                          {row.dept}
                        </span>
                        {row.counts.map((count, idx) => (
                          <div
                            key={idx}
                            title={`${count} meals`}
                            className={`aspect-square rounded-md ${heatColor(count, heatmapMax)} transition-all duration-200 hover:scale-105`}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end items-center gap-2 mt-6 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              <span>Less</span>
              {["bg-[#fff7ed]", "bg-[#fff2e6]", "bg-[#fed7aa]", "bg-[#ffb066]", "bg-[#ff7a00]"].map(c => (
                <div key={c} className={`w-3 h-3 rounded ${c}`} />
              ))}
              <span>More</span>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
            <h2 className="font-bold text-gray-800 text-sm mb-5">Peak Consumption Days</h2>

            {last7.length === 0 ? (
              <div className="h-48 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
              </div>
            ) : (
              <>
                <div className="flex items-end justify-between h-48 gap-3 px-2 relative">
                  {last7.map((d, index) => (
                    <div
                      key={index}
                      className="flex-1 flex flex-col items-center justify-end h-full relative"
                      onMouseEnter={() => setHoveredBar(index)}
                      onMouseLeave={() => setHoveredBar(null)}
                    >
                      <div
                        className={`absolute bg-white border border-orange-100 rounded-xl p-2 shadow-md flex flex-col text-left min-w-[80px] transition-all duration-200 z-10 ${
                          hoveredBar === index
                            ? "opacity-100 translate-y-0 scale-100"
                            : "opacity-0 translate-y-2 scale-95 pointer-events-none"
                        }`}
                        style={{ bottom: `${barHeights[index] + 8}px` }}
                      >
                        <span className="text-[11px] font-bold text-gray-800">{d.day}</span>
                        <span className="text-[11px] font-bold text-red-950 whitespace-nowrap mt-0.5">
                          {d.count.toLocaleString()} meals
                        </span>
                        <span className="text-[10px] text-gray-400">{d.fullDate}</span>
                      </div>
                      <div
                        className="w-full bg-[#6e3d10] rounded-t-lg transition-all duration-300 hover:opacity-95"
                        style={{ height: `${barHeights[index]}px` }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-4 text-[11px] font-medium text-gray-400 px-1">
                  {last7.map((d, i) => (
                    <span key={i} className="w-full text-center flex-1">{d.day}</span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Live Feed ── */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <div className="p-5 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-bold text-gray-800 text-sm">Live Consumption Feed</h2>
            {liveFeedLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-300" />}
          </div>
          <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-black-400 font-bold text-[14px] uppercase tracking-wider">
                <tr>
                  {["Time", "Employee", "Department", "Item Ordered", "Status"].map(h => (
                    <th key={h} className="text-left px-6 py-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs">
                {liveFeed.length === 0 && !liveFeedLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                      No recent consumption data
                    </td>
                  </tr>
                ) : (
                  liveFeed.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-gray-400 font-medium">{item.time}</td>
                      <td className="px-6 py-4 font-bold text-gray-800">{item.employee}</td>
                      <td className="px-6 py-4 text-gray-500 font-medium">{item.department}</td>
                      <td className="px-6 py-4 text-gray-500 font-medium">{item.item}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                          item.status === "SERVED"
                            ? "bg-blue-50 text-blue-500"
                            : "bg-orange-50 text-orange-600"
                        }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}