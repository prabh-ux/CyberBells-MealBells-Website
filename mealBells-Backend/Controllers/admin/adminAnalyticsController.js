// Controllers/admin/adminAnalyticsController.js
import mongoose from "mongoose";
import { userModel }   from "../../Models/user.js";
import { Attendance }  from "../../Models/attendance.js";
import { ActivityLog } from "../../Models/activityLog.js";
import { dishModel as Dish } from "../../Models/dish.js";

const dayBounds = (date = new Date()) => {
  const start = new Date(date); start.setHours(0,  0,  0,   0);
  const end   = new Date(date); end.setHours(23, 59, 59, 999);
  return { start, end };
};

const resolveUserIdFilter = async ({ department }) => {
  if (!department || department === "all") return null;
  const users = await userModel.find(
    { type: "user", active: true, department: { $regex: new RegExp(`^${department}$`, "i") } },
    "_id"
  ).lean();
  return users.map(u => u._id);
};

const resolveScheduleIdFilter = async ({ vendorId, mealType }) => {
  const MenuSchedule = mongoose.model("menuSchedule");
  let scheduleIds = null; // null = no restriction

  if (vendorId && vendorId !== "all") {
    const schedules = await MenuSchedule.find({ vendorId }, "_id").lean().catch(() => []);
    scheduleIds = schedules.map(s => String(s._id));
  }

  if (mealType && mealType !== "all") {
    const dishes    = await Dish.find({ foodType: mealType }, "_id").lean();
    const dishIds   = dishes.map(d => d._id);
    const schedules = await MenuSchedule.find({ dishId: { $in: dishIds } }, "_id").lean().catch(() => []);
    const ids = schedules.map(s => String(s._id));
    scheduleIds = scheduleIds
      ? scheduleIds.filter(id => ids.includes(id))
      : ids;
  }

  return scheduleIds;
};

// ── GET /admin/analytics/summary?days=&department=&vendorId=&mealType= ────────
// Now filter-aware: totalUsers/totalVendors/mealsToday all respect active filters
export const getAnalyticsSummary = async (req, res) => {
  try {
    const department = req.query.department || "all";
    const vendorId   = req.query.vendorId   || "all";
    const mealType   = req.query.mealType   || "all";

    const now = new Date();
    const { start: todayStart, end: todayEnd } = dayBounds(now);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(),     1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(),     0, 23, 59, 59, 999);

    // ── User / vendor counts scoped to department filter ───────────────────
    const userQuery   = { type: "user" };
    const activeQuery = { type: "user", active: true };
    if (department !== "all") {
      const deptReg = { $regex: new RegExp(`^${department}$`, "i") };
      userQuery.department   = deptReg;
      activeQuery.department = deptReg;
    }

    // Vendor count: filter by whether the vendor has schedules matching vendorId
    // (if a specific vendor is selected, count = 1; otherwise count all vendors)
    let totalVendors;
    if (vendorId !== "all") {
      totalVendors = 1; // specific vendor selected
    } else {
      totalVendors = await userModel.countDocuments({ type: "vendor", status: true });
    }

    const [totalUsers, usersThisMonth, usersLastMonth, totalActiveUsers] = await Promise.all([
      userModel.countDocuments(userQuery),
      userModel.countDocuments({ ...userQuery, createdAt: { $gte: thisMonthStart } }),
      userModel.countDocuments({ ...userQuery, createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } }),
      userModel.countDocuments(activeQuery),
    ]);

    // ── Meals today scoped to all active filters ───────────────────────────
    const todayMatch = { date: { $gte: todayStart, $lte: todayEnd }, response: "yes" };

    const userIds = await resolveUserIdFilter({ department });
    if (userIds) todayMatch.userId = { $in: userIds };

    const scheduleIds = await resolveScheduleIdFilter({ vendorId, mealType });
    if (scheduleIds !== null) {
      todayMatch.scheduleId = scheduleIds.length ? { $in: scheduleIds } : { $in: [] };
    }

    const mealsToday = await Attendance.countDocuments(todayMatch);

    const userGrowthPct = usersLastMonth > 0
      ? +((( usersThisMonth - usersLastMonth) / usersLastMonth) * 100).toFixed(1)
      : null;

   const attendancePct = totalActiveUsers > 0
  ? +((mealsToday / totalActiveUsers) * 100).toFixed(1)
  : 0;  

    return res.status(200).json({
      success: true,
      summary: { totalUsers, totalVendors, mealsToday, userGrowthPct, attendancePct },
    });
  } catch (err) {
    return res.status(500).json({ success: false, msg: "Internal error: " + err.message });
  }
};

// ── GET /admin/analytics/meals?days=7|14|30&department=&vendorId=&mealType= ───
export const getMealsChart = async (req, res) => {
  try {
    const days       = Math.min(parseInt(req.query.days) || 7, 30);
    const department = req.query.department || "all";
    const vendorId   = req.query.vendorId   || "all";
    const mealType   = req.query.mealType   || "all";
    const DAY_MAP    = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

    const now        = new Date();
    const rangeStart = new Date(now); rangeStart.setDate(rangeStart.getDate() - (days - 1)); rangeStart.setHours(0, 0, 0, 0);
    const rangeEnd   = new Date(now); rangeEnd.setHours(23, 59, 59, 999);

    const match = { date: { $gte: rangeStart, $lte: rangeEnd }, response: "yes" };

    const userIds = await resolveUserIdFilter({ department });
    if (userIds) match.userId = { $in: userIds };

    const scheduleIds = await resolveScheduleIdFilter({ vendorId, mealType });
    if (scheduleIds !== null) {
      match.scheduleId = scheduleIds.length ? { $in: scheduleIds } : { $in: [] };
    }

    const raw = await Attendance.aggregate([
      { $match: match },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }, count: { $sum: 1 } } },
    ]);

    const countByDate = Object.fromEntries(raw.map(r => [r._id, r.count]));
    const data = Array.from({ length: days }, (_, i) => {
      const d = new Date(now); d.setDate(d.getDate() - (days - 1 - i));
      const fullDate = d.toISOString().split("T")[0];
      return { day: DAY_MAP[d.getDay()], count: countByDate[fullDate] ?? 0, fullDate };
    });

    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, msg: "Internal error: " + err.message });
  }
};

// ── GET /admin/analytics/attendance?days=7|14|30&department=&vendorId=&mealType= ─
export const getAttendanceChart = async (req, res) => {
  try {
    const days       = Math.min(parseInt(req.query.days) || 7, 30);
    const department = req.query.department || "all";
    const vendorId   = req.query.vendorId   || "all";
    const mealType   = req.query.mealType   || "all";
    const DAY_MAP    = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

    const now        = new Date();
    const rangeStart = new Date(now); rangeStart.setDate(rangeStart.getDate() - (days - 1)); rangeStart.setHours(0, 0, 0, 0);
    const rangeEnd   = new Date(now); rangeEnd.setHours(23, 59, 59, 999);

    const deptQuery = { type: "user", active: true };
    if (department !== "all") deptQuery.department = { $regex: new RegExp(`^${department}$`, "i") };
    const totalActiveUsers = await userModel.countDocuments(deptQuery);

    const match = { date: { $gte: rangeStart, $lte: rangeEnd }, response: "yes" };

    const userIds = await resolveUserIdFilter({ department });
    if (userIds) match.userId = { $in: userIds };

    const scheduleIds = await resolveScheduleIdFilter({ vendorId, mealType });
    if (scheduleIds !== null) {
      match.scheduleId = scheduleIds.length ? { $in: scheduleIds } : { $in: [] };
    }

    const raw = await Attendance.aggregate([
      { $match: match },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }, count: { $sum: 1 } } },
    ]);

    const countByDate = Object.fromEntries(raw.map(r => [r._id, r.count]));
    const data = Array.from({ length: days }, (_, i) => {
      const d = new Date(now); d.setDate(d.getDate() - (days - 1 - i));
      const fullDate = d.toISOString().split("T")[0];
      const count   = countByDate[fullDate] ?? 0;
      const present = totalActiveUsers > 0 ? Math.round((count / totalActiveUsers) * 100) : 0;
      return { day: DAY_MAP[d.getDay()], present, gap: present > 0 && (100 - present) > 0 ? 2 : 0, absent: 100 - present, fullDate };
    });

    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, msg: "Internal error: " + err.message });
  }
};

// ── GET /admin/analytics/activity?limit=20 ────────────────────────────────────
export const getRecentActivity = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const logs  = await ActivityLog.find().sort({ createdAt: -1 }).limit(limit).lean();
    const activities = logs.map(l => {
      const ts = new Date(l.createdAt);
      return {
        date: ts.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        time: ts.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        name: l.name, email: l.email, action: l.action, status: l.status,
        initials: l.initials, bgColor: l.bgColor, color: l.color,
      };
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
    return res.status(200).json({
      success: true,
      vendors: vendors.map(v => ({ label: v.name, value: String(v._id) })),
    });
  } catch (err) {
    return res.status(500).json({ success: false, msg: "Internal error: " + err.message });
  }
};