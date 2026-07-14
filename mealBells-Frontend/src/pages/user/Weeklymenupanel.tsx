import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Flame, UtensilsCrossed, Check, X } from "lucide-react";
import type { AppDispatch, RootState } from "../../app/store";
import { fetchWeeklyMenu } from "../../slices/userSlice";

export default function WeeklyMenuPanel() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const { weeklyMenu: schedules, loadingWeekly: loading } =
    useSelector((s: RootState) => s.user);

  useEffect(() => { dispatch(fetchWeeklyMenu(0)); }, [dispatch]);

  const dayName   = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { weekday: "long" });
  const shortDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const isToday   = (iso: string) =>
    new Date(iso).toDateString() === new Date().toDateString();
  const isPast    = (iso: string) =>
    new Date(iso) < new Date() && !isToday(iso);

  return (
    <div className="min-h-screen bg-[#F7F6F3] px-4 sm:px-6 lg:px-8 xl:px-12 py-6 sm:py-8 lg:py-10">

      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
          Weekly Menu
        </h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-32 sm:py-40">
          <div className="w-9 h-9 border-[3px] border-orange-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : schedules.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 sm:py-40 gap-4">
          <UtensilsCrossed className="w-12 h-12 text-gray-300" />
          <p className="text-gray-400 text-base">No meals scheduled this week</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 pb-8 sm:pb-10">
          {schedules.map((s) => (
            <div
              key={s.scheduleId}
              className={`transition-all duration-200 ${isPast(s.scheduledDate) ? "opacity-40" : "opacity-100"}`}
            >
              {/* Day label row */}
              <div className="flex items-center gap-2 mb-2 sm:mb-2.5 px-0.5">
                <span className={`text-[13px] font-bold tracking-wide ${isToday(s.scheduledDate) ? "text-orange-500" : "text-gray-700"}`}>
                  {dayName(s.scheduledDate)}
                </span>
                <span className="text-[12px] text-gray-400 font-medium">{shortDate(s.scheduledDate)}</span>
                {isToday(s.scheduledDate) && (
                  <span className="ml-auto bg-orange-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Today
                  </span>
                )}
              </div>

              {/* Card */}
              <div
                onClick={() => navigate(`/user/dish-details-panel/${s.scheduleId}`)}
                className="bg-white rounded-[20px] sm:rounded-[24px] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.07)] border border-gray-100 cursor-pointer transition-all duration-200 hover:shadow-[0_6px_24px_rgba(0,0,0,0.11)] hover:-translate-y-0.5 active:scale-[0.985] group"
              >
                {/* Image */}
                <div className="relative w-full h-44 sm:h-52 overflow-hidden">
                  {s.dish?.image ? (
                    <img
                      src={s.dish.image}
                      alt={s.dish.name}
                      className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500 ease-out"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <UtensilsCrossed className="w-10 h-10 text-gray-300" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

                  <div className={`absolute top-3 left-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 backdrop-blur-md bg-white ${s.dish?.dishType === "Veg" ? "text-green-500" : "text-red-500"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dish?.dishType === "Veg" ? "bg-green-500" : "bg-red-500"}`} />
                    <span className="text-[10px] font-bold uppercase tracking-wide leading-none">
                      {s.dish?.dishType === "Veg" ? "Vegetarian" : "Non-Veg"}
                    </span>
                  </div>

                  {s.myResponse === "yes" && (
                    <div className="absolute top-3 right-3 bg-orange-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm">
                      <Check className="w-3 h-3 stroke-[3]" /> Eating
                    </div>
                  )}
                  {s.myResponse === "no" && (
                    <div className="absolute top-3 right-3 bg-gray-800/80 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
                      <X className="w-3 h-3 stroke-[3]" /> Skipping
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="px-3 sm:px-4 pt-3 pb-3 sm:pb-4">
                  <h3 className="font-bold text-gray-900 text-[14px] sm:text-[15px] leading-snug mb-2 sm:mb-2.5 line-clamp-1">
                    {s.dish?.name}
                  </h3>
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <span className="flex items-center gap-1 bg-gray-100 rounded-full px-2.5 py-1 text-[11px] font-semibold text-gray-500">
                      <Flame className="w-3 h-3 text-orange-400 flex-shrink-0" />
                      {s.dish?.estimatedCalories}
                    </span>
                    {s.dish?.tags?.slice(0, 2).map((t) => (
                      <span key={t} className="bg-orange-50 text-orange-600 text-[11px] font-semibold px-2.5 py-1 rounded-full border border-orange-100 leading-none">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CTA */}
      <div className="pt-2 pb-4">
        <button
          onClick={() => navigate("/user/dish-request")}
          className="w-full bg-orange-500 hover:bg-orange-600 active:scale-[0.99] text-white font-bold py-3.5 sm:py-4 rounded-2xl flex items-center justify-center gap-2 sm:gap-2.5 transition-all duration-150 text-sm sm:text-[15px] shadow-md shadow-orange-200/60"
        >
          <UtensilsCrossed className="w-4 h-4 sm:w-5 sm:h-5" />
          Request Dish 
        </button>
      </div>
    </div>
  );
}