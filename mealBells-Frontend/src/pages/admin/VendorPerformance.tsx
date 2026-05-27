import React, { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Cell, PieChart, Pie, Tooltip
} from "recharts";
import { useDispatch, useSelector } from "react-redux";
import shopIcon     from "../../assets/shopIcon.png";
import calanderIcon from "../../assets/calanderIcon.png";
import starFull     from "../../assets/starFull.png";
import starHalf     from "../../assets/starHalf.png";
import donutImg     from "../../assets/donutImg.png";
import linkArrow    from "../../assets/linkArrow.png";

import DropDown from "../../components/shared/DropDown";
import { PERIODS } from "../../data/adminData";
import { DATA, FEEDBACK_ROWS } from "../../data/VendorPerformance";
import KpiCard from "../../components/admin/VendorPerformance/KpiCard";
import TrendChip from "../../components/admin/VendorPerformance/TrendChip";
import ChartTooltip from "../../components/admin/VendorPerformance/ChartTooltip";
import StarRating from "../../components/admin/VendorPerformance/StarRating";
import StatusBadge from "../../components/admin/VendorPerformance/StatusBadge";
import { fetchVendors } from "../../slices/vendorSlice";
import type { AppDispatch, RootState } from "../../app/store";
import type { PeriodKey } from "../../types/admin";

const VendorPerformance = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { list: vendors } = useSelector((s: RootState) => s.vendors);

  const [vendor, setVendor]           = useState("All Vendors");
  const [period, setPeriod]           = useState<PeriodKey>("All Time");
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showAll, setShowAll]         = useState(false);

  useEffect(() => { dispatch(fetchVendors()); }, [dispatch]);

  // Build vendor options from real data
  const vendorOptions = ["All Vendors", ...vendors.map(v => v.name)];

  // Safe KPI lookup — fall back to first available vendor/period if key missing
  const firstVendorKey = Object.keys(DATA)[0];
  const firstPeriodKey = Object.keys(DATA[firstVendorKey] ?? {})[0] as PeriodKey;

  const vendorKey = DATA[vendor] ? vendor : firstVendorKey;
  const periodKey = DATA[vendorKey]?.[period] ? period : firstPeriodKey;
  const kpi       = DATA[vendorKey][periodKey];

  const peakIndex    = kpi.ratingTrend.reduce((mi, d, i, a) => d.v > a[mi].v ? i : mi, 0);
  const qualityLabel = kpi.quality >= 90 ? "Excellent" : kpi.quality >= 80 ? "Good" : "Needs Improvement";
  const rows         = showAll ? FEEDBACK_ROWS : FEEDBACK_ROWS.slice(0, 3);

  const toggleDay = (label: string) =>
    setSelectedDay(prev => prev === label ? null : label);

  return (
    <div className="w-full bg-[#f5f5f5]">
      <div className="mx-auto w-full px-6 py-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
          <div>
            <h2 className="text-2xl font-bold leading-tight text-[var(--text-primary)]">Vendor Performance</h2>
            <p className="text-sm mt-1 text-[var(--text-label)]">Detailed analytics and operational KPIs for active partners.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <DropDown
              icon={shopIcon}
              value={vendor}
              options={vendorOptions}
              onChange={v => { setVendor(v); setSelectedDay(null); }}
            />
            <DropDown
              icon={calanderIcon}
              value={period}
              options={PERIODS}
              onChange={v => { setPeriod(v as PeriodKey); setSelectedDay(null); }}
            />
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Delivery Timeliness" tooltip={`↑${kpi.timelinessChange} vs previous period`}>
            <p className="text-3xl font-bold leading-none text-[var(--text-primary)]">
              {kpi.timeliness}<span className="text-3xl font-medium ml-px">%</span>
            </p>
            <TrendChip value={kpi.timelinessChange} suffix="vs last month" />
          </KpiCard>

          <KpiCard label="Average Rating" tooltip={`Based on ${kpi.ratingReviews.toLocaleString()} reviews`}>
            <div className="flex gap-3 items-center">
              <p className="text-3xl font-bold leading-none text-[var(--text-primary)]">{kpi.rating}</p>
              <div className="flex gap-0.5">
                {[starFull,starFull,starFull,starFull,starHalf].map((s, i) => (
                  <img key={i} src={s} alt="" className="w-5 h-5" />
                ))}
              </div>
            </div>
            <p className="text-xs text-[var(--text-label)]">Based on {kpi.ratingReviews.toLocaleString()} reviews</p>
          </KpiCard>

          <KpiCard label="Menu Accuracy" tooltip={`↑${kpi.accuracyChange} vs previous period`}>
            <p className="text-3xl font-bold leading-none text-[var(--text-primary)]">
              {kpi.accuracy}<span className="text-3xl font-medium ml-px">%</span>
            </p>
            <TrendChip value={`↑${kpi.accuracyChange}`} suffix="vs last month" />
          </KpiCard>

          <KpiCard label="Quality Score" tooltip={`Score: ${kpi.quality}/100 — ${qualityLabel}`}>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-3xl font-bold leading-none text-[var(--text-primary)]">
                {kpi.quality}<span className="text-sm font-medium text-[var(--text-label)]">/100</span>
              </p>
              <img src={donutImg} alt="" className="w-12 h-12" />
            </div>
            <p className="text-xs text-[var(--text-label)]">Overall health: {qualityLabel}</p>
          </KpiCard>
        </div>

        {/* Charts Row */}
        <div className="flex flex-col lg:flex-row gap-4 mt-4">

          {/* Delivery Bar Chart */}
          <div className="w-full lg:flex-[2] bg-white rounded-xl p-4 border border-[#e6cdb8]">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <p className="text-base font-semibold text-[var(--text-primary)]">Delivery Times</p>
                {selectedDay && (
                  <p className="text-xs text-[var(--text-label)] mt-0.5">
                    {selectedDay}: <span className="font-semibold text-[#FF7A00]">
                      {kpi.deliveryData.find(d => d.day === selectedDay)?.actual} deliveries
                    </span>
                    <button onClick={() => setSelectedDay(null)} className="ml-2 text-gray-400 hover:text-gray-600 text-xs">
                      ✕ clear
                    </button>
                  </p>
                )}
              </div>
              <div className="flex items-center gap-5">
                {[["#FF7A00","Actual"], ["#E2E2E2","Target"]].map(([color, lbl]) => (
                  <span key={lbl} className="flex items-center gap-1.5 text-xs text-[var(--text-label)]">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: color }} />{lbl}
                  </span>
                ))}
              </div>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={kpi.deliveryData}
                  barCategoryGap="35%"
                  margin={{ top: 8, right: 0, left: 0, bottom: 0 }}
                  onClick={e => { if (typeof e?.activeLabel === "string") toggleDay(e.activeLabel); }}
                >
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#FF7A00" stopOpacity={0.55} />
                      <stop offset="100%" stopColor="#FF7A00" stopOpacity={0.1}  />
                    </linearGradient>
                    <linearGradient id="barGradSel" x1="0" y1="0" x2="0" y2="1">
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
                      <Cell key={d.day}
                        fill={selectedDay === d.day ? "url(#barGradSel)" : "url(#barGrad)"}
                        stroke={selectedDay === d.day ? "#FF7A00" : "none"}
                        strokeWidth={selectedDay === d.day ? 1.5 : 0}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right Column */}
          <div className="w-full lg:flex-1 flex flex-col sm:flex-row lg:flex-col gap-4">
            <div className="bg-white rounded-xl p-4 border border-[#e6cdb8] flex-1">
              <p className="text-base font-bold mb-4 text-[var(--text-primary)]">Star Rating Trend</p>
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={kpi.ratingTrend} barCategoryGap="12%" margin={{ top: 0, right: 0, left: 0, bottom: 8 }}>
                    <XAxis dataKey="week" axisLine={false} tickLine={false} interval="preserveStartEnd"
                      tickMargin={12} tick={{ fontSize: 11, fill: "#6b7280" }} />
                    <YAxis hide domain={[0, 100]} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,122,0,0.05)" }} />
                    <Bar dataKey="v" radius={[6,6,6,6]} isAnimationActive={false}>
                      {kpi.ratingTrend.map((_, i) => (
                        <Cell key={i} fill={i === peakIndex ? "#f97316" : "#fde8d8"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-[#e6cdb8] flex-1">
              <p className="text-base font-bold mb-3 text-[var(--text-primary)]">Feedback Ratio</p>
              <div className="flex items-center gap-5 mt-2">
                <PieChart width={100} height={100}>
                  <Pie
                    data={[{ name:"Positives", value:kpi.positives }, { name:"Complaints", value:100 - kpi.positives }]}
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
                  {[["#f97316", `${kpi.positives}% Positives`], ["#d1d5db", `${100 - kpi.positives}% Complaints`]].map(([color, label]) => (
                    <span key={label} className="flex items-center gap-2 text-xs text-[var(--text-label)]">
                      <span className="w-2 h-2 rounded-full inline-block" style={{ background: color }} />{label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Table */}
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

          <div className="md:hidden border-t border-[#f1e4da]">
            {rows.map((row, i) => (
              <div key={i} className="border-b border-[#f1e4da] last:border-b-0 p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={row.image} alt={row.dish} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)] leading-tight">{row.dish}</p>
                      <p className="text-xs text-[var(--text-label)] mt-0.5">{row.date}</p>
                    </div>
                  </div>
                  <StatusBadge {...row} />
                </div>
                <div className="flex items-center justify-between">
                  <StarRating rating={row.rating} />
                  {row.complaints !== "None" && (
                    <p className="text-xs text-[var(--text-label)] text-right max-w-[60%]">{row.complaints}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block">
            <div className="grid grid-cols-[1fr_2fr_1fr_2fr_1fr] px-5 py-2.5 border-t border-b border-[#f1e4da] bg-[#F5F5F5]">
              {["Date","Dish","Rating","Complaints","Delivery Status"].map((col, i) => (
                <p key={col} className={`text-xs font-bold tracking-[0.08em] uppercase text-[var(--text-label)] ${i === 4 ? "text-right" : ""}`}>
                  {col}
                </p>
              ))}
            </div>
            {rows.map((row, i) => (
              <div key={i} className={`grid grid-cols-[1fr_2fr_1fr_2fr_1fr] items-center px-5 py-3.5 hover:bg-[#FFF7ED]/40 transition-colors ${i !== rows.length - 1 ? "border-b border-[#f1e4da]" : ""}`}>
                <p className="text-sm font-bold text-[var(--text-primary)]">{row.date}</p>
                <div className="flex items-center gap-3 min-w-0">
                  <img src={row.image} alt={row.dish} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">{row.dish}</p>
                </div>
                <StarRating rating={row.rating} />
                <p className="text-sm text-[var(--text-label)]">{row.complaints}</p>
                <div className="flex justify-end"><StatusBadge {...row} /></div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default VendorPerformance;