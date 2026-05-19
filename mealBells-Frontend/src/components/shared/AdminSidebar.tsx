import React, { useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import adminPanelHeaderIcon from "../../assets/adminPanelHeaderIcon.png";
import dashboardIcon from "../../assets/dashboardIcon.png";
import usersIcon from "../../assets/usersIcon.png";
import vendorsIcon from "../../assets/vendorsIcon.png";
import mealDeliveryIcon from "../../assets/mealDeliveryIcon.png";
import attendanceIcon from "../../assets/attendanceIcon.png";
import reportsIcon from "../../assets/reportsIcon.png";
import settingsIcon from "../../assets/settingsIcon.png";
import logoutIcon from "../../assets/logoutIcon.png";
import menuOverviewIcon from "../../assets/menuOverviewIcon.png";

const navItems = [
  { label: "Dashboard", path: "/admin/dashboard", icon: dashboardIcon },
  { label: "Users", path: "/admin/users", icon: usersIcon },
  { label: "Vendors", path: "/admin/vendors", icon: vendorsIcon },
  {
    label: "Vendors Performance",
    path: "/admin/vendors-performance",
    icon: vendorsIcon,
  },
 
  { label: "Attendance", path: "/admin/attendance", icon: attendanceIcon },
  {
    label: "Consumption Report",
    path: "/admin/consumption-analytics-report",
    icon: reportsIcon,
  },
  {
    label: "Food Wastage Report",
    path: "/admin/food-wastage-report",
    icon: reportsIcon,
  },
  {
    label: "Menu Overview",
    path: "/admin/menu-overview",
    icon: menuOverviewIcon,
  },
  {
    label: "Menu Management",
    path: "/admin/menu-management",
    icon: menuOverviewIcon,
  },
];

const bottomItems = [
  { label: "Settings", path: "/admin/settings", icon: settingsIcon },
  { label: "Logout", path: "/logout", icon: logoutIcon },
];

type NavButtonProps = {
  label: string;
  path: string;
  icon: string;
  showLabel: boolean;
  isActive: boolean;
  onClick: (path: string) => void;
};

function NavButton({
  label,
  path,
  icon,
  showLabel,
  isActive,
  onClick,
}: NavButtonProps) {
  return (
    <button
      type="button"
      title={label}
      onClick={() => onClick(path)}
      className={[
        "group flex items-center gap-3 w-full text-left text-sm font-medium",
        "border-l-4 px-4 py-2.5 transition-colors duration-150",
        isActive
          ? "bg-[#334155] text-white border-[#FF7A00]"
          : "border-transparent text-[#94A3B8] hover:bg-[#243047] hover:text-white",
      ].join(" ")}
    >
      <img
        src={icon}
        alt={label}
        className={`w-5 h-5 object-contain shrink-0 ${
          isActive ? "opacity-100" : "opacity-50 group-hover:opacity-100"
        }`}
      />

      <span className={`${showLabel ? "inline" : "hidden"} lg:inline`}>
        {label}
      </span>
    </button>
  );
}
export default function AdminSidebar() {
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleNav = useCallback((path: string) => navigate(path), [navigate]);

  const openMobile = useCallback(() => setMobileExpanded(true), []);
  const closeMobile = useCallback(() => setMobileExpanded(false), []);

  return (
    <>
      {/* Mobile overlay backdrop */}
      {mobileExpanded && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={closeMobile}
        />
      )}

      {/*
        Outer wrapper sets the space the sidebar occupies in the layout.
        - Mobile: narrow icon-only strip (w-14)
        - Desktop (lg+): full sidebar (w-52)
      */}
      <div className="relative h-full w-14 lg:w-52 shrink-0">
        {/*
          Inner panel — position: absolute on mobile so it can expand over content,
          position: static on desktop so it sits normally in the layout.
        */}
        <div
          className={[
            "absolute lg:static inset-y-0 left-0 h-full z-40",
            "bg-[#1E293B] border-r border-[#334155]",
            "flex flex-col justify-between py-4",
            "transition-all duration-300 overflow-y-auto overflow-x-hidden",
            // Mobile: icon-only (w-14) unless expanded
            mobileExpanded ? "w-52" : "w-14",
            // Desktop: always full width
            "lg:w-52",
          ].join(" ")}
        >
          {/* ── TOP: logo + nav ── */}
          <div className="flex flex-col gap-4">
            {/* Mobile hamburger (collapsed state only) */}
            {!mobileExpanded && (
              <div className="flex lg:hidden justify-center">
                <button
                  onClick={openMobile}
                  aria-label="Expand sidebar"
                  className="text-[#64748B] hover:text-white p-2 rounded-lg hover:bg-[#334155] transition-colors"
                >
                  {/* chevron-right icon */}
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 5l7 7-7 7M5 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            )}

            {/* Logo row */}
            <div className="flex items-center justify-between px-3">
              <div className="flex items-center gap-2.5 w-full">
                {/* Orange icon box */}
                <div className="w-8 h-8 rounded-lg bg-[#FF7A00] flex items-center justify-center shrink-0 mx-auto lg:mx-0">
                  <img
                    src={adminPanelHeaderIcon}
                    alt="MealBells"
                    className="w-5 h-5 object-contain"
                  />
                </div>

                {/* Brand text — hidden on mobile unless expanded */}
                <div
                  className={`flex-col leading-tight ${mobileExpanded ? "flex" : "hidden"} lg:flex`}
                >
                  <span className="text-white font-bold text-sm">
                    MealBells
                  </span>
                  <span className="text-[#94A3B8] text-xs">Admin Console</span>
                </div>
              </div>

              {/* Close button (mobile expanded state) */}
              {mobileExpanded && (
                <button
                  onClick={closeMobile}
                  aria-label="Collapse sidebar"
                  className="lg:hidden text-[#94A3B8] hover:text-white p-1 shrink-0"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* Main nav links */}
            <nav className="flex flex-col">
              {navItems.map(({ label, path, icon }) => (
                <NavButton
                  key={label}
                  label={label}
                  path={path}
                  icon={icon}
                  showLabel={mobileExpanded} // mobile: show only when expanded
                  isActive={location.pathname === path}
                  onClick={handleNav}
                />
              ))}
            </nav>
          </div>

          {/* ── BOTTOM: settings, logout, export ── */}
          <div className="flex flex-col gap-1">
            {bottomItems.map(({ label, path, icon }) => (
              <NavButton
                key={label}
                label={label}
                path={path}
                icon={icon}
                showLabel={mobileExpanded}
                isActive={location.pathname === path}
                onClick={handleNav}
              />
            ))}

            {/* Export button — hidden on mobile icon-only state */}
            <div
              className={`px-3 mt-2 ${mobileExpanded ? "block" : "hidden"} lg:block`}
            >
              <button
                type="button"
                className="w-full bg-[#EA580C] hover:bg-orange-600 text-white text-sm font-semibold py-2 rounded-xl transition-colors duration-200"
              >
                Export Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
