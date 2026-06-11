import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../app/store";
import {
  fetchVendorOrgs,
  toggleVendorOrgStatus,
  optimisticToggleOrg,
  revertToggleOrg,
  updateVendorOrg,
  clearUpdateError,
} from "../../slices/organizationSlice";
import type { VendorOrg } from "../../slices/organizationSlice";
import toast from "react-hot-toast";
import {
  Plus, Search, Building2, Users, Mail,
  MapPin, ToggleLeft, ToggleRight, ChevronLeft, ChevronRight, Pencil,
} from "lucide-react";
import OrgEditModal, { type EditOrgForm } from "../../components/organization/OrgEditModal";

const PAGE_SIZE = 8;

function StatCard({ label, value, sub, color }: {
  label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function OrgRow({ org, onToggle, onEdit }: {
  org: VendorOrg;
  onToggle: (id: string) => void;
  onEdit:   (org: VendorOrg) => void;
}) {
  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4 text-orange-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800">{org.companyName}</p>
            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" />{org.officeAddress || "—"}
            </p>
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        {org.admin ? (
          <div>
            <p className="text-sm font-semibold text-gray-700">{org.admin.name}</p>
            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
              <Mail className="w-3 h-3" />{org.admin.email}
            </p>
          </div>
        ) : (
          <span className="text-xs text-gray-400">No admin</span>
        )}
      </td>

      <td className="px-5 py-4">
        <div className="flex items-center gap-1.5">
          <Users className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-700">{org.memberCount}</span>
        </div>
      </td>

      <td className="px-5 py-4">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
          org.status ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-500"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${org.status ? "bg-emerald-500" : "bg-gray-400"}`} />
          {org.status ? "Active" : "Inactive"}
        </span>
      </td>

      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onToggle(org._id)}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-orange-500 transition-colors"
          >
            {org.status
              ? <ToggleRight className="w-5 h-5 text-orange-500" />
              : <ToggleLeft  className="w-5 h-5 text-gray-400" />
            }
            {org.status ? "Deactivate" : "Activate"}
          </button>
          <button
            onClick={() => onEdit(org)}
            className="flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-orange-500 transition-colors"
          >
            <Pencil className="w-4 h-4" /> Edit
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function OrganizationManagement() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { vendorOrgs, vendorOrgsLoading, vendorOrgsError, updating, updateError } =
    useSelector((s: RootState) => s.organization);

  const [search, setSearch]           = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage]               = useState(1);
  const [editModal, setEditModal]     = useState<VendorOrg | null>(null);

  useEffect(() => { dispatch(fetchVendorOrgs()); }, [dispatch]);

  // Close modal + toast after update
  const prevUpdating = useRef(false);
  useEffect(() => {
    if (prevUpdating.current && !updating) {
      if (!updateError) {
        toast.success("Organization updated successfully!");
        setEditModal(null);
      } else {
        toast.error(updateError);
        dispatch(clearUpdateError());
      }
    }
    prevUpdating.current = updating;
  }, [updating, updateError, dispatch]);

  const handleToggle = async (id: string) => {
    const target = vendorOrgs.find(o => o._id === id);
    if (!target) return;
    dispatch(optimisticToggleOrg(id));
    const result = await dispatch(toggleVendorOrgStatus({ id, currentStatus: target.status }));
    if (toggleVendorOrgStatus.fulfilled.match(result)) {
      toast.success(result.payload.msg);
    } else {
      dispatch(revertToggleOrg({ id, status: target.status }));
      toast.error(result.payload as string ?? "Failed to update status.");
    }
  };

  const handleSaveEdit = (form: EditOrgForm) => {
    if (!editModal) return;
    dispatch(updateVendorOrg({
      id: editModal._id,
      payload: {
        companyName:       form.companyName.trim(),
        contactEmail:      form.contactEmail.trim(),
        officeAddress:     form.officeAddress.trim(),
        mealTime:          form.mealTime,
        cutoffTime:        form.cutoffTime,
        capacity:          Number(form.capacity),
        allowDishRequests: form.allowDishRequests,
      },
    }));
  };

  const { filtered, paginated, totalPages, stats } = useMemo(() => {
    const filtered = vendorOrgs.filter(o => {
      const q = search.toLowerCase();
      const matchSearch =
        o.companyName.toLowerCase().includes(q) ||
        o.admin?.name.toLowerCase().includes(q)  ||
        o.admin?.email.toLowerCase().includes(q) ||
        false;
      const matchStatus =
        statusFilter === "All"                     ||
        (statusFilter === "Active"   &&  o.status) ||
        (statusFilter === "Inactive" && !o.status);
      return matchSearch && matchStatus;
    });

    const totalPages   = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const safePage     = Math.min(page, totalPages);
    const paginated    = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
    const activeCount  = vendorOrgs.filter(o => o.status).length;
    const totalMembers = vendorOrgs.reduce((s, o) => s + o.memberCount, 0);

    return { filtered, paginated, totalPages, stats: { activeCount, totalMembers } };
  }, [vendorOrgs, search, statusFilter, page]);

  if (vendorOrgsLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        <p className="text-sm text-gray-400 animate-pulse">Loading organizations…</p>
      </div>
    );
  }

  if (vendorOrgsError && !vendorOrgs.length) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        <div className="bg-white rounded-xl border border-red-200 shadow-sm p-6 text-center max-w-sm">
          <p className="text-red-500 text-sm font-medium mb-3">{vendorOrgsError}</p>
          <button
            onClick={() => dispatch(fetchVendorOrgs())}
            className="text-xs px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] p-4 sm:p-8">

      {editModal && (
        <OrgEditModal
          org={editModal}
          saving={updating}
          onClose={() => setEditModal(null)}
          onSave={handleSaveEdit}
        />
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-[32px] font-bold text-gray-900 tracking-tight leading-tight">
            Organizations
          </h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">
            Manage the organizations you serve and their admins.
          </p>
        </div>
        <button
          onClick={() => navigate("/vendor/organizations/add")}
          className="w-full sm:w-auto bg-[#FF7A00] hover:bg-orange-600 transition-all text-white rounded-xl px-6 py-3 text-sm font-bold shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 active:scale-95"
        >
          <Plus size={18} /> Add Organization
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Orgs"    value={vendorOrgs.length}                      color="text-gray-900" />
        <StatCard label="Active"        value={stats.activeCount}                      color="text-emerald-600" />
        <StatCard label="Inactive"      value={vendorOrgs.length - stats.activeCount}  color="text-gray-400" />
        <StatCard label="Total Members" value={stats.totalMembers}                     color="text-orange-500" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 h-11 shadow-sm">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, admin…"
            className="w-full text-sm outline-none bg-transparent text-gray-700 placeholder:text-gray-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-white border border-gray-200 rounded-xl px-4 h-11 text-sm text-gray-600 shadow-sm outline-none cursor-pointer"
        >
          <option>All</option>
          <option>Active</option>
          <option>Inactive</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-8">
        {paginated.length === 0 ? (
          <div className="py-20 text-center">
            <Building2 className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-sm font-semibold text-gray-400">No organizations found</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your filters or add a new one.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-widest text-gray-400">Organization</th>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-widest text-gray-400">Admin</th>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-widest text-gray-400">Members</th>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-widest text-gray-400">Status</th>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-widest text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(org => (
                  <OrgRow key={org._id} org={org} onToggle={handleToggle} onEdit={setEditModal} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            Showing <span className="font-semibold text-gray-600">{paginated.length}</span> of{" "}
            <span className="font-semibold text-gray-600">{filtered.length}</span> organizations
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-gray-600">{page} / {totalPages}</span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}