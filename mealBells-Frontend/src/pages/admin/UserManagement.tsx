import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../app/store";
import {
  fetchUsers, toggleUserStatus, updateUser, importCSVUsers,
  optimisticToggle, revertToggle,
} from "../../slices/userSlice";
import toast from "react-hot-toast";

import type { EditForm, StatusKey, User } from "../../types/admin";
import { AVATARS, PAGE_SIZE } from "../../data/UserManagement";
import UserManagementHeader   from "../../components/admin/UserManagement/UserManagementHeader";
import UserManagementActions  from "../../components/admin/UserManagement/UserManagementActions";
import UsersTable             from "../../components/admin/UserManagement/UsersTable";
import UsersMobileList        from "../../components/admin/UserManagement/UsersMobileList";
import Pagination             from "../../components/admin/UserManagement/Pagination";
import StatsGrid              from "../../components/admin/UserManagement/StatsGrid";
import EditModal              from "../../components/admin/UserManagement/EditModal";

export default function UserManagement() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { users, loading, error, updating } = useSelector((s: RootState) => s.users);

  const [search,    setSearch]    = useState("");
  const [status,    setStatus]    = useState<StatusKey>("All Status");
  const [page,      setPage]      = useState(1);
  const [editModal, setEditModal] = useState<User | null>(null);

  // Fetch on mount
  useEffect(() => { dispatch(fetchUsers()); }, [dispatch]);

  // ── Derived state ──────────────────────────────────────────────────────────
  const { filtered, paginated, totalPages, safePage, pageNums, stats } =
    useMemo(() => {
      const filtered = users.filter(
        ({ name, email, status: s }) =>
          (name.toLowerCase().includes(search.toLowerCase()) ||
            email.toLowerCase().includes(search.toLowerCase())) &&
          (status === "All Status" || s === status),
      );
      const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
      const safePage   = Math.min(page, totalPages);
      const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
      const pageNums   =
        totalPages <= 4
          ? Array.from({ length: totalPages }, (_, i) => i + 1)
          : [1, 2, 3];
      const active = users.filter(u => u.status === "Active").length;
      const stats = [
        {
          label: "Total active users",   value: active,
          badge: `${active} active`,     badgeColor: "text-emerald-500", accent: "bg-orange-500",
        },
        {
          label: "Onboarding pending",   value: users.length - active,
          badge: `${users.length - active} pending`, badgeColor: "text-red-400", accent: "bg-[#1E293B]",
        },
        {
          label: "New users this month", value: users.length,
          badge: `+${Math.max(0, users.length - 5)} new`, badgeColor: "text-emerald-500", accent: "bg-sky-400",
        },
      ];
      return { filtered, paginated, totalPages, safePage, pageNums, stats };
    }, [users, search, status, page]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value); setPage(1);
  }, []);

  const handleStatusChange = useCallback((value: StatusKey) => {
    setStatus(value);
  }, []);

  const handleToggle = useCallback(
    async (id: string) => {
      const target = users.find(u => u.id === id);
      if (!target) return;

      dispatch(optimisticToggle(id));

      const result = await dispatch(toggleUserStatus({ id, currentStatus: target.status }));

      if (toggleUserStatus.fulfilled.match(result)) {
        toast.success(result.payload.msg);
      } else {
        dispatch(revertToggle({ id, status: target.status }));
        toast.error(result.payload as string ?? "Failed to update status.");
      }
    },
    [users, dispatch],
  );

  const goTo = useCallback(
    (p: number) => setPage(Math.max(1, Math.min(p, totalPages))),
    [totalPages],
  );

  // Track updating state to close modal and show toast
  const prevUpdating = useRef(false);
  useEffect(() => {
    if (prevUpdating.current && !updating) {
      if (!error) {
        toast.success("User updated successfully!");
        setEditModal(null);
      } else {
        toast.error(error);
      }
    }
    prevUpdating.current = updating;
  }, [updating, error]);

  const saveEdit = useCallback(
    async (form: EditForm, file?: File) => {
      if (!editModal) return;
      const result = await dispatch(updateUser({ id: editModal.id, form, file }));
      if (updateUser.rejected.match(result)) {
        throw new Error(result.payload as string);
      }
    },
    [editModal, dispatch],
  );

  const handleCSV = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ({ target }) => {
      const imported: User[] = (target?.result as string)
        .trim().split("\n").slice(1)
        .map((line, i) => {
          const [name, email, phone, department] = line.split(",").map(s => s.trim());
          return {
            id:         String(Date.now() + i),
            name:       name       || "Unknown",
            email:      email      || "",
            phone:      phone      || "",
            department: (department || "ENGINEERING").toUpperCase(),
            status:     "Active" as const,
            avatar:     AVATARS[i % AVATARS.length],
          };
        })
        .filter(u => u.name && u.email);
      dispatch(importCSVUsers(imported));
    };
    reader.readAsText(file);
  }, [dispatch]);

  // ── Loading / error states ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <p className="text-[#555F71] text-sm animate-pulse">Loading users…</p>
      </div>
    );
  }

  if (error && !users.length) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="bg-white rounded-xl border border-red-200 shadow-sm p-6 text-center max-w-sm">
          <p className="text-red-500 text-sm font-medium mb-3">{error}</p>
          <button
            onClick={() => dispatch(fetchUsers())}
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
    <div className="min-h-screen bg-[#F5F5F5] p-3 sm:p-4 lg:p-6">
      <UserManagementHeader
        search={search} status={status}
        onSearchChange={handleSearchChange}
        onStatusChange={handleStatusChange}
      />
      <UserManagementActions
        filteredCount={filtered.length}
        totalCount={users.length}
        onAddUser={() => navigate("/admin/add-user")}
        onImportCSV={handleCSV}
      />
      <UsersTable    paginated={paginated} onEdit={setEditModal} onToggle={handleToggle} />
      <UsersMobileList paginated={paginated} onEdit={setEditModal} onToggle={handleToggle} />
      <Pagination    safePage={safePage} totalPages={totalPages} pageNums={pageNums} onGoTo={goTo} />
      <StatsGrid     stats={stats} />
      {editModal && (
        <EditModal
          user={editModal}
          onClose={() => setEditModal(null)}
          onSave={saveEdit}
        />
      )}
    </div>
  );
}