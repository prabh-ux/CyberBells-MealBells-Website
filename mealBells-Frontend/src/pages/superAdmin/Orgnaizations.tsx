// pages/super-admin/Organizations.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate }                  from "react-router-dom";
import { useDispatch, useSelector }     from "react-redux";
import {
  AlertCircle, Building2, ChevronLeft,
  ChevronRight, Pencil, Plus, RefreshCw, Trash2,
  ToggleLeft, ToggleRight
} from "lucide-react";

import {
  fetchSuperOrganizations,
  toggleSuperOrganizationStatus,
  deleteSuperOrganization,
  setOrgFilters,
  resetOrgFilters,
  type SuperOrganization,
  type OrgSortBy,
  type OrgStatus,
} from "../../slices/superAdmin/superAdminOrganizationSlice";
import type { AppDispatch, RootState } from "../../app/store";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getOrgAvatar(name: string) {
  const palette = [
    { bg: "#E6F1FB", color: "#185FA5" },
    { bg: "#EAF3DE", color: "#3B6D11" },
    { bg: "#FAEEDA", color: "#854F0B" },
    { bg: "#EEEDFE", color: "#534AB7" },
    { bg: "#E1F5EE", color: "#0F6E56" },
    { bg: "#FBEAF0", color: "#993556" },
  ];
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const idx = name.charCodeAt(0) % palette.length;
  return { initials, ...palette[idx] };
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric" });

// ── Status pill ───────────────────────────────────────────────────────────────

const StatusPill = ({ active }: { active: boolean }) => (
  <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${
    active ? "bg-[#EAF3DE] text-[#3B6D11]" : "bg-[#FCEBEB] text-[#A32D2D]"
  }`}>
    <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-[#639922]" : "bg-[#E24B4A]"}`} />
    {active ? "Active" : "Inactive"}
  </span>
);

// ── Delete confirm modal (kept inline — it's just 2 buttons) ─────────────────

const DeleteModal = ({ org, deleting, onClose, onConfirm }: {
  org: SuperOrganization; deleting: boolean; onClose: () => void; onConfirm: () => void;
}) => (
  <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-0 sm:px-4">
    <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-sm p-5 sm:p-6">
      <div className="flex flex-col items-center text-center mb-5">
        <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mb-3">
          <Trash2 size={20} className="text-red-400" />
        </div>
        <h3 className="text-base font-bold text-gray-900">Delete Organization?</h3>
        <p className="text-sm text-gray-400 mt-1">
          <span className="font-semibold text-gray-600">{org.companyName}</span> and all its data will be permanently removed.
        </p>
      </div>
      <div className="flex gap-3">
        <button onClick={onClose}
          className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
          Cancel
        </button>
        <button onClick={onConfirm} disabled={deleting}
          className="flex-[2] py-3 rounded-2xl bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors">
          {deleting
            ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <><Trash2 size={14} /> Delete</>}
        </button>
      </div>
    </div>
  </div>
);

// ── Skeleton row ──────────────────────────────────────────────────────────────

const SkeletonRow = () => (
  <tr className="border-b border-gray-50 animate-pulse">
    <td className="px-5 py-3.5">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gray-100 shrink-0" />
        <div className="space-y-1.5">
          <div className="h-3 bg-gray-100 rounded-full w-32" />
          <div className="h-2.5 bg-gray-100 rounded-full w-20" />
        </div>
      </div>
    </td>
    <td className="px-4 py-3.5"><div className="h-6 w-16 bg-gray-100 rounded-full" /></td>
    <td className="px-4 py-3.5"><div className="h-5 w-12 bg-gray-100 rounded-full" /></td>
    <td className="px-4 py-3.5"><div className="h-4 w-10 bg-gray-100 rounded" /></td>
    <td className="px-4 py-3.5 hidden sm:table-cell">
      <div className="space-y-1.5">
        <div className="h-3 bg-gray-100 rounded-full w-28" />
        <div className="h-2.5 bg-gray-100 rounded-full w-36" />
      </div>
    </td>
    <td className="px-4 py-3.5 hidden md:table-cell"><div className="h-4 w-16 bg-gray-100 rounded" /></td>
    <td className="px-4 py-3.5"><div className="h-7 w-20 bg-gray-100 rounded-lg" /></td>
  </tr>
);

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Organizations() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const {
    organizations, summary, pagination, filters,
    loading, error, toggling, deleting,
  } = useSelector((s: RootState) => s.superOrgs);

  const [deleteTarget, setDeleteTarget] = useState<SuperOrganization | null>(null);

  useEffect(() => {
    dispatch(fetchSuperOrganizations(filters));
  }, [dispatch, filters]);

  const handleFilterChange = (patch: Record<string, unknown>) =>
    dispatch(setOrgFilters({ ...patch, page: 1 } as any));

  const handlePageChange = (page: number) =>
    dispatch(setOrgFilters({ page }));

  const handleToggle = (org: SuperOrganization) =>
    dispatch(toggleSuperOrganizationStatus(org._id));

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await dispatch(deleteSuperOrganization(deleteTarget._id));
    if (deleteSuperOrganization.fulfilled.match(result)) setDeleteTarget(null);
  };

  const pages = useMemo(() => {
    if (!pagination) return [];
    const total = pagination.totalPages;
    const cur   = pagination.page;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (cur <= 4)   return [1, 2, 3, 4, 5, "...", total];
    if (cur >= total - 3) return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
    return [1, "...", cur - 1, cur, cur + 1, "...", total];
  }, [pagination]);

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6">

      {/* Page header */}
      <div className="flex items-start justify-between mb-6 gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Organizations</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            All companies using MealBells · {summary?.total ?? "—"} total
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => dispatch(fetchSuperOrganizations(filters))}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            type="button"
            onClick={() => navigate("/super-admin/organizations/create")}
            className="flex items-center gap-2 bg-[#EA580C] hover:bg-orange-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span className="hidden sm:inline">Add organization</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 mb-4 px-4 py-3 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {[
          { label: "Total",    value: summary?.total,    badge: "All orgs",        cls: "bg-[#EAF3DE] text-[#3B6D11]" },
          { label: "Active",   value: summary?.active,   badge: "Currently live",  cls: "bg-[#EAF3DE] text-[#3B6D11]" },
          { label: "Inactive", value: summary?.inactive, badge: "Needs attention", cls: "bg-[#FCEBEB] text-[#A32D2D]" },
        ].map(({ label, value, badge, cls }) => (
          <div key={label} className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">{label}</p>
            <p className="text-3xl font-semibold text-gray-900 mb-2">
              {loading && value == null
                ? <span className="inline-block w-12 h-7 bg-gray-100 rounded animate-pulse" />
                : (value ?? 0)}
            </p>
            <span className={`inline-flex items-center text-[11px] font-medium px-2.5 py-1 rounded-full ${cls}`}>{badge}</span>
          </div>
        ))}
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-1.5 flex-1 min-w-[180px] max-w-xs">
          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={filters.search}
            onChange={e => handleFilterChange({ search: e.target.value })}
            placeholder="Search orgs, admins…"
            className="bg-transparent text-sm text-gray-800 placeholder:text-gray-400 outline-none w-full"
          />
          {filters.search && (
            <button onClick={() => handleFilterChange({ search: "" })} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {(["all", "active", "inactive"] as OrgStatus[]).map(s => (
            <button
              key={s}
              onClick={() => handleFilterChange({ status: s })}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border capitalize transition-colors ${
                filters.status === s
                  ? "bg-[#EA580C] text-white border-[#EA580C]"
                  : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        <select
          value={filters.sortBy}
          onChange={e => handleFilterChange({ sortBy: e.target.value as OrgSortBy })}
          className="text-xs text-gray-500 bg-white border border-gray-200 rounded-xl px-3 py-1.5 outline-none cursor-pointer hover:bg-gray-50 ml-auto"
        >
          <option value="createdAt">Sort: Joined date</option>
          <option value="name">Sort: Name</option>
          <option value="users">Sort: Users</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Organization</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Capacity</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Users</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Contact</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Joined</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }, (_, i) => <SkeletonRow key={i} />)
              ) : organizations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center">
                        <Building2 size={22} className="text-gray-300" />
                      </div>
                      <p className="text-gray-400 text-sm">No organizations match your filters.</p>
                      <button onClick={() => dispatch(resetOrgFilters())} className="text-sm text-[#EA580C] hover:underline">
                        Clear filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                organizations.map(org => {
                  const avatar     = getOrgAvatar(org.companyName);
                  const isToggling = toggling === org._id;
                  const isDeleting = deleting === org._id;

                  return (
                    <tr
                      key={org._id}
                      className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/super-admin/organizations/${org._id}`)}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                            style={{ background: avatar.bg, color: avatar.color }}
                          >
                            {avatar.initials}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 leading-tight">{org.companyName}</p>
                            <p className="text-[11px] text-gray-400 truncate max-w-[160px]">{org.officeAddress || "—"}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5"><StatusPill active={org.status} /></td>

                      <td className="px-4 py-3.5 text-gray-600 font-medium">
                        {org.capacity > 0 ? org.capacity.toLocaleString() : "—"}
                      </td>

                      <td className="px-4 py-3.5 text-gray-600 font-medium">
                        {org.userCount.toLocaleString()}
                      </td>

                      <td className="px-4 py-3.5 hidden sm:table-cell">
                        <p className="text-gray-500 text-xs truncate max-w-[180px]">{org.contactEmail}</p>
                      </td>

                      <td className="px-4 py-3.5 text-gray-400 text-sm hidden md:table-cell">
                        {fmtDate(org.createdAt)}
                      </td>

                      <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {/* Toggle */}
                          <button
                            onClick={() => handleToggle(org)}
                            disabled={!!isToggling}
                            title={org.status ? "Deactivate" : "Activate"}
                            className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors disabled:opacity-50 ${
                              org.status ? "text-emerald-500 hover:bg-emerald-50" : "text-gray-400 hover:bg-gray-100"
                            }`}
                          >
                            {isToggling
                              ? <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                              : org.status ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                          </button>

                          {/* Edit → separate page */}
                          <button
                            onClick={() => navigate(`/super-admin/organizations/${org._id}/edit`)}
                            title="Edit"
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <Pencil size={14} />
                          </button>

                          {/* View */}
                          <button
                            onClick={() => navigate(`/super-admin/organizations/${org._id}`)}
                            title="View"
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setDeleteTarget(org)}
                            disabled={!!isDeleting}
                            title="Delete"
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                          >
                            {isDeleting
                              ? <div className="w-3.5 h-3.5 border-2 border-red-300 border-t-transparent rounded-full animate-spin" />
                              : <Trash2 size={14} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {pagination && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50 flex-wrap gap-2">
            <p className="text-xs text-gray-400">
              Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} organizations
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1 || loading}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              {pages.map((p, i) =>
                p === "..." ? (
                  <span key={`e-${i}`} className="w-7 h-7 flex items-center justify-center text-xs text-gray-400">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p as number)}
                    disabled={loading}
                    className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs border transition-colors ${
                      p === pagination.page
                        ? "bg-[#EA580C] text-white border-[#EA580C]"
                        : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages || loading}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {deleteTarget && (
        <DeleteModal
          org={deleteTarget}
          deleting={deleting === deleteTarget._id}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}