import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from "recharts";
import type { AttendanceDataPoint } from "../../../slices/adminAnalyticsSlice";

const AttendanceTooltipContent = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none">
      <p className="font-semibold mb-1">{label}</p>
      {payload
        .filter((p: any) => p.dataKey !== "gap")
        .map((p: any) => (
          <p key={p.dataKey}>
            {p.dataKey === "present" ? "Present" : "Absent"}:{" "}
            <span className="text-[#FF7A00] font-bold">{p.value}%</span>
          </p>
        ))}
    </div>
  );
};

const RoundedStackedBar = (props: any) => {
  const { x, y, width, height, fill, isTop } = props;
  if (!height || height <= 0) return null;
  const r = isTop ? Math.min(8, height) : 0;
  return (
    <path
      d={`M${x + r},${y} h${width - 2 * r} a${r},${r} 0 0 1 ${r},${r} v${height - r} h-${width} v-${height - r} a${r},${r} 0 0 1 ${r},-${r}z`}
      fill={fill}
    />
  );
};

const AbsentBar  = (props: any) => <RoundedStackedBar {...props} fill="#E5E7EB" isTop={true}  />;
const MiddleBar  = (props: any) => <rect x={props.x} y={props.y - 4} width={props.width} height={4} fill="#ffffff" />;
const PresentBar = (props: any) => <RoundedStackedBar {...props} fill="#994700" isTop={false} />;

interface Props {
  attendanceData: AttendanceDataPoint[];
  loading?:       boolean;
}

const AnalyticsDashboardAttendanceChart = ({ attendanceData, loading }: Props) => {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col min-[480px]:flex-row min-[480px]:items-center justify-between mb-4 sm:mb-6 gap-2 sm:gap-3">
        <h2 className="text-[16px] sm:text-[22px] lg:text-[24px] font-semibold text-(--text-primary)">
          Daily Attendance Trend
        </h2>
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#994700] inline-block" />
            <span className="text-[12px] sm:text-[16px] text-[#6B7280]">Present</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E5E7EB] inline-block" />
            <span className="text-[12px] sm:text-[16px] text-[#80746b]">Absent</span>
          </div>
        </div>
      </div>

      {/* ── Chart / states ─────────────────────────────────────────────────── */}
      {loading ? (
        /* Loading spinner */
        <div
          style={{ height: 180 }}
          className="sm:!h-[220px] flex items-center justify-center"
        >
          <div className="w-8 h-8 border-2 border-[#994700] border-t-transparent rounded-full animate-spin" />
        </div>

      ) : attendanceData.length === 0 ? (
        /* Empty state */
        <div
          style={{ height: 180 }}
          className="sm:!h-[220px] flex flex-col items-center justify-center gap-2"
        >
          <span className="text-[32px]">📊</span>
          <p className="text-[13px] text-[#9CA3AF] font-medium">No attendance data yet</p>
        </div>

      ) : (
        /* Chart */
        <div style={{ height: 180 }} className="sm:!h-[220px] focus:outline-none">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={attendanceData} barCategoryGap="20%" stackOffset="none">
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9CA3AF", fontSize: 10, fontWeight: 500 }}
              />
              <Tooltip
                content={<AttendanceTooltipContent />}
                cursor={{ fill: "rgba(255,122,0,0.05)" }}
              />
              <Bar dataKey="present" stackId="a" fill="#994700" shape={<PresentBar />} />
              <Bar dataKey="gap"     stackId="a" fill="#ffffff"  shape={<MiddleBar  />} />
              <Bar dataKey="absent"  stackId="a" fill="#E5E7EB"  shape={<AbsentBar  />} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

    </div>
  );
};

export default AnalyticsDashboardAttendanceChart;