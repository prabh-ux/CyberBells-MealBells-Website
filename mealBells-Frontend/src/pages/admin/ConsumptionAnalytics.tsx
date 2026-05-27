import { useState } from "react";
import {
  Utensils, Flame, Users2, CalendarDays, Download,
} from "lucide-react";
import DropDown from "../../components/shared/DropDown";

export default function ConsumptionAnalytics() {
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);
  const [hoveredBar,   setHoveredBar]   = useState<number | null>(null);
  const [timeFrame,    setTimeFrame]    = useState("This Month");

  const stats = [
    {
      title: "Total Consumption",
      value: "4,892 Meals",
      badge: "+12.4%↑",
      badgeColor: "text-[#c25e1a]",
      icon: <Utensils className="w-5 h-5 text-[#934411]" />,
      bg: "bg-[#fdf2ec]",
    },
    {
      title: "Highest Demand Dish",
      value: "Chicken Teriyaki",
      badge: "Popularity: 98%",
      badgeColor: "text-slate-500",
      icon: <Flame className="w-5 h-5 text-[#3b82f6]" />,
      bg: "bg-[#eff6ff]",
    },
    {
      title: "Most Active Users",
      value: "IT Department",
      badge: "842 Users",
      badgeColor: "text-[#0284c7]",
      icon: <Users2 className="w-5 h-5 text-[#0284c7]" />,
      bg: "bg-[#f0f9ff]",
    },
    {
      title: "Least Active Days",
      value: "Fridays",
      badge: "-8%↓",
      badgeColor: "text-[#b91c1c]",
      icon: <CalendarDays className="w-5 h-5 text-[#b91c1c]" />,
      bg: "bg-[#fef2f2]",
    },
  ];

  const feedData = [
    { time: "12:45 PM", employee: "Arjun Sharma",    department: "Engineering",     item: "Chicken Teriyaki Bento",  status: "SERVED"  },
    { time: "12:42 PM", employee: "Elena Rodriguez", department: "Product Design",  item: "Classic Veg Thali",       status: "SERVED"  },
    { time: "12:38 PM", employee: "Marcus Chen",     department: "Human Resources", item: "Mediterranean Salad",     status: "IN PREP" },
  ];

  const heatmapRows = [
    { name: "IT Dept", data: ["bg-[#ff7a00]", "bg-[#ff7a00]", "bg-[#ff9d42]", "bg-[#ff7a00]", "bg-[#fed7aa]", "bg-[#fff2e6]", "bg-[#fff7ed]"] },
    { name: "Sales",   data: ["bg-[#fed7aa]", "bg-[#fed7aa]", "bg-[#ff9d42]", "bg-[#ff7a00]", "bg-[#ffb066]", "bg-[#fff7ed]", "bg-[#fff7ed]"] },
    { name: "Admin",   data: ["bg-[#fff2e6]", "bg-[#fff2e6]", "bg-[#fed7aa]", "bg-[#fff2e6]", "bg-[#fff2e6]", "bg-[#fff7ed]", "bg-[#fff2e6]"] },
    { name: "Design",  data: ["bg-[#ffb066]", "bg-[#ff9d42]", "bg-[#ffb066]", "bg-[#ffb066]", "bg-[#fed7aa]", "bg-[#fff7ed]", "bg-[#fff7ed]"] },
  ];

  const daysOfWeek  = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const barHeights  = [120, 140, 135, 150, 60, 20, 15];

  const getDonutCenterText = () => {
    if (hoveredSlice === "nonveg") return { count: "3,180", label: "Non-Veg" };
    if (hoveredSlice === "veg")    return { count: "1,223", label: "Vegetarian" };
    if (hoveredSlice === "vegan")  return { count: "489",   label: "Vegan" };
    return { count: "4,892", label: "Total" };
  };
  const centerText = getDonutCenterText();

  return (
    <div className="min-h-screen bg-[#fcfcfc] p-4 md:p-6 cursor-pointer select-none overflow-y-auto">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Consumption Analytics</h1>
            <p className="text-sm text-gray-400 mt-1">
              Detailed breakdown of food utilization and employee demand across MealMom hubs.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Time Frame:</span>
              <DropDown
                value={timeFrame}
                options={["This Month", "This Week", "Today"]}
                onChange={setTimeFrame}
              />
            </div>
            <button className="bg-[#934411] hover:bg-[#7a380e] text-white px-4 py-2 rounded-xl text-xs font-medium shadow flex items-center gap-2 cursor-pointer">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((item, index) => (
            <div key={index} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-transform hover:scale-[1.01]">
              <div className="flex items-center justify-between mb-5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.bg}`}>
                  {item.icon}
                </div>
                <span className={`text-[11px] font-bold tracking-tight ${item.badgeColor}`}>{item.badge}</span>
              </div>
              <p className="text-[12px] font-semibold text-[#8a5d45] mb-2">{item.title}</p>
              <h3 className="text-[20px] font-bold text-gray-900 leading-none tracking-tight">{item.value}</h3>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">

          {/* Line Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-800 text-sm">Meals Consumed Over Time</h2>
              <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#934411]" /> Veg
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full border-2 border-dashed border-[#4a3e3d]" /> Non-Veg
                </div>
              </div>
            </div>
            <div className="relative h-64 w-full overflow-hidden mt-8">
              <svg viewBox="0 0 700 220" className="w-full h-full">
                <path d="M 20 160 Q 150 110, 250 120 T 480 150 T 620 70 T 680 90"
                  fill="none" stroke="#4a3e3d" strokeWidth="2.5" strokeDasharray="5 5" strokeLinecap="round" />
                <path d="M 20 180 Q 150 130, 250 140 T 480 170 T 620 90 T 680 110"
                  fill="none" stroke="#934411" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 text-[11px] font-medium text-gray-400">
                {daysOfWeek.map(day => <span key={day}>{day}</span>)}
              </div>
            </div>
          </div>

          {/* Donut Chart */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
            <h2 className="font-bold text-gray-800 text-sm mb-6">Veg vs Non-Veg Consumption</h2>
            <div className="flex justify-center items-center flex-1">
              <div className="relative w-44 h-44 flex items-center justify-center">
                <svg viewBox="0 0 42 42" className="w-full h-full transform -rotate-90 select-none outline-none border-none">
                  <circle cx="21" cy="21" r="15.915" fill="none" stroke="#e2e8f0" strokeWidth="5.8"
                    strokeDasharray="10 90" strokeDashoffset="0"
                    className="cursor-pointer transition-all duration-200 hover:stroke-gray-300"
                    style={{ outline: "none", WebkitTapHighlightColor: "transparent" }}
                    onMouseEnter={() => setHoveredSlice("vegan")} onMouseLeave={() => setHoveredSlice(null)}
                  />
                  <circle cx="21" cy="21" r="15.915" fill="none" stroke="#934411" strokeWidth="5.8"
                    strokeDasharray="25 75" strokeDashoffset="-10"
                    className="cursor-pointer transition-all duration-200 hover:opacity-90"
                    style={{ outline: "none", WebkitTapHighlightColor: "transparent" }}
                    onMouseEnter={() => setHoveredSlice("veg")} onMouseLeave={() => setHoveredSlice(null)}
                  />
                  <circle cx="21" cy="21" r="15.915" fill="none" stroke="#ff7a00" strokeWidth="5.8"
                    strokeDasharray="65 35" strokeDashoffset="-35"
                    className="cursor-pointer transition-all duration-200 hover:opacity-90"
                    style={{ outline: "none", WebkitTapHighlightColor: "transparent" }}
                    onMouseEnter={() => setHoveredSlice("nonveg")} onMouseLeave={() => setHoveredSlice(null)}
                  />
                </svg>
                <div className="absolute w-[104px] h-[104px] bg-white rounded-full flex flex-col items-center justify-center pointer-events-none">
                  <h3 className="text-2xl font-extrabold text-gray-800 transition-all duration-150">{centerText.count}</h3>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider transition-all duration-150">{centerText.label}</p>
                </div>
              </div>
            </div>
            <div className="mt-6 space-y-3 text-xs font-medium text-gray-500">
              {[
                { color: "bg-[#ff7a00]", label: "Non-Veg",    pct: "65%" },
                { color: "bg-[#934411]", label: "Vegetarian", pct: "25%" },
                { color: "bg-gray-300",  label: "Vegan",      pct: "10%" },
              ].map(({ color, label, pct }) => (
                <div key={label} className="flex items-center justify-between p-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${color}`} />{label}
                  </div>
                  <span className="font-bold text-gray-700">{pct}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">

          {/* Heat Map */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden">
            <h2 className="font-bold text-gray-800 text-sm mb-6">Most Active Users by Day</h2>
            <div className="w-full overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <div className="min-w-[340px]">
                <div className="grid grid-cols-8 gap-2 mb-3 text-center">
                  <div />
                  {daysOfWeek.map(day => (
                    <span key={day} className="text-[11px] font-medium text-gray-400">{day}</span>
                  ))}
                </div>
                <div className="space-y-3">
                  {heatmapRows.map(row => (
                    <div key={row.name} className="grid grid-cols-8 gap-2 items-center">
                      <span className="text-xs font-medium text-gray-500 text-left pr-2 truncate">{row.name}</span>
                      {row.data.map((bgClass, idx) => (
                        <div key={idx} className={`aspect-square rounded-md ${bgClass} transition-all duration-200 hover:scale-105`} />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end items-center gap-2 mt-6 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              <span>Less</span>
              {["bg-[#fff7ed]", "bg-[#fff2e6]", "bg-[#fed7aa]", "bg-[#ffb066]", "bg-[#ff7a00]"].map(c => (
                <div key={c} className={`w-3 h-3 rounded ${c}`} />
              ))}
              <span>More</span>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
            <h2 className="font-bold text-gray-800 text-sm mb-5">Peak Consumption Days</h2>
            <div className="flex items-end justify-between h-48 gap-3 px-2 relative">
              {barHeights.map((height, index) => (
                <div key={index}
                  className="flex-1 flex flex-col items-center justify-end h-full relative"
                  onMouseEnter={() => setHoveredBar(index)}
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  <div
                    className={`absolute bg-white border border-orange-100 rounded-xl p-2 shadow-md flex flex-col text-left min-w-[75px] transition-all duration-200 z-10 ${
                      hoveredBar === index ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-2 scale-95 pointer-events-none"
                    }`}
                    style={{ bottom: `${height + 8}px` }}
                  >
                    <span className="text-[11px] font-bold text-gray-800">{daysOfWeek[index]}</span>
                    <span className="text-[11px] font-bold text-red-950 whitespace-nowrap mt-0.5">{height} meals</span>
                  </div>
                  <div className="w-full bg-[#6e3d10] rounded-t-lg transition-all duration-300 hover:opacity-95"
                    style={{ height: `${height}px` }} />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-4 text-[11px] font-medium text-gray-400 px-1">
              {daysOfWeek.map(day => <span key={day} className="w-full text-center flex-1">{day}</span>)}
            </div>
          </div>
        </div>

        {/* Live Feed Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <div className="p-5 border-b border-gray-50">
            <h2 className="font-bold text-gray-800 text-sm">Live Consumption Feed</h2>
          </div>
          <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-black-400 font-bold text-[14px] uppercase tracking-wider">
                <tr>
                  {["Time", "Employee", "Department", "Item Ordered", "Status"].map(h => (
                    <th key={h} className="text-left px-6 py-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs">
                {feedData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-gray-400 font-medium">{item.time}</td>
                    <td className="px-6 py-4 font-bold text-gray-800">{item.employee}</td>
                    <td className="px-6 py-4 text-gray-500 font-medium">{item.department}</td>
                    <td className="px-6 py-4 text-gray-500 font-medium">{item.item}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                        item.status === "SERVED" ? "bg-blue-50 text-blue-500" : "bg-orange-50 text-orange-600"
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}