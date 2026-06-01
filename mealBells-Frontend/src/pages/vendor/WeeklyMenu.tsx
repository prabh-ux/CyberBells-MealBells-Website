import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Plus } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { fetchVendorWeeklyMenu } from "../../slices/vendorSlice"; 
import type { AppDispatch, RootState } from "../../app/store"; 

// Map backend dishType → display tag
const formatTag = (dishType?: string) => {
  if (!dishType) return "";
  if (dishType.toLowerCase() === "non-veg") return "Non-Veg";
  if (dishType.toLowerCase() === "vegan")   return "Vegan";
  return "Veg";
};

export default function WeeklyMenu() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const { weeklyMenu, menuLoading, error } = useSelector(
    (s: RootState) => s.vendors
  );

  useEffect(() => {
    dispatch(fetchVendorWeeklyMenu());
  }, [dispatch]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (menuLoading) {
    return (
      <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-6">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Vendor Portal</p>
          <h1 className="text-2xl font-bold text-gray-900">Weekly Menu</h1>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-6">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Vendor Portal</p>
          <h1 className="text-2xl font-bold text-gray-900">Weekly Menu</h1>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
          <p className="text-gray-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // ── Content ──────────────────────────────────────────────────────────────
  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-6">

      {/* Page title */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Vendor Portal</p>
        <h1 className="text-2xl font-bold text-gray-900">Weekly Menu</h1>
      </div>

      {/* Day rows */}
      <div className="space-y-4">
        {weeklyMenu.map(({ day, date, schedule }) => (
          <div key={day}>
            {/* Day label */}
            <p className="text-sm font-semibold text-gray-500 mb-2">{day}</p>

            {schedule ? (
              /* Filled dish row */
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3 px-4 py-3">
                {/* Thumbnail */}
                <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0">
                  <img
                    src={schedule.dish.image}
                    alt={schedule.dish.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{schedule.dish.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatTag(schedule.dish.dishType)}
                    {schedule.dish.estimatedCalories
                      ? ` · ${schedule.dish.estimatedCalories} Cal`
                      : ""}
                  </p>
                </div>

                {/* Edit icon */}
                <button
                  onClick={() => navigate(`/vendor/menu/edit?day=${day}&scheduleId=${schedule.scheduleId}`)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-orange-50 transition-colors shrink-0"
                >
                  <Pencil className="w-4 h-4 text-[#EA580C]" />
                </button>
              </div>
            ) : (
              /* Empty day row */
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 flex items-center gap-3 px-4 py-3">
                <div className="w-14 h-14 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center shrink-0">
                  <Plus className="w-5 h-5 text-gray-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-300">No dish selected</p>
                  <p className="text-xs text-gray-300 mt-0.5">Tap edit to add menu</p>
                </div>
                <button
                  onClick={() => navigate(`/vendor/menu/edit?day=${day}&date=${date}`)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-orange-50 transition-colors shrink-0"
                >
                  <Plus className="w-4 h-4 text-[#EA580C]" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Edit Weekly Menu button */}
      <button
        onClick={() => navigate("/vendor/menu/weekly/edit")}
        className="w-full py-4 rounded-xl bg-[#EA580C] text-white font-semibold text-sm hover:bg-[#c2410c] transition-colors shadow-sm"
      >
        Edit Weekly Menu
      </button>

    </div>
  );
}