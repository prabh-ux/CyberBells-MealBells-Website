import React from 'react'
import arrowUpUrl   from "../../../assets/arrowUpUrl.png";

const TrendChip = ({ value, suffix }: { value: string; suffix: string }) => (
  <div className="flex items-center gap-1.5">
    <span className="flex items-center gap-1 text-xs font-semibold text-[#16a34a]">
      <img src={arrowUpUrl} alt="" className="w-3 h-3" />{value}
    </span>
    <span className="text-xs text-[var(--text-label)]">{suffix}</span>
  </div>
);

export default TrendChip