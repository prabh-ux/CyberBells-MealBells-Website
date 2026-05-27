import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchMe } from "../slices/authSlice";
import type { AppDispatch, RootState } from "../app/store";

interface Props {
  /** Require login — redirect to /login if not authed (default: false) */
  requireAuth?: boolean;
  /** Redirect to /admin/dashboard if already logged in (for /login, /signup) */
  redirectIfAuthed?: boolean;
}

export default function ProtectedRoute({ requireAuth = false, redirectIfAuthed = false }: Props) {
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

  return <Outlet />;
}