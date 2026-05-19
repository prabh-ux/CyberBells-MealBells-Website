import React, { useState, useRef, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  Cell, PieChart, Pie, Tooltip,
} from "recharts";
import shopIcon      from "../../assets/shopIcon.png";
import calanderIcon  from "../../assets/calanderIcon.png";
import arrowUpUrl    from "../../assets/arrowUpUrl.png";
import starFull      from "../../assets/starFull.png";
import starHalf      from "../../assets/starHalf.png";
import donutImg      from "../../assets/donutImg.png";
import linkArrow     from "../../assets/linkArrow.png";
import dishTeriyaki  from "../../assets/dishTeriyaki.png";
import dishQuinoa    from "../../assets/dishQuinoa.png";
import dishCurry     from "../../assets/dishCurry.png";
import DropDown from "../../components/shared/DropDown";
import type { PeriodKey, VendorKey } from "../../types/admin";
import { PERIODS, VENDORS } from "../../data/adminData";




interface KpiSet {
  timeliness: number; timelinessChange: string;
  rating: number; ratingReviews: number;
  accuracy: number; accuracyChange: string;
  quality: number;
  positives: number;
  deliveryData: { day: string; actual: number; target: number }[];
  ratingTrend: { week: string; v: number }[];
}

const DATA: Record<VendorKey, Record<PeriodKey, KpiSet>> = {
  "All Vendors": {
    "This Month":    { timeliness: 94.8, timelinessChange: "1.2%", rating: 4.7, ratingReviews: 1248, accuracy: 98.2, accuracyChange: "0.5%", quality: 88, positives: 92, deliveryData: [{day:"Mon",actual:58,target:80},{day:"Tue",actual:76,target:80},{day:"Wed",actual:63,target:80},{day:"Thu",actual:89,target:80},{day:"Fri",actual:68,target:80},{day:"Sat",actual:91,target:80},{day:"Sun",actual:73,target:80}], ratingTrend: [{week:"Week 1",v:58},{week:"",v:54},{week:"",v:96},{week:"",v:57},{week:"",v:61},{week:"",v:56},{week:"",v:59},{week:"Week 8",v:62}] },
    "Last Month":    { timeliness: 93.6, timelinessChange: "0.8%", rating: 4.5, ratingReviews: 1102, accuracy: 97.7, accuracyChange: "0.2%", quality: 85, positives: 89, deliveryData: [{day:"Mon",actual:62,target:80},{day:"Tue",actual:71,target:80},{day:"Wed",actual:55,target:80},{day:"Thu",actual:82,target:80},{day:"Fri",actual:74,target:80},{day:"Sat",actual:88,target:80},{day:"Sun",actual:69,target:80}], ratingTrend: [{week:"Week 1",v:52},{week:"",v:60},{week:"",v:88},{week:"",v:55},{week:"",v:58},{week:"",v:62},{week:"",v:57},{week:"Week 8",v:65}] },
    "Last 3 Months": { timeliness: 92.1, timelinessChange: "2.1%", rating: 4.4, ratingReviews: 3521, accuracy: 96.9, accuracyChange: "1.1%", quality: 83, positives: 87, deliveryData: [{day:"Mon",actual:55,target:80},{day:"Tue",actual:69,target:80},{day:"Wed",actual:72,target:80},{day:"Thu",actual:78,target:80},{day:"Fri",actual:60,target:80},{day:"Sat",actual:85,target:80},{day:"Sun",actual:66,target:80}], ratingTrend: [{week:"Week 1",v:48},{week:"",v:55},{week:"",v:78},{week:"",v:61},{week:"",v:54},{week:"",v:68},{week:"",v:52},{week:"Week 8",v:70}] },
    "This Year":     { timeliness: 91.4, timelinessChange: "3.4%", rating: 4.3, ratingReviews: 14203, accuracy: 95.8, accuracyChange: "2.2%", quality: 80, positives: 85, deliveryData: [{day:"Mon",actual:50,target:80},{day:"Tue",actual:65,target:80},{day:"Wed",actual:70,target:80},{day:"Thu",actual:75,target:80},{day:"Fri",actual:58,target:80},{day:"Sat",actual:80,target:80},{day:"Sun",actual:62,target:80}], ratingTrend: [{week:"Week 1",v:44},{week:"",v:50},{week:"",v:72},{week:"",v:58},{week:"",v:48},{week:"",v:64},{week:"",v:49},{week:"Week 8",v:66}] },
  },
  "The Healthy Kitchen": {
    "This Month":    { timeliness: 97.2, timelinessChange: "2.1%", rating: 4.9, ratingReviews: 412, accuracy: 99.1, accuracyChange: "0.3%", quality: 94, positives: 96, deliveryData: [{day:"Mon",actual:72,target:80},{day:"Tue",actual:84,target:80},{day:"Wed",actual:78,target:80},{day:"Thu",actual:92,target:80},{day:"Fri",actual:80,target:80},{day:"Sat",actual:95,target:80},{day:"Sun",actual:88,target:80}], ratingTrend: [{week:"Week 1",v:70},{week:"",v:75},{week:"",v:98},{week:"",v:72},{week:"",v:80},{week:"",v:74},{week:"",v:78},{week:"Week 8",v:82}] },
    "Last Month":    { timeliness: 95.1, timelinessChange: "1.4%", rating: 4.8, ratingReviews: 388, accuracy: 98.8, accuracyChange: "0.1%", quality: 91, positives: 94, deliveryData: [{day:"Mon",actual:68,target:80},{day:"Tue",actual:79,target:80},{day:"Wed",actual:74,target:80},{day:"Thu",actual:88,target:80},{day:"Fri",actual:77,target:80},{day:"Sat",actual:91,target:80},{day:"Sun",actual:83,target:80}], ratingTrend: [{week:"Week 1",v:65},{week:"",v:70},{week:"",v:92},{week:"",v:68},{week:"",v:75},{week:"",v:70},{week:"",v:73},{week:"Week 8",v:78}] },
    "Last 3 Months": { timeliness: 94.0, timelinessChange: "3.0%", rating: 4.7, ratingReviews: 1140, accuracy: 98.2, accuracyChange: "0.8%", quality: 89, positives: 93, deliveryData: [{day:"Mon",actual:65,target:80},{day:"Tue",actual:76,target:80},{day:"Wed",actual:70,target:80},{day:"Thu",actual:84,target:80},{day:"Fri",actual:74,target:80},{day:"Sat",actual:88,target:80},{day:"Sun",actual:80,target:80}], ratingTrend: [{week:"Week 1",v:60},{week:"",v:66},{week:"",v:89},{week:"",v:64},{week:"",v:71},{week:"",v:66},{week:"",v:70},{week:"Week 8",v:74}] },
    "This Year":     { timeliness: 93.2, timelinessChange: "4.5%", rating: 4.6, ratingReviews: 4720, accuracy: 97.5, accuracyChange: "1.9%", quality: 86, positives: 91, deliveryData: [{day:"Mon",actual:60,target:80},{day:"Tue",actual:72,target:80},{day:"Wed",actual:66,target:80},{day:"Thu",actual:80,target:80},{day:"Fri",actual:70,target:80},{day:"Sat",actual:84,target:80},{day:"Sun",actual:76,target:80}], ratingTrend: [{week:"Week 1",v:55},{week:"",v:62},{week:"",v:84},{week:"",v:60},{week:"",v:67},{week:"",v:62},{week:"",v:66},{week:"Week 8",v:70}] },
  },
  "Spice Route": {
    "This Month":    { timeliness: 91.3, timelinessChange: "0.7%", rating: 4.5, ratingReviews: 534, accuracy: 97.4, accuracyChange: "0.4%", quality: 84, positives: 90, deliveryData: [{day:"Mon",actual:48,target:80},{day:"Tue",actual:66,target:80},{day:"Wed",actual:55,target:80},{day:"Thu",actual:80,target:80},{day:"Fri",actual:60,target:80},{day:"Sat",actual:84,target:80},{day:"Sun",actual:65,target:80}], ratingTrend: [{week:"Week 1",v:50},{week:"",v:46},{week:"",v:90},{week:"",v:48},{week:"",v:55},{week:"",v:50},{week:"",v:53},{week:"Week 8",v:58}] },
    "Last Month":    { timeliness: 90.5, timelinessChange: "0.3%", rating: 4.3, ratingReviews: 498, accuracy: 97.0, accuracyChange: "0.2%", quality: 82, positives: 88, deliveryData: [{day:"Mon",actual:45,target:80},{day:"Tue",actual:62,target:80},{day:"Wed",actual:51,target:80},{day:"Thu",actual:76,target:80},{day:"Fri",actual:57,target:80},{day:"Sat",actual:80,target:80},{day:"Sun",actual:62,target:80}], ratingTrend: [{week:"Week 1",v:46},{week:"",v:42},{week:"",v:86},{week:"",v:44},{week:"",v:51},{week:"",v:46},{week:"",v:49},{week:"Week 8",v:54}] },
    "Last 3 Months": { timeliness: 89.8, timelinessChange: "1.5%", rating: 4.2, ratingReviews: 1502, accuracy: 96.5, accuracyChange: "0.9%", quality: 80, positives: 86, deliveryData: [{day:"Mon",actual:42,target:80},{day:"Tue",actual:59,target:80},{day:"Wed",actual:48,target:80},{day:"Thu",actual:72,target:80},{day:"Fri",actual:54,target:80},{day:"Sat",actual:76,target:80},{day:"Sun",actual:59,target:80}], ratingTrend: [{week:"Week 1",v:42},{week:"",v:38},{week:"",v:82},{week:"",v:40},{week:"",v:47},{week:"",v:42},{week:"",v:45},{week:"Week 8",v:50}] },
    "This Year":     { timeliness: 88.9, timelinessChange: "2.8%", rating: 4.1, ratingReviews: 6018, accuracy: 95.8, accuracyChange: "1.8%", quality: 77, positives: 84, deliveryData: [{day:"Mon",actual:38,target:80},{day:"Tue",actual:55,target:80},{day:"Wed",actual:44,target:80},{day:"Thu",actual:68,target:80},{day:"Fri",actual:50,target:80},{day:"Sat",actual:72,target:80},{day:"Sun",actual:55,target:80}], ratingTrend: [{week:"Week 1",v:38},{week:"",v:34},{week:"",v:78},{week:"",v:36},{week:"",v:43},{week:"",v:38},{week:"",v:41},{week:"Week 8",v:46}] },
  },
  "Green Gourmet": {
    "This Month":    { timeliness: 96.1, timelinessChange: "1.8%", rating: 4.8, ratingReviews: 302, accuracy: 98.9, accuracyChange: "0.6%", quality: 92, positives: 95, deliveryData: [{day:"Mon",actual:68,target:80},{day:"Tue",actual:80,target:80},{day:"Wed",actual:72,target:80},{day:"Thu",actual:88,target:80},{day:"Fri",actual:75,target:80},{day:"Sat",actual:92,target:80},{day:"Sun",actual:82,target:80}], ratingTrend: [{week:"Week 1",v:66},{week:"",v:70},{week:"",v:96},{week:"",v:68},{week:"",v:75},{week:"",v:70},{week:"",v:73},{week:"Week 8",v:78}] },
    "Last Month":    { timeliness: 94.3, timelinessChange: "1.1%", rating: 4.6, ratingReviews: 278, accuracy: 98.3, accuracyChange: "0.4%", quality: 89, positives: 93, deliveryData: [{day:"Mon",actual:64,target:80},{day:"Tue",actual:76,target:80},{day:"Wed",actual:68,target:80},{day:"Thu",actual:84,target:80},{day:"Fri",actual:71,target:80},{day:"Sat",actual:88,target:80},{day:"Sun",actual:78,target:80}], ratingTrend: [{week:"Week 1",v:62},{week:"",v:66},{week:"",v:92},{week:"",v:64},{week:"",v:71},{week:"",v:66},{week:"",v:69},{week:"Week 8",v:74}] },
    "Last 3 Months": { timeliness: 93.0, timelinessChange: "2.5%", rating: 4.5, ratingReviews: 822, accuracy: 97.8, accuracyChange: "1.0%", quality: 86, positives: 91, deliveryData: [{day:"Mon",actual:60,target:80},{day:"Tue",actual:72,target:80},{day:"Wed",actual:64,target:80},{day:"Thu",actual:80,target:80},{day:"Fri",actual:67,target:80},{day:"Sat",actual:84,target:80},{day:"Sun",actual:74,target:80}], ratingTrend: [{week:"Week 1",v:58},{week:"",v:62},{week:"",v:88},{week:"",v:60},{week:"",v:67},{week:"",v:62},{week:"",v:65},{week:"Week 8",v:70}] },
    "This Year":     { timeliness: 91.8, timelinessChange: "3.9%", rating: 4.4, ratingReviews: 3465, accuracy: 97.1, accuracyChange: "2.0%", quality: 83, positives: 89, deliveryData: [{day:"Mon",actual:56,target:80},{day:"Tue",actual:68,target:80},{day:"Wed",actual:60,target:80},{day:"Thu",actual:76,target:80},{day:"Fri",actual:63,target:80},{day:"Sat",actual:80,target:80},{day:"Sun",actual:70,target:80}], ratingTrend: [{week:"Week 1",v:54},{week:"",v:58},{week:"",v:84},{week:"",v:56},{week:"",v:63},{week:"",v:58},{week:"",v:61},{week:"Week 8",v:66}] },
  },
};

const allFeedbackRows = [
  { date: "Oct 24, 2023", dish: "Chicken Teriyaki Bento",  image: dishTeriyaki, rating: 5, complaints: "None",                    status: "On Time",      delayed: false },
  { date: "Oct 23, 2023", dish: "Superfood Quinoa Salad",  image: dishQuinoa,   rating: 4, complaints: "Slightly cold on arrival", status: "Delayed (12m)", delayed: true  },
  { date: "Oct 22, 2023", dish: "Red Thai Curry",          image: dishCurry,    rating: 5, complaints: "None",                    status: "On Time",      delayed: false },
  { date: "Oct 21, 2023", dish: "Chicken Teriyaki Bento",  image: dishTeriyaki, rating: 4, complaints: "Missing cutlery",         status: "On Time",      delayed: false },
  { date: "Oct 20, 2023", dish: "Superfood Quinoa Salad",  image: dishQuinoa,   rating: 5, complaints: "None",                    status: "On Time",      delayed: false },
  { date: "Oct 19, 2023", dish: "Red Thai Curry",          image: dishCurry,    rating: 3, complaints: "Spice level off",         status: "Delayed (8m)", delayed: true  },
];


// ─── KPI card ─────────────────────────────────────────────────────
const KpiCard = ({ label, children, tooltip }: { label: string; children: React.ReactNode; tooltip?: string }) => {
  const [show, setShow] = useState(false);
  return (
    <div
      className="bg-white rounded-xl p-4 flex flex-col gap-2 border border-[#e6cdb8] relative cursor-default"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <p className="text-xs font-semibold tracking-[0.08em] uppercase font-[var(--font-inter)] text-[var(--text-label)]">
        {label}
      </p>
      {children}
      {tooltip && show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg pointer-events-none">
          {tooltip}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
};

// ─── Trend chip ───────────────────────────────────────────────────
const TrendChip = ({ value, suffix }: { value: string; suffix: string }) => (
  <div className="flex items-center gap-1.5">
    <span className="flex items-center gap-1 text-xs font-semibold text-[#16a34a]">
      <img src={arrowUpUrl} alt="" className="w-3 h-3" />
      {value}
    </span>
    <span className="text-xs font-[var(--font-inter)] text-[var(--text-label)]">{suffix}</span>
  </div>
);

// ─── Stars ────────────────────────────────────────────────────────
const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <img key={i} src={i < rating ? starFull : starHalf} alt="star" className="w-3.5 h-3.5" />
    ))}
  </div>
);

// ─── Custom bar tooltip ───────────────────────────────────────────
const BarTooltipContent = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none">
      <p className="font-semibold mb-0.5">{label}</p>
      <p>Actual: <span className="text-[#FF7A00] font-bold">{payload[0]?.value}</span></p>
    </div>
  );
};

// ─── Custom donut tooltip ─────────────────────────────────────────
const DonutTooltipContent = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none">
      <p className="font-semibold">{entry.name}: <span className="text-[#FF7A00]">{entry.value}%</span></p>
    </div>
  );
};

// ─── Mobile card ──────────────────────────────────────────────────
const MobileFeedbackCard = ({ row }: { row: typeof allFeedbackRows[0] }) => (
  <div className="border-b border-[#f1e4da] last:border-b-0 p-4">
    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="flex items-center gap-3 min-w-0">
        <img src={row.image} alt={row.dish} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--text-primary)] leading-tight">{row.dish}</p>
          <p className="text-xs text-[var(--text-label)] mt-0.5">{row.date}</p>
        </div>
      </div>
      <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold flex-shrink-0 ${
        row.delayed ? "bg-[#FFEDD5] text-[#C2410C]" : "bg-[#D1FAE5] text-[#047857]"
      }`}>
        {row.status}
      </span>
    </div>
    <div className="flex items-center justify-between">
      <StarRating rating={row.rating} />
      {row.complaints !== "None" && (
        <p className="text-xs text-[var(--text-label)] text-right max-w-[60%]">{row.complaints}</p>
      )}
    </div>
  </div>
);

// ─── Main ─────────────────────────────────────────────────────────
const VendorPerformance = () => {
  const [vendor, setVendor] = useState<VendorKey>("All Vendors");
  const [period, setPeriod] = useState<PeriodKey>("This Month");
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const kpi = DATA[vendor][period];
  const feedbackRows = showAll ? allFeedbackRows : allFeedbackRows.slice(0, 3);
  const PEAK = kpi.ratingTrend.reduce((maxI, d, i, arr) => d.v > arr[maxI].v ? i : maxI, 0);

  const feedbackData = [
    { name: "Positives",  value: kpi.positives },
    { name: "Complaints", value: 100 - kpi.positives },
  ];

  return (
    <div className="w-full bg-[#f5f5f5] font-[var(--font-inter)]">
      <div className="mx-auto w-full px-6 py-6">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
          <div>
            <h2 className="text-2xl font-bold leading-tight text-[var(--text-primary)]">
              Vendor Performance
            </h2>
            <p className="text-sm mt-1 text-[var(--text-label)]">
              Detailed analytics and operational KPIs for active partners.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <DropDown icon={shopIcon}     value={vendor} options={VENDORS} onChange={(v) => setVendor(v as VendorKey)} />
            <DropDown icon={calanderIcon} value={period} options={PERIODS} onChange={(v) => { setPeriod(v as PeriodKey); setSelectedDay(null); }} />
          </div>
        </div>

        {/* ── KPI cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Delivery Timeliness" tooltip={`↑${kpi.timelinessChange} vs previous period`}>
            <p className="text-3xl font-bold leading-none font-[var(--font-manrope)] text-[var(--text-primary)]">
              {kpi.timeliness}<span className="text-3xl font-medium ml-px">%</span>
            </p>
            <TrendChip value={kpi.timelinessChange} suffix="vs last month" />
          </KpiCard>

          <KpiCard label="Average Rating" tooltip={`Based on ${kpi.ratingReviews.toLocaleString()} reviews`}>
            <div className="flex gap-3 items-center">
              <p className="text-3xl font-bold leading-none font-[var(--font-manrope)] text-[var(--text-primary)]">{kpi.rating}</p>
              <div className="flex items-center gap-0.5">
                {[starFull, starFull, starFull, starFull, starHalf].map((src, i) => (
                  <img key={i} src={src} alt="star" className="w-5 h-5" />
                ))}
              </div>
            </div>
            <p className="text-xs text-[var(--text-label)]">Based on {kpi.ratingReviews.toLocaleString()} reviews</p>
          </KpiCard>

          <KpiCard label="Menu Accuracy" tooltip={`↑${kpi.accuracyChange} vs previous period`}>
            <p className="text-3xl font-bold leading-none font-[var(--font-manrope)] text-[var(--text-primary)]">
              {kpi.accuracy}<span className="text-3xl font-medium ml-px">%</span>
            </p>
            <TrendChip value={`↑${kpi.accuracyChange}`} suffix="vs last month" />
          </KpiCard>

          <KpiCard label="Quality Score" tooltip={`Score: ${kpi.quality}/100 — ${kpi.quality >= 90 ? "Excellent" : kpi.quality >= 80 ? "Good" : "Needs Improvement"}`}>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-3xl font-bold leading-none font-[var(--font-manrope)] text-[var(--text-primary)]">
                {kpi.quality}<span className="text-sm font-medium text-[var(--text-label)]">/100</span>
              </p>
              <img src={donutImg} alt={`${kpi.quality}/100 quality ring`} className="w-12 h-12" />
            </div>
            <p className="text-xs text-[var(--text-label)]">
              Overall health: {kpi.quality >= 90 ? "Excellent" : kpi.quality >= 80 ? "Good" : "Needs Improvement"}
            </p>
          </KpiCard>
        </div>

        {/* ── Charts ── */}
        <div className="flex flex-col lg:flex-row gap-4 mt-4">

          {/* Delivery Times */}
          <div className="w-full lg:flex-[2] bg-white rounded-xl p-4 border border-[#e6cdb8]">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <p className="text-base font-semibold font-[var(--font-manrope)] text-[var(--text-primary)]">
                  Delivery Times
                </p>
                {selectedDay && (
                  <p className="text-xs text-[var(--text-label)] mt-0.5">
                    {selectedDay}: <span className="font-semibold text-[#FF7A00]">
                      {kpi.deliveryData.find(d => d.day === selectedDay)?.actual} deliveries
                    </span>
                    <button onClick={() => setSelectedDay(null)} className="ml-2 text-gray-400 hover:text-gray-600 text-xs">✕ clear</button>
                  </p>
                )}
              </div>
              <div className="flex items-center gap-5">
                <span className="flex items-center gap-1.5 text-xs text-[var(--text-label)]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF7A00] inline-block" />
                  Actual
                </span>
                <span className="flex items-center gap-1.5 text-xs text-[var(--text-label)]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E2E2E2] inline-block" />
                  Target
                </span>
              </div>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={kpi.deliveryData}
                  barCategoryGap="35%"
                  margin={{ top: 8, right: 0, left: 0, bottom: 0 }}
onClick={(e) => {
  if (typeof e?.activeLabel === "string") {
    setSelectedDay(
      e.activeLabel === selectedDay ? null : e.activeLabel
    );
  }
}}                >
                  <defs>
                    <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#FF7A00" stopOpacity={0.55} />
                      <stop offset="35%"  stopColor="#FF7A00" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#FF7A00" stopOpacity={0.1}  />
                    </linearGradient>
                    <linearGradient id="selectedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#FF7A00" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#FF7A00" stopOpacity={0.5} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#f1e4da" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontFamily: "var(--font-inter)", fontSize: 11, fill: "var(--text-label)" }} tickMargin={8} />
                  <YAxis hide />
                  <Tooltip content={<BarTooltipContent />} cursor={{ fill: "rgba(255,122,0,0.05)" }} />
                  <Bar dataKey="actual" radius={[6, 6, 6, 6]} isAnimationActive={false} maxBarSize={48} style={{ cursor: "pointer" }}>
                    {kpi.deliveryData.map((entry) => (
                      <Cell
                        key={entry.day}
                        fill={selectedDay === entry.day ? "url(#selectedGrad)" : "url(#actualGrad)"}
                        stroke={selectedDay === entry.day ? "#FF7A00" : "none"}
                        strokeWidth={selectedDay === entry.day ? 1.5 : 0}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right column */}
          <div className="w-full lg:flex-1 flex flex-col sm:flex-row lg:flex-col gap-4">

            {/* Star Rating Trend */}
            <div className="bg-white rounded-xl p-4 border border-[#e6cdb8] flex-1">
              <p className="text-base font-bold mb-4 font-[var(--font-manrope)] text-[var(--text-primary)]">
                Star Rating Trend
              </p>
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={kpi.ratingTrend} barCategoryGap="12%" margin={{ top: 0, right: 0, left: 0, bottom: 8 }}>
                    <XAxis dataKey="week" axisLine={false} tickLine={false} interval="preserveStartEnd" tickMargin={12} tick={{ fontFamily: "var(--font-inter)", fontSize: 11, fill: "#6b7280" }} />
                    <YAxis hide domain={[0, 100]} />
                    <Tooltip content={<BarTooltipContent />} cursor={{ fill: "rgba(255,122,0,0.05)" }} />
                    <Bar dataKey="v" radius={[6, 6, 6, 6]} isAnimationActive={false}>
                      {kpi.ratingTrend.map((_, i) => (
                        <Cell key={i} fill={i === PEAK ? "#f97316" : "#fde8d8"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Feedback Ratio */}
            <div className="bg-white rounded-xl p-4 border border-[#e6cdb8] flex-1">
              <p className="text-base font-bold mb-3 font-[var(--font-manrope)] text-[var(--text-primary)]">
                Feedback Ratio
              </p>
              <div className="flex items-center gap-5 mt-2">
                <PieChart width={100} height={100}>
                  <Pie
                    data={feedbackData}
                    cx={45} cy={45}
                    innerRadius={32} outerRadius={46}
                    startAngle={90} endAngle={-270}
                    dataKey="value"
                    strokeWidth={0}
                    paddingAngle={3}
                  >
                    <Cell fill="#f5c4a8" />
                    <Cell fill="#fbe8dc" />
                  </Pie>
                  <Tooltip content={<DonutTooltipContent />} />
                </PieChart>
                <div className="flex flex-col gap-2">
                  <span className="flex items-center gap-2 text-xs text-[var(--text-label)]">
                    <span className="w-2 h-2 rounded-full bg-[#f97316] inline-block" />
                    {kpi.positives}% Positives
                  </span>
                  <span className="flex items-center gap-2 text-xs text-[var(--text-label)]">
                    <span className="w-2 h-2 rounded-full bg-[#d1d5db] inline-block" />
                    {100 - kpi.positives}% Complaints
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Recent Feedback & Delivery ── */}
        <div className="bg-white rounded-xl border border-[#e6cdb8] mt-4 overflow-hidden">

          {/* Table header */}
          <div className="flex items-center justify-between px-5 py-3.5">
            <p className="text-base font-semibold font-[var(--font-manrope)] text-[var(--text-primary)]">
              Recent Feedback &amp; Delivery
            </p>
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-sm font-bold text-[var(--brand)] flex items-center gap-1.5 cursor-pointer whitespace-nowrap hover:opacity-75 transition-opacity"
            >
              {showAll ? "Show Less" : "View All"}
              <img src={linkArrow} alt="arrow" className={`w-3 h-auto transition-transform ${showAll ? "rotate-90" : ""}`} />
            </button>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden border-t border-[#f1e4da]">
            {feedbackRows.map((row, idx) => <MobileFeedbackCard key={idx} row={row} />)}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block">
            <div className="grid grid-cols-[1fr_2fr_1fr_2fr_1fr] items-center px-5 py-2.5 border-t border-b border-[#f1e4da] bg-[#F5F5F5] text-[var(--text-label)]">
              {["Date", "Dish", "Rating", "Complaints", "Delivery Status"].map((col, i) => (
                <p key={col} className={`text-xs font-bold tracking-[0.08em] uppercase ${i === 4 ? "text-right" : ""}`}>
                  {col}
                </p>
              ))}
            </div>

            {feedbackRows.map((row, idx) => (
              <div
                key={idx}
                className={`grid grid-cols-[1fr_2fr_1fr_2fr_1fr] items-center px-5 py-3.5 transition-colors hover:bg-[#FFF7ED]/40 ${
                  idx !== feedbackRows.length - 1 ? "border-b border-[#f1e4da]" : ""
                }`}
              >
                <p className="text-sm font-bold text-[var(--text-primary)]">{row.date}</p>

                <div className="flex items-center gap-3 min-w-0">
                  <img src={row.image} alt={row.dish} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">{row.dish}</p>
                </div>

                <StarRating rating={row.rating} />

                <p className="text-sm text-[var(--text-label)]">{row.complaints}</p>

                <div className="flex justify-end">
                  <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold ${
                    row.delayed ? "bg-[#FFEDD5] text-[#C2410C]" : "bg-[#D1FAE5] text-[#047857]"
                  }`}>
                    {row.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default VendorPerformance;