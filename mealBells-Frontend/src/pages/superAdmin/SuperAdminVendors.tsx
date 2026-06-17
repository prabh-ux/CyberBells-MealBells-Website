import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  AlertCircle,
  Building2,
  CheckCircle2,

  Drumstick,
  Flame,
  Leaf,
  Phone,
  RefreshCw,
  Salad,
  Star,
  Store,
  Trash2,
  Wind,
  Zap,
  ToggleLeft,
  ToggleRight,
  Pencil,
  Plus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  fetchSuperVendors,
  toggleSuperVendorStatus,
  deleteSuperVendor,
  optimisticToggleSuperVendor,
  revertToggleSuperVendor,
  type SuperVendor,
  type VendorStatusFilter,
  type VendorFoodTypeFilter,
} from "../../slices/superAdmin/superAdminVendorSlice";
import type { AppDispatch, RootState } from "../../app/store";

// ── Utilities ─────────────────────────────────────────────────────────────────

const initials = (name: string) =>
  name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

const AVATAR_COLORS = [
  "bg-violet-500", "bg-sky-600", "bg-emerald-500",
  "bg-orange-500", "bg-rose-500", "bg-amber-600",
];
const avatarColor = (name: string) =>
  AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

const Spinner = ({ white = true }: { white?: boolean }) => (
  <div className={`w-4 h-4 border-2 ${white ? "border-white border-t-transparent" : "border-gray-400 border-t-transparent"} rounded-full animate-spin`} />
);

// ── Badges ────────────────────────────────────────────────────────────────────

const FoodBadge = ({ type }: { type: string }) => {
  const map: Record<string, { cls: string; Icon: React.ElementType }> = {
    Veg:       { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", Icon: Leaf },
    "Non-Veg": { cls: "bg-red-50 text-red-600 border-red-200",            Icon: Drumstick },
    Both:      { cls: "bg-amber-50 text-amber-700 border-amber-200",      Icon: Salad },
  };
  const entry = map[type] ?? map["Both"];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${entry.cls}`}>
      <entry.Icon size={10} strokeWidth={2.5} />
      {type || "Both"}
    </span>
  );
};

const StarRating = ({ rating, total }: { rating: number; total: number }) => (
  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-500">
    <Star size={11} className="fill-amber-400 text-amber-400" />
    {rating.toFixed(1)}
    <span className="text-gray-300 font-normal">({total})</span>
  </span>
);

// ── Delete Confirm Modal ──────────────────────────────────────────────────────

const DeleteModal = ({
  vendor, deleting, onClose, onConfirm,
}: {
  vendor: SuperVendor; deleting: boolean; onClose: () => void; onConfirm: () => void;
}) => (
  <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-0 sm:px-4">
    <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-sm p-5 sm:p-6">
      <div className="flex flex-col items-center text-center mb-5">
        <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mb-3">
          <Trash2 size={20} className="text-red-400" />
        </div>
        <h3 className="text-base font-bold text-gray-900">Delete Vendor?</h3>
        <p className="text-sm text-gray-400 mt-1">
          <span className="font-semibold text-gray-600">{vendor.name}</span>{" "}
          will be permanently removed. This cannot be undone.
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={deleting}
          className="flex-[2] py-3 rounded-2xl bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors"
        >
          {deleting ? <Spinner /> : <><Trash2 size={14} /> Delete</>}
        </button>
      </div>
    </div>
  </div>
);

// ── Vendor Card ───────────────────────────────────────────────────────────────

interface VendorCardProps {
  vendor: SuperVendor;
  toggling: string | null;
  deleting: string | null;
  activeOrgId: string;
  onToggle: (vendor: SuperVendor) => void;
  onEdit: (vendor: SuperVendor) => void;
  onDelete: (vendor: SuperVendor) => void;
}

const VendorCard: React.FC<VendorCardProps> = ({
  vendor, toggling, deleting, activeOrgId, onToggle, onEdit, onDelete,
}) => {
  const isToggling = toggling === vendor._id;
  const isDeleting = deleting === vendor._id;

  const orgNames = useMemo(() => {
    if (activeOrgId !== "all") return null;
    if (!vendor.organizationId?.length) return null;
    return (vendor.organizationId as any[])
      .map((o) => (typeof o === "object" ? o.name : o))
      .join(", ");
  }, [vendor.organizationId, activeOrgId]);

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 sm:p-5 flex flex-col gap-3 sm:gap-4">

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          {vendor.logo ? (
            <img src={vendor.logo} alt={vendor.name}
              className="w-10 h-10 rounded-2xl object-cover border border-gray-100 shrink-0" />
          ) : (
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white text-sm font-bold shrink-0 ${avatarColor(vendor.name)}`}>
              {initials(vendor.name)}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{vendor.name}</p>
            <p className="text-[11px] text-gray-400 truncate">{vendor.email}</p>
          </div>
        </div>
        <span className={`shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
          vendor.active
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : "bg-gray-100 text-gray-400 border-gray-200"
        }`}>
          {vendor.active ? "Active" : "Inactive"}
        </span>
      </div>

      {/* Org tag */}
      {orgNames && (
        <div className="flex items-center gap-1.5">
          <Building2 size={11} className="text-purple-400 shrink-0" />
          <span className="text-[11px] font-semibold text-purple-600 truncate">{orgNames}</span>
        </div>
      )}

      {/* Info strip */}
      <div className="bg-orange-50 border border-orange-100 rounded-2xl px-3 sm:px-4 py-2.5 grid grid-cols-2 gap-y-1.5 gap-x-3">
        <div>
          <p className="text-[9px] font-bold text-orange-400 uppercase tracking-wider">Capacity</p>
          <p className="text-sm font-semibold text-gray-800">{vendor.capacity} meals/day</p>
        </div>
        <div>
          <p className="text-[9px] font-bold text-orange-400 uppercase tracking-wider">Delivery</p>
          <p className="text-sm font-semibold text-gray-800 truncate">{vendor.deliveryTiming || "—"}</p>
        </div>
      </div>

      {/* Meta badges */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        <FoodBadge type={vendor.foodType} />
        <StarRating rating={vendor.rating} total={vendor.totalReviews} />
        {vendor.phone && (
          <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 bg-gray-50 border border-gray-100 rounded-full px-2.5 py-1">
            <Phone size={10} strokeWidth={2.5} />{vendor.phone}
          </span>
        )}
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
          vendor.status
            ? "bg-sky-50 text-sky-700 border-sky-200"
            : "bg-gray-50 text-gray-400 border-gray-200"
        }`}>
          {vendor.status ? <Wind size={10} strokeWidth={2.5} /> : <Flame size={10} strokeWidth={2.5} />}
          {vendor.status ? "Open" : "Closed"}
        </span>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        <button
          onClick={() => onToggle(vendor)}
          disabled={!!isToggling}
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-2xl border text-xs font-bold transition-colors ${
            vendor.active
              ? "bg-gray-50 border-gray-200 text-gray-500 hover:bg-red-50 hover:border-red-200 hover:text-red-500"
              : "bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100"
          } disabled:opacity-50`}
        >
          {isToggling ? <Spinner white={false} /> : vendor.active
            ? <><ToggleRight size={13} />Deactivate</>
            : <><ToggleLeft size={13} />Activate</>}
        </button>

        <button
          onClick={() => onEdit(vendor)}
          className="flex items-center justify-center gap-1.5 py-2.5 rounded-2xl border border-gray-200 bg-gray-50 text-gray-600 text-xs font-bold hover:bg-orange-50 hover:border-orange-200 hover:text-orange-500 transition-colors"
        >
          <Pencil size={12} /> Edit
        </button>

        <button
          onClick={() => onDelete(vendor)}
          disabled={!!isDeleting}
          className="flex items-center justify-center gap-1.5 py-2.5 rounded-2xl border border-gray-200 bg-gray-50 text-gray-500 text-xs font-bold hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-colors disabled:opacity-50"
        >
          {isDeleting ? <Spinner white={false} /> : <><Trash2 size={12} />Delete</>}
        </button>
      </div>
    </div>
  );
};

// ── Skeleton ──────────────────────────────────────────────────────────────────

const SkeletonCard = () => (
  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 sm:p-5 animate-pulse">
    <div className="flex gap-3 mb-4">
      <div className="w-10 h-10 rounded-2xl bg-gray-100 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-gray-100 rounded-full w-1/2" />
        <div className="h-2.5 bg-gray-100 rounded-full w-2/3" />
      </div>
    </div>
    <div className="h-16 bg-gray-50 rounded-2xl mb-4" />
    <div className="flex gap-2 mb-4">
      <div className="h-6 w-16 bg-gray-100 rounded-full" />
      <div className="h-6 w-20 bg-gray-100 rounded-full" />
    </div>
    <div className="grid grid-cols-3 gap-2">
      <div className="h-9 bg-gray-100 rounded-2xl" />
      <div className="h-9 bg-gray-100 rounded-2xl" />
      <div className="h-9 bg-gray-100 rounded-2xl" />
    </div>
  </div>
);

// ── Filter tab definitions ────────────────────────────────────────────────────

const STATUS_TABS: { value: VendorStatusFilter; label: string }[] = [
  { value: "all",      label: "All" },
  { value: "active",   label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const FOOD_TABS: { value: VendorFoodTypeFilter; label: string }[] = [
  { value: "all",      label: "All Types" },
  { value: "Veg",     label: "Veg" },
  { value: "Non-Veg", label: "Non-Veg" },
  { value: "Both",    label: "Both" },
];

// ── Main Page ─────────────────────────────────────────────────────────────────

const SuperAdminVendors: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const { vendors, loading, error, toggling, deleting } = useSelector(
    (s: RootState) => s.superVendors,
  );
  const { filters, orgOptions } = useSelector((s: RootState) => s.superAnalytics);
  const activeOrgId = filters.orgId;

  const [statusFilter,   setStatusFilter]   = useState<VendorStatusFilter>("all");
  const [foodTypeFilter, setFoodTypeFilter] = useState<VendorFoodTypeFilter>("all");
  const [search,         setSearch]         = useState("");
  const [deleteTarget,   setDeleteTarget]   = useState<SuperVendor | null>(null);

  // Fetch whenever org / filters change
  useEffect(() => {
    dispatch(fetchSuperVendors({ orgId: activeOrgId, status: statusFilter, foodType: foodTypeFilter }));
  }, [dispatch, activeOrgId, statusFilter, foodTypeFilter]);

  const refresh = () =>
    dispatch(fetchSuperVendors({ orgId: activeOrgId, status: statusFilter, foodType: foodTypeFilter }));

  const activeOrgLabel =
    activeOrgId === "all"
      ? "All Organizations"
      : (orgOptions.find((o) => o.value === activeOrgId)?.label ?? activeOrgId);

  const displayed = useMemo(() => {
    if (!search.trim()) return vendors;
    const q = search.toLowerCase();
    return vendors.filter(
      (v) => v.name.toLowerCase().includes(q) || v.email.toLowerCase().includes(q) || v.phone?.includes(q),
    );
  }, [vendors, search]);

  const activeCount    = useMemo(() => vendors.filter((v) => v.active).length,  [vendors]);
  const inactiveCount  = useMemo(() => vendors.filter((v) => !v.active).length, [vendors]);
  const totalCapacity  = useMemo(() => vendors.reduce((s, v) => s + (v.capacity || 0), 0), [vendors]);

  const stats = [
    { label: "Total Vendors",  value: vendors.length, Icon: Store,       cls: "text-gray-700"   },
    { label: "Active",         value: activeCount,    Icon: CheckCircle2, cls: "text-emerald-600" },
    { label: "Inactive",       value: inactiveCount,  Icon: AlertCircle,  cls: "text-red-400"    },
    { label: "Total Capacity", value: totalCapacity,  Icon: Zap,          cls: "text-orange-500" },
  ];

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleToggle = async (vendor: SuperVendor) => {
    const prevActive = vendor.active;
    dispatch(optimisticToggleSuperVendor(vendor._id));
    const result = await dispatch(toggleSuperVendorStatus(vendor._id));
    if (toggleSuperVendorStatus.rejected.match(result)) {
      dispatch(revertToggleSuperVendor({ id: vendor._id, active: prevActive }));
    }
  };

  // Navigate to the dedicated edit page instead of opening a modal
  const handleEdit = (vendor: SuperVendor) => {
    navigate(`/super-admin/vendors/${vendor._id}/edit`);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const result = await dispatch(deleteSuperVendor(deleteTarget._id));
    if (deleteSuperVendor.fulfilled.match(result)) setDeleteTarget(null);
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#fdfcfa] py-6 sm:py-10 px-3 sm:px-6">
      <div className="w-full max-w-7xl mx-auto">

        {/* Page header */}
        <div className="flex flex-row items-center justify-between gap-3 mb-5 sm:mb-8">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold text-gray-900 leading-tight truncate">
              Vendors
            </h1>
            <p className="text-gray-400 text-[11px] sm:text-sm mt-0.5 flex items-center gap-1.5">
              {activeOrgId !== "all" && <Building2 size={11} className="text-orange-400 shrink-0" />}
              {activeOrgId === "all"
                ? "Viewing vendors across all organizations."
                : `Viewing vendors for: ${activeOrgLabel}`}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={refresh}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl border border-gray-200 bg-white text-xs sm:text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
            >
              <RefreshCw size={13} strokeWidth={2} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            <button
              onClick={() => navigate("/super-admin/vendors/add")}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm font-bold shadow-sm shadow-orange-200 transition-colors"
            >
              <Plus size={14} strokeWidth={2.5} />
              Add Vendor
            </button>
          </div>
        </div>

        {/* All-orgs info banner */}
        {activeOrgId === "all" && (
          <div className="flex items-center gap-2 mb-4 sm:mb-6 px-4 py-3 rounded-2xl bg-amber-50 border border-amber-100 text-amber-700 text-sm">
            <AlertCircle size={16} strokeWidth={2} />
            Select a specific organization from the header to manage its vendors.
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-6 sm:mb-8">
          {stats.map(({ label, value, Icon, cls }) => (
            <div key={label} className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm p-3 sm:p-5 flex flex-col sm:flex-row items-center gap-1 sm:gap-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                <Icon size={15} className={cls} strokeWidth={1.75} />
              </div>
              <div className="min-w-0 text-center sm:text-left">
                <p className="text-lg sm:text-2xl font-bold text-gray-900 leading-none">{value}</p>
                <p className="text-[9px] sm:text-xs text-gray-400 font-medium leading-tight mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="mb-4 sm:mb-5">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-4 h-11 shadow-sm">
            <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <path strokeLinecap="round" d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search vendors by name, email, phone…"
              className="flex-1 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {STATUS_TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => setStatusFilter(t.value)}
                className={`flex-shrink-0 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold border capitalize transition-all ${
                  statusFilter === t.value
                    ? "bg-orange-500 border-orange-500 text-white shadow-sm shadow-orange-200"
                    : "bg-white border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-500"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="w-px h-8 bg-gray-200 self-center hidden sm:block" />

          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {FOOD_TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => setFoodTypeFilter(t.value)}
                className={`flex-shrink-0 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold border transition-all ${
                  foodTypeFilter === t.value
                    ? "bg-gray-800 border-gray-800 text-white"
                    : "bg-white border-gray-200 text-gray-600 hover:border-gray-400"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
            {Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 sm:py-20 gap-3">
            <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
              <AlertCircle size={22} className="text-red-400" strokeWidth={1.75} />
            </div>
            <p className="text-sm font-semibold text-gray-500 text-center px-4">{error}</p>
            <button onClick={refresh} className="text-xs text-orange-500 font-semibold hover:underline">
              Try again
            </button>
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 sm:py-20 gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center">
              <Store size={22} className="text-gray-300" strokeWidth={1.75} />
            </div>
            <p className="text-sm font-semibold text-gray-400">
              {search
                ? `No vendors match "${search}"`
                : `No ${statusFilter !== "all" ? statusFilter : ""} vendors found${activeOrgId !== "all" ? ` for ${activeOrgLabel}` : ""}.`}
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-400 mb-3 sm:mb-4">
              {displayed.length} vendor{displayed.length !== 1 ? "s" : ""} found
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
              {displayed.map((v) => (
                <VendorCard
                  key={v._id}
                  vendor={v}
                  toggling={toggling}
                  deleting={deleting}
                  activeOrgId={activeOrgId}
                  onToggle={handleToggle}
                  onEdit={handleEdit}
                  onDelete={setDeleteTarget}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Delete confirm modal */}
      {deleteTarget && (
        <DeleteModal
          vendor={deleteTarget}
          deleting={deleting === deleteTarget._id}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
};

export default SuperAdminVendors;