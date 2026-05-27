interface StatItem {
  label: string;
  value: number;
  badge: string;
  badgeColor: string;
  accent: string;
}

interface Props {
  stats: StatItem[];
}

export default function StatsGrid({ stats }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
      {stats.map(({ label, value, badge, badgeColor, accent }) => (
        <div
          key={label}
          className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5 flex items-center gap-4 relative overflow-hidden"
        >
          <div
            className={`absolute left-0 top-0 h-full w-1 ${accent} rounded-l-xl`}
          />
          <div className="pl-2">
            <p className="text-xs text-[#555F71] mb-1">{label}</p>
            <div className="flex items-end gap-2 flex-wrap">
              <span className="text-2xl sm:text-[30px] font-normal text-gray-900">
                {value}
              </span>
              <span className={`text-xs sm:text-sm font-semibold mb-0.5 ${badgeColor}`}>
                {badge}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}