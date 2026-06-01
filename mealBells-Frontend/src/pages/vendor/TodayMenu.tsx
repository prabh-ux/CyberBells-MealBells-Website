import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Users, Flame, Pencil } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { fetchVendorTodayMenu } from "../../slices/vendorSlice"; 
import type { AppDispatch, RootState } from "../../app/store"; 

type DietTag = "VEG" | "NON-VEG" | "VEGAN";

const dietStyles: Record<DietTag, { bg: string; text: string; dot: string }> = {
  VEG:       { bg: "bg-green-50",   text: "text-green-700",   dot: "bg-green-500" },
  "NON-VEG": { bg: "bg-red-50",     text: "text-red-600",     dot: "bg-red-500" },
  VEGAN:     { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
};

// Map backend dishType → display tag
const normalizeDiet = (dishType?: string): DietTag => {
  if (!dishType) return "VEG";
  const t = dishType.toLowerCase();
  if (t === "non-veg") return "NON-VEG";
  if (t === "vegan")   return "VEGAN";
  return "VEG";
};

// Format ISO date → "Monday, Oct 23rd"
const formatDate = (iso: string) => {
  const d = new Date(iso);
  const day  = d.toLocaleDateString("en-US", { weekday: "long" });
  const mon  = d.toLocaleDateString("en-US", { month: "short" });
  const date = d.getDate();
  const suffix =
    date % 10 === 1 && date !== 11 ? "st" :
    date % 10 === 2 && date !== 12 ? "nd" :
    date % 10 === 3 && date !== 13 ? "rd" : "th";
  return `${day}, ${mon} ${date}${suffix}`;
};

export default function TodayMenu() {
  const navigate  = useNavigate();
  const dispatch  = useDispatch<AppDispatch>();
  const { todayMenu, menuLoading, error } = useSelector(
    (s: RootState) => s.vendors
  );

  useEffect(() => {
    dispatch(fetchVendorTodayMenu());
  }, [dispatch]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (menuLoading) {
    return (
      <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-6">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Vendor Portal</p>
          <h1 className="text-2xl font-bold text-gray-900">Today's Menu</h1>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error || !todayMenu) {
    return (
      <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-6">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Vendor Portal</p>
          <h1 className="text-2xl font-bold text-gray-900">Today's Menu</h1>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
          <p className="text-gray-400 text-sm">
            {error ?? "No dish scheduled for today."}
          </p>
        </div>
      </div>
    );
  }

  // ── Data ─────────────────────────────────────────────────────────────────
  const { dish, scheduledDate, expectedPortions } = todayMenu;
  const diet = normalizeDiet(dish.dishType);
  const s    = dietStyles[diet];

  // ingredients may come as a comma-separated string or array
  const ingredientList: string[] =
    Array.isArray(dish.ingredients)
      ? dish.ingredients
      : dish.ingredients?.split(",").map(i => i.trim()).filter(Boolean) ?? [];

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-6">

      {/* Page title */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Vendor Portal</p>
        <h1 className="text-2xl font-bold text-gray-900">Today's Menu</h1>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Diet badge */}
        <div className="px-5 pt-5 pb-2">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${s.bg} ${s.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            {diet}
          </span>
        </div>

        {/* Dish name */}
        <div className="px-5 pb-2">
          <h2 className="text-xl font-bold text-gray-900">{dish.name}</h2>
        </div>

        {/* Description */}
        <div className="px-5 pb-4">
          <p className="text-sm text-gray-500 leading-relaxed">{dish.description}</p>
        </div>

        {/* Ingredients */}
        <div className="px-5 pb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Ingredients
          </p>
          <div className="flex flex-wrap gap-1.5">
            {ingredientList.map((ing) => (
              <span
                key={ing}
                className="text-xs px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-full text-gray-600"
              >
                {ing}
              </span>
            ))}
          </div>
        </div>

        {/* Calories */}
        <div className="px-5 pb-5 flex items-center gap-1.5 text-sm text-gray-500">
          <Flame className="w-4 h-4 text-orange-400" />
          <span>{dish.estimatedCalories} kcal per serving</span>
        </div>

        {/* Food image */}
        {dish.image && (
          <div className="w-full h-196 overflow-hidden">
            <img
              src={dish.image}
              alt={dish.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Scheduled + Portions */}
        <div className="px-5 py-5 flex items-center justify-between border-t border-gray-50">
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

        {/* Edit Button */}
        <div className="px-5 pb-5">
          <button
            onClick={() => navigate("/vendor/menu/edit")}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-orange-400 text-white text-sm font-semibold hover:bg-orange-500 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            Edit Today's Menu
          </button>
        </div>

      </div>
    </div>
  );
}