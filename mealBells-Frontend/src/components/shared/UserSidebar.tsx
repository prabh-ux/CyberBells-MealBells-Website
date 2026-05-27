import { useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logoutUser } from "../../slices/authSlice";
import type { AppDispatch } from "../../app/store";

import {
  UtensilsCrossed,
  CalendarDays,
  Star,
  BadgePercent,
  ClipboardList,
  Truck,
  BarChart3,
  Settings,
  LogOut,
  PanelLeftClose,
  X,
} from "lucide-react";

import adminPanelHeaderIcon from "../../assets/adminPanelHeaderIcon.png";
import NavButton from "./NavButton";

const navItems = [
  {
    label: "Today's Menu",
    path: "/user/today-menu",
    icon: UtensilsCrossed,
  },
  {
    label: "Weekly Menu",
    path: "/user/weekly-menu-panel",
    icon: CalendarDays,
  },
  {
    label: "My Reviews",
    path: "/user/reviews",
    icon: Star,
  },
  {
    label: "Rate My Meal",
    path: "/user/rate-my-meal",
    icon: BadgePercent,
  },
  {
    label: "Dish Request",
    path: "/user/dish-request",
    icon: ClipboardList,
  },
  {
    label: "Delivery Status",
    path: "/user/delivery-status",
    icon: Truck,
  },
  {
    label: "My Consumption",
    path: "/user/my-consumption-report",
    icon: BarChart3,
  },
];

const bottomItems = [
  {
    label: "Settings",
    path: "/user/profile",
    icon: Settings,
  },
];

function getIsActive(path: string, currentPath: string): boolean {
  if (currentPath === path) return true;
  if (path === "/user/today-menu" && currentPath === "/user") return true;
  if (path === "/user/weekly-menu-panel" && currentPath.startsWith("/user/dish-details-panel")) return true;
  if (path === "/user/settings" && currentPath === "/user/profile") return true;
  return false;
}

export default function UserSidebar() {
  const [mobileExpanded, setMobileExpanded] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const handleNav = useCallback(
    (path: string) => navigate(path),
    [navigate]
  );

  const openMobile = useCallback(() => setMobileExpanded(true), []);
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

                <div
                  className={`flex-col leading-tight ${
                    mobileExpanded ? "flex" : "hidden"
                  } lg:flex`}
                >
                  <span className="text-white font-bold text-sm">
                    MealBells
                  </span>
                  <span className="text-[#94A3B8] text-xs">My Meals</span>
                </div>
              </div>

              {mobileExpanded && (
                <button
                  onClick={closeMobile}
                  className="lg:hidden text-[#94A3B8] hover:text-white p-1 shrink-0"
                >
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
              <span
                className={`text-sm font-medium ${
                  mobileExpanded ? "block" : "hidden"
                } lg:block`}
              >
                Logout
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}