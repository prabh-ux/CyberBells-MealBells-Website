import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft, Star, Flame, CheckCircle2, XCircle, CalendarDays,
  Pencil, Leaf, Drumstick, Salad, Check, X, Package,
} from "lucide-react";

const backendUrl = import.meta.env.VITE_BACKEND;
export type AttendanceResponse = "yes" | "no";

export interface Vendor { name: string; logo?: string; rating: number; foodType?: string; }
export interface Dish {
  _id?: string; name: string; description: string;
  dishType: "Veg" | "Non-Veg" | "Vegan"; image: string;
  estimatedCalories: number; protein?: string; carbs?: string;
  tags: string[]; ingredientsList: string[]; vendor?: Vendor;
}
export interface DishDetailsData {
  scheduleId: string; scheduledDate: string; dish: Dish;
  myAttendance: AttendanceResponse | null; hasReviewed: boolean; myReview: null;
}

export default function DishDetailsPanel() {
  const { scheduleId } = useParams<{ scheduleId: string }>();
  const navigate = useNavigate();
  const [data, setData]       = useState<DishDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [voting, setVoting]   = useState(false);

  useEffect(() => {
    if (!scheduleId) return;
    setLoading(true);
    axios.get(`${backendUrl}/user/dish/${scheduleId}`, { withCredentials: true })
      .then(r => r.data.success ? setData(r.data.data) : setError(r.data.msg))
      .catch(e => setError(e?.response?.data?.msg ?? "Failed to load."))
      .finally(() => setLoading(false));
  }, [scheduleId]);

  const markAttendance = async (response: AttendanceResponse) => {
    if (!data || voting) return;
    setVoting(true);
    try {
      const r = await axios.patch(
        `${backendUrl}/user/attendance/${data.scheduleId}`,
        { response }, { withCredentials: true }
      );
      if (r.data.success) setData(p => p ? { ...p, myAttendance: response } : p);
    } finally { setVoting(false); }
  };

  /* ── Loading ── */
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#F7F6F3]">
      <div className="w-8 h-8 rounded-full border-[3px] border-orange-100 border-t-orange-500 animate-spin" />
    </div>
  );

  /* ── Error ── */
  if (error || !data) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F7F6F3] gap-3 px-8 text-center">
      <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center">
        <Package className="w-6 h-6 text-orange-300" />
      </div>
      <p className="text-sm text-gray-400">{error ?? "Dish not found."}</p>
      <button onClick={() => navigate(-1)} className="text-sm font-semibold text-orange-500">← Go Back</button>
    </div>
  );

  const { dish, myAttendance, hasReviewed } = data;
  const attended = myAttendance === "yes";
  const skipped  = myAttendance === "no";

  const btnBase  = "w-full py-3.5 rounded-2xl text-white text-[14px] font-semibold flex items-center justify-center gap-2 transition-opacity active:opacity-80 disabled:opacity-50";
  const btnColor = attended ? "bg-green-500" : skipped ? "bg-red-500" : "bg-orange-500";

  const vegBadge = dish.dishType === "Veg"
    ? "bg-green-500 text-white"
    : dish.dishType === "Vegan"
    ? "bg-emerald-500 text-white"
    : "bg-orange-500 text-white";

  const DishTypeIcon = dish.dishType === "Veg"
    ? Leaf
    : dish.dishType === "Vegan"
    ? Salad
    : Drumstick;

  return (
    <div className="min-h-screen bg-[#F7F6F3] flex flex-col items-center py-0 sm:py-6">
      <div className="w-full sm:max-w-xl lg:max-w-7xl">

        {/* ── BACK BUTTON — outside the card ── */}
        <div className="px-4 pt-5 pb-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-orange-500 transition-colors"
          >
            <ArrowLeft size={13} strokeWidth={2.5} />
            Back
          </button>
        </div>

        {/* ── CARD ── */}
        <div className="bg-white sm:rounded-3xl sm:mx-4 overflow-hidden sm:shadow-sm sm:border sm:border-gray-100">

          {/* HERO IMAGE */}
          <div className="relative w-full h-44 sm:h-48">
            <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" />

            {/* Veg / Non-Veg badge */}
            <span className={`absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${vegBadge}`}>
              <DishTypeIcon size={10} strokeWidth={2.5} />
              {dish.dishType === "Non-Veg" ? "Non-Veg" : dish.dishType}
            </span>

            {/* Attendance ribbon */}
            {myAttendance && (
              <span className={`absolute bottom-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-full text-white flex items-center gap-1 ${attended ? "bg-green-500" : "bg-red-500"}`}>
                {attended
                  ? <Check size={10} strokeWidth={2.5} />
                  : <X size={10} strokeWidth={2.5} />}
                {attended ? "Attending" : "Skipping"}
              </span>
            )}
          </div>

          {/* ── CONTENT ── */}
          <div className="px-5 sm:px-6 pt-4 pb-6 space-y-3.5">

            {/* NAME + VENDOR */}
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-snug">
                {dish.name}
              </h1>
              {dish.vendor && (
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-400">by {dish.vendor.name}</span>
                  <span className="text-gray-200">·</span>
                  <span className="flex items-center gap-0.5 text-xs text-amber-500 font-semibold">
                    <Star size={10} fill="currentColor" strokeWidth={0} />
                    {dish.vendor.rating}
                  </span>
                </div>
              )}
            </div>

            {/* DESCRIPTION */}
            <p className="text-xs text-gray-500 leading-relaxed">
              {dish.description}
            </p>

            {/* TAGS */}
            {dish.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {dish.tags.map(t => (
                  <span key={t} className="text-[10px] font-medium text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-0.5 rounded-full">
                    {t}
                  </span>
                ))}
              </div>
            )}

            <div className="border-t border-gray-100" />

            {/* CALORIES */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                <Flame size={16} className="text-orange-500" strokeWidth={1.75} />
              </div>
              <div>
                <span className="text-lg font-bold text-gray-800">
                  {dish.estimatedCalories}
                </span>
                <span className="text-xs font-medium text-gray-400 ml-1">kcal</span>
                <p className="text-[10px] text-gray-400 leading-none mt-0.5">
                  Estimated per serving
                </p>
              </div>
            </div>

            <div className="border-t border-gray-100" />

            {/* INGREDIENTS */}
            <div>
              <h2 className="text-sm font-bold text-gray-800 mb-3">Ingredients</h2>
              <div className="grid grid-cols-5 sm:grid-cols-7 gap-2.5">
                {dish.ingredientsList.map(ing => (
                  <div key={ing} className="flex flex-col items-center gap-1.5">
                    <div className="w-11 h-11 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center">
                      <Salad size={18} className="text-orange-400" strokeWidth={1.5} />
                    </div>
                    <p className="text-[9px] font-medium text-gray-500 text-center leading-tight">
                      {ing}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-100" />

            {/* REVIEWED NOTICE */}
            {hasReviewed && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-green-700">
                <CheckCircle2 size={13} strokeWidth={2} className="shrink-0" />
                You've already reviewed this dish.
              </div>
            )}

            {/* BUTTONS */}
            <div className="space-y-2.5 pt-0.5">
              {/* Primary — attendance */}
              <button
                onClick={() => markAttendance(attended ? "no" : "yes")}
                disabled={voting}
                className={`${btnBase} ${btnColor}`}
              >
                {attended
                  ? <CheckCircle2 size={15} strokeWidth={2} />
                  : skipped
                  ? <XCircle size={15} strokeWidth={2} />
                  : <CalendarDays size={15} strokeWidth={2} />}
                {attended
                  ? "Attending this Day"
                  : skipped
                  ? "Skipping — tap to undo"
                  : "Mark Attendance for this Day"}
              </button>

              {/* Secondary — modification */}
              <button
                onClick={() => navigate("/user/dish-request")}
                className="w-full py-3.5 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 text-[13px] font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Pencil size={13} strokeWidth={2.2} />
                Request Modification
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}