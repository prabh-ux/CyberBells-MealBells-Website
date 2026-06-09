import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Package, Clock, Star, Utensils, TrendingUp, Award, Zap, Users, Loader2 } from "lucide-react";
import type { AppDispatch, RootState } from "../../app/store";
import { fetchVendorAnalytics, type AnalyticsPeriod } from "../../slices/vendorSlice";

const DonutChart = ({ veg, nonVeg }: { veg: number; nonVeg: number }) => {
  const total   = veg + nonVeg || 1;
  const r       = 54;
  const cx = 70; const cy = 70;
  const circ    = 2 * Math.PI * r;
  const vegDash = circ * (veg / total);
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth="18" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f97316" strokeWidth="18"
        strokeDasharray={`${vegDash} ${circ - vegDash}`}
        strokeDashoffset={circ * 0.25} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.6s ease" }} />
      <text x={cx} y={cy - 8} textAnchor="middle" fontSize="20" fontWeight="600" fill="#111827">
        {(veg + nonVeg).toLocaleString()}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="11" fill="#9ca3af">total</text>
    </svg>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1f2937", borderRadius: 8, padding: "6px 12px", fontSize: 13, color: "#fff" }}>
      <span style={{ color: "#fb923c", fontWeight: 600 }}>{payload[0].value}</span>
      <span style={{ color: "#9ca3af", marginLeft: 4 }}>boxes · {label}</span>
    </div>
  );
};

const VendorReport = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { analyticsData, analyticsLoading, analyticsError } = useSelector((s: RootState) => s.vendors);
  const [period, setPeriod] = useState<AnalyticsPeriod>("week");

  useEffect(() => { dispatch(fetchVendorAnalytics(period)); }, [dispatch, period]);

  if (analyticsLoading)
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );

  if (analyticsError)
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
          <p className="text-gray-500 font-medium mb-3">{analyticsError}</p>
          <button onClick={() => dispatch(fetchVendorAnalytics(period))} className="text-sm text-orange-500 underline">Retry</button>
        </div>
      </div>
    );

  const d         = analyticsData;
  const chartData = d?.boxesDelivered ?? [];
  const maxVal    = Math.max(...chartData.map((b) => b.boxes), 1);

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">

        {/* Page header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Analytics Overview</h1>
          <p className="text-sm text-gray-400 mt-0.5">Track your delivery performance and meal trends</p>
        </div>

        {/* Row 1: Bar chart + Donut */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

          {/* Boxes Delivered */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-4 sm:p-6 border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-5">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Boxes Delivered</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{(d?.totalBoxes ?? 0).toLocaleString()}</p>
              </div>
              <div className="flex bg-gray-100 rounded-xl p-1 gap-1 self-start sm:self-auto">
                {(["week", "month", "year"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all capitalize ${
                      period === p ? "bg-orange-500 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {chartData.length === 0 ? (
              <div className="h-[160px] sm:h-[200px] flex items-center justify-center text-gray-400 text-sm">
                No delivery data for this period.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData} barSize={period === "year" ? 14 : 22}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(249,115,22,0.06)" }} />
                  <Bar dataKey="boxes" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.boxes === maxVal ? "#f97316" : "#fed7aa"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Veg vs Non-Veg */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100 flex flex-col">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 sm:mb-4">
              Veg vs Non-Veg
            </p>
            <div className="flex-1 flex flex-col items-center justify-center gap-3 sm:gap-5 py-2 sm:py-0">
              <DonutChart veg={d?.vegCount ?? 0} nonVeg={d?.nonVegCount ?? 0} />
              <div className="flex gap-4 sm:gap-6 text-sm">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-orange-400 inline-block" />
                  <span className="text-gray-600 font-medium">Veg</span>
                  <span className="font-bold text-gray-900">{d?.vegPct ?? 0}%</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-gray-200 inline-block" />
                  <span className="text-gray-600 font-medium">Non-Veg</span>
                  <span className="font-bold text-gray-900">{d?.nonVegPct ?? 0}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {[
            { icon: Package,  label: "Total boxes delivered", value: (d?.totalBoxes ?? 0).toLocaleString(),    sub: `This ${period}`,                          accent: "bg-orange-100 text-orange-500"  },
            { icon: Utensils, label: "Average daily meals",   value: (d?.avgDailyMeals ?? 0).toLocaleString(), sub: "Daily avg",                               accent: "bg-blue-100 text-blue-500"      },
            { icon: Clock,    label: "Peak day",              value: d?.peakDay.label ?? "—",                  sub: `${(d?.peakDay.orders ?? 0).toLocaleString()} orders`, accent: "bg-purple-100 text-purple-500" },
            { icon: Star,     label: "Avg rating",            value: d?.avgRating ? String(d.avgRating) : "—", sub: `${d?.totalReviews ?? 0} reviews`,          accent: "bg-amber-100 text-amber-500"    },
          ].map(({ icon: Icon, label, value, sub, accent }) => (
            <div key={label} className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-gray-100">
              <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl ${accent} flex items-center justify-center mb-2 sm:mb-3`}>
                <Icon style={{ width: 16, height: 16 }} />
              </div>
              <p className="text-[10px] sm:text-xs text-gray-400 font-medium mb-1 leading-tight">{label}</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900 mb-0.5 sm:mb-1">{value}</p>
              <p className="text-[10px] sm:text-xs font-semibold text-gray-400 flex items-center gap-0.5">
                <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                {sub}
              </p>
            </div>
          ))}
        </div>

        {/* Row 3: Popular dishes + Growth opportunity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Most popular */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                  <Award className="w-4 h-4 text-orange-500" />
                </div>
                <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Most popular dish</p>
              </div>
              {d?.mostPopular ? (
                <>
                  <div className="flex items-center gap-2 sm:gap-3 mb-3">
                    {d.mostPopular.image ? (
                      <img src={d.mostPopular.image} alt={d.mostPopular.name} className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-orange-50 flex items-center justify-center text-xl sm:text-2xl shrink-0">🍛</div>
                    )}
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2">{d.mostPopular.name}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">Ordered {d.mostPopular.orders.toLocaleString()} times</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className="bg-orange-500 h-1.5 rounded-full transition-all" style={{ width: `${d.mostPopular.percent}%` }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5 text-right">{d.mostPopular.percent}% of total</p>
                </>
              ) : (
                <p className="text-sm text-gray-400">No data yet.</p>
              )}
            </div>

            {/* Least popular */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-gray-400" />
                </div>
                <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Least popular dish</p>
              </div>
              {d?.leastPopular ? (
                <>
                  <div className="flex items-center gap-2 sm:gap-3 mb-3">
                    {d.leastPopular.image ? (
                      <img src={d.leastPopular.image} alt={d.leastPopular.name} className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gray-50 flex items-center justify-center text-xl sm:text-2xl shrink-0">🥗</div>
                    )}
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2">{d.leastPopular.name}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">Ordered {d.leastPopular.orders.toLocaleString()} times</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className="bg-gray-300 h-1.5 rounded-full transition-all" style={{ width: `${d.leastPopular.percent}%` }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5 text-right">{d.leastPopular.percent}% of total</p>
                </>
              ) : (
                <p className="text-sm text-gray-400">No data yet.</p>
              )}
            </div>
          </div>

          {/* Growth opportunity */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-400 rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/20 flex items-center justify-center mb-3 sm:mb-4">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <h3 className="text-white font-bold text-base sm:text-lg leading-snug mb-2">Growth Opportunity</h3>
              {d?.peakDay.label && d.peakDay.label !== "—" ? (
                <p className="text-orange-100 text-sm leading-relaxed">
                  Your busiest period is{" "}
                  <span className="text-white font-bold">{d.peakDay.label}</span> with{" "}
                  <span className="text-white font-bold">{d.peakDay.orders.toLocaleString()} orders</span>.
                  Consider scheduling your most popular dishes on slower days to boost overall delivery volume.
                </p>
              ) : (
                <p className="text-orange-100 text-sm leading-relaxed">
                  Not enough data yet. Keep scheduling dishes to unlock insights.
                </p>
              )}
            </div>
            <button className="mt-4 sm:mt-5 w-full py-2.5 bg-white text-orange-500 font-bold text-sm rounded-xl hover:bg-orange-50 transition-colors">
              View Strategy
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default VendorReport;