import { useState, useRef, useEffect }  from "react";
import { useDispatch, useSelector }      from "react-redux";
import type { AppDispatch, RootState }   from "../../app/store";

import {
  fetchAnalyticsSummary,
  fetchMealsChart,
  fetchRecentActivity,
  fetchAttendanceChart,
  DEFAULT_FILTERS,
} from "../../slices/adminAnalyticsSlice";

import AnalyticsDashboardHeader          from "../../components/admin/AnalyticsDashboard/AnalyticsDashboardHeader";
import AnalyticsDashboardStatCards       from "../../components/admin/AnalyticsDashboard/AnalyticsDashboardStatCards";
import AnalyticsDashboardMealsChart      from "../../components/admin/AnalyticsDashboard/AnalyticsDashboardMealsChart";
import AnalyticsDashboardAttendanceChart from "../../components/admin/AnalyticsDashboard/AnalyticsDashboardAttendanceChart";
import AnalyticsDashboardRecentActivity  from "../../components/admin/AnalyticsDashboard/AnalyticsDashboardRecentActivity";
import type { ActivityItem, AnalyticsFilters } from "../../slices/adminAnalyticsSlice";

// ── Helpers ───────────────────────────────────────────────────────────────────

const RANGE_TO_DAYS: Record<string, 7 | 14 | 30> = {
  "Last 7 Days":  7,
  "Last 14 Days": 14,
  "Last 30 Days": 30,
};

const PAGE_SIZE = 3;

const makeFilters = (days: 7 | 14 | 30): AnalyticsFilters => ({
  ...DEFAULT_FILTERS,
  days,
});

const cacheKey = (f: AnalyticsFilters) =>
  `${f.days}|${f.department}|${f.vendorId}|${f.mealType}`;

export function exportToCSV(data: ActivityItem[]) {
  const headers = ["Date", "Time", "Name", "Email", "Action", "Status"];
  const rows    = data.map(a => [a.date, a.time, a.name, a.email, a.action, a.status]);
  const csv     = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
  const blob    = new Blob([csv], { type: "text/csv" });
  const url     = URL.createObjectURL(blob);
  const a       = document.createElement("a");
  a.href = url; a.download = "activity-log.csv"; a.click();
  URL.revokeObjectURL(url);
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AnalyticsDashboard() {
  const dispatch = useDispatch<AppDispatch>();

  const {
    summary, mealsChart, attendanceChart, activities,
    summaryLoading, mealsLoading, attendanceLoading,
  } = useSelector((s: RootState) => s.analytics);

  const [mealRange,    setMealRange]    = useState("Last 7 Days");
  const [search,       setSearch]       = useState("");
  const [page,         setPage]         = useState(0);
  const [filterOpen,   setFilterOpen]   = useState(false);
  const [activeStatus, setActiveStatus] = useState("All");
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dispatch(fetchAnalyticsSummary(DEFAULT_FILTERS));
    dispatch(fetchMealsChart(makeFilters(7)));
    dispatch(fetchAttendanceChart(makeFilters(7)));
    dispatch(fetchRecentActivity(50));
  }, [dispatch]);

  useEffect(() => {
    const days    = RANGE_TO_DAYS[mealRange];
    const filters = makeFilters(days);
    const key     = cacheKey(filters);
    if (!mealsChart[key])      dispatch(fetchMealsChart(filters));
    if (!attendanceChart[key]) dispatch(fetchAttendanceChart(filters));
  }, [mealRange, dispatch, mealsChart, attendanceChart]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node))
        setFilterOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const days           = RANGE_TO_DAYS[mealRange];
  const key            = cacheKey(makeFilters(days));
  const mealsData      = mealsChart[key]      ?? [];
  const attendanceData = attendanceChart[key] ?? [];
  const mealsMax       = mealsData.length ? Math.max(...mealsData.map(d => d.count)) : 1;

  const filtered = activities.filter(a => {
    const matchesSearch = !search || [a.name, a.action, a.email].some(v => v.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = activeStatus === "All" || a.status === activeStatus;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const safePage   = Math.min(page, Math.max(0, totalPages - 1));
  const paginated  = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  const handleSearch       = (val: string) => { setSearch(val);     setPage(0); };
  const handleStatusFilter = (s: string)   => { setActiveStatus(s); setPage(0); setFilterOpen(false); };
  const handlePrev         = ()            => setPage(p => Math.max(0, p - 1));
  const handleNext         = ()            => setPage(p => Math.min(totalPages - 1, p + 1));

  return (
    // Responsive padding: tight on mobile, generous on desktop
    <div className="min-h-full bg-[#F5F5F5] p-3 sm:p-5 lg:p-7 font-sans">
      <div className="flex flex-col gap-4 sm:gap-5 lg:gap-6">

        <AnalyticsDashboardHeader onExport={() => exportToCSV(activities)} />

        <AnalyticsDashboardStatCards summary={summary} loading={summaryLoading} />

        {/* Charts: stacked on mobile/tablet, side-by-side on lg */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          <AnalyticsDashboardMealsChart
            mealsData={mealsData}
            mealsMax={mealsMax}
            mealRange={mealRange}
            loading={mealsLoading}
                         attendanceData={attendanceData}

            onRangeChange={setMealRange}
          />
          <AnalyticsDashboardAttendanceChart
            attendanceData={attendanceData}
            loading={attendanceLoading}
          />
        </div>

        <AnalyticsDashboardRecentActivity
          paginated={paginated}
          filtered={filtered}
          search={search}
          activeStatus={activeStatus}
          filterOpen={filterOpen}
          safePage={safePage}
          totalPages={totalPages}
          pageSize={PAGE_SIZE}
          filterRef={filterRef}
          onSearch={handleSearch}
          onStatusFilter={handleStatusFilter}
          onToggleFilter={() => setFilterOpen(o => !o)}
          onPrev={handlePrev}
          onNext={handleNext}
        />

      </div>
    </div>
  );
}