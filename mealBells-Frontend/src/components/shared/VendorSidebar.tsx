import { useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logoutUser } from "../../slices/authSlice";
import type { AppDispatch } from "../../app/store";

import {
  LayoutDashboard,
  UtensilsCrossed,
  CalendarDays,
  ClipboardList,
  Truck,
  Star,
  BarChart3,
  Settings,
  LogOut,
  PanelLeftClose,
  X,
} from "lucide-react";

import adminPanelHeaderIcon from "../../assets/adminPanelHeaderIcon.png";
import NavButton from "./NavButton";

const navItems = [
  { label: "Dashboard",        path: "/vendor/dashboard",        icon: LayoutDashboard },
  { label: "Today's Menu",     path: "/vendor/menu",             icon: UtensilsCrossed },
  { label: "Weekly Menu",      path: "/vendor/menu/weekly",      icon: CalendarDays },
  { label: "Requested Dishes", path: "/vendor/requested-dishes", icon: ClipboardList },
  { label: "Delivery",         path: "/vendor/delivery",         icon: Truck },
  { label: "Reviews",          path: "/vendor/reviews",          icon: Star },
  { label: "Reports",          path: "/vendor/reports",          icon: BarChart3 },
];

const bottomItems = [
  { label: "Settings", path: "/vendor/settings", icon: Settings },
];

function getIsActive(path: string, currentPath: string): boolean {
  if (currentPath === path) return true;

  // /vendor → dashboard
  if (path === "/vendor/dashboard" && currentPath === "/vendor") return true;

  // Today's Menu: only its own edit route, NOT the weekly edit route
  if (path === "/vendor/menu" && currentPath === "/vendor/menu/edit") return true;

  // Weekly Menu: highlights for both weekly view and weekly edit
  if (
    path === "/vendor/menu/weekly" &&
    currentPath.startsWith("/vendor/menu/weekly")
  ) return true;

  return false;
}

export default function VendorSidebar() {
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const location = useLocation();
  const navigate  = useNavigate();
  const dispatch  = useDispatch<AppDispatch>();

  const handleNav   = useCallback((path: string) => navigate(path), [navigate]);
  const openMobile  = useCallback(() => setMobileExpanded(true), []);
  const closeMobile = useCallback(() => setMobileExpanded(false), []);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate("/login", { replace: true });
  };

  return (
    <>
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
          {/* TOP */}
          <div className="flex flex-col gap-4">
            {!mobileExpanded && (
              <div className="flex lg:hidden justify-center">
                <button
                  onClick={openMobile}
                  className="text-[#64748B] hover:text-white p-2 rounded-lg hover:bg-[#334155]"
                >
                  <PanelLeftClose className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Logo */}
            <div className="flex items-center justify-between px-3">
              <div className="flex items-center gap-2.5 w-full">
                <div className="w-8 h-8 rounded-lg bg-[#FF7A00] flex items-center justify-center shrink-0 mx-auto lg:mx-0">
                  <img
                    src={adminPanelHeaderIcon}
                    alt="MealBells"
                    className="w-5 h-5 object-contain"
                  />
                </div>
                <div className={`flex-col leading-tight ${mobileExpanded ? "flex" : "hidden"} lg:flex`}>
                  <span className="text-white font-bold text-sm">MealBells</span>
                  <span className="text-[#94A3B8] text-xs">Vendor Portal</span>
                </div>
              </div>

              {mobileExpanded && (
                <button onClick={closeMobile} className="lg:hidden text-[#94A3B8] hover:text-white p-1 shrink-0">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Nav */}
            <nav className="flex flex-col">
              {navItems.map(({ label, path, icon }) => (
                <NavButton
                  key={label}
                  label={label}
                  path={path}
                  icon={icon}
                  showLabel={mobileExpanded}
                  isActive={getIsActive(path, location.pathname)}
                  onClick={handleNav}
                />
              ))}
            </nav>
          </div>

          {/* Bottom */}
          <div className="flex flex-col gap-1">
            {bottomItems.map(({ label, path, icon }) => (
              <NavButton
                key={label}
                label={label}
                path={path}
                icon={icon}
                showLabel={mobileExpanded}
                isActive={getIsActive(path, location.pathname)}
                onClick={handleNav}
              />
            ))}

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 mx-2 rounded-xl text-[#94A3B8] hover:text-white hover:bg-red-500/20 transition-colors duration-200 group"
            >
              <LogOut className="w-5 h-5 shrink-0 opacity-70 group-hover:opacity-100" />
              <span className={`text-sm font-medium ${mobileExpanded ? "block" : "hidden"} lg:block`}>
                Logout
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}