// pages/superAdmin/SuperAdminUsersPage.tsx
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector }    from "react-redux";
import { useNavigate }                 from "react-router-dom";
import { Search, Plus, Trash2, Pencil, X, Eye, EyeOff, Copy, Check } from "lucide-react";
import type { AppDispatch, RootState } from "../../app/store";
import {
  fetchSuperUsers,
  updateSuperUser,
  toggleSuperUserStatus,
  deleteSuperUser,
  clearNewUserCredentials,
  clearError,
  type SuperUserRecord,
} from "../../slices/superAdmin/superAdminUsersSlice";
import { fetchSuperOrgOptions } from "../../slices/superAdmin/superAdminAnalyticsSlice";

// ── helpers ───────────────────────────────────────────────────────────────────

const ROLES   = ["Standard User", "Department Head", "System Admin"];
const GENDERS = ["Male", "Female", "Other"];

const initials = (name: string) =>
  name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

const avatarBg = (name: string) => {
  const colors = ["#FFF4EC", "#EFF6FF", "#F0FDF4", "#FDF4FF", "#FFF1F2"];
  return colors[name.charCodeAt(0) % colors.length];
};
const avatarFg = (name: string) => {
  const colors = ["#EA580C", "#2563EB", "#16A34A", "#9333EA", "#E11D48"];
  return colors[name.charCodeAt(0) % colors.length];
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function SuperAdminUsersPage() {
  const dispatch  = useDispatch<AppDispatch>();
  const navigate  = useNavigate();

  const { users, loading, updating, deleting, toggling, error } =
    useSelector((s: RootState) => s.superUsers);
  const { orgOptions, filters } = useSelector((s: RootState) => s.superAnalytics);
  const activeOrgId = filters.orgId;

  // local state
  const [search,       setSearch]       = useState("");
  const [editTarget,   setEditTarget]   = useState<SuperUserRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SuperUserRecord | null>(null);
  const [form,         setForm]         = useState({
    fullName: "", email: "", phone: "", gender: "",
    department: "", role: "Standard User", active: "true", orgId: "",
  });
  const [avatarFile,    setAvatarFile]    = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── fetch ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!orgOptions.length) dispatch(fetchSuperOrgOptions());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchSuperUsers(activeOrgId));
  }, [dispatch, activeOrgId]);

  // ── filtered list ─────────────────────────────────────────────────────────
  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return (
      !q ||
      u.name.toLowerCase().includes(q)              ||
      u.email.toLowerCase().includes(q)             ||
      u.department?.toLowerCase().includes(q)       ||
      u.organizationName?.toLowerCase().includes(q)
    );
  });

  // ── edit helpers ──────────────────────────────────────────────────────────
  const openEdit = (u: SuperUserRecord) => {
    setEditTarget(u);
    setForm({
      fullName:   u.name,
      email:      u.email,
      phone:      u.phone      ?? "",
      gender:     u.gender     ?? "",
      department: u.department ?? "",
      role:       u.role,
      active:     u.active ? "true" : "false",
      orgId:      u.organizationId?.[0] ?? "",
    });
    setAvatarFile(null);
    setAvatarPreview(u.avatar ?? null);
  };

  const closeEdit = () => {
    setEditTarget(null);
    setAvatarFile(null);
    setAvatarPreview(null);
    dispatch(clearError());
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleUpdate = async () => {
    if (!editTarget) return;
    const payload = new FormData();
    Object.entries(form).forEach(([k, v]) => payload.append(k, v));
    if (avatarFile) payload.append("avatar", avatarFile);
    const res = await dispatch(updateSuperUser({ id: editTarget._id, payload }));
    if (!res.type.endsWith("rejected")) closeEdit();
  };

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-full bg-[#F5F5F5] p-4 sm:p-6 lg:p-8 font-sans">

      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-[24px] sm:text-[30px] font-bold text-gray-900 tracking-tight">
            All Users
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {activeOrgId === "all"
              ? "Managing users across all organizations"
              : `Showing users for: ${orgOptions.find(o => o.value === activeOrgId)?.label ?? activeOrgId}`}
          </p>
        </div>
        <button
          onClick={() => navigate("/super-admin/users/add")}
          className="flex items-center gap-2 bg-[#EA580C] hover:bg-[#C44D0A] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4 flex items-center gap-3 shadow-sm">
        <Search className="w-4 h-4 text-gray-400 shrink-0" />
        <input
          type="text"
          placeholder="Search by name, email, department or organization..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 text-sm text-gray-700 placeholder:text-gray-400 outline-none bg-transparent"
        />
        {search && (
          <button onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: "Total Users",   value: users.length },
          { label: "Active",        value: users.filter(u => u.active).length },
          { label: "Inactive",      value: users.filter(u => !u.active).length },
          { label: "Organizations", value: new Set(users.map(u => u.organizationId?.[0])).size },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
            <p className="text-xs text-gray-400 font-medium">{s.label}</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
            Loading users...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <p className="text-sm font-medium">No users found</p>
            {search && <p className="text-xs mt-1">Try a different search</p>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {["User", "Organization", "Department", "Role", "Status", "Actions"].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(u => (
                  <tr key={u._id} className="hover:bg-gray-50 transition-colors">

                    {/* User */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {u.avatar ? (
                          <img src={u.avatar} alt={u.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                        ) : (
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                            style={{ background: avatarBg(u.name), color: avatarFg(u.name) }}
                          >
                            {initials(u.name)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800 truncate">{u.name}</p>
                          <p className="text-xs text-gray-400 truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Org */}
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-orange-50 text-orange-700 text-xs font-semibold">
                        {u.organizationName}
                      </span>
                    </td>

                    {/* Department */}
                    <td className="px-5 py-4 text-gray-600">{u.department || "—"}</td>

                    {/* Role */}
                    <td className="px-5 py-4">
                      <span className="text-xs text-gray-600 font-medium">{u.role}</span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <button
                        onClick={() => dispatch(toggleSuperUserStatus(u._id))}
                        disabled={toggling === u._id}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                          u.active
                            ? "bg-green-50 text-green-700 hover:bg-green-100"
                            : "bg-red-50 text-red-600 hover:bg-red-100"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${u.active ? "bg-green-500" : "bg-red-400"}`} />
                        {toggling === u._id ? "..." : u.active ? "Active" : "Inactive"}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(u)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(u)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Edit Modal (kept inline) ───────────────────────────────────────── */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">Edit User</h2>
              <button onClick={closeEdit} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 flex flex-col gap-4">

              {/* Avatar picker */}
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-full overflow-hidden border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-orange-400 transition-colors shrink-0"
                  onClick={() => fileRef.current?.click()}
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} className="w-full h-full object-cover" alt="avatar" />
                  ) : (
                    <span className="text-xs text-gray-400 text-center leading-tight px-1">Add photo</span>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
                <div>
                  <p className="text-sm font-medium text-gray-700">Profile photo</p>
                  <p className="text-xs text-gray-400">Optional · JPG, PNG</p>
                </div>
              </div>

              {/* Org */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Organization *</label>
                <select
                  value={form.orgId}
                  onChange={e => setForm(f => ({ ...f, orgId: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-orange-400 text-gray-700 bg-white"
                >
                  <option value="">Select organization</option>
                  {orgOptions.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Full Name *</label>
                <input
                  value={form.fullName}
                  onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                  placeholder="John Doe"
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-orange-400"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="john@company.com"
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-orange-400"
                />
              </div>

              {/* Phone + Gender */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Phone</label>
                  <input
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+91 9876543210"
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Gender</label>
                  <select
                    value={form.gender}
                    onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-orange-400 bg-white text-gray-700"
                  >
                    <option value="">Select</option>
                    {GENDERS.map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
              </div>

              {/* Department + Role */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Department</label>
                  <input
                    value={form.department}
                    onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                    placeholder="Engineering"
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Role</label>
                  <select
                    value={form.role}
                    onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-orange-400 bg-white text-gray-700"
                  >
                    {ROLES.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Status</label>
                <div className="flex gap-3">
                  {["true", "false"].map(val => (
                    <label key={val} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio" name="active" value={val}
                        checked={form.active === val}
                        onChange={() => setForm(f => ({ ...f, active: val }))}
                        className="accent-orange-500"
                      />
                      <span className="text-sm text-gray-700">{val === "true" ? "Active" : "Inactive"}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Error */}
              {error && (
                <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button onClick={closeEdit}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button onClick={handleUpdate} disabled={updating}
                  className="flex-1 py-2.5 rounded-xl bg-[#EA580C] hover:bg-[#C44D0A] text-white text-sm font-semibold transition-colors disabled:opacity-60">
                  {updating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ───────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-base font-bold text-gray-800 mb-1">Delete User?</h3>
            <p className="text-sm text-gray-500 mb-5">
              This will permanently delete{" "}
              <span className="font-semibold text-gray-700">{deleteTarget.name}</span>.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={async () => {
                  await dispatch(deleteSuperUser(deleteTarget._id));
                  setDeleteTarget(null);
                }}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}