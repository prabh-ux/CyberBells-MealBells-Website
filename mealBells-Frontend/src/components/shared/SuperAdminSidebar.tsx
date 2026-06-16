import { useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logoutUser } from "../../slices/authSlice";
import type { AppDispatch } from "../../app/store";

import adminPanelHeaderIcon from "../../assets/adminPanelHeaderIcon.png";
import dashboardIcon from "../../assets/dashboardIcon.png";
import usersIcon from "../../assets/usersIcon.png";
import vendorsIcon from "../../assets/vendorsIcon.png";
import reportsIcon from "../../assets/reportsIcon.png";
import settingsIcon from "../../assets/settingsIcon.png";
import logoutIcon from "../../assets/logoutIcon.png";
import menuOverviewIcon from "../../assets/menuOverviewIcon.png";
import attendanceIcon from "../../assets/attendanceIcon.png";

import NavButton from "./NavButton";

// ── Nav config ───────────────────────────────────────────────────────────────

const navItems = [
  { label: "Dashboard",            path: "/super-admin/dashboard",                    icon: dashboardIcon },
  { label: "Users",                path: "/super-admin/users",                        icon: usersIcon },
  { label: "Requested Dishes",     path: "/super-admin/requested-dishes",             icon: usersIcon },
  { label: "Vendors",              path: "/super-admin/vendors",                      icon: vendorsIcon },
  { label: "Vendors Performance",  path: "/super-admin/vendors-performance",          icon: vendorsIcon },
  { label: "Attendance",           path: "/super-admin/attendance",                   icon: attendanceIcon },
  { label: "Consumption Report",   path: "/super-admin/consumption-analytics-report", icon: reportsIcon },
  { label: "Food Wastage Report",  path: "/super-admin/food-wastage-report",          icon: reportsIcon },
  { label: "Menu Overview",        path: "/super-admin/menu-overview",                icon: menuOverviewIcon },
  { label: "Organizations",   path: "/super-admin/organizations",  icon: vendorsIcon },
];

const bottomNavItems = [
  { label: "Platform Settings", path: "/super-admin/settings", icon: settingsIcon },
];

// Routes that should highlight a different nav item than their own path
// implies (e.g. menu-management is a sub-page of "Menu Overview", and has
// no nav item of its own). Checked longest-prefix-first against the
// current pathname.
const ALIAS_PATHS: Record<string, string> = {
  "/super-admin/menu-management": "/super-admin/menu-overview",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function SuperAdminSidebar() {
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const handleNav   = useCallback((path: string) => { navigate(path); setMobileExpanded(false); }, [navigate]);
  const openMobile  = useCallback(() => setMobileExpanded(true),  []);
  const closeMobile = useCallback(() => setMobileExpanded(false), []);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate("/login", { replace: true });
  };

  // Resolve the current pathname to the nav path it should highlight,
  // applying any alias mapping for child routes that don't have their
  // own nav item (e.g. /super-admin/menu-management/:id -> Menu Overview).
  const resolveActivePath = () => {
    const aliasMatch = Object.keys(ALIAS_PATHS).find(
      prefix => location.pathname === prefix || location.pathname.startsWith(prefix + "/")
    );
    return aliasMatch ? ALIAS_PATHS[aliasMatch] : location.pathname;
  };

  const getIsActive = (path: string) => {
    if (path === "/super-admin/overview") {
      return (
        location.pathname === "/super-admin" ||
        location.pathname === "/super-admin/overview"
      );
    }

    const effectivePath = resolveActivePath();

    // "/super-admin/vendors" must not also match "/super-admin/vendors-performance".
    // Match on the exact path, or any deeper child segment (e.g. /vendors/add),
    // but not a sibling path that merely starts with the same string.
    if (effectivePath === path) return true;
    return effectivePath.startsWith(path + "/");
  };
  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      {/* Mobile backdrop */}
      {mobileExpanded && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={closeMobile}
        />
      )}

      <div className="relative h-full w-14 lg:w-52 shrink-0">
        <div
          className={[
            "absolute lg:static inset-y-0 left-0 h-full z-40",
            "bg-[#1E293B] border-r border-[#334155]",
            "flex flex-col justify-between py-4",
            "transition-all duration-300 overflow-y-auto overflow-x-hidden",
            mobileExpanded ? "w-52" : "w-14",
            "lg:w-52",
          ].join(" ")}
        >
          {/* ── TOP ── */}
          <div className="flex flex-col gap-4">

            {/* Hamburger — mobile collapsed */}
            {!mobileExpanded && (
              <div className="flex lg:hidden justify-center">
                <button
                  onClick={openMobile}
                  aria-label="Expand sidebar"
                  className="text-[#64748B] hover:text-white p-2 rounded-lg hover:bg-[#334155] transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}

            {/* Logo row */}
            <div className="flex items-center justify-between px-3">
              <div className="flex items-center gap-2.5 w-full">
                <div className="w-8 h-8 rounded-lg bg-[#FF7A00] flex items-center justify-center shrink-0 mx-auto lg:mx-0">
                  <img src={adminPanelHeaderIcon} alt="MealBells" className="w-5 h-5 object-contain" />
                </div>
                <div className={`flex-col leading-tight ${mobileExpanded ? "flex" : "hidden"} lg:flex`}>
                  <span className="text-white font-bold text-sm">MealBells</span>
                  <span className="text-[#94A3B8] text-xs">Super Admin</span>
                </div>
              </div>

              {/* Close — mobile expanded */}
              {mobileExpanded && (
                <button
                  onClick={closeMobile}
                  aria-label="Collapse sidebar"
                  className="lg:hidden text-[#94A3B8] hover:text-white p-1 shrink-0"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Main nav */}
            <nav className="flex flex-col">
              {navItems.map(({ label, path, icon }) => (
                <NavButton
                  key={label}
                  label={label}
                  path={path}
                  icon={icon}
                  showLabel={mobileExpanded}
                  isActive={getIsActive(path)}
                  onClick={handleNav}
                />
              ))}
            </nav>
          </div>

          {/* ── BOTTOM ── */}
          <div className="flex flex-col gap-1">

            {/* Platform Settings */}
            {bottomNavItems.map(({ label, path, icon }) => (
              <NavButton
                key={label}
                label={label}
                path={path}
                icon={icon}
                showLabel={mobileExpanded}
                isActive={getIsActive(path)}
                onClick={handleNav}
              />
            ))}

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 mx-2 rounded-xl text-[#94A3B8] hover:text-white hover:bg-red-500/20 transition-colors duration-200 group"
            >
              <img
                src={logoutIcon}
                alt="Sign out"
                className="w-5 h-5 shrink-0 opacity-70 group-hover:opacity-100"
              />
              <span className={`text-sm font-medium ${mobileExpanded ? "block" : "hidden"} lg:block`}>
                Sign out
              </span>
            </button>

            {/* Export */}
            <div className={`px-3 mt-2 ${mobileExpanded ? "block" : "hidden"} lg:block`}>
              <button
                type="button"
                className="w-full bg-[#EA580C] hover:bg-orange-600 text-white text-sm font-semibold py-2 rounded-xl transition-colors duration-200"
              >
                Export data
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}