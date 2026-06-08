import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchMe } from "../slices/authSlice";
import type { AppDispatch, RootState } from "../app/store";

interface Props {
  requireAuth?:     boolean;  // redirect to /login if not authed
  redirectIfAuthed?: boolean; // redirect away from /login if already authed
  adminOnly?:       boolean;  // block non-admin users entirely
}

export default function ProtectedRoute({
  requireAuth      = false,
  redirectIfAuthed = false,
  adminOnly        = false,
}: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const { user, initialized } = useSelector((s: RootState) => s.auth);

  useEffect(() => {
    if (!initialized) dispatch(fetchMe());
  }, []);

  if (!initialized) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-gray-400 text-sm">Verifying session…</span>
      </div>
    );
  }

  if (requireAuth && !user)       return <Navigate to="/login"           replace />;
  if (redirectIfAuthed && user)   return <Navigate to="/admin/dashboard" replace />;

  // ── New: block non-admins from admin-only pages ───────────────────────────
  if (adminOnly && user?.type !== "admin")
    return <Navigate to="/user/today-menu" replace />;

  return <Outlet />;
}