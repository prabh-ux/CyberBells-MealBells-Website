import React from "react";
import type { RefObject } from "react";
import searchIcon from "../../../assets/searchIcon.png";
import filterIcon from "../../../assets/filterIcon.png";
import actionBtns from "../../../assets/actionBtns.png";

const ALL_STATUSES = ["All", "Success", "Pending", "Critical"];

const statusStyle: Record<string, string> = {
  Success:  "bg-[#DCFCE7] text-[#15803D]",
  Pending:  "bg-[#FEF9C3] text-[#A16207]",
  Critical: "bg-[#FFE4E6] text-[#BE123C]",
};

interface Activity {
  date: string; time: string; name: string; email: string;
  action: string; status: string; initials: string;
  bgColor: string; color: string;
}

interface Props {
  paginated: Activity[];
  filtered: Activity[];
  search: string;
  activeStatus: string;
  filterOpen: boolean;
  safePage: number;
  totalPages: number;
  pageSize: number;
filterRef: RefObject<HTMLDivElement | null>;  onSearch: (val: string) => void;
  onStatusFilter: (status: string) => void;
  onToggleFilter: () => void;
  onPrev: () => void;
  onNext: () => void;
}

const AnalyticsDashboardRecentActivity = ({
  paginated, filtered, search, activeStatus, filterOpen,
  safePage, totalPages, pageSize, filterRef,
  onSearch, onStatusFilter, onToggleFilter, onPrev, onNext,
}: Props) => {
  return (
    <div className="bg-white rounded-2xl">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 pt-5 sm:pt-6 pb-4 sm:pb-5 gap-3">
        <h2 className="text-[18px] sm:text-[24px] font-semibold text-[#0E0E0E]">Recent Activity</h2>
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
              onChange={(e) => onSearch(e.target.value)}
              className="w-full sm:w-[180px] lg:w-[220px] pl-8 pr-4 py-[7px] border border-[#E5E7EB] rounded-xl text-[13px] text-[#374151] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-orange-200 bg-white"
            />
          </div>

          {/* Filter */}
          <div className="relative shrink-0" ref={filterRef}>
            <button
              onClick={onToggleFilter}
              className={`flex items-center gap-2 border px-4 py-[7px] rounded-xl text-[13px] font-medium transition-colors bg-white shrink-0 ${
                activeStatus !== "All"
                  ? "border-[#F97316] text-[#EA580C]"
                  : "border-[#E5E7EB] text-[#374151] hover:bg-gray-50"
              }`}
            >
              <img src={filterIcon} alt="filter" width="14" height="14" />
              <span className="hidden sm:inline">{activeStatus === "All" ? "Filter" : activeStatus}</span>
              {activeStatus !== "All" && <span className="w-1.5 h-1.5 rounded-full bg-[#F97316] inline-block" />}
            </button>

            {filterOpen && (
              <div className="absolute right-0 top-full mt-1.5 bg-white border border-[#E5E7EB] rounded-xl shadow-md z-20 py-1.5 min-w-[130px]">
                {ALL_STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => onStatusFilter(s)}
                    className={`w-full text-left px-4 py-2 text-[13px] font-medium hover:bg-gray-50 transition-colors flex items-center gap-2 ${
                      activeStatus === s ? "text-[#EA580C]" : "text-[#374151]"
                    }`}
                  >
                    {s !== "All" ? (
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusStyle[s]}`}>{s}</span>
                    ) : (
                      <span>All statuses</span>
                    )}
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
              <span key={h} className="text-[11px] font-bold text-[#6B7280] tracking-widest uppercase">{h}</span>
            ))}
          </div>
          <div className="divide-y divide-[#F3F4F6]">
            {paginated.length === 0 ? (
              <div className="px-6 py-10 text-center text-[14px] text-[#9CA3AF]">No activities match your search or filter.</div>
            ) : (
              paginated.map((a, i) => (
                <div key={i} className="grid grid-cols-[1.1fr_1.8fr_1.5fr_1fr_0.3fr] gap-4 items-center px-6 py-4 hover:bg-gray-50/60 transition-colors">
                  <div>
                    <p className="text-[14px] font-semibold text-(--text-primary) leading-snug">{a.date}</p>
                    <p className="text-[12px] text-[#9CA3AF] mt-0.5">{a.time}</p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0" style={{ backgroundColor: a.bgColor, color: a.color }}>
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
          <div className="px-4 py-10 text-center text-[13px] text-[#9CA3AF]">No activities match your search or filter.</div>
        ) : (
          paginated.map((a, i) => (
            <div key={i} className="px-4 py-4 hover:bg-gray-50/60 transition-colors">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0" style={{ backgroundColor: a.bgColor, color: a.color }}>
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

      {/* ── Footer / Pagination ── */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-t border-[#F3F4F6] bg-[#F9FAFB] rounded-b-2xl">
        <span className="text-[12px] sm:text-[14px] text-[#6B7280]">
          {filtered.length === 0
            ? "No results"
            : `Showing ${Math.min(pageSize, filtered.length - safePage * pageSize)} of ${filtered.length} activities`}
        </span>
        <div className="flex items-center gap-2">
          <button onClick={onPrev} disabled={safePage === 0} className="w-8 h-8 sm:w-9 sm:h-9 border border-[#E5E7EB] rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-30">
            <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
              <path d="M6 1L1 6L6 11" stroke="#1A1C1C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span className="text-[13px] text-[#6B7280] min-w-[40px] text-center">
            {totalPages > 0 ? `${safePage + 1} / ${totalPages}` : "—"}
          </span>
          <button onClick={onNext} disabled={safePage >= totalPages - 1} className="w-8 h-8 sm:w-9 sm:h-9 border border-[#E5E7EB] rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-30">
            <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
              <path d="M1 1L6 6L1 11" stroke="#1A1C1C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

    </div>
  )
}

export default AnalyticsDashboardRecentActivity