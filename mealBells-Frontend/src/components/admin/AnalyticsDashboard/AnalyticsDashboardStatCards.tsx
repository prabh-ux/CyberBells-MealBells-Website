import React from 'react'
import userIconUrl   from "../../../assets/userIconUrl.png";
import vendorIconUrl from "../../../assets/vendorIconUrl.png";
import checkIconUrl  from "../../../assets/checkIconUrl.png";
import mealsIconUrl  from "../../../assets/mealsIconUrl.png";
import growth        from "../../../assets/growth.png";
import minusUrl      from "../../../assets/minusUrl.png";
import arrowUpUrl    from "../../../assets/arrowUpUrl.png";
import arrowDownUrl  from "../../../assets/arrowDownUrl.png";

const STAT_CARDS = [
  { label: "TOTAL USERS",   icon: userIconUrl,   value: "1,284", note: "+12.5% vs last month", noteColor: "#16A34A", noteIcon: growth      },
  { label: "TOTAL VENDORS", icon: vendorIconUrl, value: "42",    note: "Stable performance",   noteColor: "#EA580C", noteIcon: minusUrl     },
  { label: "MEALS TODAY",   icon: mealsIconUrl,  value: "856",   note: "94% delivery rate",    noteColor: "#16A34A", noteIcon: arrowUpUrl   },
  { label: "ATTENDANCE %",  icon: checkIconUrl,  value: "92.4%", note: "-2.1% from average",  noteColor: "#DC2626", noteIcon: arrowDownUrl },
];

const AnalyticsDashboardStatCards = () => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {STAT_CARDS.map((card) => (
        <div key={card.label} className="bg-white rounded-2xl p-3 sm:p-5 flex flex-col gap-2 sm:gap-4">
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[12px] font-semibold text-[#6B7280] tracking-widest leading-tight">
              {card.label}
            </span>
            <div className="w-[26px] h-[26px] sm:w-[32px] sm:h-[32px] bg-[#FFF3E8] rounded-xl flex items-center justify-center shrink-0">
              <img src={card.icon} alt={card.label} width="26" height="26" />
            </div>
          </div>
          <div>
            <div className="text-[20px] sm:text-[28px] lg:text-[32px] font-(--font-manrope) font-bold text-[#0E0E0E] leading-none">
              {card.value}
            </div>
            <div className="flex items-center gap-1 mt-1.5">
              <img src={card.noteIcon} alt="trend" width="11" height="11" />
              <span className="text-[10px] sm:text-[12px] font-bold leading-tight" style={{ color: card.noteColor }}>
                {card.note}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default AnalyticsDashboardStatCards