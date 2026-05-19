import { useState, useRef, useMemo, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import searchIcon from "../../assets/searchIcon.png";
import plus from "../../assets/plus.png";
import importIcon from "../../assets/import.png";
import editIcon from "../../assets/editIcon.png";
import notActionIcon from "../../assets/notActionIcon.png";
import actionIcon from "../../assets/actionIcon.png";
import leftArrowIcon from "../../assets/leftArrowIcon.png";
import rightArrowIcon from "../../assets/rightArrowIcon.png";
import a1 from "../../assets/a1.png";
import a2 from "../../assets/a2.png";
import a3 from "../../assets/a3.png";
import a4 from "../../assets/a4.png";
import a5 from "../../assets/a5.png";
import DropDown from "../../components/shared/DropDown";
import type { StatusKey } from "../../types/admin";
import { STATUS } from "../../data/adminData";

// ─── Constants ────────────────────────────────────────────────────────────────
const AVATARS = [a1, a2, a3, a4, a5];
const PAGE_SIZE = 5;
const DEPARTMENTS = ["ENGINEERING", "MARKETING", "PRODUCT", "SALES", "HUMAN RESOURCES", "FINANCE", "DESIGN"];
const FIELD_META = {
  name:  { label: "Full Name", placeholder: "e.g. Jane Smith",        type: "text"  },
  email: { label: "Email",     placeholder: "e.g. jane@company.com",  type: "email" },
  phone: { label: "Phone",     placeholder: "e.g. +1 (555) 000-0000", type: "text"  },
} as const;

export const INIT_USERS = [
  { id: 1, name: "Alex Morgan",     email: "alex.morgan@company.com", phone: "+1 (555) 123-4567", department: "ENGINEERING",     status: "Active",   avatar: a1 },
  { id: 2, name: "Jordan Peterson", email: "j.peterson@company.com",  phone: "+1 (555) 987-6543", department: "MARKETING",       status: "Inactive", avatar: a2 },
  { id: 3, name: "David Chen",      email: "david.chen@company.com",  phone: "+1 (555) 444-2222", department: "PRODUCT",         status: "Active",   avatar: a3 },
  { id: 4, name: "Sarah Jenkins",   email: "s.jenkins@company.com",   phone: "+1 (555) 777-8888", department: "SALES",           status: "Active",   avatar: a4 },
  { id: 5, name: "Robert Wilson",   email: "r.wilson@company.com",    phone: "+1 (555) 222-3333", department: "HUMAN RESOURCES", status: "Active",   avatar: a5 },
  { id: 1, name: "Alex Morgan",     email: "alex.morgan@company.com", phone: "+1 (555) 123-4567", department: "ENGINEERING",     status: "Active",   avatar: a1 },
  { id: 2, name: "Jordan Peterson", email: "j.peterson@company.com",  phone: "+1 (555) 987-6543", department: "MARKETING",       status: "Inactive", avatar: a2 },
  { id: 3, name: "David Chen",      email: "david.chen@company.com",  phone: "+1 (555) 444-2222", department: "PRODUCT",         status: "Active",   avatar: a3 },
  { id: 4, name: "Sarah Jenkins",   email: "s.jenkins@company.com",   phone: "+1 (555) 777-8888", department: "SALES",           status: "Active",   avatar: a4 },
  { id: 5, name: "Robert Wilson",   email: "r.wilson@company.com",    phone: "+1 (555) 222-3333", department: "HUMAN RESOURCES", status: "Active",   avatar: a5 },
];

export type User = typeof INIT_USERS[0];
type EditForm = { name: string; email: string; phone: string; department: string };

// ─── Field Label ──────────────────────────────────────────────────────────────
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[12px] font-semibold uppercase tracking-wide text-[var(--text-label)] [font-family:var(--font-inter)]">
      {children}
    </label>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ s }: { s: string }) => (
  <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs font-semibold whitespace-nowrap ${
    s === "Active" ? "bg-[#F0FDF4] border-[#CDEFD8] text-[#15803D]" : "bg-[#F3F4F6] border-[#E5E7EB] text-[#4B5563]"
  }`}>
    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s === "Active" ? "bg-[#22C55E]" : "bg-[#9CA3AF]"}`} />
    {s}
  </span>
);

// ─── Edit Modal ───────────────────────────────────────────────────────────────
const EditModal = memo(({ user, onClose, onSave }: {
  user: User;
  onClose: () => void;
  onSave: (form: EditForm) => void;
}) => {
  const [form, setForm] = useState<EditForm>({
    name: user.name,
    email: user.email,
    phone: user.phone,
    department: user.department,
  });
  const [error, setError] = useState("");

  const setField = useCallback(
    (key: keyof EditForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
    []
  );
  const setDept = useCallback((v: string) => setForm((f) => ({ ...f, department: v })), []);

  const submit = () => {
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setError("Name, email, and phone are required.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(form.email)) {
      setError("Enter a valid email address.");
      return;
    }
    onSave(form);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--divider)] shrink-0">
          <h2 className="text-[18px] font-bold text-[var(--text-primary)] [font-family:var(--font-manrope)]">
            Edit User
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--text-label)] hover:text-[var(--text-primary)] text-xl leading-none transition-colors"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-4">
          {error && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          {/* Avatar preview */}
          <div className="flex items-center gap-4 p-4 bg-[#F9F9F9] rounded-xl border border-[var(--border)]">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-14 h-14 rounded-full object-cover ring-2 ring-white shadow"
            />
            <div className="flex flex-col gap-1">
              <p className="text-[14px] font-bold text-[var(--text-primary)] [font-family:var(--font-manrope)]">
                {user.name}
              </p>
              <p className="text-[12px] text-[var(--text-label)] [font-family:var(--font-inter)]">
                {user.email}
              </p>
              <StatusBadge s={user.status} />
            </div>
          </div>

          {/* Text fields */}
          {(["name", "email", "phone"] as const).map((key) => (
            <div key={key} className="flex flex-col gap-1">
              <FieldLabel>{FIELD_META[key].label}</FieldLabel>
              <input
                type={FIELD_META[key].type}
                placeholder={FIELD_META[key].placeholder}
                value={form[key]}
                onChange={setField(key)}
                className="border border-[var(--border)] rounded-xl px-3 py-[10px] text-[14px] text-[var(--text-primary)] [font-family:var(--font-inter)] focus:outline-none focus:border-[#FF7A00] transition-colors placeholder:text-[#9CA3AF]"
              />
            </div>
          ))}

          {/* Department */}
          <div className="flex flex-col gap-1">
            <FieldLabel>Department</FieldLabel>
            <DropDown wfull={true} value={form.department} options={DEPARTMENTS} onChange={setDept} />
          </div>

          {/* Spacer so dropdown has room to open */}
          <div className="h-32" />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--divider)] shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl border border-[var(--border)] text-[14px] font-semibold text-[var(--text-label)] hover:text-[var(--text-primary)] [font-family:var(--font-inter)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            className="px-5 py-2 rounded-xl bg-[#FF7A00] hover:brightness-90 active:brightness-75 text-white text-[14px] font-semibold [font-family:var(--font-inter)] transition-all"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
});

// ─── User Row (desktop) ───────────────────────────────────────────────────────
const UserRow = memo(({ user, onEdit, onToggle }: { user: User; onEdit: (u: User) => void; onToggle: (id: number) => void }) => {
  const { id, name, email, phone, department, status: s, avatar } = user;
  return (
    <tr className="hover:bg-orange-50/30 transition-colors">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <img src={avatar} alt={name} className="w-9 h-9 rounded-full object-cover shadow-sm ring-2 ring-white shrink-0" />
          <span className="font-semibold text-sm lg:text-base whitespace-nowrap">{name}</span>
        </div>
      </td>
      <td className="px-4 py-4 text-[#555F71] text-xs lg:text-sm max-w-[180px] truncate">{email}</td>
      <td className="px-4 py-4 text-[#555F71] text-sm hidden lg:table-cell whitespace-nowrap">{phone}</td>
      <td className="px-4 py-4 hidden md:table-cell">
        <span className="bg-[#EEEEEE] text-[10px] font-bold tracking-wide px-2.5 py-0.5 rounded-md">{department}</span>
      </td>
      <td className="px-4 py-4"><StatusBadge s={s} /></td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-1">
          <button onClick={() => onEdit(user)} className="p-1.5 rounded-md hover:bg-blue-50 transition-colors">
            <img src={editIcon} alt="Edit" width={15} height={15} />
          </button>
          <button onClick={() => onToggle(id)} className="p-1.5 rounded-md hover:bg-red-50 transition-colors">
            <img src={s === "Active" ? actionIcon : notActionIcon} alt="Toggle" width={15} height={15} className={s === "Active" ? "" : "opacity-50"} />
          </button>
        </div>
      </td>
    </tr>
  );
});

// ─── Mobile Card ──────────────────────────────────────────────────────────────
const MobileCard = memo(({ user, onEdit, onToggle }: { user: User; onEdit: (u: User) => void; onToggle: (id: number) => void }) => {
  const { id, name, email, phone, department, status: s, avatar } = user;
  return (
    <div className="bg-white rounded-xl border border-[#F3F4F6] shadow-sm p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <img src={avatar} alt={name} className="w-10 h-10 rounded-full object-cover ring-2 ring-white shrink-0" />
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{name}</p>
            <p className="text-xs text-[#555F71] truncate">{email}</p>
            <p className="text-xs text-[#555F71] mt-0.5">{phone}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => onEdit(user)} className="p-2 rounded-md hover:bg-blue-50 transition-colors">
            <img src={editIcon} alt="Edit" width={15} height={15} />
          </button>
          <button onClick={() => onToggle(id)} className="p-2 rounded-md hover:bg-red-50 transition-colors">
            <img src={s === "Active" ? notActionIcon : actionIcon} alt="Toggle" width={15} height={15} className={s === "Active" ? "opacity-50" : ""} />
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <span className="bg-[#EEEEEE] text-[10px] font-bold tracking-wide px-2.5 py-0.5 rounded-md">{department}</span>
        <StatusBadge s={s} />
      </div>
    </div>
  );
});

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function UserManagement() {
  const navigate = useNavigate();

  const [users, setUsers]         = useState(INIT_USERS);
  const [search, setSearch]       = useState("");
  const [status, setStatus]       = useState<StatusKey>("All Status");
  const [currentPage, setCurrentPage] = useState(1);
  const [editModal, setEditModal] = useState<User | null>(null); // ← only edit modal, no add modal
  const csvRef = useRef<HTMLInputElement>(null);

  const { filtered, paginated, totalPages, safePage, pageNums, stats } = useMemo(() => {
    const filtered = users.filter(({ name, email, status: s }) =>
      (name.toLowerCase().includes(search.toLowerCase()) || email.toLowerCase().includes(search.toLowerCase())) &&
      (status === "All Status" || s === status)
    );
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const safePage   = Math.min(currentPage, totalPages);
    const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
    const pageNums   = totalPages <= 4 ? Array.from({ length: totalPages }, (_, i) => i + 1) : [1, 2, 3];
    const active   = users.filter((u) => u.status === "Active").length;
    const inactive = users.length - active;
    const stats = [
      { label: "Total active users",   value: active,        badge: `${active} active`,                     badgeColor: "text-emerald-500", accent: "bg-orange-500" },
      { label: "Onboarding pending",   value: inactive,      badge: `${inactive} pending`,                   badgeColor: "text-red-400",     accent: "bg-[#1E293B]"  },
      { label: "New users this month", value: users.length,  badge: `+${Math.max(0, users.length - 5)} new`, badgeColor: "text-emerald-500", accent: "bg-sky-400"    },
    ];
    return { filtered, paginated, totalPages, safePage, pageNums, stats };
  }, [users, search, status, currentPage]);

  const toggleStatus = useCallback((id: number) =>
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, status: u.status === "Active" ? "Inactive" : "Active" } : u)), []);

  // ← "Add New User" navigates to a route
  const openAdd = useCallback(() => navigate("/admin/add-user"), [navigate]);

  // ← Edit icon opens the modal inline
  const openEdit  = useCallback((user: User) => setEditModal(user), []);
  const closeEdit = useCallback(() => setEditModal(null), []);
  const saveEdit  = useCallback((form: EditForm) => {
    setUsers((prev) => prev.map((u) => u.id === editModal!.id ? { ...u, ...form } : u));
    setEditModal(null);
  }, [editModal]);

  const goTo = useCallback((p: number) => setCurrentPage(Math.max(1, Math.min(p, totalPages))), [totalPages]);

  const handleCSV = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ({ target }) => {
      const imported = (target?.result as string).trim().split("\n").slice(1)
        .map((line, i) => {
          const [name, email, phone, department] = line.split(",").map((s) => s.trim());
          return {
            id: Date.now() + i,
            name: name || "Unknown",
            email: email || "",
            phone: phone || "",
            department: (department || "ENGINEERING").toUpperCase(),
            status: "Active",
            avatar: AVATARS[i % AVATARS.length],
          };
        })
        .filter((u) => u.name && u.email);
      setUsers((prev) => [...prev, ...imported]);
    };
    reader.readAsText(file);
    e.target.value = "";
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F5F5] p-3 sm:p-4 lg:p-6">
      

       {/* Header */}
<div className="mb-4 sm:mb-6">
  
  {/* Row 1: Title (left) + Search & Filter (right) */}
  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
    {/* Title block */}
    <div className="shrink-0">
      <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-bold text-[var(--text-primary)] tracking-tight leading-tight">
        User Management
      </h1>
      <p className="text-xs sm:text-sm text-[#555F71] mt-0.5 sm:mt-1 max-w-xs">
        Manage and monitor platform access for all organization members.
      </p>
    </div>

    {/* Search + Filter */}
    <div className="flex items-center gap-2 w-full sm:w-auto">
      <div className="relative flex-1 sm:w-56 lg:w-72">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <img src={searchIcon} alt="Search" width={15} height={15} />
        </span>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          className="w-full pl-9 pr-3 py-2 text-sm border border-[#E5E7EB] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder-gray-400 text-[#6B7280]"
        />
      </div>
      <DropDown value={status} options={STATUS} onChange={(v) => setStatus(v as StatusKey)} />
    </div>
  </div>

  
</div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={openAdd}
              className="flex items-center gap-1.5 bg-[#FF7A00] hover:bg-orange-600 active:bg-orange-700 text-white text-sm px-3 sm:px-4 py-2 rounded-xl shadow-sm transition-colors whitespace-nowrap"
            >
              <img src={plus} alt="Add" width={11.67} height={11.67} />
              Add New User
            </button>
            <button
              onClick={() => csvRef.current?.click()}
              className="flex items-center gap-1.5 border border-[#E5E7EB] bg-white hover:bg-gray-50 text-[#555F71] text-sm px-3 sm:px-4 py-2 rounded-xl shadow-sm transition-colors whitespace-nowrap"
            >
              <img src={importIcon} alt="Upload" width={13.33} height={13.33} />
              <span className="hidden sm:inline">Import Users (CSV)</span>
              <span className="sm:hidden">Import CSV</span>
            </button>
            <input ref={csvRef} type="file" accept=".csv" className="hidden" onChange={handleCSV} />
          </div>
          <span className="text-xs sm:text-sm text-[#555F71] whitespace-nowrap">
            Showing {filtered.length} of {users.length} users
          </span>
        </div>

        {/* Desktop Table */}
        <div className="hidden sm:block">
          <div className="bg-white rounded-t-xl border border-[#F3F4F6] shadow-sm overflow-x-auto">
            <table className="w-full text-sm min-w-[580px]">
              <thead className="bg-[#F3F3F3] text-[#555F71]">
                <tr className="border-b border-gray-100">
                  {["User", "Email", "Phone", "Department", "Status", "Actions"].map((h, i) => (
                    <th key={h} className={`text-left px-4 py-3.5 text-xs font-bold uppercase tracking-wide ${i === 2 ? "hidden lg:table-cell" : i === 3 ? "hidden md:table-cell" : ""}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.length === 0
                  ? <tr><td colSpan={6} className="text-center py-10 text-[#555F71] text-sm">No users found.</td></tr>
                  : paginated.map((user) => <UserRow key={user.id} user={user} onEdit={openEdit} onToggle={toggleStatus} />)
                }
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="sm:hidden flex flex-col gap-3">
          {paginated.length === 0
            ? <div className="bg-white rounded-xl border border-[#F3F4F6] shadow-sm p-8 text-center text-[#555F71] text-sm">No users found.</div>
            : paginated.map((user) => <MobileCard key={user.id} user={user} onEdit={openEdit} onToggle={toggleStatus} />)
          }
        </div>

      {/* Pagination */}
<div className="flex items-center justify-between bg-white border border-t-0 rounded-b-xl border-[#F3F4F6] px-3 py-2.5 mb-4 sm:mb-6">
  <button
    onClick={() => goTo(safePage - 1)}
    disabled={safePage === 1}
    className="flex items-center gap-1.5 text-xs sm:text-sm text-[#374151] border border-[#E5E7EB] shadow-sm px-3 sm:px-4 py-1.5 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium"
  >
    ‹ Previous
  </button>

  <div className="flex items-center gap-1">
    {pageNums.map((p) => (
      <button
        key={p}
        onClick={() => goTo(p)}
        className={`w-8 h-8 rounded-xl text-sm font-medium transition-colors ${
          safePage === p
            ? "bg-orange-500 text-white shadow-sm"
            : "text-gray-600 hover:bg-gray-100"
        }`}
      >
        {p}
      </button>
    ))}
    {totalPages > 4 && (
      <>
        <span className="px-1 text-gray-400 text-sm">...</span>
        <button
          onClick={() => goTo(totalPages)}
          className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
            safePage === totalPages
              ? "bg-orange-500 text-white shadow-sm"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          {totalPages}
        </button>
      </>
    )}
  </div>

  <button
    onClick={() => goTo(safePage + 1)}
    disabled={safePage === totalPages}
    className="flex items-center gap-1.5 text-xs sm:text-sm text-[#374151] border border-[#E5E7EB] shadow-sm px-3 sm:px-4 py-1.5 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium"
  >
    Next ›
  </button>
</div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {stats.map(({ label, value, badge, badgeColor, accent }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5 flex items-center gap-4 relative overflow-hidden">
              <div className={`absolute left-0 top-0 h-full w-1 ${accent} rounded-l-xl`} />
              <div className="pl-2">
                <p className="text-xs text-[#555F71] mb-1">{label}</p>
                <div className="flex items-end gap-2 flex-wrap">
                  <span className="text-2xl sm:text-[30px] font-normal text-gray-900">{value}</span>
                  <span className={`text-xs sm:text-sm font-semibold mb-0.5 ${badgeColor}`}>{badge}</span>
                </div>
              </div>
            </div>
          ))}
        </div>


      {/* Edit Modal — opens inline over the page */}
      {editModal && (
        <EditModal user={editModal} onClose={closeEdit} onSave={saveEdit} />
      )}
    </div>
  );
}