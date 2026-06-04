import type { AnalyticsSummary } from "../../../slices/adminAnalyticsSlice";
import userIconUrl   from "../../../assets/userIconUrl.png";
import vendorIconUrl from "../../../assets/vendorIconUrl.png";
import checkIconUrl  from "../../../assets/checkIconUrl.png";
import mealsIconUrl  from "../../../assets/mealsIconUrl.png";
import growth        from "../../../assets/growth.png";
import minusUrl      from "../../../assets/minusUrl.png";
import arrowUpUrl    from "../../../assets/arrowUpUrl.png";
import arrowDownUrl  from "../../../assets/arrowDownUrl.png";

interface Props {
  summary: AnalyticsSummary | null;
  loading: boolean;
}

function formatGrowth(pct: number | null): { note: string; noteColor: string; noteIcon: string } {
  if (pct === null) return { note: "Calculating…",            noteColor: "#6B7280", noteIcon: minusUrl    };
  if (pct > 0)      return { note: `+${pct}% vs last month`,  noteColor: "#16A34A", noteIcon: growth      };
  if (pct < 0)      return { note: `${pct}% vs last month`,   noteColor: "#DC2626", noteIcon: arrowDownUrl };
  return                   { note: "Stable vs last month",    noteColor: "#EA580C", noteIcon: minusUrl    };
}

function formatAttendance(pct: number | null, loading: boolean): {
  value: string; note: string; noteColor: string; noteIcon: string;
} {
  if (loading || pct === null) return {
    value:     "—",
    note:      "Loading…",
    noteColor: "#6B7280",
    noteIcon:  minusUrl,
  };
  if (pct >= 80) return {
    value:     `${pct}%`,
    note:      "Great turnout today",
    noteColor: "#16A34A",
    noteIcon:  arrowUpUrl,
  };
  if (pct >= 50) return {
    value:     `${pct}%`,
    note:      "Today's rate",
    noteColor: "#EA580C",
    noteIcon:  minusUrl,
  };
  return {
    value:     `${pct}%`,
    note:      "Low attendance today",
    noteColor: "#DC2626",
    noteIcon:  arrowDownUrl,
  };
}

const AnalyticsDashboardStatCards = ({ summary, loading }: Props) => {
  const growth_     = formatGrowth(summary?.userGrowthPct ?? null);
  const attendance_ = formatAttendance(summary?.attendancePct ?? null, loading);

  const STAT_CARDS = [
    {
      label:     "TOTAL USERS",
      icon:      userIconUrl,
      value:     loading || !summary ? "—" : summary.totalUsers.toLocaleString(),
      note:      growth_.note,
      noteColor: growth_.noteColor,
      noteIcon:  growth_.noteIcon,
    },
    {
      label:     "TOTAL VENDORS",
      icon:      vendorIconUrl,
      value:     loading || !summary ? "—" : summary.totalVendors.toLocaleString(),
      note:      "Stable performance",
      noteColor: "#EA580C",
      noteIcon:  minusUrl,
    },
    {
      label:     "MEALS TODAY",
      icon:      mealsIconUrl,
      value:     loading || !summary ? "—" : summary.mealsToday.toLocaleString(),
      note:      "Scheduled for today",
      noteColor: "#16A34A",
      noteIcon:  arrowUpUrl,
    },
    {
      label:     "ATTENDANCE %",
      icon:      checkIconUrl,
      value:     attendance_.value,
      note:      attendance_.note,
      noteColor: attendance_.noteColor,
      noteIcon:  attendance_.noteIcon,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {STAT_CARDS.map((card) => (
        <div
          key={card.label}
          className="bg-white rounded-2xl p-3 sm:p-5 flex flex-col gap-2 sm:gap-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[12px] font-semibold text-[#6B7280] tracking-widest leading-tight">
              {card.label}
            </span>
            <div className="w-[26px] h-[26px] sm:w-[32px] sm:h-[32px] bg-[#FFF3E8] rounded-xl flex items-center justify-center shrink-0">
              <img src={card.icon} alt={card.label} width="26" height="26" />
            </div>
          </div>
          <div>
            <div
              className={`text-[20px] sm:text-[28px] lg:text-[32px] font-(--font-manrope) font-bold text-[#0E0E0E] leading-none transition-opacity ${
                loading ? "opacity-40" : ""
              }`}
            >
              {card.value}
            </div>
            <div className="flex items-center gap-1 mt-1.5">
              <img src={card.noteIcon} alt="trend" width="11" height="11" />
              <span
                className="text-[10px] sm:text-[12px] font-bold leading-tight"
                style={{ color: card.noteColor }}
              >
                {card.note}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AnalyticsDashboardStatCards;