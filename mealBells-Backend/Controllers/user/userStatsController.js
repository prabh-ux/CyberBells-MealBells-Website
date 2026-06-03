import mongoose from "mongoose";
import { MenuSchedule } from "../../Models/menuSchedule.js";
import { Attendance }   from "../../Models/attendance.js";

// ── GET /user/consumption-stats ───────────────────────────────────────────────
export const getConsumptionStats = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const period = req.query.period ?? "week";

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const now = new Date();
    let start, end;

    if (period === "week") {
      const day  = now.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      start = new Date(now);
      start.setDate(now.getDate() + diff);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else if (period === "month") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else {
      start = new Date(now.getFullYear(), 0, 1);
      end   = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    }

    const allAttendances = await Attendance.find({
      userId: userObjectId,
      date:   { $gte: start, $lte: end },
    }).lean();

    const attended = allAttendances.filter(a => a.response === "yes");
    const skipped  = allAttendances.filter(a => a.response === "no");

    let chartData = [];

    if (period === "week") {
      const days   = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const counts = Array(7).fill(0);
      attended.forEach(a => {
        const d   = new Date(a.date);
        const idx = d.getDay() === 0 ? 6 : d.getDay() - 1;
        counts[idx]++;
      });
      chartData = days.map((day, i) => ({ day, meals: counts[i] }));

    } else if (period === "month") {
      const counts = [0, 0, 0, 0];
      attended.forEach(a => {
        const weekIdx = Math.min(Math.floor((new Date(a.date).getDate() - 1) / 7), 3);
        counts[weekIdx]++;
      });
      chartData = ["W1", "W2", "W3", "W4"].map((day, i) => ({ day, meals: counts[i] }));

    } else {
      const counts = Array(12).fill(0);
      attended.forEach(a => { counts[new Date(a.date).getMonth()]++; });
      chartData = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
        .map((day, i) => ({ day, meals: counts[i] }));
    }

    const scheduleIds = attended.map(a => a.scheduleId).filter(Boolean);
    const schedules   = await MenuSchedule.find({ _id: { $in: scheduleIds } })
      .populate({ path: "dish", select: "name" })
      .lean();

    const freq = {};
    schedules.forEach(s => {
      const name = s.dish?.name;
      if (name) freq[name] = (freq[name] ?? 0) + 1;
    });
    const mostEaten = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

    const allYes = await Attendance.find({ userId: userObjectId, response: "yes" })
      .sort({ date: -1 })
      .lean();

    let streak = 0;
    let cursor = new Date();
    cursor.setHours(0, 0, 0, 0);

    for (const a of allYes) {
      const d = new Date(a.date);
      d.setHours(0, 0, 0, 0);
      const diff = Math.round((cursor.getTime() - d.getTime()) / 86400000);
      if (diff === 0 || diff === 1) { streak++; cursor = d; }
      else break;
    }

    return res.status(200).json({
      success: true,
      data: {
        period,
        daysAttended:  attended.length,
        daysSkipped:   skipped.length,
        totalMeals:    attended.length,
        mostEaten,
        currentStreak: streak,
        chartData,
      },
    });
  } catch (err) {
    console.error("getConsumptionStats:", err);
    return res.status(500).json({ success: false, msg: "Internal server error" });
  }
};
