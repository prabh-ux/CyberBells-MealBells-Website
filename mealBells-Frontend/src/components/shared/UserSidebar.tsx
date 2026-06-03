import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../../slices/authSlice";
import type { AppDispatch, RootState } from "../../app/store";
import { fetchOrganization } from "../../slices/organizationSlice";

import {
  UtensilsCrossed, CalendarDays, Star, BadgePercent,
  ClipboardList, Truck, BarChart3, Settings, LogOut,
  PanelLeftClose, X,
} from "lucide-react";

import adminPanelHeaderIcon from "../../assets/adminPanelHeaderIcon.png";
import NavButton from "./NavButton";

const BASE_NAV_ITEMS = [
  { label: "Today's Menu",   path: "/user/today-menu",             icon: UtensilsCrossed },
  { label: "Weekly Menu",    path: "/user/weekly-menu-panel",      icon: CalendarDays    },
  { label: "My Reviews",     path: "/user/reviews",                icon: Star            },
  { label: "Rate My Meal",   path: "/user/rate-my-meal",           icon: BadgePercent    },
  { label: "Dish Request",   path: "/user/dish-request",           icon: ClipboardList   },
  { label: "Delivery Status",path: "/user/delivery-status",        icon: Truck           },
  { label: "My Consumption", path: "/user/my-consumption-report",  icon: BarChart3       },
];

const BOTTOM_ITEMS = [
  { label: "Settings", path: "/user/profile", icon: Settings },
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

  const org = useSelector((s: RootState) => s.organization.data);

  useEffect(() => {
    dispatch(fetchOrganization());
  }, [dispatch]);

  // Hide "Dish Request" when admin has disabled it
  const navItems = BASE_NAV_ITEMS.filter(
    (item) => item.label !== "Dish Request" || org?.allowDishRequests !== false
  );

  const handleNav = (path: string) => navigate(path);
  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate("/login", { replace: true });
  };

  return (
    <>
      {mobileExpanded && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setMobileExpanded(false)} />
      )}

      <div className="relative h-full w-14 lg:w-52 shrink-0">
        <div className={[
          "absolute lg:static inset-y-0 left-0 h-full z-40",
          "bg-[#1E293B] border-r border-[#334155]",
          "flex flex-col justify-between py-4",
          "transition-all duration-300 overflow-y-auto overflow-x-hidden",
          mobileExpanded ? "w-52" : "w-14",
          "lg:w-52",
        ].join(" ")}>

          {/* TOP */}
          <div className="flex flex-col gap-4">
            {!mobileExpanded && (
              <div className="flex lg:hidden justify-center">
                <button
                  onClick={() => setMobileExpanded(true)}
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
                  <img src={adminPanelHeaderIcon} alt="MealBells" className="w-5 h-5 object-contain" />
                </div>
                <div className={`flex-col leading-tight ${mobileExpanded ? "flex" : "hidden"} lg:flex`}>
                  <span className="text-white font-bold text-sm">MealBells</span>
                  <span className="text-[#94A3B8] text-xs">My Meals</span>
                </div>
              </div>
              {mobileExpanded && (
                <button onClick={() => setMobileExpanded(false)} className="lg:hidden text-[#94A3B8] hover:text-white p-1 shrink-0">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Nav — filtered by org settings */}
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

          {/* BOTTOM */}
          <div className="flex flex-col gap-1">
            {BOTTOM_ITEMS.map(({ label, path, icon }) => (
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