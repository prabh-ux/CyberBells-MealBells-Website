import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Users, Flame, Pencil } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { fetchVendorTodayMenu } from "../../slices/vendorSlice";
import type { AppDispatch, RootState } from "../../app/store";

type DietTag = "VEG" | "NON-VEG" | "VEGAN";

const dietStyles: Record<DietTag, { bg: string; text: string; dot: string }> = {
  VEG:       { bg: "bg-green-50",   text: "text-green-700",   dot: "bg-green-500" },
  "NON-VEG": { bg: "bg-red-50",     text: "text-red-600",     dot: "bg-red-500"   },
  VEGAN:     { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
};

const normalizeDiet = (dishType?: string): DietTag => {
  if (!dishType) return "VEG";
  const t = dishType.toLowerCase();
  if (t === "non-veg") return "NON-VEG";
  if (t === "vegan")   return "VEGAN";
  return "VEG";
};

const formatDate = (iso: string) => {
  const d      = new Date(iso);
  const day    = d.toLocaleDateString("en-US", { weekday: "long" });
  const mon    = d.toLocaleDateString("en-US", { month: "short" });
  const date   = d.getDate();
  const suffix =
    date % 10 === 1 && date !== 11 ? "st" :
    date % 10 === 2 && date !== 12 ? "nd" :
    date % 10 === 3 && date !== 13 ? "rd" : "th";
  return `${day}, ${mon} ${date}${suffix}`;
};

export default function TodayMenu() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { todayMenu, menuLoading, error, activeOrgId } = useSelector((s: RootState) => s.vendors);

useEffect(() => {
  if (activeOrgId) dispatch(fetchVendorTodayMenu(activeOrgId));
}, [dispatch, activeOrgId]);

  const PageShell = ({ children }: { children: React.ReactNode }) => (
    <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Vendor Portal</p>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Today's Menu</h1>
      </div>
      {children}
    </div>
  );

  if (menuLoading)
    return (
      <PageShell>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </PageShell>
    );

  if (error || !todayMenu)
    return (
      <PageShell>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
          <p className="text-gray-400 text-sm">{error ?? "No dish scheduled for today."}</p>
        </div>
      </PageShell>
    );

  const { dish, scheduledDate, expectedPortions, scheduleId } = todayMenu;
  const diet = normalizeDiet(dish.dishType);
  const s    = dietStyles[diet];

  const ingredientList: string[] =
    Array.isArray(dish.ingredients)
      ? dish.ingredients
      : dish.ingredients?.split(",").map((i: string) => i.trim()).filter(Boolean) ?? [];

  return (
    <PageShell>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Diet badge */}
        <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-2">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${s.bg} ${s.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            {diet}
          </span>
        </div>

        {/* Dish name */}
        <div className="px-4 sm:px-5 pb-2">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">{dish.name}</h2>
        </div>

        {/* Description */}
        <div className="px-4 sm:px-5 pb-3 sm:pb-4">
          <p className="text-sm text-gray-500 leading-relaxed">{dish.description}</p>
        </div>

        {/* Ingredients */}
        <div className="px-4 sm:px-5 pb-3 sm:pb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Ingredients
          </p>
          <div className="flex flex-wrap gap-1.5">
            {ingredientList.map((ing: string) => (
              <span key={ing} className="text-xs px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-full text-gray-600">
                {ing}
              </span>
            ))}
          </div>
        </div>

        {/* Calories */}
        <div className="px-4 sm:px-5 pb-4 sm:pb-5 flex items-center gap-1.5 text-sm text-gray-500">
          <Flame className="w-4 h-4 text-orange-400 shrink-0" />
          <span>{dish.estimatedCalories} kcal per serving</span>
        </div>

        {/* Food image */}
        {dish.image && (
          <div className="w-full h-48 sm:h-64 lg:h-80 overflow-hidden">
            <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Scheduled + Portions */}
        <div className="px-4 sm:px-5 py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 border-t border-gray-50">
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-[#EA580C] mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-gray-400">Scheduled For</p>
              <p className="text-sm font-semibold text-gray-800">{formatDate(scheduledDate)}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Users className="w-4 h-4 text-[#EA580C] mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-gray-400">Expected Portions</p>
              <p className="text-sm font-semibold text-gray-800">{expectedPortions} Units</p>
            </div>
          </div>
        </div>

        {/* Edit Button — passes scheduleId so EditDish opens in edit mode */}
        <div className="px-4 sm:px-5 pb-4 sm:pb-5">
          <button
            onClick={() =>
              navigate(`/vendor/menu/edit?scheduleId=${scheduleId}&day=Today`)
            }
            className="w-full flex items-center justify-center gap-2 py-3 sm:py-3.5 rounded-xl bg-orange-400 text-white text-sm font-semibold hover:bg-orange-500 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            Edit Today's Menu
          </button>
        </div>

      </div>
    </PageShell>
  );
}