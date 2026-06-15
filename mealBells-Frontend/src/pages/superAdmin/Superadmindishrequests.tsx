// pages/super-admin/SuperAdminDishRequests.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector }             from "react-redux";
import {
  AlertCircle, CalendarDays, CheckCircle2,
  Clock, Drumstick, Flame, Leaf, RefreshCw,
  Salad, Send, Store, Wind, Zap, Building2,
} from "lucide-react";

import {
  fetchSuperDishRequests,
  fetchSuperDishRequestVendors,
  superForwardDishRequest,
  clearSuperDishRequestVendors,
  type StatusFilter,
  type SuperDishRequest,
  type SuperDishRequestVendor,
} from "../../slices/superAdmin/superDishRequestSlice";
import type { AppDispatch, RootState } from "../../app/store";

// ── Utilities ─────────────────────────────────────────────────────────────────

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });

const initials = (name: string) =>
  name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

const AVATAR_COLORS = [
  "bg-violet-500", "bg-sky-600", "bg-emerald-500",
  "bg-orange-500", "bg-rose-500", "bg-amber-600",
];
const avatarColor = (name: string) =>
  AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

// ── Badges ────────────────────────────────────────────────────────────────────

const DietBadge = ({ pref }: { pref: string }) => {
  const map: Record<string, { label: string; cls: string; Icon: React.ElementType }> = {
    Veg:       { label: "Veg",     cls: "bg-emerald-50 text-emerald-700 border-emerald-200", Icon: Leaf      },
    "Non-Veg": { label: "Non-Veg", cls: "bg-red-50 text-red-600 border-red-200",            Icon: Drumstick },
    Both:      { label: "Both",    cls: "bg-amber-50 text-amber-700 border-amber-200",       Icon: Salad     },
  };
  const { label, cls, Icon } = map[pref] ?? map["Both"];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cls}`}>
      <Icon size={10} strokeWidth={2.5} />{label}
    </span>
  );
};

const SpiceBadge = ({ level }: { level: string }) => {
  const map: Record<string, { cls: string; Icon: React.ElementType }> = {
    Mild:   { cls: "bg-sky-50 text-sky-600 border-sky-200",          Icon: Wind  },
    Normal: { cls: "bg-orange-50 text-orange-600 border-orange-200", Icon: Flame },
    Spicy:  { cls: "bg-red-50 text-red-600 border-red-200",          Icon: Zap   },
  };
  const { cls, Icon } = map[level] ?? map["Normal"];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cls}`}>
      <Icon size={10} strokeWidth={2.5} />{level}
    </span>
  );
};

const StatusPill = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    pending:  "bg-yellow-50 text-yellow-700 border-yellow-200",
    reviewed: "bg-blue-50 text-blue-700 border-blue-200",
    approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rejected: "bg-red-50 text-red-600 border-red-200",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border capitalize ${map[status] ?? ""}`}>
      {status}
    </span>
  );
};

const Spinner = () => (
  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
);

// ── Vendor Modal ──────────────────────────────────────────────────────────────

interface VendorModalProps {
  request:   SuperDishRequest;
  vendors:   SuperDishRequestVendor[];
  loading:   boolean;
  orgId:     string;
  onClose:   () => void;
  onForward: (requestId: string, vendorIds: string[]) => void;
}

const VendorModal: React.FC<VendorModalProps> = ({
  request, vendors, loading, orgId, onClose, onForward,
}) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const allSelected = selected.size === vendors.length && vendors.length > 0;
  const selectAll   = () =>
    setSelected(allSelected ? new Set() : new Set(vendors.map((v) => v._id)));

  const noOrgSelected = !orgId || orgId === "all";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-0 sm:px-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-md p-5 sm:p-6 max-h-[90vh] flex flex-col">

        <div className="mb-4">
          <h3 className="text-base sm:text-lg font-bold text-gray-900">Forward to Vendors</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {noOrgSelected
              ? "Please select an organization from the header to see its vendors."
              : <>
                  Select which vendor(s) should see this request
                  {request.dishSuggestion && (
                    <> for <span className="font-semibold text-gray-600">{request.dishSuggestion}</span></>
                  )}
                </>
            }
          </p>
        </div>

        {!noOrgSelected && (
          <button
            onClick={selectAll}
            className="flex items-center gap-2 text-xs font-semibold text-orange-500 hover:text-orange-600 mb-3 transition-colors"
          >
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
              allSelected ? "bg-orange-500 border-orange-500" : "border-gray-300"
            }`}>
              {allSelected && <CheckCircle2 size={10} className="text-white" strokeWidth={3} />}
            </div>
            {allSelected ? "Deselect all" : "Select all vendors"}
          </button>
        )}

        <div className="space-y-2 overflow-y-auto flex-1 pr-1 mb-4">
          {noOrgSelected ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
              <Building2 className="w-8 h-8 text-gray-200" />
              <p className="text-sm text-gray-400">Select an organization from the header dropdown first.</p>
            </div>
          ) : vendors.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No vendors available for this organization.</p>
          ) : vendors.map((v) => {
            const checked = selected.has(v._id);
            return (
              <button
                key={v._id}
                onClick={() => toggle(v._id)}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${
                  checked
                    ? "bg-orange-50 border-orange-300 shadow-sm"
                    : "bg-gray-50 border-gray-200 hover:border-orange-200"
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                  {v.logo
                    ? <img src={v.logo} alt={v.name} className="w-full h-full object-cover" />
                    : <Store size={16} className="text-gray-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{v.name}</p>
                  {v.email && <p className="text-[11px] text-gray-400 truncate">{v.email}</p>}
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                  checked ? "bg-orange-500 border-orange-500" : "border-gray-300"
                }`}>
                  {checked && <CheckCircle2 size={12} className="text-white" strokeWidth={3} />}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onForward(request._id, [...selected])}
            disabled={selected.size === 0 || loading || noOrgSelected}
            className="flex-[2] py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-orange-200 flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? <Spinner /> : (
              <>
                <Send size={14} strokeWidth={2} />
                Forward to {selected.size > 0 ? selected.size : ""} Vendor{selected.size !== 1 ? "s" : ""}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Request Card ──────────────────────────────────────────────────────────────

interface CardProps {
  request:     SuperDishRequest;
  vendors:     SuperDishRequestVendor[];
  forwarding:  string | null;
  activeOrgId: string;
  onForward:   (requestId: string, vendorIds: string[]) => void;
}

const RequestCard: React.FC<CardProps> = ({
  request, vendors, forwarding, activeOrgId, onForward,
}) => {
  const [modalOpen, setModalOpen] = useState(false);

  const user        = request.userId;
  const isForwarding = forwarding === request._id;
  const forwardedTo  = request.forwardedTo ?? [];

  // In "all orgs" view show department as org hint badge
  const orgTag = activeOrgId === "all" && user && typeof user === "object" ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-purple-50 text-purple-700 border-purple-200">
      <Building2 size={10} strokeWidth={2.5} />
      {user.department ?? "—"}
    </span>
  ) : null;

  return (
    <>
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 sm:p-5 flex flex-col gap-3 sm:gap-4">

        {/* User row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${avatarColor(user && typeof user === "object" ? user.name ?? "U" : "U")}`}>
              {user && typeof user === "object" && user.avatar
                ? <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                : initials(user && typeof user === "object" ? user.name ?? "U" : "U")}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">
                {user && typeof user === "object" ? user.name ?? "Unknown User" : "Unknown User"}
              </p>
              {user && typeof user === "object" && user.department && (
                <p className="text-[11px] text-gray-400 truncate">{user.department}</p>
              )}
            </div>
          </div>
          <StatusPill status={request.status} />
        </div>

        {/* Dish suggestion */}
        {request.dishSuggestion && (
          <div className="bg-orange-50 border border-orange-100 rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3">
            <p className="text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-0.5">Requested Dish</p>
            <p className="text-sm font-semibold text-gray-800">{request.dishSuggestion}</p>
          </div>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-full px-2 sm:px-2.5 py-1">
            <CalendarDays size={11} strokeWidth={2.5} />{fmtDate(request.requestedDate)}
          </span>
          <DietBadge  pref={request.dietaryPreference} />
          <SpiceBadge level={request.spiceLevel} />
          {orgTag}
        </div>

        {/* Forwarded to */}
        {forwardedTo.length > 0 && (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-300 mb-1.5">Forwarded to</p>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {forwardedTo.map((f) => {
                const isPopulated = typeof f.vendorId === "object" && f.vendorId !== null;
                const key  = isPopulated ? (f.vendorId as any)._id  : String(f.vendorId);
                const name = isPopulated ? (f.vendorId as any).name : "Vendor";
                return (
                  <span
                    key={key}
                    className={`inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                      f.vendorStatus === "accepted"  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : f.vendorStatus === "ignored" ? "bg-gray-100 text-gray-400 border-gray-200"
                                                     : "bg-blue-50 text-blue-700 border-blue-200"
                    }`}
                  >
                    <Store size={10} strokeWidth={2.5} />{name}
                    {f.vendorStatus !== "pending" && (
                      <span className="opacity-70 capitalize">· {f.vendorStatus}</span>
                    )}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Forward button */}
        <button
          onClick={() => setModalOpen(true)}
          disabled={isForwarding}
          className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-sm shadow-sm shadow-orange-200 transition-colors"
        >
          {isForwarding ? <Spinner /> : (
            <>
              <Send size={14} strokeWidth={2} />
              {forwardedTo.length > 0 ? "Forward Again" : "Forward to Vendor"}
            </>
          )}
        </button>
      </div>

      {modalOpen && (
        <VendorModal
          request={request}
          vendors={vendors}
          loading={isForwarding}
          orgId={activeOrgId}
          onClose={() => setModalOpen(false)}
          onForward={(reqId, vendorIds) => {
            onForward(reqId, vendorIds);
            setModalOpen(false);
          }}
        />
      )}
    </>
  );
};

// ── Skeleton ──────────────────────────────────────────────────────────────────

const SkeletonCard = () => (
  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 sm:p-5 animate-pulse">
    <div className="flex gap-3 mb-4">
      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-100" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-gray-100 rounded-full w-1/2" />
        <div className="h-2.5 bg-gray-100 rounded-full w-1/3" />
      </div>
    </div>
    <div className="h-14 sm:h-16 bg-gray-50 rounded-2xl mb-4" />
    <div className="flex gap-2 mb-4">
      <div className="h-6 w-20 bg-gray-100 rounded-full" />
      <div className="h-6 w-16 bg-gray-100 rounded-full" />
    </div>
    <div className="h-10 bg-gray-100 rounded-2xl" />
  </div>
);

// ── Main Page ─────────────────────────────────────────────────────────────────

const STATUS_TABS: StatusFilter[] = ["pending", "reviewed", "all"];

const SuperAdminDishRequests: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  const { requests, requestsLoading, requestsError, vendors, vendorsLoading, vendorsError, forwarding } =
    useSelector((s: RootState) => s.superDishRequests);

  // ← Read org from header's global filter (no local org state)
  const { filters, orgOptions } = useSelector((s: RootState) => s.superAnalytics);
  const activeOrgId = filters.orgId;

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");

  // Re-fetch requests whenever header org or status filter changes
  useEffect(() => {
    dispatch(fetchSuperDishRequests({ orgId: activeOrgId, status: statusFilter }));
  }, [dispatch, activeOrgId, statusFilter]);

  // Re-fetch vendors whenever org changes
  useEffect(() => {
    if (activeOrgId && activeOrgId !== "all") {
      dispatch(fetchSuperDishRequestVendors(activeOrgId));
    } else {
      dispatch(clearSuperDishRequestVendors());
    }
  }, [dispatch, activeOrgId]);

  const handleForward = (requestId: string, vendorIds: string[]) => {
    dispatch(superForwardDishRequest({ requestId, vendorIds }));
  };

  const refresh = () => {
    dispatch(fetchSuperDishRequests({ orgId: activeOrgId, status: statusFilter }));
  };

  const activeOrgLabel =
    activeOrgId === "all"
      ? "All Organizations"
      : orgOptions.find((o) => o.value === activeOrgId)?.label ?? activeOrgId;

  const pendingCount  = useMemo(() => requests.filter((r) => r.status === "pending").length,  [requests]);
  const reviewedCount = useMemo(() => requests.filter((r) => r.status === "reviewed").length, [requests]);

  const stats = [
    { label: "Total Requests", value: requests.length, Icon: CalendarDays, cls: "text-gray-700"    },
    { label: "Pending Review", value: pendingCount,     Icon: Clock,        cls: "text-yellow-600"  },
    { label: "Forwarded",      value: reviewedCount,    Icon: CheckCircle2, cls: "text-emerald-600" },
  ];

  return (
    <div className="min-h-screen bg-[#fdfcfa] py-6 sm:py-10 px-3 sm:px-6">
      <div className="w-full max-w-7xl mx-auto">

        {/* ── Page header ── */}
        <div className="flex flex-row items-center justify-between gap-3 mb-5 sm:mb-8">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold text-gray-900 leading-tight truncate">
              Dish Requests
            </h1>
            <p className="text-gray-400 text-[11px] sm:text-sm mt-0.5 flex items-center gap-1.5">
              {activeOrgId !== "all" && (
                <Building2 size={11} className="text-orange-400 shrink-0" />
              )}
              {activeOrgId === "all"
                ? "Viewing requests across all organizations."
                : `Viewing requests for: ${activeOrgLabel}`}
            </p>
          </div>
          <button
            onClick={refresh}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl border border-gray-200 bg-white text-xs sm:text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <RefreshCw size={13} strokeWidth={2} className={requestsLoading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Vendor error banner */}
        {vendorsError && (
          <div className="flex items-center gap-2 mb-4 sm:mb-6 px-4 py-3 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm">
            <AlertCircle size={16} strokeWidth={2} />
            {vendorsError} — vendors won&apos;t appear in the forward modal.
          </div>
        )}

        {/* "All orgs" info banner */}
        {activeOrgId === "all" && (
          <div className="flex items-center gap-2 mb-4 sm:mb-6 px-4 py-3 rounded-2xl bg-amber-50 border border-amber-100 text-amber-700 text-sm">
            <AlertCircle size={16} strokeWidth={2} />
            Select a specific organization from the header to forward requests to its vendors.
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8">
          {stats.map(({ label, value, Icon, cls }) => (
            <div
              key={label}
              className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm p-2 sm:p-5 flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-4"
            >
              <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                <Icon size={14} className={cls} strokeWidth={1.75} />
              </div>
              <div className="min-w-0 text-center sm:text-left">
                <p className="text-base sm:text-2xl font-bold text-gray-900 leading-none">{value}</p>
                <p className="text-[9px] sm:text-xs text-gray-400 font-medium leading-tight mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-2 mb-4 sm:mb-6 overflow-x-auto pb-1 scrollbar-none">
          {STATUS_TABS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`flex-shrink-0 px-2 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold border capitalize transition-all ${
                statusFilter === s
                  ? "bg-orange-500 border-orange-500 text-white shadow-sm shadow-orange-200"
                  : "bg-white border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-500"
              }`}
            >
              {s === "all" ? "All Requests" : s}
            </button>
          ))}
        </div>

        {/* Content grid */}
        {requestsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
            {Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : requestsError ? (
          <div className="flex flex-col items-center justify-center py-16 sm:py-20 gap-3">
            <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
              <AlertCircle size={22} className="text-red-400" strokeWidth={1.75} />
            </div>
            <p className="text-sm font-semibold text-gray-500 text-center px-4">{requestsError}</p>
            <button onClick={refresh} className="text-xs text-orange-500 font-semibold hover:underline">
              Try again
            </button>
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 sm:py-20 gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center">
              <Salad size={22} className="text-gray-300" strokeWidth={1.75} />
            </div>
            <p className="text-sm font-semibold text-gray-400">
              No {statusFilter !== "all" ? statusFilter : ""} requests found
              {activeOrgId !== "all" ? ` for ${activeOrgLabel}` : ""}.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
            {requests.map((req) => (
              <RequestCard
                key={req._id}
                request={req}
                vendors={vendorsLoading ? [] : vendors}
                forwarding={forwarding}
                activeOrgId={activeOrgId}
                onForward={handleForward}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminDishRequests;