// pages/superAdmin/SuperAdminVendorPerformance.tsx
import { useState, useEffect }         from "react";
import { useDispatch, useSelector }    from "react-redux";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Cell, PieChart, Pie, Tooltip,
} from "recharts";

import shopIcon     from "../../assets/shopIcon.png";
import calanderIcon from "../../assets/calanderIcon.png";
import donutImg     from "../../assets/donutImg.png";
import linkArrow    from "../../assets/linkarrow.png";

import DropDown     from "../../components/shared/DropDown";
// Reuse the same presentational sub-components from the admin panel
import KpiCard      from "../../components/admin/VendorPerformance/KpiCard";
import TrendChip    from "../../components/admin/VendorPerformance/TrendChip";
import ChartTooltip from "../../components/admin/VendorPerformance/ChartTooltip";
import StarRating   from "../../components/admin/VendorPerformance/StarRating";
import StatusBadge  from "../../components/admin/VendorPerformance/StatusBadge";

import {
  fetchSuperVendorList,
  fetchSuperVendorKpi,
  superVendorCacheKey,
} from "../../slices/superAdmin/superAdminVendorPerformanceSlice";
import { fetchSuperOrgOptions } from "../../slices/superAdmin/superAdminAnalyticsSlice";
import type { AppDispatch, RootState } from "../../app/store";

const PERIODS = ["Full Time", "Breakfast", "Lunch", "Dinner"];

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-[#f1e4da] rounded ${className}`} />
);

// ── Org pill selector (mirrors the org switcher in the super admin header) ────
interface OrgTabsProps {
  options: { label: string; value: string }[];
  value:   string;
  onChange: (v: string) => void;
}
const OrgTabs = ({ options, value, onChange }: OrgTabsProps) => (
  <div className="flex items-center gap-1.5 flex-wrap">
    {[{ label: "All Orgs", value: "all" }, ...options].map(opt => (
      <button
        key={opt.value}
        onClick={() => onChange(opt.value)}
        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
          value === opt.value
            ? "bg-[#FF7A00] text-white shadow-sm"
            : "bg-white text-[var(--text-label)] border border-[#e6cdb8] hover:border-[#FF7A00] hover:text-[#FF7A00]"
        }`}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

// ── Page ──────────────────────────────────────────────────────────────────────

const SuperAdminVendorPerformance = () => {
  const dispatch = useDispatch<AppDispatch>();

  // Super admin analytics slice — for org options
  const { orgOptions, orgOptionsLoading, filters } =
    useSelector((s: RootState) => s.superAnalytics);

  // Super admin vendor performance slice
  const { vendors, listLoading, kpiCache, kpiLoading } =
    useSelector((s: RootState) => s.superVendorPerformance);

  // The currently active org from the shared super-admin header
  const activeOrgId = filters.orgId;

  const [vendorId,    setVendorId]    = useState<string>("all");
  const [period,      setPeriod]      = useState("Full Time");
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showAll,     setShowAll]     = useState(false);

  // Fetch org options once on mount (no-op if already loaded)
  useEffect(() => {
    if (!orgOptions.length && !orgOptionsLoading) {
      dispatch(fetchSuperOrgOptions());
    }
  }, [dispatch, orgOptions.length, orgOptionsLoading]);

  // Re-fetch vendor list whenever the active org changes
  useEffect(() => {
    dispatch(fetchSuperVendorList(activeOrgId));
    // Also reset vendor selection so we don't keep showing stale data
    setVendorId("all");
    setSelectedDay(null);
    setShowAll(false);
  }, [dispatch, activeOrgId]);

  // Fetch KPI data whenever org / vendor / period changes
  useEffect(() => {
    dispatch(fetchSuperVendorKpi({ orgId: activeOrgId, vendorId, period }));
    setSelectedDay(null);
    setShowAll(false);
  }, [dispatch, activeOrgId, vendorId, period]);

  // Derived state
  const cacheKey = superVendorCacheKey(activeOrgId, vendorId, period);
  const kpi      = kpiCache[cacheKey] ?? null;
  const loading  = (kpiLoading || listLoading) && !kpi;

  const vendorOptions = [
    { label: "All Vendors", value: "all" },
    ...vendors.map(v => ({ label: v.name, value: v._id })),
  ];
  const selectedVendorLabel = vendorOptions.find(v => v.value === vendorId)?.label ?? "All Vendors";

  const peakIndex    = kpi ? kpi.ratingTrend.reduce((mi, d, i, a) => d.v > a[mi].v ? i : mi, 0) : 0;
  const qualityLabel = !kpi ? "" : kpi.quality >= 90 ? "Excellent" : kpi.quality >= 80 ? "Good" : "Needs Improvement";
  const rows         = showAll ? (kpi?.recentFeedback ?? []) : (kpi?.recentFeedback ?? []).slice(0, 3);

  return (
    <div className="min-h-full bg-[#F5F5F5]">

    

      <div className="mx-auto w-full px-6 pb-6 mt-5">

        {/* ── Org selector ──────────────────────────────────────────────────── */}
        {orgOptions.length > 0 && (
          <div className="mb-5">
            <p className="text-xs font-semibold text-[var(--text-label)] uppercase tracking-widest mb-2">
              Organisation
            </p>
            <OrgTabs
              options={orgOptions}
              value={activeOrgId}
              onChange={(v) => {
                // Dispatch to the shared super-analytics filter so the header
                // and this page stay in sync
                dispatch({ type: "superAnalytics/setSuperFilters", payload: { orgId: v } });
              }}
            />
          </div>
        )}

        {/* ── Page header ───────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
          <div>
            <h2 className="text-2xl font-bold leading-tight text-[var(--text-primary)]">
              Vendor Performance
            </h2>
            <p className="text-sm mt-1 text-[var(--text-label)]">
              {activeOrgId === "all"
                ? "Aggregated analytics across all organisations."
                : `Analytics for ${orgOptions.find(o => o.value === activeOrgId)?.label ?? "selected organisation"}.`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {kpiLoading && kpi && (
              <span className="text-xs text-[var(--text-label)] animate-pulse">Refreshing…</span>
            )}
            <DropDown
              icon={shopIcon}
              value={selectedVendorLabel}
              options={vendorOptions.map(v => v.label)}
              onChange={(label) => {
                const found = vendorOptions.find(v => v.label === label);
                setVendorId(found?.value ?? "all");
              }}
            />
            <DropDown
              icon={calanderIcon}
              value={period}
              options={PERIODS}
              onChange={(v) => { setPeriod(v); setSelectedDay(null); }}
            />
          </div>
        </div>

        {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          <KpiCard
            label="Delivery Timeliness"
            tooltip={kpi?.timelinessChange != null
              ? `${kpi.timelinessChange >= 0 ? "↑" : "↓"}${Math.abs(kpi.timelinessChange)} vs previous period`
              : "No previous period data"}
          >
            {loading || !kpi
              ? <Skeleton className="h-8 w-20" />
              : <p className="text-3xl font-bold leading-none text-[var(--text-primary)]">
                  {kpi.timeliness}<span className="text-3xl font-medium ml-px">%</span>
                </p>
            }
            {loading || !kpi
              ? <Skeleton className="h-4 w-28" />
              : <TrendChip value={kpi.timelinessChange} suffix="vs last month" />
            }
          </KpiCard>

          <KpiCard
            label="Average Rating"
            tooltip={kpi ? `Based on ${kpi.ratingReviews.toLocaleString()} reviews` : ""}
          >
            {loading || !kpi
              ? <Skeleton className="h-8 w-24" />
              : <div className="flex gap-3 items-center">
                  <p className="text-3xl font-bold leading-none text-[var(--text-primary)]">{kpi.rating}</p>
                  <StarRating rating={kpi.rating} />
                </div>
            }
            {loading || !kpi
              ? <Skeleton className="h-4 w-32" />
              : <p className="text-xs text-[var(--text-label)]">Based on {kpi.ratingReviews.toLocaleString()} reviews</p>
            }
          </KpiCard>

          <KpiCard
            label="Menu Accuracy"
            tooltip={kpi?.accuracyChange != null
              ? `${kpi.accuracyChange >= 0 ? "↑" : "↓"}${Math.abs(kpi.accuracyChange)} vs previous period`
              : "No previous period data"}
          >
            {loading || !kpi
              ? <Skeleton className="h-8 w-20" />
              : <p className="text-3xl font-bold leading-none text-[var(--text-primary)]">
                  {kpi.accuracy}<span className="text-3xl font-medium ml-px">%</span>
                </p>
            }
            {loading || !kpi
              ? <Skeleton className="h-4 w-28" />
              : <TrendChip value={kpi.accuracyChange} suffix="vs last month" />
            }
          </KpiCard>

          <KpiCard
            label="Quality Score"
            tooltip={kpi ? `Score: ${kpi.quality}/100 — ${qualityLabel}` : ""}
          >
            {loading || !kpi
              ? <Skeleton className="h-8 w-24" />
              : <div className="flex items-center gap-3 mt-1">
                  <p className="text-3xl font-bold leading-none text-[var(--text-primary)]">
                    {kpi.quality}<span className="text-sm font-medium text-[var(--text-label)]">/100</span>
                  </p>
                  <img src={donutImg} alt="" className="w-12 h-12" />
                </div>
            }
            {loading || !kpi
              ? <Skeleton className="h-4 w-28" />
              : <p className="text-xs text-[var(--text-label)]">Overall health: {qualityLabel}</p>
            }
          </KpiCard>
        </div>

        {/* ── Charts Row ────────────────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-4 mt-4">

          {/* Delivery Bar Chart */}
          <div className="w-full lg:flex-[2] bg-white rounded-xl p-4 border border-[#e6cdb8]">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <p className="text-base font-semibold text-[var(--text-primary)]">Delivery Times</p>
                {selectedDay && kpi && (
                  <p className="text-xs text-[var(--text-label)] mt-0.5">
                    {selectedDay}:{" "}
                    <span className="font-semibold text-[#FF7A00]">
                      {kpi.deliveryData.find(d => d.day === selectedDay)?.actual} deliveries
                    </span>
                    <button onClick={() => setSelectedDay(null)} className="ml-2 text-gray-400 hover:text-gray-600 text-xs">
                      ✕ clear
                    </button>
                  </p>
                )}
              </div>
              <div className="flex items-center gap-5">
                {[["#FF7A00", "Actual"], ["#E2E2E2", "Target"]].map(([color, lbl]) => (
                  <span key={lbl} className="flex items-center gap-1.5 text-xs text-[var(--text-label)]">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: color }} />{lbl}
                  </span>
                ))}
              </div>
            </div>
            <div className="h-48">
              {loading || !kpi ? (
                <div className="h-full flex items-end gap-2 px-2">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="flex-1 flex flex-col justify-end" style={{ height: `${30 + i * 7}%` }}>
                      <Skeleton className="w-full h-full" />
                    </div>
                  ))}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={kpi.deliveryData}
                    barCategoryGap="35%"
                    margin={{ top: 8, right: 0, left: 0, bottom: 0 }}
                    onClick={e => {
                      const label = e?.activeLabel;
                      if (label != null) setSelectedDay(prev => prev === String(label) ? null : String(label));
                    }}
                  >
                    <defs>
                      <linearGradient id="superBarGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#FF7A00" stopOpacity={0.55} />
                        <stop offset="100%" stopColor="#FF7A00" stopOpacity={0.1}  />
                      </linearGradient>
                      <linearGradient id="superBarGradSel" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#FF7A00" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#FF7A00" stopOpacity={0.5} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="#f1e4da" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tickMargin={8}
                      tick={{ fontSize: 11, fill: "var(--text-label)" }} />
                    <YAxis hide />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,122,0,0.05)" }} />
                    <Bar dataKey="actual" radius={[6,6,6,6]} isAnimationActive={false} maxBarSize={48} style={{ cursor: "pointer" }}>
                      {kpi.deliveryData.map(d => (
                        <Cell
                          key={d.day}
                          fill={selectedDay === d.day ? "url(#superBarGradSel)" : "url(#superBarGrad)"}
                          stroke={selectedDay === d.day ? "#FF7A00" : "none"}
                          strokeWidth={selectedDay === d.day ? 1.5 : 0}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="w-full lg:flex-1 flex flex-col sm:flex-row lg:flex-col gap-4">

            {/* Star Rating Trend */}
            <div className="bg-white rounded-xl p-4 border border-[#e6cdb8] flex-1">
              <p className="text-base font-bold mb-4 text-[var(--text-primary)]">Star Rating Trend</p>
              <div className="h-36">
                {loading || !kpi ? (
                  <div className="h-full flex items-end gap-2 px-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex-1 flex flex-col justify-end" style={{ height: `${40 + i * 15}%` }}>
                        <Skeleton className="w-full h-full" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={kpi.ratingTrend} barCategoryGap="12%"
                      margin={{ top: 0, right: 0, left: 0, bottom: 8 }}>
                      <XAxis dataKey="week" axisLine={false} tickLine={false}
                        interval="preserveStartEnd" tickMargin={12}
                        tick={{ fontSize: 11, fill: "#6b7280" }} />
                      <YAxis hide domain={[0, 100]} />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,122,0,0.05)" }} />
                      <Bar dataKey="v" radius={[6,6,6,6]} isAnimationActive={false}>
                        {kpi.ratingTrend.map((_, i) => (
                          <Cell key={i} fill={i === peakIndex ? "#f97316" : "#fde8d8"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Feedback Ratio */}
            <div className="bg-white rounded-xl p-4 border border-[#e6cdb8] flex-1">
              <p className="text-base font-bold mb-3 text-[var(--text-primary)]">Feedback Ratio</p>
              {loading || !kpi ? (
                <div className="flex items-center gap-5 mt-2">
                  <Skeleton className="w-[100px] h-[100px] rounded-full" />
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-5 mt-2">
                  <PieChart width={100} height={100}>
                    <Pie
                      data={[
                        { name: "Positives",  value: kpi.positives },
                        { name: "Complaints", value: 100 - kpi.positives },
                      ]}
                      cx={45} cy={45} innerRadius={32} outerRadius={46}
                      startAngle={90} endAngle={-270}
                      dataKey="value" strokeWidth={0} paddingAngle={3}
                    >
                      <Cell fill="#f5c4a8" />
                      <Cell fill="#fbe8dc" />
                    </Pie>
                    <Tooltip content={({ active, payload }) =>
                      active && payload?.length ? (
                        <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none">
                          {payload[0].name}: <span className="text-[#FF7A00]">{payload[0].value}%</span>
                        </div>
                      ) : null
                    } />
                  </PieChart>
                  <div className="flex flex-col gap-2">
                    {[
                      ["#f97316", `${kpi.positives}% Positives`],
                      ["#d1d5db", `${100 - kpi.positives}% Complaints`],
                    ].map(([color, label]) => (
                      <span key={label} className="flex items-center gap-2 text-xs text-[var(--text-label)]">
                        <span className="w-2 h-2 rounded-full inline-block" style={{ background: color }} />{label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Feedback Table ───────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-[#e6cdb8] mt-4 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5">
            <p className="text-base font-semibold text-[var(--text-primary)]">Recent Feedback &amp; Delivery</p>
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-sm font-bold text-[var(--brand)] flex items-center gap-1.5 hover:opacity-75 transition-opacity"
            >
              {showAll ? "Show Less" : "View All"}
              <img src={linkArrow} alt="" className={`w-3 h-auto transition-transform ${showAll ? "rotate-90" : ""}`} />
            </button>
          </div>

          {loading || !kpi ? (
            <div className="border-t border-[#f1e4da] p-4 flex flex-col gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
                  <div className="flex-1 flex flex-col gap-1.5">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="border-t border-[#f1e4da] py-12 flex flex-col items-center gap-2">
              <span className="text-3xl">📋</span>
              <p className="text-sm text-[#9CA3AF] font-medium">No feedback yet for this period</p>
            </div>
          ) : (
            <>
              {/* Mobile */}
              <div className="md:hidden border-t border-[#f1e4da]">
                {rows.map((row, i) => (
                  <div key={i} className="border-b border-[#f1e4da] last:border-b-0 p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {row.image
                          ? <img src={row.image} alt={row.dish} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                          : <div className="w-10 h-10 rounded-lg bg-[#fde8d8] flex-shrink-0 flex items-center justify-center text-lg">🍽️</div>
                        }
                        <div>
                          <p className="text-sm font-semibold text-[var(--text-primary)] leading-tight">{row.dish}</p>
                          <p className="text-xs text-[var(--text-label)] mt-0.5">{row.date}</p>
                        </div>
                      </div>
                      <StatusBadge onTime={row.onTime} />
                    </div>
                    <div className="flex items-center justify-between">
                      <StarRating rating={row.rating} />
                      {row.complaints !== "None" && row.complaints && (
                        <p className="text-xs text-[var(--text-label)] text-right max-w-[60%]">{row.complaints}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop */}
              <div className="hidden md:block">
                <div className="grid grid-cols-[1fr_2fr_1fr_2fr_1fr] px-5 py-2.5 border-t border-b border-[#f1e4da] bg-[#F5F5F5]">
                  {["Date", "Dish", "Rating", "Comments", "Delivery Status"].map((col, i) => (
                    <p key={col} className={`text-xs font-bold tracking-[0.08em] uppercase text-[var(--text-label)] ${i === 4 ? "text-right" : ""}`}>
                      {col}
                    </p>
                  ))}
                </div>
                {rows.map((row, i) => (
                  <div
                    key={i}
                    className={`grid grid-cols-[1fr_2fr_1fr_2fr_1fr] items-center px-5 py-3.5 hover:bg-[#FFF7ED]/40 transition-colors ${i !== rows.length - 1 ? "border-b border-[#f1e4da]" : ""}`}
                  >
                    <p className="text-sm font-bold text-[var(--text-primary)]">{row.date}</p>
                    <div className="flex items-center gap-3 min-w-0">
                      {row.image
                        ? <img src={row.image} alt={row.dish} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                        : <div className="w-10 h-10 rounded-lg bg-[#fde8d8] flex-shrink-0 flex items-center justify-center text-lg">🍽️</div>
                      }
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">{row.dish}</p>
                    </div>
                    <StarRating rating={row.rating} />
                    <p className="text-sm text-[var(--text-label)]">{row.complaints || "—"}</p>
                    <div className="flex justify-end"><StatusBadge onTime={row.onTime} /></div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default SuperAdminVendorPerformance;
