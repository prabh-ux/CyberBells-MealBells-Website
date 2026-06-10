import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchMe } from "../slices/authSlice";
import type { AppDispatch, RootState } from "../app/store";

interface Props {
  requireAuth?:      boolean; // redirect to /login if not authed
  redirectIfAuthed?: boolean; // redirect away from login/signup if already authed
  adminOnly?:        boolean; // block non-admin users entirely
  allowedTypes?:     string[]; // restrict to specific user types
}

const getHomeByType = (type: string) => {
  if (type === "vendor") return "/vendor/dashboard";
  if (type === "admin")  return "/admin/dashboard";
  return "/user/today-menu";
};

export default function ProtectedRoute({
  requireAuth      = false,
  redirectIfAuthed = false,
  adminOnly        = false,
  allowedTypes,
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

  // Not logged in but route requires auth
  if (requireAuth && !user) return <Navigate to="/login" replace />;

  // Already logged in — redirect to their correct home
  if (redirectIfAuthed && user) return <Navigate to={getHomeByType(user.type)} replace />;

  // Admin-only pages
  if (adminOnly && user?.type !== "admin") return <Navigate to={getHomeByType(user?.type ?? "")} replace />;

  // Type-restricted pages (e.g. allowedTypes={["user"]})
  if (allowedTypes && user && !allowedTypes.includes(user.type)) {
    return <Navigate to={getHomeByType(user.type)} replace />;
  }

  return <Outlet />;
}