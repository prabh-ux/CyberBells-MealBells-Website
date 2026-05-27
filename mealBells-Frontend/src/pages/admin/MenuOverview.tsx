// pages/admin/MenuOverview.tsx
import { useEffect, useState } from "react";
import { useNavigate }         from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import DropDown   from "../../components/shared/DropDown";
import MenuCard   from "../../components/admin/MenuOverview/MenuCard";
import AddNewCard from "../../components/admin/MenuOverview/AddNewCard";

import type { MenuItem, PeriodKey }    from "../../types/admin";
import { PERIODS, TABS }               from "../../data/adminData";
import { fetchVendors }                from "../../slices/vendorSlice";
import { fetchSchedules }              from "../../slices/dishSlice";
import type { AppDispatch, RootState } from "../../app/store";

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

const MenuOverview = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const { schedules, loading, error } = useSelector((s: RootState) => s.dishes);
  const { list: vendors }             = useSelector((s: RootState) => s.vendors);

  const [activeTab, setActiveTab] = useState("Both");
  const [vendor,    setVendor]    = useState("All Vendors");
  const [period,    setPeriod]    = useState<PeriodKey>("All Time");

  useEffect(() => { dispatch(fetchSchedules()); }, [dispatch]);
  useEffect(() => { dispatch(fetchVendors());   }, [dispatch]);

  const filtered = schedules.filter(item => {
    const matchesVendor = vendor === "All Vendors" || item.vendor === vendor;
    const matchesTab    = activeTab === "Both"     || item.dishType === activeTab;
    const matchesPeriod = inPeriod(item.scheduledDate ?? item.createdAt, period);
    return matchesVendor && matchesTab && matchesPeriod;
  });

  // ← navigate to AddEditDish with the dish id
  const handleEdit = (item: MenuItem) => {
    navigate(`/admin/menu-management/${item.id}`);
  };

  const vendorOptions = ["All Vendors", ...vendors.map(v => v.name)];

  return (
    <div className="min-h-screen bg-[var(--page-bg)] [font-family:var(--font-inter)]">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-7">
          <div>
            <h1 className="text-[32px] font-bold text-[var(--text-primary)] tracking-tight leading-tight">
              Menu Overview
            </h1>
            <p className="text-[16px] text-[var(--text-label)] mt-1">
              Manage and organize your catering menus across vendors.
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <DropDown value={vendor} options={vendorOptions} onChange={setVendor} />
            <DropDown value={period} options={PERIODS}       onChange={v => setPeriod(v as PeriodKey)} />
          </div>
        </div>

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
                />
              ))
          }
          <AddNewCard onClick={() => navigate("/admin/menu-management")} />
        </div>
      </div>
    </div>
  );
};

export default MenuOverview;