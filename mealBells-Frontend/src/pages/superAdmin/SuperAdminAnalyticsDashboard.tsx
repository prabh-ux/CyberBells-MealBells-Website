import { useState, useRef, useEffect }  from "react";
import { useDispatch, useSelector }      from "react-redux";
import type { AppDispatch, RootState }   from "../../app/store";

import {
  fetchSuperAnalyticsSummary,
  fetchSuperMealsChart,
  fetchSuperRecentActivity,
  fetchSuperAttendanceChart,
  superCacheKey,
  DEFAULT_SUPER_FILTERS,
} from "../../slices/superAdmin/superAdminAnalyticsSlice";
import type { ActivityItem, SuperAnalyticsFilters } from "../../slices/superAdmin/superAdminAnalyticsSlice";

// Reuse the same presentational components — no changes needed there
import SuperAdminDashboardHeader         from "../../components/superAdmin/SuperAdminDashboardHeader";
import AnalyticsDashboardStatCards       from "../../components/admin/AnalyticsDashboard/AnalyticsDashboardStatCards";
import AnalyticsDashboardMealsChart      from "../../components/admin/AnalyticsDashboard/AnalyticsDashboardMealsChart";
import AnalyticsDashboardAttendanceChart from "../../components/admin/AnalyticsDashboard/AnalyticsDashboardAttendanceChart";
import AnalyticsDashboardRecentActivity  from "../../components/admin/AnalyticsDashboard/AnalyticsDashboardRecentActivity";

// ── Helpers ───────────────────────────────────────────────────────────────────

const RANGE_TO_DAYS: Record<string, 7 | 14 | 30> = {
  "Last 7 Days":  7,
  "Last 14 Days": 14,
  "Last 30 Days": 30,
};

const PAGE_SIZE = 3;

const makeFilters = (
  days: 7 | 14 | 30,
  orgId: string
): SuperAnalyticsFilters => ({
  ...DEFAULT_SUPER_FILTERS,
  days,
  orgId,
});

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

export default function SuperAdminAnalyticsDashboard() {
  const dispatch = useDispatch<AppDispatch>();

  const {
    summary,
    mealsChart,
    attendanceChart,
    activities,
    summaryLoading,
    mealsLoading,
    attendanceLoading,
    filters,
  } = useSelector((s: RootState) => s.superAnalytics);

  const activeOrgId = filters.orgId;

  const [mealRange,    setMealRange]    = useState("Last 7 Days");
  const [search,       setSearch]       = useState("");
  const [page,         setPage]         = useState(0);
  const [filterOpen,   setFilterOpen]   = useState(false);
  const [activeStatus, setActiveStatus] = useState("All");
  const filterRef = useRef<HTMLDivElement>(null);

  // Mirror the latest cache into refs so the chart-fetch effect can read
  // "is this already cached?" WITHOUT subscribing to the cache objects as
  // dependencies. Subscribing to them caused a feedback loop: fetching meals
  // updates `mealsChart` -> new object reference -> effect re-runs -> sees
  // attendance not yet cached (it resolves slower) -> dispatches attendance
  // again -> that update re-runs the effect again, etc.
  const mealsChartRef      = useRef(mealsChart);
  const attendanceChartRef = useRef(attendanceChart);
  mealsChartRef.current      = mealsChart;
  attendanceChartRef.current = attendanceChart;

  // Initial load — summary & activity only. Meals/attendance for the default
  // 7-day range are owned entirely by the chart effect below (it also runs
  // on mount), so fetching them here too just duplicates the request.
  useEffect(() => {
    const filters7 = makeFilters(7, activeOrgId);
    dispatch(fetchSuperAnalyticsSummary(filters7));
    dispatch(fetchSuperRecentActivity({ limit: 50, orgId: activeOrgId }));
  }, [dispatch, activeOrgId]);

  // Fetch meals/attendance whenever the range or org actually changes.
  // Cache lookups go through refs (not reactive), so a fetch fulfilling and
  // updating the cache does NOT re-trigger this effect.
  useEffect(() => {
    const days = RANGE_TO_DAYS[mealRange];
    const f    = makeFilters(days, activeOrgId);
    const key  = superCacheKey(f);
    if (!mealsChartRef.current[key])      dispatch(fetchSuperMealsChart(f));
    if (!attendanceChartRef.current[key]) dispatch(fetchSuperAttendanceChart(f));
  }, [mealRange, activeOrgId, dispatch]);

  // Close filter dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node))
        setFilterOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Reset pagination when org or search changes
  useEffect(() => { setPage(0); }, [activeOrgId, search, activeStatus]);

  // Derived chart data
  const days           = RANGE_TO_DAYS[mealRange];
  const key            = superCacheKey(makeFilters(days, activeOrgId));
  const mealsData      = mealsChart[key]      ?? [];
  const attendanceData = attendanceChart[key] ?? [];
  const mealsMax       = mealsData.length ? Math.max(...mealsData.map(d => d.count)) : 1;

  // Filtered activity
  const filtered = activities.filter(a => {
    const matchesSearch = !search || [a.name, a.action, a.email].some(v =>
      v.toLowerCase().includes(search.toLowerCase())
    );
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
    <div className="min-h-full bg-[#F5F5F5] p-3 sm:p-5 lg:p-7 font-sans">
      <div className="flex flex-col gap-4 sm:gap-5 lg:gap-6">

        <SuperAdminDashboardHeader
          onExport={() => exportToCSV(activities)}
          mealRange={mealRange}
        />

        <AnalyticsDashboardStatCards summary={summary} loading={summaryLoading} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          <AnalyticsDashboardMealsChart
            mealsData={mealsData}
            mealsMax={mealsMax}
            mealRange={mealRange}
            loading={mealsLoading}
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