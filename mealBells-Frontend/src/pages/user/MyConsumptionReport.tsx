import { useState, useEffect } from "react";
import axios from "axios";
import {
  Utensils,
  CalendarCheck,
  CalendarX,
  Star,
  Leaf,
  TrendingUp,
} from "lucide-react";

const backendUrl = import.meta.env.VITE_BACKEND;

type Period = "Week" | "Month" | "Year";

interface ChartBar {
  day: string;
  meals: number;
}

interface StatsData {
  period: string;
  daysAttended: number;
  daysSkipped: number;
  totalMeals: number;
  mostEaten: string;
  currentStreak: number;
  chartData: ChartBar[];
}

interface ReviewSummary {
  totalReviews: number;
  avgRating: number;
}

function BarChart({ data, max }: { data: ChartBar[]; max: number }) {
  return (
    <div className="flex items-end gap-2 h-28">
      {data.map((d) => {
        const pct = max > 0 ? (d.meals / max) * 100 : 0;
        return (
          <div
            key={d.day}
            className="flex-1 flex flex-col items-center gap-1.5"
          >
            <div
              className="w-full flex flex-col justify-end"
              style={{ height: "80px" }}
            >
              <div
                className="w-full rounded-t-lg bg-orange-500 transition-all duration-500 min-h-[4px]"
                style={{ height: `${Math.max(pct, 4)}%` }}
              />
            </div>
            <span className="text-[10px] text-gray-400 font-medium">
              {d.day}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function MyConsumptionReport() {
  const [period, setPeriod] = useState<Period>("Week");
  const [stats, setStats] = useState<StatsData | null>(null);
  const [reviews, setReviews] = useState<ReviewSummary | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch stats whenever period changes
  useEffect(() => {
    setLoadingStats(true);
    axios
      .get(`${backendUrl}/user/consumption-stats`, {
        params: { period: period.toLowerCase() },
        withCredentials: true,
      })
      .then((res) => {
        if (res.data.success) setStats(res.data.data);
        else setError(res.data.msg ?? "Failed to load stats.");
      })
      .catch((e) => setError(e?.response?.data?.msg ?? "Failed to load stats."))
      .finally(() => setLoadingStats(false));
  }, [period]);

  // Fetch review summary once
  useEffect(() => {
    axios
      .get(`${backendUrl}/user/reviews`, {
        params: { page: 1, limit: 1 },
        withCredentials: true,
      })
      .then((res) => {
        if (res.data.success) {
          setReviews({
            totalReviews: res.data.data.totalReviews,
            avgRating: res.data.data.avgRating,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoadingReviews(false));
  }, []);

  const loading = loadingStats || loadingReviews;

  // ── Loading ──
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F6F3]">
        <div className="w-8 h-8 rounded-full border-[3px] border-orange-100 border-t-orange-500 animate-spin" />
      </div>
    );

  // ── Error ──
  if (error || !stats)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F6F3] gap-3 px-8 text-center">
        <p className="text-sm text-gray-400">
          {error ?? "Could not load report."}
        </p>
      </div>
    );

  const maxVal = Math.max(...stats.chartData.map((d) => d.meals), 1);
  const attendanceRate =
    stats.daysAttended + stats.daysSkipped > 0
      ? Math.round(
          (stats.daysAttended / (stats.daysAttended + stats.daysSkipped)) * 100,
        )
      : 0;

  const periodLabel =
    period === "Week"
      ? "Lunch boxes eaten this week"
      : period === "Month"
        ? "Lunch boxes eaten this month"
        : "Lunch boxes eaten this year";

  return (
    <div className="min-h-screen bg-[#F7F6F3]">
      <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
        {/* ── Header ── */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 leading-tight">
            My Consumption Report
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* ── LEFT ── */}
          <div className="lg:col-span-2 space-y-5">
            {/* Chart card */}
            <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-0.5">
                    {period === "Week"
                      ? "Weekly"
                      : period === "Month"
                        ? "Monthly"
                        : "Yearly"}{" "}
                    Trend
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900">
                      {stats.totalMeals}
                    </span>
                    <span className="text-orange-500 font-bold text-sm">
                      Meals
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{periodLabel}</p>
                </div>
                <div className="flex bg-gray-100 rounded-full p-1 gap-1">
                  {(["Week", "Month", "Year"] as Period[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPeriod(p)}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                        period === p
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-400 hover:text-gray-600"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {loadingStats ? (
                <div className="h-28 flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full border-2 border-orange-100 border-t-orange-500 animate-spin" />
                </div>
              ) : (
                <BarChart data={stats.chartData} max={maxVal} />
              )}
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0">
                  <Utensils className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalMeals}
                  </p>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Total Meals
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-green-50 flex items-center justify-center shrink-0">
                  <CalendarCheck className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.daysAttended}
                  </p>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Days Attended
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-red-50 flex items-center justify-center shrink-0">
                  <CalendarX className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.daysSkipped}
                  </p>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Days Skipped
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-yellow-50 flex items-center justify-center shrink-0">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900 leading-tight truncate">
                    {stats.mostEaten}
                  </p>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Most Eaten
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div className="space-y-5">
            {/* Eco-saver */}
            <div className="relative bg-orange-500 rounded-[24px] p-6 overflow-hidden">
              <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-orange-400 opacity-40" />
              <div className="absolute -right-2 -top-4 w-20 h-20 rounded-full bg-orange-600 opacity-30" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <Leaf className="w-5 h-5 text-white" />
                  <span className="text-white font-bold text-sm">
                    Top 5% Eco-Saver
                  </span>
                </div>
                <p className="text-white/80 text-xs leading-relaxed">
                  By eating with us, you've saved{" "}
                  <span className="text-white font-bold">
                    {(stats.totalMeals * 0.05).toFixed(1)} kg
                  </span>{" "}
                  of single-use plastic waste this {period.toLowerCase()}.
                </p>
              </div>
            </div>

            {/* Attendance rate */}
            <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
                Attendance Rate
              </p>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-bold text-gray-900">
                  {attendanceRate}%
                </span>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full transition-all duration-700"
                  style={{ width: `${attendanceRate}%` }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-[11px] text-green-500 font-semibold">
                  {stats.daysAttended} attended
                </span>
                <span className="text-[11px] text-red-400 font-semibold">
                  {stats.daysSkipped} skipped
                </span>
              </div>
            </div>

            {/* Streak */}
            <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
                Current Streak
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center">
                  <span className="text-2xl">🔥</span>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.currentStreak}{" "}
                    <span className="text-base font-semibold text-gray-400">
                      days
                    </span>
                  </p>
                  <p className="text-xs text-orange-500 font-semibold">
                    {stats.currentStreak > 0
                      ? "Keep it up!"
                      : "Start your streak today!"}
                  </p>
                </div>
              </div>
            </div>

            {/* Avg rating from reviews */}
            {reviews && (
              <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
                  {reviews.totalReviews === 1
                    ? "Your Rating"
                    : "Your Avg Rating"}
                </p>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-bold text-gray-900">
                    {reviews.avgRating}
                  </span>
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full transition-all duration-700"
                    style={{ width: `${(reviews.avgRating / 5) * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-2 font-semibold">
                  {reviews.totalReviews === 1
                    ? "From your 1 review"
                    : `From ${reviews.totalReviews} reviews`}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
