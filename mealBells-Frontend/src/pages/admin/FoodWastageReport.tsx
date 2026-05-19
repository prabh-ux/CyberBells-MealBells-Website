import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import IcMeals from "../../assets/IcMeals.png";
import IcPlus from "../../assets/IcPlus.png";
import IcWarn from "../../assets/IcWarn.png";
import IcPercent from "../../assets/IcPercent.png";
import IcDownload from "../../assets/IcDownload.png";
import foodWastageFooterBg from "../../assets/foodWastageFooterBg.png";
import IcFilter from "../../assets/IcFilter.png";
import IcBrain from "../../assets/IcBrain.png";
import IcArrowUp from "../../assets/IcArrowUp.png";
import IcArrowDown from "../../assets/IcArrowDown.png";
import tickMarkGreen from "../../assets/tickMarkGreen.png";
import DropDown from "../../components/shared/DropDown";
import type { MealKey, PeriodKey, VendorKey } from "../../types/admin";
import { MEALS, PERIODS, VENDORS } from "../../data/adminData";

interface WastageRow {
  date: string;
  expected: number;
  delivered: number;
  eaten: number;
  wastageCount: number;
  wastagePercent: number;
}

const chartData = [
  { day: "MON", Expected: 450, Delivered: 420 },
  { day: "TUE", Expected: 480, Delivered: 460 },
  { day: "WED", Expected: 400, Delivered: 390 },
  { day: "THU", Expected: 520, Delivered: 400 },
  { day: "FRI", Expected: 430, Delivered: 415 },
  { day: "SAT", Expected: 220, Delivered: 190 },
  { day: "SUN", Expected: 150, Delivered: 140 },
];

const tableRows: WastageRow[] = [
  { date: "Oct 23, 2023", expected: 450, delivered: 460, eaten: 412, wastageCount: 48,  wastagePercent: 10.4 },
  { date: "Oct 22, 2023", expected: 480, delivered: 480, eaten: 455, wastageCount: 25,  wastagePercent: 5.2  },
  { date: "Oct 21, 2023", expected: 400, delivered: 410, eaten: 380, wastageCount: 30,  wastagePercent: 7.3  },
  { date: "Oct 20, 2023", expected: 520, delivered: 530, eaten: 410, wastageCount: 120, wastagePercent: 22.6 },
  { date: "Oct 19, 2023", expected: 430, delivered: 430, eaten: 415, wastageCount: 15,  wastagePercent: 3.4  },
];

function wastageCountClass(count: number): string {
  if (count >= 100) return "bg-[#FEE2E2] text-[#B91C1C]";
  if (count >= 30)  return "bg-[#FEF2F2] text-[#DC2626]";
  if (count <= 20)  return "bg-[#F0FDF4] text-[#16A34A]";
  return "bg-[#FFF7ED] text-[#994700]";
}

function IconTile({ src, bg }: { src: string; bg: string }) {
  return (
    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
      <img src={src} alt="" className="w-[55%] h-[55%] object-contain" />
    </div>
  );
}

function StatCard({
  label, value, trend, trendGood, trendLabel, iconSrc, iconBg,
}: {
  label: string; value: string; trend?: string; trendGood?: boolean;
  trendLabel?: string; iconSrc: string; iconBg: string;
}) {
  return (
    <div className="bg-white rounded-xl p-3 sm:p-4 flex flex-col gap-1.5 sm:gap-2 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[10px] sm:text-xs font-bold text-[var(--text-label)] uppercase tracking-wide font-[var(--font-inter)] leading-tight">
          {label}
        </span>
        <IconTile src={iconSrc} bg={iconBg} />
      </div>

      <p className="text-2xl sm:text-3xl font-medium text-[var(--text-primary)] font-[var(--font-manrope)]">
        {value}
      </p>

      {trend && (
        <div className="flex items-center gap-1">
          <span className={`text-[10px] sm:text-xs font-semibold font-[var(--font-inter)] flex items-center gap-1 ${trendGood ? "text-[#BA1A1A]" : "text-[var(--brand)]"}`}>
            <img src={trendGood ? IcArrowUp : IcArrowDown} alt="" className="w-3 h-3 object-contain" />
            {trend}
          </span>
        </div>
      )}

      {!trend && trendLabel && (
        <div className="flex items-center gap-1.5 sm:gap-2 flex-nowrap">
          {trendLabel.includes("Good") && (
            <img src={tickMarkGreen} alt="tick" className="w-3.5 sm:w-4 h-3.5 sm:h-4 object-contain flex-shrink-0" />
          )}
          <span className={`text-[10px] sm:text-sm font-semibold font-[var(--font-inter)] whitespace-nowrap ${trendLabel.includes("Good") ? "text-[#1FA64B]" : "text-[#94A3B8]"}`}>
            {trendLabel}
          </span>
        </div>
      )}
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-(--text-primary) border border-[var(--border)] rounded-xl shadow-lg px-4 py-3 text-sm font-[var(--font-inter)]">
      <p className="font-semibold text-white mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="text-xs" style={{ color: p.color }}>
          {p.name}: <span className="font-semibold">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

export default function FoodWastageReport() {
  const [vendor, setVendor] = useState<VendorKey>("All Vendors");
  const [period, setPeriod] = useState<PeriodKey>("This Month");
  const [mealType, setMealType] = useState("All Meals");

  return (
    <div className="min-h-screen bg-[#F5F5F5] font-[var(--font-manrope)]">
      <div className="mx-auto w-full px-3 sm:px-6 py-4 sm:py-6">
        <div className="space-y-4 sm:space-y-5">

          {/* ── Title + Filter card ── */}
          {/* Stack on mobile, side-by-side on md+ */}
          <div className="flex flex-col md:grid md:grid-cols-2 gap-4">

            {/* Title */}
            <div className="md:mt-auto">
              <h1 className="text-2xl sm:text-[32px] font-bold font-[var(--font-manrope)] text-[var(--text-primary)] tracking-tight">
                Food Wastage Report
              </h1>
              <p className="text-xs sm:text-base text-[#64748B] mt-1 font-[var(--font-inter)]">
                Detailed analysis of meal consumption vs production efficiency.
              </p>
            </div>

            {/* Filter card */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              {/* Vendor + Month — always 2 cols */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-[#94A3B8] mb-1 font-[var(--font-inter)]">
                    Vendor
                  </label>
                  <DropDown value={vendor} options={VENDORS} onChange={(v) => setVendor(v as VendorKey)} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-[#94A3B8] mb-1 font-[var(--font-inter)]">
                    Month
                  </label>
                  <DropDown value={period} options={PERIODS} onChange={(v) => setPeriod(v as PeriodKey)} />
                </div>
              </div>

              {/* Meal type + Apply — stacked on xs, row on sm+ */}
              <div className="flex flex-col xs:flex-row items-stretch xs:items-end gap-2 sm:gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-bold uppercase tracking-widest text-[#94A3B8] mb-1 font-[var(--font-inter)]">
                    Meal Type
                  </label>
                  <DropDown value={mealType} options={MEALS} onChange={(v) => setMealType(v as MealKey)} />
                </div>
                <button className="flex items-center justify-center gap-1.5 bg-[var(--brand)] hover:opacity-90 text-white font-semibold text-sm px-4 py-2 xs:py-0 xs:h-[38px] rounded-lg transition-opacity font-[var(--font-inter)] shrink-0">
                  <img src={IcFilter} alt="" className="w-3.5 h-3.5 object-contain brightness-0 invert" />
                  Apply
                </button>
              </div>
            </div>
          </div>

          {/* ── Stat cards — 2×2 on mobile, 4-col on lg ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard label="Wasted Meals"       value="482"  trend="12% vs last month" trendGood={true}  iconSrc={IcMeals}   iconBg="bg-orange-50" />
            <StatCard label="Extra Meals Sent"   value="124"  trend="5% vs last month"  trendGood={false} iconSrc={IcPlus}    iconBg="bg-blue-50"   />
            <StatCard label="Shortages"          value="12"   trendLabel="Good performance"  iconSrc={IcWarn}    iconBg="bg-red-50"    />
            <StatCard label="Wastage Percentage" value="8.4%" trendLabel="– Neutral trend"   iconSrc={IcPercent} iconBg="bg-amber-50"  />
          </div>

          {/* ── Expected vs Actual chart ── */}
          <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm">
            <div className="flex flex-col gap-3 mb-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-sm sm:text-base font-semibold text-[var(--text-primary)]">
                  Expected vs Actual Meals
                </h2>
                <p className="text-xs text-[var(--text-label)] mt-0.5 font-[var(--font-inter)]">
                  Daily meal distribution analysis for the current week
                </p>
              </div>
              <div className="flex items-center gap-4 sm:gap-5 shrink-0">
                {[["#d1d5db", "Expected"], ["#994700", "Delivered"]].map(([color, label]) => (
                  <span key={label} className="flex items-center gap-1.5 text-xs text-[var(--text-label)] font-bold font-[var(--font-inter)]">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: color }} />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div className="h-44 sm:h-52 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="day" hide />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#9ca3af", fontFamily: "var(--font-inter)" }}
                    axisLine={false} tickLine={false} domain={[100, 600]}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="Expected" stroke="#d1d5db" strokeWidth={2}
                    dot={{ r: 4, fill: "#d1d5db", strokeWidth: 0 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="Delivered" stroke="#994700" strokeWidth={2.5}
                    dot={{ r: 4, fill: "#994700", strokeWidth: 0 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Day labels */}
            <div className="flex justify-around pl-4 mt-2">
              {chartData.map((d) => (
                <div key={d.day} className="flex flex-col items-center gap-0.5 min-w-0 flex-1">
                  <div className="flex gap-0.5 sm:gap-1">
                    <span className="text-[9px] sm:text-xs text-gray-400 font-[var(--font-inter)]">{d.Expected}</span>
                    <span className="text-[9px] sm:text-xs text-[var(--brand)] font-semibold font-[var(--font-inter)]">{d.Delivered}</span>
                  </div>
                  <span className="text-[9px] sm:text-xs font-semibold text-gray-500 font-[var(--font-inter)]">{d.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Detailed Wastage Log ── */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="flex flex-col gap-2 p-4 sm:p-5 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-sm sm:text-base font-semibold text-[var(--text-primary)]">
                Detailed Wastage Log
              </h2>
              <button className="flex items-center gap-2 text-sm font-bold text-[var(--brand)] hover:opacity-80 transition-opacity font-[var(--font-inter)] shrink-0 self-start sm:self-auto">
                <img src={IcDownload} alt="" className="w-4 h-4 object-contain" />
                Export Report
              </button>
            </div>

            {/* Horizontally scrollable table */}
            <div className="overflow-x-auto">
              <div className="min-w-[500px]">
                {/* Header */}
                <div className="grid grid-cols-6 gap-2 px-4 sm:px-5 py-2.5 bg-[#F5F5F5] border-b border-[var(--divider)]">
                  {["Date", "Expected", "Delivered", "Eaten", "Wastage", "Wastage %"].map((h) => (
                    <span key={h} className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[var(--text-label)] font-[var(--font-inter)]">
                      {h}
                    </span>
                  ))}
                </div>

                {/* Rows */}
                {tableRows.map((row, i) => (
                  <div key={i} className="grid grid-cols-6 gap-2 px-4 sm:px-5 py-3 sm:py-3.5 border-b border-[var(--divider)] last:border-0 items-center">
                    <span className="text-xs sm:text-sm text-[var(--text-primary)] font-[var(--font-inter)] font-bold whitespace-nowrap">
                      {row.date}
                    </span>
                    <span className="text-xs sm:text-sm text-[var(--text-label)] font-[var(--font-inter)] font-medium">{row.expected}</span>
                    <span className="text-xs sm:text-sm text-[var(--text-label)] font-[var(--font-inter)] font-medium">{row.delivered}</span>
                    <span className="text-xs sm:text-sm text-[var(--text-label)] font-[var(--font-inter)] font-medium">{row.eaten}</span>
                    <span>
                      <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs sm:text-sm font-semibold font-[var(--font-inter)] ${wastageCountClass(row.wastageCount)}`}>
                        {row.wastageCount}
                      </span>
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-[var(--text-primary)] font-[var(--font-inter)]">
                      {row.wastagePercent}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination */}
            <div className="flex flex-col items-center gap-3 p-4 sm:p-5 sm:flex-row sm:justify-between">
              <span className="text-xs sm:text-sm text-[var(--text-label)] font-medium font-[var(--font-inter)]">
                Showing 1 to 5 of 31 days
              </span>
              <div className="flex items-center gap-2">
                {[
                  <path key="l" d="M15 18l-6-6 6-6" />,
                  <path key="r" d="M9 18l6-6-6-6" />,
                ].map((icon, i) => (
                  <button
                    key={i}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border)] hover:bg-[var(--page-bg)] transition-colors ${i === 0 ? "opacity-60" : ""}`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      className="text-[var(--text-primary)] w-4 h-4">
                      {icon}
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Bottom row ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">

            {/* Optimize card */}
            <div className="relative rounded-xl overflow-hidden min-h-44 sm:min-h-52">
              <img src={foodWastageFooterBg} alt="Optimize background" className="absolute inset-0 w-full h-full object-cover" />
              <div className="relative z-10 p-5 sm:p-6 flex flex-col justify-end h-full">
                <h3 className="text-base sm:text-lg leading-tight font-normal text-white mb-2 sm:mb-3 font-[var(--font-manrope)]">
                  Optimize Your Next Week
                </h3>
                <p className="text-xs sm:text-sm text-[#CBD5E1] font-[var(--font-inter)] leading-relaxed mb-4 sm:mb-5 max-w-sm">
                  Based on current wastage patterns, reducing Thursday's lunch order by 15% could save an estimated $1,200 this month.
                </p>
                <button className="w-fit bg-[var(--brand)] hover:opacity-90 text-white font-normal text-sm px-5 py-2 rounded-lg transition-all duration-200 font-[var(--font-inter)] shadow-lg">
                  Adjust Orders
                </button>
              </div>
            </div>

            {/* AI Insight card */}
            <div className="bg-white rounded-xl p-5 sm:p-6 shadow-sm flex flex-col items-center text-center justify-center gap-3 sm:gap-4">
              <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-full bg-amber-50 flex items-center justify-center">
                <img src={IcBrain} alt="" className="w-[55%] h-[55%] object-contain" />
              </div>
              <h3 className="text-sm sm:text-base font-normal font-[var(--font-manrope)] text-[var(--text-primary)]">
                AI Insight
              </h3>
              <p className="text-xs sm:text-sm text-[var(--text-label)] font-[var(--font-inter)] leading-relaxed max-w-xs">
                "Wastage typically peaks on Thursdays due to high remote-work attendance. Consider implementing a 'Confirm Lunch' notification for Thursdays."
              </p>
              <button className="text-sm font-bold text-[var(--brand)] hover:opacity-75 transition-opacity font-[var(--font-inter)]">
                Enable Notifications
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}