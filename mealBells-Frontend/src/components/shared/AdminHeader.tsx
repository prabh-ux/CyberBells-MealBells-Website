import React, { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import searchIcon from "../../assets/searchIcon.png";
import bellIcon from "../../assets/bellIcon.png";
import helpIcon from "../../assets/helpIcon.png";
import dashboardIcon from "../../assets/dashboardIcon.png";
import usersIcon from "../../assets/usersIcon.png";
import vendorsIcon from "../../assets/vendorsIcon.png";
import attendanceIcon from "../../assets/attendanceIcon.png";
import reportsIcon from "../../assets/reportsIcon.png";
import menuOverviewIcon from "../../assets/menuOverviewIcon.png";
import { fetchMe } from "../../slices/authSlice";
import type { AppDispatch, RootState } from "../../app/store";

// All searchable pages — keep in sync with sidebar navItems
const SEARCH_ITEMS = [
  { label: "Dashboard",           path: "/admin/dashboard",                    icon: dashboardIcon,      keywords: ["home", "overview", "main"] },
  { label: "Users",               path: "/admin/users",                        icon: usersIcon,          keywords: ["people", "accounts", "members"] },
  { label: "Requested Dishes",    path: "/admin/requested-dishes",             icon: usersIcon,          keywords: ["dishes", "requests", "food requests"] },
  { label: "Vendors",             path: "/admin/vendors",                      icon: vendorsIcon,        keywords: ["suppliers", "partners"] },
  { label: "Vendors Performance", path: "/admin/vendors-performance",          icon: vendorsIcon,        keywords: ["vendor stats", "performance", "ratings"] },
  { label: "Attendance",          path: "/admin/attendance",                   icon: attendanceIcon,     keywords: ["presence", "check-in", "tracking"] },
  { label: "Consumption Report",  path: "/admin/consumption-analytics-report", icon: reportsIcon,        keywords: ["analytics", "consumption", "report", "usage"] },
  { label: "Food Wastage Report", path: "/admin/food-wastage-report",          icon: reportsIcon,        keywords: ["wastage", "waste", "report", "food loss"] },
  { label: "Menu Overview",       path: "/admin/menu-overview",                icon: menuOverviewIcon,   keywords: ["menu", "food", "meals", "dishes"] },
  { label: "Settings",            path: "/admin/settings",                     icon: null,               keywords: ["config", "preferences", "options"] },
  { label: "Notifications",       path: "/admin/notifications",                icon: null,               keywords: ["alerts", "bell"] },
  { label: "Profile",             path: "/admin/profile",                      icon: null,               keywords: ["account", "me", "my profile"] },
  { label: "Help",                path: "/admin/help",                         icon: null,               keywords: ["support", "faq", "guide"] },
];

function filterItems(query: string) {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return SEARCH_ITEMS.filter(
    (item) =>
      item.label.toLowerCase().includes(q) ||
      item.keywords.some((k) => k.includes(q))
  );
}

// Highlight matched portion of text
function Highlight({ text, query }: { text: string; query: string }) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <span>{text}</span>;
  return (
    <span>
      {text.slice(0, idx)}
      <span className="text-[#EA580C] font-semibold">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </span>
  );
}

const AdminHeader = () => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const navigate  = useNavigate();
  const location  = useLocation();
  const dispatch  = useDispatch<AppDispatch>();
  const { user }  = useSelector((s: RootState) => s.auth);

  const inputRef      = useRef<HTMLInputElement>(null);
  const mobileRef     = useRef<HTMLInputElement>(null);
  const containerRef  = useRef<HTMLDivElement>(null);

  const isNotifications = location.pathname === "/admin/notifications";
  const isProfile       = location.pathname === "/admin/profile";
  const isHelp          = location.pathname === "/admin/help";

  React.useEffect(() => {
    if (!user) dispatch(fetchMe());
  }, []);

  const results = filterItems(query);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const handleSelect = (path: string) => {
    navigate(path);
    setQuery("");
    setOpen(false);
    setMobileSearchOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[activeIndex]) handleSelect(results[activeIndex].path);
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setOpen(true);
  };

  const avatarSrc = user?.avatar || null;
  const initials  = user?.name?.[0]?.toUpperCase() ?? "A";

  const Avatar = () =>
    avatarSrc ? (
      <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover" />
    ) : (
      <div className="w-full h-full bg-[#FFF4EC] flex items-center justify-center text-sm font-bold text-[#FA7000]">
        {initials}
      </div>
    );

  const SearchDropdown = () =>
    open && results.length > 0 ? (
      <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden z-50">
        <div className="px-3 pt-2.5 pb-1">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
            Pages
          </p>
        </div>
        <ul>
          {results.map((item, i) => (
            <li key={item.path}>
              <button
                type="button"
                onMouseEnter={() => setActiveIndex(i)}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(item.path); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                  i === activeIndex ? "bg-orange-50" : "hover:bg-gray-50"
                }`}
              >
                {item.icon ? (
                  <img src={item.icon} alt="" className="w-4 h-4 shrink-0 opacity-60" />
                ) : (
                  <div className="w-4 h-4 shrink-0 rounded bg-gray-200" />
                )}
                <span className="text-sm text-gray-700">
                  <Highlight text={item.label} query={query} />
                </span>
                {i === activeIndex && (
                  <span className="ml-auto text-[10px] text-gray-400 font-medium">↵ Enter</span>
                )}
              </button>
            </li>
          ))}
        </ul>
        <div className="px-3 py-2 border-t border-gray-100">
          <p className="text-[10px] text-gray-400">
            ↑ ↓ to navigate · Enter to select · Esc to close
          </p>
        </div>
      </div>
    ) : open && query.trim().length > 0 ? (
      <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 px-4 py-4 text-center">
        <p className="text-sm text-gray-500">No pages found for <span className="font-medium text-gray-700">"{query}"</span></p>
      </div>
    ) : null;

  return (
    <header className="w-full h-14 px-6 flex items-center justify-between border-b border-gray-200 bg-white font-[var(--font-inter)]">

      {/* Brand */}
      <button
        onClick={() => navigate("/")}
        className="font-[var(--font-manrope)] text-[#EA580C] font-bold text-lg tracking-tight shrink-0"
      >
        <span className="sm:hidden">MB Admin</span>
        <span className="hidden sm:inline">MealBells Admin</span>
      </button>

      {/* Mobile search overlay */}
      {mobileSearchOpen && (
        <div className="absolute left-0 top-0 w-full h-auto bg-white px-4 pt-3 pb-2 flex flex-col gap-2 z-10 border-b border-gray-200 sm:hidden">
          <div className="flex items-center gap-3">
            <img src={searchIcon} alt="search" className="w-4 h-4 shrink-0" />
            <input
              ref={mobileRef}
              autoFocus
              type="text"
              value={query}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Search pages..."
              className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 outline-none"
            />
            <button
              onClick={() => { setMobileSearchOpen(false); setQuery(""); setOpen(false); }}
              className="text-gray-500 text-sm font-medium"
            >
              Cancel
            </button>
          </div>

          {/* Mobile results */}
          {open && results.length > 0 && (
            <ul className="pb-1">
              {results.map((item) => (
                <li key={item.path}>
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); handleSelect(item.path); }}
                    className="w-full flex items-center gap-3 px-1 py-2.5 text-left hover:bg-orange-50 rounded-xl transition-colors"
                  >
                    {item.icon ? (
                      <img src={item.icon} alt="" className="w-4 h-4 shrink-0 opacity-60" />
                    ) : (
                      <div className="w-4 h-4 shrink-0 rounded bg-gray-200" />
                    )}
                    <span className="text-sm text-gray-700">
                      <Highlight text={item.label} query={query} />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {open && query.trim().length > 0 && results.length === 0 && (
            <p className="text-sm text-gray-400 px-1 pb-2">No pages found for "{query}"</p>
          )}
        </div>
      )}

      {/* Right controls */}
      <div className="flex items-center gap-3">

        {/* Search — sm+ with dropdown */}
        <div ref={containerRef} className="relative hidden sm:block">
          <div className="flex items-center gap-2 bg-[#EEEEEE] rounded-xl px-3 py-1.5">
            <img src={searchIcon} alt="search" className="w-4 h-4 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onFocus={() => query.trim() && setOpen(true)}
              placeholder="Search pages..."
              className="bg-transparent text-sm text-gray-800 placeholder:text-[#6B7280] outline-none w-48"
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(""); setOpen(false); inputRef.current?.focus(); }}
                className="text-gray-400 hover:text-gray-600 text-xs leading-none"
              >
                ✕
              </button>
            )}
          </div>
          <SearchDropdown />
        </div>

        {/* Search toggle — mobile */}
        <button
          type="button"
          onClick={() => setMobileSearchOpen(true)}
          className="sm:hidden w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <img src={searchIcon} alt="search" className="w-5 h-5 object-contain" />
        </button>

        {/* Bell */}
        <button
          type="button"
          onClick={() => navigate("/admin/notifications")}
          className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${
            isNotifications ? "bg-orange-100 ring-2 ring-orange-400" : "hover:bg-gray-100"
          }`}
        >
          <img
            src={bellIcon}
            alt="notifications"
            className={`w-5 h-5 object-contain ${isNotifications ? "opacity-100" : "opacity-70"}`}
          />
        </button>

        {/* Help */}
        <button
          type="button"
          onClick={() => navigate("/admin/help")}
          className={`hidden sm:flex w-9 h-9 items-center justify-center rounded-full transition-colors ${
            isHelp ? "bg-orange-100 ring-2 ring-orange-400" : "hover:bg-gray-100"
          }`}
        >
          <img src={helpIcon} alt="help" className="w-5 h-5 object-contain" />
        </button>

        {/* Avatar */}
        <button
          type="button"
          onClick={() => navigate("/admin/profile")}
          className={`w-9 h-9 rounded-full overflow-hidden border transition-all shrink-0 ${
            isProfile
              ? "border-orange-400 ring-2 ring-orange-400"
              : "border-gray-200 hover:ring-2 hover:ring-orange-400"
          }`}
        >
          <Avatar />
        </button>

      </div>
    </header>
  );
};

export default AdminHeader;