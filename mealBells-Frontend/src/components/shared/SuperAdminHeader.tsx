import React, { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { fetchMe } from "../../slices/authSlice";
import type { AppDispatch, RootState } from "../../app/store";

// ── Searchable pages for super admin ────────────────────────────────────────

const SEARCH_ITEMS = [
  { label: "Overview",           path: "/super-admin/overview",       keywords: ["home", "dashboard", "main"] },
  { label: "Organizations",      path: "/super-admin/organizations",  keywords: ["orgs", "companies", "clients", "tenants"] },
  { label: "Plans & Billing",    path: "/super-admin/plans",          keywords: ["subscription", "payment", "invoice", "pricing"] },
  { label: "All Users",          path: "/super-admin/users",          keywords: ["people", "accounts", "members"] },
  { label: "Analytics",          path: "/super-admin/analytics",      keywords: ["stats", "reports", "metrics", "data"] },
  { label: "Audit Logs",         path: "/super-admin/audit-logs",     keywords: ["logs", "history", "activity", "trail"] },
  { label: "Platform Settings",  path: "/super-admin/settings",       keywords: ["config", "preferences", "options"] },
  { label: "Notifications",      path: "/super-admin/notifications",  keywords: ["alerts", "bell"] },
  { label: "Profile",            path: "/super-admin/profile",        keywords: ["account", "me", "my profile"] },
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

// ── Highlight matched text ───────────────────────────────────────────────────

function Highlight({ text, query }: { text: string; query: string }) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <span>{text}</span>;
  return (
    <span>
      {text.slice(0, idx)}
      <span className="text-[#EA580C] font-semibold">
        {text.slice(idx, idx + query.length)}
      </span>
      {text.slice(idx + query.length)}
    </span>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

const SuperAdminHeader = () => {
  const [query, setQuery]                   = useState("");
  const [open, setOpen]                     = useState(false);
  const [activeIndex, setActiveIndex]       = useState(0);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const navigate  = useNavigate();
  const location  = useLocation();
  const dispatch  = useDispatch<AppDispatch>();
  const { user }  = useSelector((s: RootState) => s.auth);

  const inputRef     = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isNotifications = location.pathname === "/super-admin/notifications";
  const isProfile       = location.pathname === "/super-admin/profile";

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
  const initials  = user?.name?.[0]?.toUpperCase() ?? "S";

  // ── Avatar ───────────────────────────────────────────────────────────────

  const Avatar = () =>
    avatarSrc ? (
      <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover" />
    ) : (
      <div className="w-full h-full bg-[#FFF4EC] flex items-center justify-center text-sm font-bold text-[#FA7000]">
        {initials}
      </div>
    );

  // ── Search dropdown ──────────────────────────────────────────────────────

  const SearchDropdown = () => {
    if (open && results.length > 0) {
      return (
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
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(item.path);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                    i === activeIndex ? "bg-orange-50" : "hover:bg-gray-50"
                  }`}
                >
                  {/* Generic page icon */}
                  <div className="w-4 h-4 shrink-0 rounded bg-gray-100 flex items-center justify-center">
                    <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700">
                    <Highlight text={item.label} query={query} />
                  </span>
                  {i === activeIndex && (
                    <span className="ml-auto text-[10px] text-gray-400 font-medium">
                      ↵ Enter
                    </span>
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
      );
    }

    if (open && query.trim().length > 0) {
      return (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 px-4 py-4 text-center">
          <p className="text-sm text-gray-500">
            No pages found for{" "}
            <span className="font-medium text-gray-700">"{query}"</span>
          </p>
        </div>
      );
    }

    return null;
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <header className="w-full h-14 px-6 flex items-center justify-between border-b border-gray-200 bg-white font-[var(--font-inter)]">

      {/* Brand breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <button
          onClick={() => navigate("/super-admin/overview")}
          className="font-semibold text-[#EA580C] hover:opacity-80 transition-opacity"
        >
          <span className="sm:hidden">MB</span>
          <span className="hidden sm:inline">MealBells</span>
        </button>
        <span className="text-gray-300 hidden sm:inline">/</span>
        <span className="text-gray-400 hidden sm:inline capitalize">
          {location.pathname.split("/").pop()?.replace(/-/g, " ") || "Overview"}
        </span>
      </div>

      {/* Mobile search overlay */}
      {mobileSearchOpen && (
        <div className="absolute left-0 top-0 w-full h-auto bg-white px-4 pt-3 pb-2 flex flex-col gap-2 z-10 border-b border-gray-200 sm:hidden">
          <div className="flex items-center gap-3">
            {/* Search icon */}
            <svg className="w-4 h-4 shrink-0 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="m21 21-4.35-4.35" />
            </svg>
            <input
              autoFocus
              type="text"
              value={query}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Search pages..."
              className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 outline-none"
            />
            <button
              onClick={() => {
                setMobileSearchOpen(false);
                setQuery("");
                setOpen(false);
              }}
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
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelect(item.path);
                    }}
                    className="w-full flex items-center gap-3 px-1 py-2.5 text-left hover:bg-orange-50 rounded-xl transition-colors"
                  >
                    <div className="w-4 h-4 shrink-0 rounded bg-gray-100" />
                    <span className="text-sm text-gray-700">
                      <Highlight text={item.label} query={query} />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {open && query.trim().length > 0 && results.length === 0 && (
            <p className="text-sm text-gray-400 px-1 pb-2">
              No pages found for "{query}"
            </p>
          )}
        </div>
      )}

      {/* Right controls */}
      <div className="flex items-center gap-2">

        {/* Super Admin badge — desktop only */}
        <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#EA580C] bg-orange-50 border border-orange-100 rounded-full px-2.5 py-1 mr-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C] animate-pulse" />
          Super Admin
        </span>

        {/* Desktop search with dropdown */}
        <div ref={containerRef} className="relative hidden sm:block">
          <div className="flex items-center gap-2 bg-[#EEEEEE] rounded-xl px-3 py-1.5">
            <svg className="w-4 h-4 shrink-0 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="m21 21-4.35-4.35" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onFocus={() => query.trim() && setOpen(true)}
              placeholder="Search pages..."
              className="bg-transparent text-sm text-gray-800 placeholder:text-[#6B7280] outline-none w-44"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setOpen(false);
                  inputRef.current?.focus();
                }}
                className="text-gray-400 hover:text-gray-600 text-xs leading-none"
              >
                ✕
              </button>
            )}
          </div>
          <SearchDropdown />
        </div>

        {/* Mobile search toggle */}
        <button
          type="button"
          onClick={() => setMobileSearchOpen(true)}
          className="sm:hidden w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Open search"
        >
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="m21 21-4.35-4.35" />
          </svg>
        </button>

        {/* Bell */}
        <button
          type="button"
          onClick={() => navigate("/super-admin/notifications")}
          aria-label="Notifications"
          className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${
            isNotifications
              ? "bg-orange-100 ring-2 ring-orange-400"
              : "hover:bg-gray-100"
          }`}
        >
          <svg
            className={`w-5 h-5 ${isNotifications ? "text-[#EA580C]" : "text-gray-500"}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6.002 6.002 0 0 0-4-5.659V5a2 2 0 1 0-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9" />
          </svg>
        </button>

        {/* Avatar */}
        <button
          type="button"
          onClick={() => navigate("/super-admin/profile")}
          aria-label="My profile"
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

export default SuperAdminHeader;