import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { Settings, Building2, ChevronDown, Check } from "lucide-react";
import { fetchMe } from "../../slices/authSlice";
import { fetchVendorOrgs } from "../../slices/organizationSlice";
import {
  setActiveOrgId,
  fetchVendorDashboard,
  fetchVendorTodayMenu,
  fetchVendorWeeklyMenu,
} from "../../slices/vendorSlice";
import type { AppDispatch, RootState } from "../../app/store";

const VendorHeader = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const dispatch  = useDispatch<AppDispatch>();

  const { user }        = useSelector((s: RootState) => s.auth);
  const { vendorOrgs }  = useSelector((s: RootState) => s.organization);
  const { activeOrgId } = useSelector((s: RootState) => s.vendors);

  const [open, setOpen] = useState(false);
  const dropdownRef     = useRef<HTMLDivElement>(null);

  const isSettings = location.pathname === "/vendor/settings";

  useEffect(() => {
    if (!user) dispatch(fetchMe());
  }, []);

  useEffect(() => {
    if (!vendorOrgs.length) dispatch(fetchVendorOrgs());
  }, [dispatch]);

  useEffect(() => {
    if (vendorOrgs.length && !activeOrgId) {
      const firstId = vendorOrgs[0]._id;
      dispatch(setActiveOrgId(firstId));
      dispatch(fetchVendorDashboard({ orgId: firstId }));
      dispatch(fetchVendorTodayMenu(firstId));
      dispatch(fetchVendorWeeklyMenu(firstId));
    }
  }, [vendorOrgs, activeOrgId, dispatch]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSwitch = (orgId: string) => {
    setOpen(false);
    if (orgId === activeOrgId) return;
    dispatch(setActiveOrgId(orgId));
    dispatch(fetchVendorDashboard({ orgId }));
    dispatch(fetchVendorTodayMenu(orgId));
    dispatch(fetchVendorWeeklyMenu(orgId));
  };

  const activeOrg  = vendorOrgs.find(o => o._id === activeOrgId);
  const multiOrg   = vendorOrgs.length > 1;
  const avatarSrc  = user?.avatar || null;
  const initials   = user?.name?.[0]?.toUpperCase() ?? "V";
  const vendorName = user?.name ?? "Green Bistro";

  const Avatar = () =>
    avatarSrc ? (
      <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover" />
    ) : (
      <div className="w-full h-full bg-[#FFF4EC] flex items-center justify-center text-xs font-bold text-[#FA7000]">
        {initials}
      </div>
    );

  return (
    <header className="w-full h-14 px-4 flex items-center justify-between border-b border-gray-200 bg-white gap-3">

      <div
        className="flex items-center gap-2.5 cursor-pointer shrink-0"
        onClick={() => navigate("/")}
      >
        <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 shrink-0">
          <Avatar />
        </div>
        <span className="text-[#EA580C] font-bold text-base tracking-tight hidden sm:block">
          {vendorName}
        </span>
      </div>

      {multiOrg && (
        <div className="flex-1 flex justify-center" ref={dropdownRef}>
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpen(o => !o)}
              className="flex items-center gap-1.5 px-3 h-8 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:border-orange-300 hover:text-orange-500 transition-colors max-w-[200px]"
            >
              <Building2 className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              <span className="truncate">
                {activeOrg?.companyName ?? "Select Org"}
              </span>
              <ChevronDown
                className={`w-3 h-3 text-gray-400 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
              />
            </button>

            {open && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 w-56 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                <p className="px-3 pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Switch Organization
                </p>
                <div className="pb-1.5">
                  {vendorOrgs.map(org => {
                    const isActive = org._id === activeOrgId;
                    return (
                      <button
                        key={org._id}
                        type="button"
                        onClick={() => handleSwitch(org._id)}
                        className={`w-full text-left px-3 py-2.5 flex items-center gap-2.5 text-sm transition-colors ${
                          isActive
                            ? "bg-orange-50 text-orange-600 font-semibold"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          isActive ? "bg-orange-100 text-orange-500" : "bg-gray-100 text-gray-500"
                        }`}>
                          {org.companyName?.[0]?.toUpperCase() ?? "O"}
                        </div>
                        <span className="truncate flex-1">{org.companyName}</span>
                        {isActive && (
                          <Check className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => navigate("/vendor/settings")}
        className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors shrink-0 ${
          isSettings ? "bg-orange-100 ring-2 ring-orange-400" : "hover:bg-gray-100"
        }`}
      >
        <Settings className={`w-5 h-5 ${isSettings ? "text-orange-500" : "text-gray-400"}`} />
      </button>

    </header>
  );
};

export default VendorHeader;