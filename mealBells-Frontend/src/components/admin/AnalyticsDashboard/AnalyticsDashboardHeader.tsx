import React from 'react'
import uploadIconWhite from "../../../assets/uploadIconWhite.png";

interface Props {
  onExport: () => void;
}

const AnalyticsDashboardHeader = ({ onExport }: Props) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
      <div>
        <h1 className="text-[22px] sm:text-[28px] lg:text-[32px] font-bold font-(--font-manrope) text-(--text-primary) tracking-tight leading-tight">
          Analytics Dashboard
        </h1>
        <p className="text-[#6B7280] text-[13px] sm:text-[16px] mt-1">
          Real-time overview of MealBells operations and user activity.
        </p>
      </div>
      <button
        onClick={onExport}
        className="flex items-center gap-2 bg-(--brand) hover:bg-[#A34800] transition-colors text-white text-[13px] sm:text-[15px] font-semibold px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl shrink-0 self-start sm:self-auto"
      >
        <img src={uploadIconWhite} alt="export" width="13" height="13" />
        Export Data
      </button>
    </div>
  )
}

export default AnalyticsDashboardHeader