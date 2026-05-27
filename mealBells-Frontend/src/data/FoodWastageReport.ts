import IcMeals    from "../assets/IcMeals.png";
import IcPlus     from "../assets/IcPlus.png";
import IcWarn     from "../assets/IcWarn.png";
import IcPercent  from "../assets/IcPercent.png";

export const chartData = [
  { day: "MON", Expected: 450, Delivered: 420 },
  { day: "TUE", Expected: 480, Delivered: 460 },
  { day: "WED", Expected: 400, Delivered: 390 },
  { day: "THU", Expected: 520, Delivered: 400 },
  { day: "FRI", Expected: 430, Delivered: 415 },
  { day: "SAT", Expected: 220, Delivered: 190 },
  { day: "SUN", Expected: 150, Delivered: 140 },
];

export const tableRows = [
  { date: "Oct 23, 2023", expected: 450, delivered: 460, eaten: 412, wastageCount: 48,  wastagePercent: 10.4 },
  { date: "Oct 22, 2023", expected: 480, delivered: 480, eaten: 455, wastageCount: 25,  wastagePercent: 5.2  },
  { date: "Oct 21, 2023", expected: 400, delivered: 410, eaten: 380, wastageCount: 30,  wastagePercent: 7.3  },
  { date: "Oct 20, 2023", expected: 520, delivered: 530, eaten: 410, wastageCount: 120, wastagePercent: 22.6 },
  { date: "Oct 19, 2023", expected: 430, delivered: 430, eaten: 415, wastageCount: 15,  wastagePercent: 3.4  },
];

export const statCards = [
  { label: "Wasted Meals",       value: "482",  trend: "12% vs last month", trendGood: true,  iconSrc: IcMeals,   iconBg: "bg-orange-50" },
  { label: "Extra Meals Sent",   value: "124",  trend: "5% vs last month",  trendGood: false, iconSrc: IcPlus,    iconBg: "bg-blue-50"   },
  { label: "Shortages",          value: "12",   trendLabel: "Good performance", iconSrc: IcWarn,    iconBg: "bg-red-50"    },
  { label: "Wastage Percentage", value: "8.4%", trendLabel: "– Neutral trend",  iconSrc: IcPercent, iconBg: "bg-amber-50"  },
];

export const TABLE_HEADERS = ["Date", "Expected", "Delivered", "Eaten", "Wastage", "Wastage %"];
export const CHART_LEGEND  = [["#d1d5db", "Expected"], ["#994700", "Delivered"]] as const;
export const NAV_ICONS     = ["M15 18l-6-6 6-6", "M9 18l6-6-6-6"] as const;