// pages/super-admin/SuperAdminMenuOverview.tsx
import { useEffect, useState }          from "react";
import { useNavigate }                  from "react-router-dom";
import { useDispatch, useSelector }     from "react-redux";
import { Building2 }                    from "lucide-react";

import MenuCard   from "../../components/admin/MenuOverview/MenuCard";
import AddNewCard from "../../components/admin/MenuOverview/AddNewCard";
import DropDown   from "../../components/shared/DropDown";

import type { MenuItem, PeriodKey }    from "../../types/admin";
import { PERIODS, TABS }               from "../../data/adminData";
import { fetchSuperSchedules, deleteSuperDish } from "../../slices/superAdmin/superDishSlice";
import type { AppDispatch, RootState } from "../../app/store";
import toast                           from "react-hot-toast";

const inPeriod = (dateStr: string, period: PeriodKey): boolean => {
  if (period === "All Time") return true;
  const date = new Date(dateStr);
  const now  = new Date();
  switch (period) {
    case "This Month":
      return date >= new Date(now.getFullYear(), now.getMonth(), 1);
    case "Last Month": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      return date >= start && date <= end;
    }
    case "Last 3 Month":
      return date >= new Date(now.getFullYear(), now.getMonth() - 3, 1);
    case "This Year":
      return date >= new Date(now.getFullYear(), 0, 1);
    default:
      return true;
  }
};

const SuperAdminMenuOverview = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const { schedules, loading, error, deleting } = useSelector((s: RootState) => s.superDish);
  const { filters, orgOptions }                  = useSelector((s: RootState) => s.superAnalytics);
  const activeOrgId    = filters.orgId;

 const activeOrgLabel = activeOrgId === "all"
  ? "All Organizations"
  : orgOptions.find(o => o.value === activeOrgId)?.label ?? "Organization";

  const [activeTab, setActiveTab] = useState("Both");
  const [vendor,    setVendor]    = useState("All Vendors");
  const [period,    setPeriod]    = useState<PeriodKey>("All Time");

  // Re-fetch whenever header org changes
  useEffect(() => {
    dispatch(fetchSuperSchedules(activeOrgId));
    setVendor("All Vendors"); // reset vendor filter on org change
  }, [dispatch, activeOrgId]);

  // Vendor filter options derived from current schedules
  const vendorNames = [
    "All Vendors",
    ...Array.from(new Set(schedules.map(s => s.vendor).filter(Boolean))),
  ];

  const filtered = schedules.filter(item => {
    const matchesVendor = vendor === "All Vendors" || item.vendor === vendor;
    const matchesTab    = activeTab === "Both"     || item.dishType === activeTab;
    const matchesPeriod = inPeriod(item.scheduledDate ?? item.createdAt, period);
    return matchesVendor && matchesTab && matchesPeriod;
  });

  const handleEdit = (item: MenuItem) => {
    navigate(`/super-admin/menu-management/${item.id}`);
  };

  const handleDelete = async (item: MenuItem) => {
if (!window.confirm(`Delete "${item.name ?? item.id}"?`)) return;
    const result = await dispatch(deleteSuperDish(String(item.id)));
    if (deleteSuperDish.fulfilled.match(result)) {
      toast.success("Dish deleted.");
    } else {
      toast.error((result.payload as string) ?? "Failed to delete dish.");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--page-bg)] [font-family:var(--font-inter)]">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-7">
          <div>
            <h1 className="text-[32px] font-bold text-[var(--text-primary)] tracking-tight leading-tight">
              Menu Overview
            </h1>
            <p className="text-[15px] text-[var(--text-label)] mt-1 flex items-center gap-1.5">
              {activeOrgId !== "all" && (
                <Building2 size={13} className="text-orange-400 shrink-0" />
              )}
              {activeOrgId === "all"
                ? "Showing menus across all organizations."
                : `Showing menus for: ${activeOrgLabel}`}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <DropDown value={vendor} options={vendorNames} onChange={setVendor} />
            <DropDown value={period} options={PERIODS}     onChange={v => setPeriod(v as PeriodKey)} />
          </div>
        </div>

        {/* "All orgs" info nudge */}
        {activeOrgId === "all" && (
          <div className="flex items-center gap-2 mb-5 px-4 py-3 rounded-2xl bg-amber-50 border border-amber-100 text-amber-700 text-sm">
            <Building2 size={15} className="shrink-0" />
            Select a specific organization from the header to add or edit dishes.
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-[var(--divider)] mb-6">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-[2px] mr-6 pb-2.5 text-[14px] font-semibold border-b-2 -mb-px transition-colors ${
                activeTab === tab
                  ? "border-[#FF7A00] text-[#FF7A00]"
                  : "border-transparent text-[var(--text-label)] hover:text-[var(--text-primary)]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-52 rounded-2xl bg-gray-100 animate-pulse" />
              ))
            : filtered.map(item => (
                <MenuCard
                  key={item.scheduleId ?? item.id}
                  item={item}
                  onEdit={handleEdit}
                  onDelete={activeOrgId !== "all" ? handleDelete : undefined}
                  deleting={deleting === String(item.id)}
                />
              ))
          }
          {/* Only show Add card when a specific org is selected */}
          {activeOrgId !== "all" && (
            <AddNewCard onClick={() => navigate("/super-admin/menu-management")} />
          )}
        </div>

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-14 h-14 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-400">
              {activeOrgId === "all"
                ? "No scheduled dishes found across all organizations."
                : `No scheduled dishes found for ${activeOrgLabel}.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminMenuOverview;