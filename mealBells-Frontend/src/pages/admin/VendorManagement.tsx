import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../app/store";
import {
  fetchVendors, toggleVendorStatus, updateVendor,
  optimisticToggleVendor, revertToggleVendor,
} from "../../slices/vendorSlice";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";

import type { EditVendorForm, Vendor } from "../../types/admin";
import VendorFilters    from "../../components/admin/VendorManagement/VendorFilters";
import VendorStatsCards from "../../components/admin/VendorManagement/VendorStatsCards";
import VendorTable      from "../../components/admin/VendorManagement/VendorTable";
import VendorPagination from "../../components/admin/VendorManagement/VendorPagination";
import VendorEditModal  from "../../components/admin/VendorManagement/VendorEditModal";

const PAGE_SIZE = 8;

export default function VendorManagement() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { list: vendors, loading, error, updating } = useSelector((s: RootState) => s.vendors);

  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [ratingFilter, setRatingFilter] = useState("All Ratings");
  const [page,         setPage]         = useState(1);
  const [editModal,    setEditModal]    = useState<Vendor | null>(null);

  // Fetch on mount
  useEffect(() => { dispatch(fetchVendors()); }, [dispatch]);

  // Close modal + toast after update
  const prevUpdating = useRef(false);
  useEffect(() => {
    if (prevUpdating.current && !updating) {
      if (!error) {
        toast.success("Vendor updated successfully!");
        setEditModal(null);
      } else {
        toast.error(error);
      }
    }
    prevUpdating.current = updating;
  }, [updating, error]);

  // ── Toggle ─────────────────────────────────────────────────────────────────
  const handleToggleStatus = async (id: string) => {
    const target = vendors.find(v => v._id === id);
    if (!target) return;

    dispatch(optimisticToggleVendor(id));

    const result = await dispatch(toggleVendorStatus({ id, currentStatus: target.status }));

    if (toggleVendorStatus.fulfilled.match(result)) {
      toast.success(result.payload.msg);
    } else {
      dispatch(revertToggleVendor({ id, status: target.status }));
      toast.error(result.payload as string ?? "Failed to update status.");
    }
  };

  // ── Save edit ──────────────────────────────────────────────────────────────
  const handleSaveEdit = async (form: EditVendorForm, file?: File) => {
    if (!editModal) return;
    const result = await dispatch(updateVendor({ id: editModal._id, form, file }));
    if (updateVendor.rejected.match(result)) {
      throw new Error(result.payload as string);
    }
  };

  // ── Filter + paginate ──────────────────────────────────────────────────────
  const { filtered, paginated, totalPages, stats } = useMemo(() => {
    const filtered = vendors.filter(v => {
      const matchSearch =
        v.name.toLowerCase().includes(search.toLowerCase())  ||
        v.email.toLowerCase().includes(search.toLowerCase()) ||
        v.phone.includes(search);
      const matchStatus =
        statusFilter === "All Status"                    ||
        (statusFilter === "ACTIVE"   &&  v.status)       ||
        (statusFilter === "INACTIVE" && !v.status);
      const matchRating =
        ratingFilter === "All Ratings"               ||
        (ratingFilter === "4.5+" && v.rating >= 4.5) ||
        (ratingFilter === "4.0+" && v.rating >= 4.0) ||
        (ratingFilter === "3.5+" && v.rating >= 3.5);
      return matchSearch && matchStatus && matchRating;
    });

    const totalPages    = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const safePage      = Math.min(page, totalPages);
    const paginated     = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
    const activeCount   = vendors.filter(v => v.status).length;
    const totalCapacity = vendors.reduce((sum, v) => sum + (v.capacity || 0), 0);
    const topVendor     = [...vendors].sort((a, b) => b.rating - a.rating)[0] ?? null;

    return { filtered, paginated, totalPages, stats: { activeCount, totalCapacity, topVendor } };
  }, [vendors, search, statusFilter, ratingFilter, page]);

  // ── Filter helpers ─────────────────────────────────────────────────────────
  const handleSearchChange = (val: string) => { setSearch(val);       setPage(1); };
  const handleStatusChange = (val: string) => { setStatusFilter(val); setPage(1); };
  const handleRatingChange = (val: string) => { setRatingFilter(val); setPage(1); };

  // ── Loading / error states ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        <p className="text-sm text-gray-400 animate-pulse">Loading vendors…</p>
      </div>
    );
  }

  if (error && !vendors.length) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        <div className="bg-white rounded-xl border border-red-200 shadow-sm p-6 text-center max-w-sm">
          <p className="text-red-500 text-sm font-medium mb-3">{error}</p>
          <button
            onClick={() => dispatch(fetchVendors())}
            className="text-xs px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F8F9FB] p-4 sm:p-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-[32px] font-bold text-gray-900 tracking-tight leading-tight">
            Vendor Management
          </h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">
            Manage your restaurant partners, their capacities, and operational status.
          </p>
        </div>
        <button
          onClick={() => navigate("/admin/add-vendor")}
          className="w-full sm:w-auto bg-[#FF7A00] hover:bg-orange-600 transition-all text-white rounded-xl px-6 py-3 text-sm font-bold shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 active:scale-95"
        >
          <Plus size={18} />
          Add Vendor
        </button>
      </div>

      <VendorFilters
        search={search}
        statusFilter={statusFilter}
        ratingFilter={ratingFilter}
        onSearchChange={handleSearchChange}
        onStatusChange={handleStatusChange}
        onRatingChange={handleRatingChange}
      />

      <VendorStatsCards totalCount={vendors.length} stats={stats} />

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-8">
        <VendorTable
          vendors={paginated}
          onEdit={setEditModal}
          onToggleStatus={handleToggleStatus}
        />
        <VendorPagination
          page={page}
          totalPages={totalPages}
          shownCount={paginated.length}
          totalCount={filtered.length}
          onPageChange={setPage}
        />
      </div>

      {editModal && (
        <VendorEditModal
          vendor={editModal}
          onClose={() => setEditModal(null)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}