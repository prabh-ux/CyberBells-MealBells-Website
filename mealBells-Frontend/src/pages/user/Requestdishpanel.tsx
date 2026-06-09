import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { submitDishRequest, resetDishRequest } from "../../slices/userSlice";
import type { AppDispatch, RootState } from "../../app/store";
import type { DietOption, SpiceLevel } from "../../slices/userSlice";
import {
  CalendarDays, Utensils, Leaf, Drumstick, Salad,
  Flame, Wind, Zap, Send, CheckCircle2, RotateCcw, X,
} from "lucide-react";

interface DateOption { value: string; label: string; sub: string; }

const getDateOptions = (): DateOption[] => {
  const opts: DateOption[] = [];
  const quickLabels: Record<number, string> = { 1: "Tomorrow", 2: "Day After" };
  for (let i = 1; i <= 5; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dow = d.toLocaleDateString("en-US", { weekday: "long" });
    const dm  = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    opts.push({ value: d.toISOString().split("T")[0], label: quickLabels[i] ?? dow, sub: dm });
  }
  return opts;
};

const DATE_OPTIONS = getDateOptions();

const DIET_OPTS: { value: DietOption; label: string; Icon: React.ElementType; activeClass: string }[] = [
  { value: "Veg",     label: "Vegetarian", Icon: Leaf,      activeClass: "bg-emerald-500 border-emerald-500 text-white shadow-emerald-200" },
  { value: "Non-Veg", label: "Non-Veg",    Icon: Drumstick, activeClass: "bg-orange-500 border-orange-500 text-white shadow-orange-200"   },
  { value: "Both",    label: "Both",       Icon: Salad,     activeClass: "bg-amber-500 border-amber-500 text-white shadow-amber-200"       },
];

const SPICE_OPTS: { value: SpiceLevel; label: string; Icon: React.ElementType; activeClass: string; desc: string }[] = [
  { value: "Mild",   label: "Mild",   Icon: Wind,  desc: "Light & gentle",  activeClass: "bg-sky-500 border-sky-500 text-white shadow-sky-200"         },
  { value: "Normal", label: "Normal", Icon: Flame, desc: "Balanced heat",   activeClass: "bg-orange-500 border-orange-500 text-white shadow-orange-200" },
  { value: "Spicy",  label: "Spicy",  Icon: Zap,   desc: "Bold & fiery",    activeClass: "bg-red-500 border-red-500 text-white shadow-red-200"          },
];

export default function RequestDishPanel() {
  const dispatch = useDispatch<AppDispatch>();

  const {
    dishRequestSuccess:    success,
    submittingDishRequest: loading,
    dishRequestError:      error,
  } = useSelector((state: RootState) => state.user);

  const [selectedDate, setSelectedDate] = useState<string>(DATE_OPTIONS[0].value);
  const [suggestion,   setSuggestion]   = useState<string>("");
  const [diet,         setDiet]         = useState<DietOption>("Both");
  const [spice,        setSpice]        = useState<SpiceLevel>("Normal");

  useEffect(() => {
    return () => { dispatch(resetDishRequest()); };
  }, [dispatch]);

  const handleSubmit = () => {
    if (!selectedDate) return;
    dispatch(submitDishRequest({
      requestedDate: selectedDate, dishSuggestion: suggestion,
      dietaryPreference: diet, spiceLevel: spice,
    }));
  };

  const handleReset = () => {
    dispatch(resetDishRequest());
    setSuggestion(""); setDiet("Both"); setSpice("Normal");
    setSelectedDate(DATE_OPTIONS[0].value);
  };

  if (success)
    return (
      <div className="min-h-screen bg-[#fdfcfa] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 p-8 sm:p-12 flex flex-col items-center text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-50 border border-green-100 flex items-center justify-center mb-5 sm:mb-6">
            <CheckCircle2 size={32} className="text-green-500" strokeWidth={1.75} />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Request Sent!</h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-6 sm:mb-8">
            Your chefs have been notified. We'll do our best to serve your suggestion on the selected day.
          </p>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 sm:px-8 py-3 sm:py-3.5 rounded-2xl shadow-lg shadow-orange-200 transition-colors"
          >
            <RotateCcw size={15} strokeWidth={2} />
            Make Another Request
          </button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#fdfcfa] px-4 sm:px-6 py-6 sm:py-10">
      <div className="w-full max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
            Request a Dish
          </h1>
        </div>

        {/* Layout: stacked on mobile, two-col on lg */}
        <div className="flex flex-col lg:grid lg:grid-cols-5 gap-5 sm:gap-6 lg:gap-8">

          {/* LEFT hero */}
          <div className="lg:col-span-2 flex flex-col gap-4 sm:gap-6">
            <div className="bg-orange-500 rounded-2xl sm:rounded-3xl p-5 sm:p-7 relative overflow-hidden shadow-xl shadow-orange-200">
              <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/10" />
              <div className="absolute -bottom-10 -right-4 w-24 h-24 rounded-full bg-white/10" />
              <div className="relative z-10">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center mb-4 sm:mb-5">
                  <Utensils size={20} className="text-white" strokeWidth={1.75} />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug mb-2">
                  Craving something special?
                </h2>
                <p className="text-orange-100 text-sm leading-relaxed">
                  Tell our chefs what you'd like to see on the menu. Your suggestions shape tomorrow's dining experience.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 p-5 sm:p-6 shadow-sm space-y-3 sm:space-y-4">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-300">How it works</p>
              {[
                { step: "1", text: "Pick a day and describe your craving" },
                { step: "2", text: "Choose your dietary preference & spice level" },
                { step: "3", text: "Submit — our chefs review every request" },
              ].map(({ step, text }) => (
                <div key={step} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-orange-50 border border-orange-100 text-[11px] font-bold text-orange-500 flex items-center justify-center shrink-0 mt-0.5">
                    {step}
                  </span>
                  <p className="text-sm text-gray-500 leading-snug">{text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT form */}
          <div className="lg:col-span-3 bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm p-5 sm:p-8 space-y-6 sm:space-y-7">

            {/* Select a Day */}
            <div>
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
                <CalendarDays size={13} strokeWidth={2.5} />
                Select a Day
              </label>
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                {DATE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSelectedDate(opt.value)}
                    className={`py-2.5 sm:py-3 px-0.5 sm:px-1 rounded-xl sm:rounded-2xl border text-center transition-all ${
                      selectedDate === opt.value
                        ? "bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-200"
                        : "bg-gray-50 border-gray-200 text-gray-700 hover:border-orange-300 hover:bg-orange-50"
                    }`}
                  >
                    <p className="text-[10px] sm:text-[11px] font-bold leading-tight">{opt.label}</p>
                    <p className={`text-[9px] sm:text-[10px] mt-0.5 ${selectedDate === opt.value ? "text-orange-100" : "text-gray-400"}`}>
                      {opt.sub}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-100" />

            {/* Dish Suggestion */}
            <div>
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
                <Utensils size={13} strokeWidth={2.5} />
                Dish Suggestion
              </label>
              <div className="relative">
                <input
                  value={suggestion}
                  onChange={(e) => setSuggestion(e.target.value)}
                  placeholder="e.g., Thai Green Curry, Pasta Alfredo…"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl px-4 py-3 sm:py-3.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition pr-10"
                />
                {suggestion && (
                  <button
                    onClick={() => setSuggestion("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                  >
                    <X size={15} strokeWidth={2} />
                  </button>
                )}
              </div>
            </div>

            <div className="border-t border-gray-100" />

            {/* Dietary Preference */}
            <div>
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
                <Leaf size={13} strokeWidth={2.5} />
                Dietary Preference
              </label>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {DIET_OPTS.map(({ value, label, Icon, activeClass }) => (
                  <button
                    key={value}
                    onClick={() => setDiet(value)}
                    className={`flex items-center justify-center gap-1.5 sm:gap-2 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl border font-semibold text-xs sm:text-sm transition-all shadow-sm ${
                      diet === value
                        ? `${activeClass} shadow-lg`
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <Icon size={14} strokeWidth={2} />
                    <span className="hidden sm:inline">{label}</span>
                    <span className="sm:hidden">{value}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-100" />

            {/* Spice Level */}
            <div>
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
                <Flame size={13} strokeWidth={2.5} />
                Spice Level
              </label>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {SPICE_OPTS.map(({ value, label, Icon, activeClass, desc }) => (
                  <button
                    key={value}
                    onClick={() => setSpice(value)}
                    className={`flex flex-col items-center py-3 sm:py-4 rounded-xl sm:rounded-2xl border font-semibold text-sm transition-all shadow-sm ${
                      spice === value
                        ? `${activeClass} shadow-lg`
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <Icon size={18} strokeWidth={1.75} className="mb-1 sm:mb-1.5" />
                    <span className="text-[12px] sm:text-[13px] font-bold">{label}</span>
                    <span className={`text-[9px] sm:text-[10px] mt-0.5 font-normal hidden sm:block ${spice === value ? "opacity-75" : "text-gray-400"}`}>
                      {desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-xs font-semibold text-red-600">
                <X size={13} strokeWidth={2.5} className="shrink-0" />
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading || !selectedDate}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3.5 sm:py-4 rounded-2xl shadow-lg shadow-orange-200 flex items-center justify-center gap-2 sm:gap-2.5 transition-colors"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <><Send size={15} strokeWidth={2} /> Submit Request</>
              )}
            </button>
            <p className="text-center text-xs text-gray-400 -mt-4">
              Requests help us plan better menus for everyone.
            </p>

          </div>
        </div>
      </div>
    </div>
  );
}