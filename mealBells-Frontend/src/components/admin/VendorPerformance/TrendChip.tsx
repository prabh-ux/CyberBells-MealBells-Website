import arrowUpUrl from "../../../assets/arrowUpUrl.png";

const TrendChip = ({ value, suffix }: { value: number | string | null | undefined; suffix: string }) => {
  if (value === "—" || value === null || value === undefined) {
    return <span className="text-xs text-[#9CA3AF]">New this period</span>;
  }

  const numVal  = typeof value === "number" ? value : parseFloat(String(value));
  const isUp    = typeof value === "string" ? value.startsWith("↑") : numVal >= 0;
  const display = typeof value === "number"
    ? `${numVal >= 0 ? "↑" : "↓"}${Math.abs(numVal)}`
    : value;

  return (
    <div className="flex items-center gap-1.5">
      <span className={`flex items-center gap-1 text-xs font-semibold ${isUp ? "text-[#16a34a]" : "text-[#dc2626]"}`}>
        <img src={arrowUpUrl} alt="" className={`w-3 h-3 ${!isUp ? "rotate-180" : ""}`} />
        {display}
      </span>
      <span className="text-xs text-[var(--text-label)]">{suffix}</span>
    </div>
  );
};

export default TrendChip;