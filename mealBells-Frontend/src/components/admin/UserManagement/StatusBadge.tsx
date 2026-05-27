import React from 'react'

const StatusBadge = ({ s }: { s: string }) => {
  return (
  <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs font-semibold whitespace-nowrap ${
    s === "Active" ? "bg-[#F0FDF4] border-[#CDEFD8] text-[#15803D]" : "bg-[#F3F4F6] border-[#E5E7EB] text-[#4B5563]"
  }`}>
    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s === "Active" ? "bg-[#22C55E]" : "bg-[#9CA3AF]"}`} />
    {s}
  </span>
);
}

export default StatusBadge


