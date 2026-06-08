// Controllers/admin/adminAnalyticsController.js
import mongoose from "mongoose";
import { userModel }         from "../../Models/user.js";
import { Attendance }        from "../../Models/attendance.js";
import { ActivityLog }       from "../../Models/activityLog.js";
import { dishModel as Dish } from "../../Models/dish.js";
import { MenuSchedule }      from "../../Models/menuSchedule.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

const dayBounds = (date = new Date()) => {
  const start = new Date(date); start.setHours(0, 0, 0, 0);
  const end   = new Date(date); end.setHours(23, 59, 59, 999);
  return { start, end };
};

const utcDayRange = (date = new Date()) => {
  const start = new Date(date); start.setUTCHours(0, 0, 0, 0);
  const end   = new Date(date); end.setUTCHours(23, 59, 59, 999);
  return { start, end };
};

const getEmployeeIds = async (department = "all") => {
  const q = { type: "user", active: true };
  if (department !== "all") q.department = { $regex: new RegExp(`^${department}$`, "i") };
  const users = await userModel.find(q, "_id").lean();
  return users.map(u => u._id);
};

// vendor lives on Dish, not MenuSchedule
const getScheduleIdsByVendor = async (vendorId = "all") => {
  if (!vendorId || vendorId === "all") return null;
  const dishes    = await Dish.find({ vendor: vendorId }, "_id").lean();
  if (!dishes.length) return [];
  const schedules = await MenuSchedule.find({ dish: { $in: dishes.map(d => d._id) } }, "_id").lean();
  return schedules.map(s => s._id);
};

const getScheduleIds = async ({ vendorId, mealType } = {}) => {
  let ids = await getScheduleIdsByVendor(vendorId);
  if (mealType && mealType !== "all") {
    const dishes    = await Dish.find({ dishType: mealType }, "_id").lean();
    const schedules = await MenuSchedule.find({ dish: { $in: dishes.map(d => d._id) } }, "_id").lean();
    const set       = schedules.map(s => String(s._id));
    ids = ids !== null ? ids.filter(id => set.includes(String(id))) : schedules.map(s => s._id);
  }
  return ids;
};

// shared $lookup pipeline: attendance → menuschedule → dish
const DISH_LOOKUP = [
  { $lookup: { from: "menuschedules", localField: "scheduleId", foreignField: "_id", as: "schedule" } },
  { $unwind: { path: "$schedule", preserveNullAndEmptyArrays: true } },
  { $lookup: { from: "dishes", localField: "schedule.dish", foreignField: "_id", as: "dish" } },
  { $unwind: { path: "$dish", preserveNullAndEmptyArrays: true } },
];

// ── GET /admin/analytics/summary ─────────────────────────────────────────────

export const getAnalyticsSummary = async (req, res) => {
  try {
    const department = req.query.department || "all";
    const vendorId   = req.query.vendorId   || "all";
    const mealType   = req.query.mealType   || "all";

    const now            = new Date();
    const { start: todayStart, end: todayEnd } = dayBounds(now);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const userQ   = { type: "user" };
    const activeQ = { type: "user", active: true };
    if (department !== "all") {
      const reg = { $regex: new RegExp(`^${department}$`, "i") };
      userQ.department   = reg;
      activeQ.department = reg;
    }

    const totalVendors = vendorId !== "all"
      ? 1
      : await userModel.countDocuments({ type: "vendor", status: true });

    const [totalUsers, usersThisMonth, usersLastMonth, totalActiveUsers] = await Promise.all([
      userModel.countDocuments(userQ),
      userModel.countDocuments({ ...userQ, createdAt: { $gte: thisMonthStart } }),
      userModel.countDocuments({ ...userQ, createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } }),
      userModel.countDocuments(activeQ),
    ]);

    const employeeIds = await getEmployeeIds(department);
    const todayMatch  = { date: { $gte: todayStart, $lte: todayEnd }, response: "yes", userId: { $in: employeeIds } };
    const scheduleIds = await getScheduleIds({ vendorId, mealType });
    if (scheduleIds !== null) todayMatch.scheduleId = scheduleIds.length ? { $in: scheduleIds } : { $in: [] };

    const mealsToday    = await Attendance.countDocuments(todayMatch);
    const userGrowthPct = usersLastMonth > 0 ? +((( usersThisMonth - usersLastMonth) / usersLastMonth) * 100).toFixed(1) : null;
    const attendancePct = totalActiveUsers > 0 ? +((mealsToday / totalActiveUsers) * 100).toFixed(1) : 0;

    return res.status(200).json({ success: true, summary: { totalUsers, totalVendors, mealsToday, userGrowthPct, attendancePct } });
  } catch (err) {
    return res.status(500).json({ success: false, msg: "Internal error: " + err.message });
  }
};

// ── GET /admin/analytics/meals ────────────────────────────────────────────────

export const getMealsChart = async (req, res) => {
  try {
    const days       = Math.min(parseInt(req.query.days) || 7, 30);
    const department = req.query.department || "all";
    const vendorId   = req.query.vendorId   || "all";
    const mealType   = req.query.mealType   || "all";
    const DAY_MAP    = ["SUN","MON","TUE","WED","THU","FRI","SAT"];

    const now        = new Date();
    const rangeStart = new Date(now); rangeStart.setUTCDate(rangeStart.getUTCDate() - (days - 1)); rangeStart.setUTCHours(0, 0, 0, 0);
    const rangeEnd   = new Date(now); rangeEnd.setUTCHours(23, 59, 59, 999);

    const employeeIds = await getEmployeeIds(department);
    const match = { date: { $gte: rangeStart, $lte: rangeEnd }, response: "yes", userId: { $in: employeeIds } };
    const scheduleIds = await getScheduleIds({ vendorId, mealType });
    if (scheduleIds !== null) match.scheduleId = scheduleIds.length ? { $in: scheduleIds } : { $in: [] };

    const raw         = await Attendance.aggregate([{ $match: match }, { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }, count: { $sum: 1 } } }]);
    const countByDate = Object.fromEntries(raw.map(r => [r._id, r.count]));
    const data        = Array.from({ length: days }, (_, i) => {
      const d = new Date(now); d.setUTCDate(d.getUTCDate() - (days - 1 - i));
      const fullDate = d.toISOString().split("T")[0];
      return { day: DAY_MAP[d.getUTCDay()], count: countByDate[fullDate] ?? 0, fullDate };
    });

    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, msg: "Internal error: " + err.message });
  }
};

// ── GET /admin/analytics/attendance ──────────────────────────────────────────

export const getAttendanceChart = async (req, res) => {
  try {
    const days       = Math.min(parseInt(req.query.days) || 7, 30);
    const department = req.query.department || "all";
    const vendorId   = req.query.vendorId   || "all";
    const mealType   = req.query.mealType   || "all";
    const DAY_MAP    = ["SUN","MON","TUE","WED","THU","FRI","SAT"];

    const now        = new Date();
    const rangeStart = new Date(now); rangeStart.setUTCDate(rangeStart.getUTCDate() - (days - 1)); rangeStart.setUTCHours(0, 0, 0, 0);
    const rangeEnd   = new Date(now); rangeEnd.setUTCHours(23, 59, 59, 999);

    const deptQ = { type: "user", active: true };
    if (department !== "all") deptQ.department = { $regex: new RegExp(`^${department}$`, "i") };
    const totalActiveUsers = await userModel.countDocuments(deptQ);

    const employeeIds = await getEmployeeIds(department);
    const match = { date: { $gte: rangeStart, $lte: rangeEnd }, response: "yes", userId: { $in: employeeIds } };
    const scheduleIds = await getScheduleIds({ vendorId, mealType });
    if (scheduleIds !== null) match.scheduleId = scheduleIds.length ? { $in: scheduleIds } : { $in: [] };

    const raw         = await Attendance.aggregate([{ $match: match }, { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }, count: { $sum: 1 } } }]);
    const countByDate = Object.fromEntries(raw.map(r => [r._id, r.count]));
    const data        = Array.from({ length: days }, (_, i) => {
      const d = new Date(now); d.setUTCDate(d.getUTCDate() - (days - 1 - i));
      const fullDate = d.toISOString().split("T")[0];
      const count    = countByDate[fullDate] ?? 0;
      const present  = totalActiveUsers > 0 ? Math.round((count / totalActiveUsers) * 100) : 0;
      return { day: DAY_MAP[d.getUTCDay()], present, gap: present > 0 && (100 - present) > 0 ? 2 : 0, absent: 100 - present, fullDate };
    });

    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, msg: "Internal error: " + err.message });
  }
};

// ── GET /admin/analytics/activity ────────────────────────────────────────────

export const getRecentActivity = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const logs  = await ActivityLog.find().sort({ createdAt: -1 }).limit(limit).lean();
    const activities = logs.map(l => {
      const ts = new Date(l.createdAt);
      return { date: ts.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }), time: ts.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }), name: l.name, email: l.email, action: l.action, status: l.status, initials: l.initials, bgColor: l.bgColor, color: l.color };
    });
    return res.status(200).json({ success: true, activities });
  } catch (err) {
    return res.status(500).json({ success: false, msg: "Internal error: " + err.message });
  }
};

// ── GET /admin/analytics/filter-options ──────────────────────────────────────

export const getFilterOptions = async (req, res) => {
  try {
    const vendors = await userModel.find({ type: "vendor", status: true }, "name _id").lean();
    return res.status(200).json({ success: true, vendors: vendors.map(v => ({ label: v.name, value: String(v._id) })) });
  } catch (err) {
    return res.status(500).json({ success: false, msg: "Internal error: " + err.message });
  }
};

// ── GET /admin/analytics/consumption-breakdown ────────────────────────────────

export const getConsumptionBreakdown = async (req, res) => {
  try {
    const days       = Math.min(Math.max(parseInt(req.query.days) || 30, 1), 30);
    const department = req.query.department || "all";
    const vendorId   = req.query.vendorId   || "all";

    const now        = new Date();
    const { start: rangeStart, end: rangeEnd } = utcDayRange(now);
    rangeStart.setUTCDate(rangeStart.getUTCDate() - (days - 1));

    // base match — no userId filter so we never get empty results
    const baseMatch = { date: { $gte: rangeStart, $lte: rangeEnd }, response: "yes" };

    // apply department filter if specified
    if (department !== "all") {
      const ids = await getEmployeeIds(department);
      baseMatch.userId = { $in: ids };
    }

    // apply vendor filter if specified
    const vendorScheduleIds = await getScheduleIdsByVendor(vendorId);
    if (vendorScheduleIds !== null) {
      baseMatch.scheduleId = vendorScheduleIds.length ? { $in: vendorScheduleIds } : { $in: [] };
    }

    // ── 1. Meal-type breakdown (donut) ────────────────────────────────────────
    // Simple: just join attendance → schedule → dish, group by dishType
    const mealTypeAgg = await Attendance.aggregate([
      { $match: baseMatch },
      ...DISH_LOOKUP,
      { $group: { _id: { $ifNull: ["$dish.dishType", "Unknown"] }, count: { $sum: 1 } } },
    ]);

    const typeMap     = Object.fromEntries(mealTypeAgg.map(t => [t._id, t.count]));
    const vegCount    = typeMap["Veg"]     || 0;
    const nonVegCount = typeMap["Non-Veg"] || 0;
    const bothCount   = typeMap["Both"]    || 0;
    const rawTotal    = vegCount + nonVegCount + bothCount;
    const divisor     = rawTotal || 1;

    const mealTypeBreakdown = {
      vegCount, nonVegCount, bothCount, total: rawTotal,
      veg:    Math.round((vegCount    / divisor) * 100),
      nonVeg: Math.round((nonVegCount / divisor) * 100),
      both:   Math.round((bothCount   / divisor) * 100),
    };

    // ── 2. Top dish ───────────────────────────────────────────────────────────
    const topDishAgg = await Attendance.aggregate([
      { $match: { ...baseMatch, scheduleId: { $ne: null } } },
      { $group: { _id: "$scheduleId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
      { $lookup: { from: "menuschedules", localField: "_id", foreignField: "_id", as: "schedule" } },
      { $unwind: { path: "$schedule", preserveNullAndEmptyArrays: false } },
      { $lookup: { from: "dishes", localField: "schedule.dish", foreignField: "_id", as: "dish" } },
      { $unwind: { path: "$dish", preserveNullAndEmptyArrays: false } },
      { $project: { name: "$dish.name", count: 1 } },
    ]);

    const topDish = topDishAgg[0]
      ? { name: topDishAgg[0].name, count: topDishAgg[0].count, popularity: Math.min(100, Math.round((topDishAgg[0].count / divisor) * 100)) }
      : { name: "N/A", count: 0, popularity: 0 };

    // ── 3. Most active department ─────────────────────────────────────────────
    const deptAgg = await Attendance.aggregate([
      { $match: baseMatch },
      { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: false } },
      { $match: { "user.type": "user" } },
      { $group: { _id: { $ifNull: ["$user.department", "Unknown"] }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]);

    const mostActiveDept = deptAgg[0]
      ? { name: deptAgg[0]._id, count: deptAgg[0].count }
      : { name: "N/A", count: 0 };

    // ── 4. Least active day ───────────────────────────────────────────────────
    const dayAgg = await Attendance.aggregate([
      { $match: baseMatch },
      { $group: { _id: { $dayOfWeek: "$date" }, count: { $sum: 1 } } },
      { $sort: { count: 1 } },
      { $limit: 1 },
    ]);

    const leastActiveDay = dayAgg[0]
      ? { name: DAY_NAMES[dayAgg[0]._id - 1], dayOfWeek: dayAgg[0]._id, count: dayAgg[0].count }
      : { name: "N/A", dayOfWeek: null, count: 0 };

    // ── 5. Heatmap ────────────────────────────────────────────────────────────
    const DOW_TO_IDX = { 2: 0, 3: 1, 4: 2, 5: 3, 6: 4, 7: 5, 1: 6 };

    const topDeptsAgg = await Attendance.aggregate([
      { $match: baseMatch },
      { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: false } },
      { $match: { "user.type": "user" } },
      { $group: { _id: { $ifNull: ["$user.department", "Unknown"] }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 4 },
    ]);

    const topDepts = topDeptsAgg.map(d => d._id).filter(Boolean);
    let heatmap = [];

    if (topDepts.length > 0) {
      const heatmapAgg = await Attendance.aggregate([
        { $match: baseMatch },
        { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: false } },
        { $match: { "user.type": "user", "user.department": { $in: topDepts } } },
        { $group: { _id: { department: "$user.department", dayOfWeek: { $dayOfWeek: "$date" } }, count: { $sum: 1 } } },
      ]);

      const map = {};
      for (const dept of topDepts) map[dept] = Array(7).fill(0);
      for (const row of heatmapAgg) {
        const idx = DOW_TO_IDX[row._id.dayOfWeek];
        if (map[row._id.department] !== undefined && idx !== undefined) map[row._id.department][idx] = row.count;
      }

      heatmap = topDepts.map(dept => ({ dept: dept.length > 12 ? dept.slice(0, 12) : dept, counts: map[dept] }));
    }

    return res.status(200).json({ success: true, data: { topDish, mostActiveDept, leastActiveDay, mealTypeBreakdown, heatmap } });
  } catch (err) {
    console.error("[getConsumptionBreakdown]", err);
    return res.status(500).json({ success: false, msg: "Internal error: " + err.message });
  }
};

// ── GET /admin/analytics/live-feed ───────────────────────────────────────────

export const getLiveFeed = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);

    // fetch latest attendance records — no userId filter so all records show
    const records = await Attendance.find({ response: "yes" })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate({ path: "userId", select: "name department avatar" })
      .lean();

    // fetch schedules + dishes in one query
    const scheduleIds = records.map(r => r.scheduleId).filter(Boolean);
    const schedules   = await MenuSchedule.find({ _id: { $in: scheduleIds } })
      .populate({ path: "dish", select: "name dishType" })
      .lean();

    const scheduleMap = Object.fromEntries(schedules.map(s => [String(s._id), s]));
    const now         = Date.now();

    const feed = records.map(r => {
      const ts       = r.createdAt ? new Date(r.createdAt) : new Date(r.date);
      const schedule = scheduleMap[String(r.scheduleId)] ?? null;
      const dish     = schedule?.dish ?? null;
      const status   = schedule?.scheduledDate && now < new Date(schedule.scheduledDate).getTime() ? "IN PREP" : "SERVED";

      return {
        time:       ts.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        employee:   r.userId?.name       ?? "Unknown",
        department: r.userId?.department ?? "Unknown",
        avatar:     r.userId?.avatar     ?? "",
        item:       dish?.name           ?? "No dish linked",
        dishType:   dish?.dishType       ?? "",
        status,
      };
    });

    return res.status(200).json({ success: true, data: feed });
  } catch (err) {
    console.error("[getLiveFeed]", err);
    return res.status(500).json({ success: false, msg: "Internal error: " + err.message });
  }
};