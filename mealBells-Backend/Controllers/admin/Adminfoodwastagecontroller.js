// Controllers/admin/adminFoodWastageController.js
import mongoose         from "mongoose";
import { Attendance }   from "../../Models/attendance.js";
import { Delivery }     from "../../Models/delivery.js";
import { MenuSchedule } from "../../Models/menuSchedule.js";
import { userModel }    from "../../Models/user.js";
import { dishModel }    from "../../Models/dish.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

const dayBounds = (date = new Date()) => {
  const start = new Date(date); start.setHours(0,  0,  0,   0);
  const end   = new Date(date); end.setHours(23, 59, 59, 999);
  return { start, end };
};

const resolveScheduleIds = async ({ date, vendorId, mealType }) => {
  const { start, end } = dayBounds(date);
  const scheduleFilter  = { scheduledDate: { $gte: start, $lte: end } };

  if (mealType && mealType !== "all") {
    const dishes = await dishModel.find({ foodType: mealType }, "_id").lean();
    if (!dishes.length) return [];
    scheduleFilter.dish = { $in: dishes.map(d => d._id) };
  }

  const schedules   = await MenuSchedule.find(scheduleFilter, "_id").lean();
  let   scheduleIds = schedules.map(s => s._id);

  if (vendorId && vendorId !== "all" && scheduleIds.length) {
    const dels = await Delivery.find(
      { scheduleId: { $in: scheduleIds }, vendorId: new mongoose.Types.ObjectId(vendorId) },
      "scheduleId"
    ).lean();
    scheduleIds = dels.map(d => d.scheduleId);
  }

  return scheduleIds;
};

/**
 * Wastage formula:
 *   totalActiveUsers  = all users with type:"user" and active:true
 *   eaten             = Attendance { response:"yes" } for the day
 *   wastage           = totalActiveUsers - eaten
 *
 * This handles three real-world cases:
 *   1. Employee says "no"     → attendance record exists, response:"no"
 *   2. Employee doesn't reply → no attendance record at all
 *   3. Employee says "yes"    → attendance record, response:"yes"
 * Cases 1 & 2 both result in wasted food, so both are counted as wastage.
 */
const getDayMetrics = async ({ date, vendorId, mealType }) => {
  const { start, end } = dayBounds(date);

  // Total employees who could eat (denominator for wastage %)
  const totalUsers = await userModel.countDocuments({ type: "user", active: true });

  // How many confirmed they'll eat today
  const eaten = await Attendance.countDocuments({
    date:     { $gte: start, $lte: end },
    response: "yes",
  });

  // Wastage = everyone who did NOT confirm eating
  const wastage        = Math.max(0, totalUsers - eaten);
  const expected       = totalUsers;
  const wastagePercent = totalUsers > 0
    ? +((wastage / totalUsers) * 100).toFixed(1)
    : 0;

  // Delivered = schedules handed over (vendor/mealType filtered)
  const scheduleIds = await resolveScheduleIds({ date, vendorId, mealType });
  const delivered   = scheduleIds.length
    ? await Delivery.countDocuments({ scheduleId: { $in: scheduleIds }, status: "handed_over" })
    : 0;

  return { expected, delivered, eaten, wastage, wastagePercent };
};

// ── GET /admin/food-wastage/debug ─────────────────────────────────────────────
// Call this to verify your DB has data. Remove once confirmed working.
export const debugWastage = async (req, res) => {
  try {
    const { start, end } = dayBounds(new Date());

    const [totalUsers, todayYes, todayNo, todayAll, totalAttendance] = await Promise.all([
      userModel.countDocuments({ type: "user", active: true }),
      Attendance.countDocuments({ date: { $gte: start, $lte: end }, response: "yes" }),
      Attendance.countDocuments({ date: { $gte: start, $lte: end }, response: "no" }),
      Attendance.countDocuments({ date: { $gte: start, $lte: end } }),
      Attendance.countDocuments({}),
    ]);

    // Sample of what's in attendance
    const sample = await Attendance.find({}).sort({ createdAt: -1 }).limit(3).lean();

    return res.status(200).json({
      today: { start, end },
      totalActiveUsers: totalUsers,
      todayAttendance: { yes: todayYes, no: todayNo, total: todayAll },
      totalAttendanceRecordsEver: totalAttendance,
      sampleRecords: sample,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ── GET /admin/food-wastage/vendors ──────────────────────────────────────────
export const getWastageVendors = async (req, res) => {
  try {
    const vendors = await userModel
      .find({ type: "vendor" }, "_id name logo foodType status")
      .lean();
    return res.status(200).json({ success: true, vendors });
  } catch (err) {
    return res.status(500).json({ success: false, msg: err.message });
  }
};

// ── GET /admin/food-wastage/summary ──────────────────────────────────────────
export const getFoodWastageSummary = async (req, res) => {
  try {
    const vendorId = req.query.vendor   || "all";
    const mealType = req.query.mealType || "all";
    const days     = Math.min(parseInt(req.query.days) || 30, 90);
    const now      = new Date();
    const results  = [];

    for (let i = days - 1; i >= 0; i--) {
      const date    = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const m       = await getDayMetrics({ date, vendorId, mealType });
      results.push({ date: dateStr, ...m });
    }

    const totalExpected  = results.reduce((s, r) => s + r.expected,  0);
    const totalDelivered = results.reduce((s, r) => s + r.delivered, 0);
    const totalEaten     = results.reduce((s, r) => s + r.eaten,     0);
    const totalWastage   = results.reduce((s, r) => s + r.wastage,   0);

    // avgWastagePercent: average of daily wastage percentages (skip zero-user days)
    const activeDays        = results.filter(r => r.expected > 0);
    const avgWastagePercent = activeDays.length > 0
      ? +(activeDays.reduce((s, r) => s + r.wastagePercent, 0) / activeDays.length).toFixed(1)
      : 0;

    const efficiency = totalExpected > 0
      ? +((totalDelivered / totalExpected) * 100).toFixed(1)
      : 0;

    const half   = Math.floor(results.length / 2);
    const fH     = results.slice(0, half);
    const sH     = results.slice(half);
    const fExp   = fH.reduce((s, r) => s + r.expected, 0);
    const sExp   = sH.reduce((s, r) => s + r.expected, 0);
    const fW     = fH.reduce((s, r) => s + r.wastage,  0);
    const sW     = sH.reduce((s, r) => s + r.wastage,  0);
    const fPct   = fExp > 0 ? (fW / fExp) * 100 : 0;
    const sPct   = sExp > 0 ? (sW / sExp) * 100 : 0;
    const wasteTrend = fPct > 0 ? +((sPct - fPct) / fPct * 100).toFixed(1) : null;

    return res.status(200).json({
      success: true,
      summary: { totalExpected, totalDelivered, totalEaten, totalWastage,
                 avgWastagePercent, efficiency, wasteTrend },
      daily: results,
    });
  } catch (err) {
    return res.status(500).json({ success: false, msg: err.message });
  }
};

// ── GET /admin/food-wastage/chart ─────────────────────────────────────────────
export const getFoodWastageChart = async (req, res) => {
  try {
    const vendorId = req.query.vendor   || "all";
    const mealType = req.query.mealType || "all";
    const days     = Math.min(parseInt(req.query.days) || 7, 30);
    const DAYS     = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
    const now      = new Date();
    const data     = [];

    for (let i = days - 1; i >= 0; i--) {
      const date    = new Date(now);
      date.setDate(date.getDate() - i);
      const { expected, delivered, eaten, wastage } =
        await getDayMetrics({ date, vendorId, mealType });
      data.push({
        day: DAYS[date.getDay()], fullDate: date.toISOString().split("T")[0],
        Expected: expected, Delivered: delivered, Eaten: eaten, Wastage: wastage,
      });
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, msg: err.message });
  }
};

// ── GET /admin/food-wastage/table ─────────────────────────────────────────────
export const getFoodWastageTable = async (req, res) => {
  try {
    const vendorId = req.query.vendor   || "all";
    const mealType = req.query.mealType || "all";
    const page     = Math.max(1, parseInt(req.query.page)  || 1);
    const limit    = Math.min(   parseInt(req.query.limit) || 5, 31);
    const now      = new Date();
    const allRows  = [];

    for (let i = 0; i < 31; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const { expected, delivered, eaten, wastage, wastagePercent } =
        await getDayMetrics({ date, vendorId, mealType });
      allRows.push({
        date:  date.toLocaleDateString("en-US", { month: "short", day: "2-digit" }),
        fullDate: date.toISOString().split("T")[0],
        expected, delivered, eaten,
        wastageCount: wastage, wastagePercent,
      });
    }

    return res.status(200).json({
      success: true,
      data:    allRows.slice((page - 1) * limit, page * limit),
      pagination: { total: allRows.length, page, limit,
                    totalPages: Math.ceil(allRows.length / limit) },
    });
  } catch (err) {
    return res.status(500).json({ success: false, msg: err.message });
  }
};