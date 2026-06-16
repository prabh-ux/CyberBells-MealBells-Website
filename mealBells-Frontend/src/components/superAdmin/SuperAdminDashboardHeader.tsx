import { useEffect }   from "react";
import { useDispatch, useSelector }        from "react-redux";
import uploadIconWhite                     from "../../assets/uploadIconWhite.png";
import {
  fetchSuperOrgOptions,

} from "../../slices/superAdmin/superAdminAnalyticsSlice";
import type { AppDispatch, RootState } from "../../app/store";

interface Props {
  onExport:   () => void;
  mealRange:  string;             // passed down so header can re-fetch on org change
}



const SuperAdminDashboardHeader = ({ onExport }: Props) => {
  const dispatch    = useDispatch<AppDispatch>();

  const { orgOptions, filters } = useSelector((s: RootState) => s.superAnalytics);
  const activeOrgId = filters.orgId;

  // Load org options once
  useEffect(() => {
    if (!orgOptions.length) dispatch(fetchSuperOrgOptions());
  }, [dispatch]);





  const activeLabel =
    activeOrgId === "all"
      ? "All Organizations"
      : orgOptions.find(o => o.value === activeOrgId)?.label ?? "Select Org";

  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
      {/* Left — title + org picker */}
      <div className="flex flex-col gap-2">
        <div>
          <h1 className="text-[22px] sm:text-[28px] lg:text-[32px] font-bold font-(--font-manrope) text-(--text-primary) tracking-tight leading-tight">
            Analytics Dashboard
          </h1>
          <p className="text-[#6B7280] text-[13px] sm:text-[16px] mt-1">
            {activeOrgId === "all"
              ? "Showing combined data across all organizations."
              : `Showing data for: ${activeLabel}`}
          </p>
        </div>

      
      </div>

      {/* Right — Export button */}
      <button
        onClick={onExport}
        className="flex items-center gap-2 bg-(--brand) hover:bg-[#A34800] transition-colors text-white text-[13px] sm:text-[15px] font-semibold px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl shrink-0 self-start sm:self-auto"
      >
        <img src={uploadIconWhite} alt="export" width="13" height="13" />
        Export Data
      </button>
    </div>
  );
};

export default SuperAdminDashboardHeader;