import { useState, useRef, useEffect } from 'react'
import { activities, ALL_MEALS_DATA, attendanceData } from "../../data/AnalyticsDashboard";

import AnalyticsDashboardHeader from '../../components/admin/AnalyticsDashboard/AnalyticsDashboardHeader';
import AnalyticsDashboardStatCards from '../../components/admin/AnalyticsDashboard/AnalyticsDashboardStatCards';
import AnalyticsDashboardMealsChart from '../../components/admin/AnalyticsDashboard/AnalyticsDashboardMealsChart';
import AnalyticsDashboardAttendanceChart from '../../components/admin/AnalyticsDashboard/AnalyticsDashboardAttendanceChart';
import AnalyticsDashboardRecentActivity from '../../components/admin/AnalyticsDashboard/AnalyticsDashboardRecentActivity';

function getMax(data: { count: number }[]) {
  return Math.max(...data.map((d) => d.count));
}

export function exportToCSV(data: typeof activities) {
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

const PAGE_SIZE = 3;

export default function AnalyticsDashboard() {
  const [mealRange, setMealRange]         = useState("Last 7 Days");
  const [search, setSearch]               = useState("");
  const [page, setPage]                   = useState(0);
  const [filterOpen, setFilterOpen]       = useState(false);
  const [activeStatus, setActiveStatus]   = useState("All");
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node))
        setFilterOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const mealsData = ALL_MEALS_DATA[mealRange];
  const mealsMax  = getMax(mealsData);

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
  const safePage   = Math.min(page, Math.max(0, totalPages - 1));
  const paginated  = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  const handleSearch       = (val: string) => { setSearch(val); setPage(0); };
  const handleStatusFilter = (status: string) => { setActiveStatus(status); setPage(0); setFilterOpen(false); };
  const handlePrev         = () => setPage((p) => Math.max(0, p - 1));
  const handleNext         = () => setPage((p) => Math.min(totalPages - 1, p + 1));

  return (
    <div className="min-h-full bg-[#F5F5F5] p-4 sm:p-6 lg:p-7 font-(--font-inter)">
      <div className="flex flex-col gap-5 lg:gap-6">

        <AnalyticsDashboardHeader
          onExport={() => exportToCSV(activities)}
        />

        <AnalyticsDashboardStatCards />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AnalyticsDashboardMealsChart
            mealsData={mealsData}
            mealsMax={mealsMax}
            mealRange={mealRange}
            onRangeChange={setMealRange}
          />
          <AnalyticsDashboardAttendanceChart
            attendanceData={attendanceData}
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
          onToggleFilter={() => setFilterOpen((o) => !o)}
          onPrev={handlePrev}
          onNext={handleNext}
        />

      </div>
    </div>
  );
}