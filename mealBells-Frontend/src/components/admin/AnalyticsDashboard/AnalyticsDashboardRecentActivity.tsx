import type { RefObject } from "react";
import searchIcon from "../../../assets/searchIcon.png";
import actionBtns from "../../../assets/actionBtns.png";
import DropDown from "../../shared/DropDown";

const FILTER_OPTIONS = ["All", "Success", "Pending", "Critical"];

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
  filterRef: RefObject<HTMLDivElement | null>;
  onSearch: (val: string) => void;
  onStatusFilter: (status: string) => void;
  onToggleFilter: () => void;
  onPrev: () => void;
  onNext: () => void;
}

const AnalyticsDashboardRecentActivity = ({
  paginated, filtered, search, activeStatus,
  safePage, totalPages, pageSize,
  onSearch, onStatusFilter, onPrev, onNext,
}: Props) => {
  return (
    <div className="bg-white rounded-2xl w-full overflow-hidden">

      {/* ── Header ── */}
      <div className="px-4 sm:px-6 pt-5 sm:pt-6 pb-4 sm:pb-5">

        {/* Title row */}
        <div className="flex items-center justify-between mb-3 sm:mb-0">
          <h2 className="text-[18px] sm:text-[22px] font-semibold text-[#0E0E0E]">
            Recent Activity
          </h2>
          {/* Result count — visible only sm+ next to title */}
          <span className="hidden sm:inline text-[13px] text-[#9CA3AF]">
            {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
          </span>
        </div>

        {/* Search + filter row — always full-width on mobile */}
        <div className="flex items-center gap-2 mt-0 sm:mt-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <img src={searchIcon} alt="search" width="14" height="14" />
            </span>
            <input
              type="text"
              placeholder="Search activity..."
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              className="w-full pl-8 pr-4 py-[9px] border border-[#E5E7EB] rounded-xl text-[13px] text-[#374151] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-orange-200 bg-white"
            />
          </div>
          <div className="shrink-0 w-[120px] sm:w-[140px]">
            <DropDown
              value={activeStatus}
              options={FILTER_OPTIONS}
              onChange={(val) => onStatusFilter(val)}
              placeholder="Filter"
            />
          </div>
        </div>

      </div>

      {/* ── Desktop table (lg+) ── */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="bg-[#F5F5F5] border-b border-[#F3F4F6]">
              {["DATE & TIME", "USER", "ACTION", "STATUS", ""].map((h, i) => (
                <th
                  key={i}
                  className="px-6 py-3 text-left text-[11px] font-bold text-[#6B7280] tracking-widest uppercase"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F3F4F6]">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-[14px] text-[#9CA3AF]">
                  No activities match your search or filter.
                </td>
              </tr>
            ) : (
              paginated.map((a, i) => (
                <tr key={i} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-[14px] font-semibold text-[#0E0E0E] leading-snug">{a.date}</p>
                    <p className="text-[12px] text-[#9CA3AF] mt-0.5">{a.time}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                        style={{ backgroundColor: a.bgColor, color: a.color }}
                      >
                        {a.initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[14px] font-bold text-[#0E0E0E] leading-snug truncate">{a.name}</p>
                        <p className="text-[12px] text-[#6B7280] mt-0.5 truncate">{a.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[14px] text-[#374151]">{a.action}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-semibold ${statusStyle[a.status]}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors ml-auto">
                      <img src={actionBtns} alt="more" width="4" height="16" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Tablet cards (sm → lg) ── */}
      <div className="hidden sm:block lg:hidden divide-y divide-[#F3F4F6]">
        {paginated.length === 0 ? (
          <div className="px-6 py-12 text-center text-[14px] text-[#9CA3AF]">
            No activities match your search or filter.
          </div>
        ) : (
          paginated.map((a, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/60 transition-colors">
              {/* Avatar */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                style={{ backgroundColor: a.bgColor, color: a.color }}
              >
                {a.initials}
              </div>

              {/* User + action */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <p className="text-[14px] font-bold text-[#0E0E0E] leading-snug">{a.name}</p>
                  <p className="text-[12px] text-[#6B7280] truncate">{a.email}</p>
                </div>
                <p className="text-[13px] text-[#374151] mt-0.5 truncate">{a.action}</p>
              </div>

              {/* Right: status + date + action btn */}
              <div className="shrink-0 flex flex-col items-end gap-1.5">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${statusStyle[a.status]}`}>
                  {a.status}
                </span>
                <p className="text-[11px] text-[#9CA3AF]">{a.date} · {a.time}</p>
              </div>

              <button className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors shrink-0">
                <img src={actionBtns} alt="more" width="4" height="14" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* ── Mobile cards (< sm) ── */}
      <div className="sm:hidden divide-y divide-[#F3F4F6]">
        {paginated.length === 0 ? (
          <div className="px-4 py-10 text-center text-[13px] text-[#9CA3AF]">
            No activities match your search or filter.
          </div>
        ) : (
          paginated.map((a, i) => (
            <div key={i} className="px-4 py-4 hover:bg-gray-50/60 transition-colors">

              {/* Top row: avatar + name + status + action btn */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                    style={{ backgroundColor: a.bgColor, color: a.color }}
                  >
                    {a.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-bold text-[#0E0E0E] leading-snug truncate">{a.name}</p>
                    <p className="text-[11px] text-[#9CA3AF] truncate">{a.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${statusStyle[a.status]}`}>
                    {a.status}
                  </span>
                  <button className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-gray-100 transition-colors">
                    <img src={actionBtns} alt="more" width="4" height="14" />
                  </button>
                </div>
              </div>

              {/* Bottom row: action + date */}
              <div className="flex items-center justify-between gap-2 pl-[46px]">
                <span className="text-[12px] text-[#374151] truncate">{a.action}</span>
                <span className="text-[11px] text-[#9CA3AF] shrink-0 whitespace-nowrap">{a.date} · {a.time}</span>
              </div>

            </div>
          ))
        )}
      </div>

      {/* ── Footer / Pagination ── */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-t border-[#F3F4F6] bg-[#F9FAFB] rounded-b-2xl">
        <span className="text-[11px] sm:text-[13px] text-[#6B7280]">
          {filtered.length === 0
            ? "No results"
            : `${Math.min(pageSize, filtered.length - safePage * pageSize)} of ${filtered.length}`}
        </span>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={onPrev}
            disabled={safePage === 0}
            className="w-8 h-8 border border-[#E5E7EB] rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg width="6" height="11" viewBox="0 0 7 12" fill="none">
              <path d="M6 1L1 6L6 11" stroke="#1A1C1C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span className="text-[12px] sm:text-[13px] text-[#6B7280] min-w-[36px] sm:min-w-[48px] text-center tabular-nums">
            {totalPages > 0 ? `${safePage + 1} / ${totalPages}` : "—"}
          </span>
          <button
            onClick={onNext}
            disabled={safePage >= totalPages - 1}
            className="w-8 h-8 border border-[#E5E7EB] rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg width="6" height="11" viewBox="0 0 7 12" fill="none">
              <path d="M1 1L6 6L1 11" stroke="#1A1C1C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

    </div>
  );
};

export default AnalyticsDashboardRecentActivity;