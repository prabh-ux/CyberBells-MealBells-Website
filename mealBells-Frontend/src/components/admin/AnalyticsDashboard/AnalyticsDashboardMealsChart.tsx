import { BarChart, Bar, Cell, XAxis, ResponsiveContainer, Tooltip } from "recharts";
import DropDown from "../../shared/DropDown"; // adjust path to match your project structure

function barColor(count: number, max: number) {
  const pct = (count / max) * 100;
  if (pct >= 95) return "#994700";
  if (pct >= 80) return "#FDBA74";
  if (pct >= 72) return "#FDBA74";
  if (pct >= 60) return "#FED7AA";
  if (pct >= 58) return "#FFF7ED";
  if (pct >= 54) return "#FFF7ED";
  return "#FFEDD5";
}

const RoundedBar = (props: any) => {
  const { x, y, width, height, fill } = props;
  if (!height || height <= 0) return null;
  const radius = Math.min(8, height);
  return (
    <path
      d={`M${x + radius},${y} h${width - 2 * radius} a${radius},${radius} 0 0 1 ${radius},${radius} v${height - radius} h-${width} v-${height - radius} a${radius},${radius} 0 0 1 ${radius},-${radius}z`}
      fill={fill}
    />
  );
};

const BarTooltipContent = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none">
      <p className="font-semibold mb-0.5">{label}</p>
      <p>Delivered: <span className="text-[#FF7A00] font-bold">{payload[0]?.value}</span></p>
    </div>
  );
};

const RANGE_OPTIONS = ["Last 7 Days", "Last 14 Days", "Last 30 Days"];

interface Props {
  mealsData: { day: string; count: number }[];
  mealsMax:  number;
  mealRange: string;
  loading:   boolean;
  onRangeChange: (range: string) => void;
}

const AnalyticsDashboardMealsChart = ({ mealsData, mealsMax, mealRange, loading, onRangeChange }: Props) => {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6">
      <div className="flex flex-col min-[480px]:flex-row min-[480px]:items-center justify-between mb-4 sm:mb-6 gap-2 sm:gap-3">
        <h2 className="text-[16px] sm:text-[22px] lg:text-[24px] font-semibold text-(--text-primary) leading-snug">
          Meals Delivered This Week
        </h2>

        {/* Custom DropDown replaces native <select> */}
        <div className="shrink-0 w-[160px]">
          <DropDown
            value={mealRange}
            options={RANGE_OPTIONS}
            onChange={onRangeChange}
          />
        </div>
      </div>

      <div style={{ height: 180 }} className="sm:!h-[220px]">
        {loading ? (
          <div className="flex items-end justify-around w-full h-full pb-5 gap-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-lg bg-[#F3F4F6] animate-pulse"
                style={{ height: `${40 + Math.random() * 50}%` }}
              />
            ))}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mealsData} barCategoryGap="20%" barGap={4}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#9CA3AF", fontSize: 10, fontWeight: 500 }} />
              <Tooltip content={<BarTooltipContent />} cursor={{ fill: "rgba(255,122,0,0.05)" }} />
              <Bar dataKey="count" shape={<RoundedBar />} radius={[8, 8, 0, 0]}>
                {mealsData.map((entry, index) => (
                  <Cell key={index} fill={barColor(entry.count, mealsMax)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboardMealsChart;