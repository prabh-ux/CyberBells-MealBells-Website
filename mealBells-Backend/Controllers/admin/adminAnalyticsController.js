// Controllers/admin/adminAnalyticsController.js
import mongoose from "mongoose";
import { userModel }         from "../../Models/user.js";
import { Attendance }        from "../../Models/attendance.js";
import { ActivityLog }       from "../../Models/activityLog.js";
import { dishModel as Dish } from "../../Models/dish.js";
import { MenuSchedule }      from "../../Models/menuSchedule.js";

const dayWindow = (offset = 0) => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - offset);
  const start = new Date(d);
  const end   = new Date(d);
  end.setUTCHours(23, 59, 59, 999);
  return { start, end };
};

const rangeWindow = (days = 7) => ({
  start: dayWindow(days - 1).start,
  end:   dayWindow(0).end,
});

const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const DAY_MAP   = ["SUN","MON","TUE","WED","THU","FRI","SAT"];

const getAdminOrgId = async (adminUserId) => {
  const admin = await userModel.findById(adminUserId).select("organizationId").lean();
  return admin?.organizationId?.[0] ?? null;
};

const getOrgUserIds = async (organizationId, extraFilter = {}) => {
  const users = await userModel.find(
    { type: "user", active: true, organizationId: { $in: [organizationId] }, ...extraFilter },
    "_id"
  ).lean();
  return users.map(u => u._id);
};

const buildFilters = async ({ days, department, vendorId, mealType, adminUserId }) => {
  const { start, end } = rangeWindow(days);

  const baseMatch = {
    response: "yes",
    date:     { $gte: start, $lte: end },
  };

  const organizationId = await getAdminOrgId(adminUserId);
  if (!organizationId) {
    baseMatch.userId = { $in: [] };
    return { baseMatch, mealTypeLookup: [] };
  }

  const deptFilter = department && department !== "all"
    ? { department: { $regex: new RegExp(`^${department}$`, "i") } }
    : {};

  const orgUserIds = await getOrgUserIds(organizationId, deptFilter);
  baseMatch.userId = { $in: orgUserIds };

  if (vendorId && vendorId !== "all" && mongoose.Types.ObjectId.isValid(vendorId)) {
    const dishes    = await Dish.find({ vendor: new mongoose.Types.ObjectId(vendorId) }, "_id").lean();
    const schedules = await MenuSchedule.find({ dish: { $in: dishes.map(d => d._id) } }, "_id").lean();
    baseMatch.scheduleId = { $in: schedules.map(s => s._id) };
  }

  let mealTypeLookup = [];
  if (mealType && mealType !== "all") {
    const allowed = mealType === "Veg"
      ? ["Veg", "Both"]
      : mealType === "Non-Veg"
        ? ["Non-Veg", "Both"]
        : [mealType];

    mealTypeLookup = [
      { $lookup: { from: "menuschedules", localField: "scheduleId", foreignField: "_id", as: "_ms" } },
      { $unwind: { path: "$_ms", preserveNullAndEmptyArrays: false } },
      { $lookup: { from: "dishes", localField: "_ms.dish", foreignField: "_id", as: "_dish" } },
      { $unwind: { path: "$_dish", preserveNullAndEmptyArrays: false } },
      { $match: { "_dish.dishType": { $in: allowed } } },
    ];
  }

  return { baseMatch, mealTypeLookup, organizationId };
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /admin/analytics/summary
// ─────────────────────────────────────────────────────────────────────────────
export const getAnalyticsSummary = async (req, res) => {
  try {
    const days        = Math.min(parseInt(req.query.days) || 7, 30);
    const department  = req.query.department || "all";
    const vendorId    = req.query.vendorId   || "all";
    const mealType    = req.query.mealType   || "all";
    const adminUserId = req.user.id;

    const organizationId = await getAdminOrgId(adminUserId);
    if (!organizationId) {
      return res.status(200).json({
        success: true,
        summary: { totalUsers: 0, totalVendors: 0, mealsToday: 0, userGrowthPct: null, attendancePct: 0 },
      });
    }

    const deptFilter = department !== "all"
      ? { department: { $regex: new RegExp(`^${department}$`, "i") } }
      : {};

    const now            = new Date();
    const thisMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const lastMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const lastMonthEnd   = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 23, 59, 59, 999));

    const [totalUsers, usersThisMonth, usersLastMonth, totalActiveUsers, totalVendors] =
      await Promise.all([
        userModel.countDocuments({ type: "user", organizationId: { $in: [organizationId] }, ...deptFilter }),
        userModel.countDocuments({ type: "user", organizationId: { $in: [organizationId] }, ...deptFilter, createdAt: { $gte: thisMonthStart } }),
        userModel.countDocuments({ type: "user", organizationId: { $in: [organizationId] }, ...deptFilter, createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } }),
        userModel.countDocuments({ type: "user", active: true, organizationId: { $in: [organizationId] }, ...deptFilter }),
        vendorId !== "all"
          ? Promise.resolve(1)
          : userModel.countDocuments({ type: "vendor", status: true, organizationId: { $in: [organizationId] } }),
      ]);

    const { baseMatch, mealTypeLookup } = await buildFilters({ days, department, vendorId, mealType, adminUserId });

    const perDay = await Attendance.aggregate([
      { $match: baseMatch },
      ...mealTypeLookup,
      { $group: { _id: { date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }, userId: "$userId" } } },
      { $group: { _id: "$_id.date", count: { $sum: 1 } } },
    ]);

    const mealsInRange = perDay.reduce((s, d) => s + d.count, 0);
    let attendancePct  = 0;
    if (totalActiveUsers > 0 && perDay.length > 0) {
      const avg     = mealsInRange / perDay.length;
      attendancePct = Math.min(100, +((avg / totalActiveUsers) * 100).toFixed(1));
    }

    const userGrowthPct = usersLastMonth > 0
      ? +(((usersThisMonth - usersLastMonth) / usersLastMonth) * 100).toFixed(1)
      : null;

    return res.status(200).json({
      success: true,
      summary: { totalUsers, totalVendors, mealsToday: mealsInRange, userGrowthPct, attendancePct },
    });
  } catch (err) {
    console.error("[getAnalyticsSummary]", err);
    return res.status(500).json({ success: false, msg: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /admin/analytics/meals
// ─────────────────────────────────────────────────────────────────────────────
export const getMealsChart = async (req, res) => {
  try {
    const days        = Math.min(parseInt(req.query.days) || 7, 30);
    const department  = req.query.department || "all";
    const vendorId    = req.query.vendorId   || "all";
    const mealType    = req.query.mealType   || "all";
    const adminUserId = req.user.id;

    const { baseMatch, mealTypeLookup } = await buildFilters({ days, department, vendorId, mealType, adminUserId });

    const raw = await Attendance.aggregate([
      { $match: baseMatch },
      ...mealTypeLookup,
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }, count: { $sum: 1 } } },
    ]);

    const countByDate = Object.fromEntries(raw.map(r => [r._id, r.count]));

    const data = Array.from({ length: days }, (_, i) => {
      const offset    = days - 1 - i;
      const { start } = dayWindow(offset);
      const fullDate  = start.toISOString().split("T")[0];
      return { day: DAY_MAP[start.getUTCDay()], count: countByDate[fullDate] ?? 0, fullDate };
    });

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("[getMealsChart]", err);
    return res.status(500).json({ success: false, msg: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /admin/analytics/attendance
// ─────────────────────────────────────────────────────────────────────────────
export const getAttendanceChart = async (req, res) => {
  try {
    const days        = Math.min(parseInt(req.query.days) || 7, 30);
    const department  = req.query.department || "all";
    const vendorId    = req.query.vendorId   || "all";
    const mealType    = req.query.mealType   || "all";
    const adminUserId = req.user.id;

    const organizationId = await getAdminOrgId(adminUserId);

    const deptFilter = department !== "all"
      ? { department: { $regex: new RegExp(`^${department}$`, "i") } }
      : {};

    const [{ baseMatch, mealTypeLookup }, totalActiveUsers] = await Promise.all([
      buildFilters({ days, department, vendorId, mealType, adminUserId }),
      userModel.countDocuments({ type: "user", active: true, organizationId: { $in: [organizationId] }, ...deptFilter }),
    ]);

    const raw = await Attendance.aggregate([
      { $match: baseMatch },
      ...mealTypeLookup,
      {
        $group: {
          _id: { date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }, userId: "$userId" },
        },
      },
      { $group: { _id: "$_id.date", count: { $sum: 1 } } },
    ]);

    const countByDate = Object.fromEntries(raw.map(r => [r._id, r.count]));

    const data = Array.from({ length: days }, (_, i) => {
      const offset    = days - 1 - i;
      const { start } = dayWindow(offset);
      const fullDate  = start.toISOString().split("T")[0];
      const count     = countByDate[fullDate] ?? 0;
      const present   = totalActiveUsers > 0
        ? Math.min(100, Math.round((count / totalActiveUsers) * 100))
        : 0;
      return {
        day:     DAY_MAP[start.getUTCDay()],
        present,
        gap:     present > 0 && present < 100 ? 2 : 0,
        absent:  100 - present,
        fullDate,
      };
    });

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("[getAttendanceChart]", err);
    return res.status(500).json({ success: false, msg: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /admin/analytics/activity
// ─────────────────────────────────────────────────────────────────────────────
export const getRecentActivity = async (req, res) => {
  try {
    const limit          = Math.min(parseInt(req.query.limit) || 20, 100);
    const adminUserId    = req.user.id;
    const organizationId = await getAdminOrgId(adminUserId);

    const orgUserIds = organizationId
      ? await getOrgUserIds(organizationId)
      : [];

    const scopedUserIds = [...orgUserIds, adminUserId];

    const logs = await ActivityLog.find({
      userId: { $in: scopedUserIds },
    }).sort({ createdAt: -1 }).limit(limit).lean();

    const activities = logs.map(l => {
      const ts = new Date(l.createdAt);
      return {
        date:     ts.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        time:     ts.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        name:     l.name,
        email:    l.email,
        action:   l.action,
        status:   l.status,
        initials: l.initials,
        bgColor:  l.bgColor,
        color:    l.color,
      };
    });

    return res.status(200).json({ success: true, activities });
  } catch (err) {
    return res.status(500).json({ success: false, msg: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /admin/analytics/filter-options
// ─────────────────────────────────────────────────────────────────────────────
export const getFilterOptions = async (req, res) => {
  try {
    const organizationId = await getAdminOrgId(req.user.id);
    if (!organizationId)
      return res.status(200).json({ success: true, vendors: [] });

    const vendors = await userModel
      .find(
        { type: "vendor", status: true, organizationId: { $in: [organizationId] } },
        "name _id"
      )
      .lean();

    return res.status(200).json({
      success: true,
      vendors: vendors.map(v => ({ label: v.name, value: String(v._id) })),
    });
  } catch (err) {
    return res.status(500).json({ success: false, msg: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /admin/analytics/consumption-breakdown
// ─────────────────────────────────────────────────────────────────────────────
export const getConsumptionBreakdown = async (req, res) => {
  try {
    const days        = Math.min(Math.max(parseInt(req.query.days) || 30, 1), 30);
    const department  = req.query.department || "all";
    const vendorId    = req.query.vendorId   || "all";
    const mealType    = req.query.mealType   || "all";
    const adminUserId = req.user.id;

    const { baseMatch, mealTypeLookup } = await buildFilters({ days, department, vendorId, mealType, adminUserId });

    const mealTypeAgg = await Attendance.aggregate([
      { $match: baseMatch },
      ...mealTypeLookup,
      { $lookup: { from: "menuschedules", localField: "scheduleId", foreignField: "_id", as: "_ms" } },
      { $unwind: { path: "$_ms", preserveNullAndEmptyArrays: true } },
      { $lookup: { from: "dishes", localField: "_ms.dish", foreignField: "_id", as: "_dish" } },
      { $unwind: { path: "$_dish", preserveNullAndEmptyArrays: true } },
      { $group: { _id: { $ifNull: ["$_dish.dishType", "Unknown"] }, count: { $sum: 1 } } },
    ]);

    const typeMap     = Object.fromEntries(mealTypeAgg.map(t => [t._id, t.count]));
    const vegCount    = typeMap["Veg"]     || 0;
    const nonVegCount = typeMap["Non-Veg"] || 0;
    const bothCount   = typeMap["Both"]    || 0;
    const rawTotal    = vegCount + nonVegCount + bothCount || 1;

    const mealTypeBreakdown = {
      vegCount, nonVegCount, bothCount,
      total:  rawTotal,
      veg:    Math.round((vegCount    / rawTotal) * 100),
      nonVeg: Math.round((nonVegCount / rawTotal) * 100),
      both:   Math.round((bothCount   / rawTotal) * 100),
    };

    const topDishAgg = await Attendance.aggregate([
      { $match: { ...baseMatch, scheduleId: { $ne: null } } },
      ...mealTypeLookup,
      { $group: { _id: "$scheduleId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
      { $lookup: { from: "menuschedules", localField: "_id", foreignField: "_id", as: "_ms" } },
      { $unwind: "$_ms" },
      { $lookup: { from: "dishes", localField: "_ms.dish", foreignField: "_id", as: "_dish" } },
      { $unwind: "$_dish" },
      { $project: { name: "$_dish.name", count: 1 } },
    ]);

    const topDish = topDishAgg[0]
      ? { name: topDishAgg[0].name, count: topDishAgg[0].count, popularity: Math.min(100, Math.round((topDishAgg[0].count / rawTotal) * 100)) }
      : { name: "N/A", count: 0, popularity: 0 };

    const deptAgg = await Attendance.aggregate([
      { $match: baseMatch },
      ...mealTypeLookup,
      { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "_user" } },
      { $unwind: "$_user" },
      { $match: { "_user.type": "user" } },
      { $group: { _id: { $ifNull: ["$_user.department", "Unknown"] }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]);
    const mostActiveDept = deptAgg[0]
      ? { name: deptAgg[0]._id, count: deptAgg[0].count }
      : { name: "N/A", count: 0 };

    const dayAgg = await Attendance.aggregate([
      { $match: baseMatch },
      ...mealTypeLookup,
      { $group: { _id: { $dayOfWeek: "$date" }, count: { $sum: 1 } } },
      { $sort: { count: 1 } },
      { $limit: 1 },
    ]);
    const leastActiveDay = dayAgg[0]
      ? { name: DAY_NAMES[dayAgg[0]._id - 1], dayOfWeek: dayAgg[0]._id, count: dayAgg[0].count }
      : { name: "N/A", dayOfWeek: null, count: 0 };

    const DOW_TO_IDX = { 2: 0, 3: 1, 4: 2, 5: 3, 6: 4, 7: 5, 1: 6 };

    const topDeptsAgg = await Attendance.aggregate([
      { $match: baseMatch },
      ...mealTypeLookup,
      { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "_user" } },
      { $unwind: "$_user" },
      { $match: { "_user.type": "user" } },
      { $group: { _id: { $ifNull: ["$_user.department", "Unknown"] }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 4 },
    ]);
    const topDepts = topDeptsAgg.map(d => d._id).filter(Boolean);

    let heatmap = [];
    if (topDepts.length) {
      const heatmapAgg = await Attendance.aggregate([
        { $match: baseMatch },
        ...mealTypeLookup,
        { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "_user" } },
        { $unwind: "$_user" },
        { $match: { "_user.type": "user", "_user.department": { $in: topDepts } } },
        { $group: { _id: { department: "$_user.department", dow: { $dayOfWeek: "$date" } }, count: { $sum: 1 } } },
      ]);

      const map = Object.fromEntries(topDepts.map(d => [d, Array(7).fill(0)]));
      for (const row of heatmapAgg) {
        const idx = DOW_TO_IDX[row._id.dow];
        if (map[row._id.department] && idx !== undefined)
          map[row._id.department][idx] = row.count;
      }
      heatmap = topDepts.map(dept => ({ dept: dept.slice(0, 12), counts: map[dept] }));
    }

    return res.status(200).json({
      success: true,
      data: { topDish, mostActiveDept, leastActiveDay, mealTypeBreakdown, heatmap },
    });
  } catch (err) {
    console.error("[getConsumptionBreakdown]", err);
    return res.status(500).json({ success: false, msg: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /admin/analytics/live-feed
// ─────────────────────────────────────────────────────────────────────────────
export const getLiveFeed = async (req, res) => {
  try {
    const limit       = Math.min(parseInt(req.query.limit) || 20, 100);
    const department  = req.query.department || "all";
    const vendorId    = req.query.vendorId   || "all";
    const mealType    = req.query.mealType   || "all";
    const adminUserId = req.user.id;

    const organizationId = await getAdminOrgId(adminUserId);

    const baseFilter = { response: "yes" };

    if (organizationId) {
      const deptFilter = department !== "all"
        ? { department: { $regex: new RegExp(`^${department}$`, "i") } }
        : {};
      const orgUserIds = await getOrgUserIds(organizationId, deptFilter);
      baseFilter.userId = { $in: orgUserIds };
    }

    if (vendorId !== "all" && mongoose.Types.ObjectId.isValid(vendorId)) {
      const dishes    = await Dish.find({ vendor: new mongoose.Types.ObjectId(vendorId) }, "_id").lean();
      const schedules = await MenuSchedule.find({ dish: { $in: dishes.map(d => d._id) } }, "_id").lean();
      baseFilter.scheduleId = { $in: schedules.map(s => s._id) };
    }

    let records = await Attendance.find(baseFilter)
      .sort({ createdAt: -1 })
      .limit(mealType !== "all" ? limit * 4 : limit)
      .populate({ path: "userId", select: "name department avatar" })
      .lean();

    const schedIds  = [...new Set(records.map(r => String(r.scheduleId)).filter(Boolean))];
    const schedules = await MenuSchedule.find({ _id: { $in: schedIds } })
      .populate({ path: "dish", select: "name dishType" })
      .lean();
    const scheduleMap = Object.fromEntries(schedules.map(s => [String(s._id), s]));

    if (mealType !== "all") {
      const allowed = mealType === "Veg" ? ["Veg", "Both"] : ["Non-Veg", "Both"];
      records = records.filter(r => {
        const dish = scheduleMap[String(r.scheduleId)]?.dish;
        return dish && allowed.includes(dish.dishType);
      });
    }

    const now  = Date.now();
    const feed = records.slice(0, limit).map(r => {
      const ts       = r.createdAt ? new Date(r.createdAt) : new Date(r.date);
      const schedule = scheduleMap[String(r.scheduleId)] ?? null;
      const dish     = schedule?.dish ?? null;
      return {
        time:       ts.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        employee:   r.userId?.name       ?? "Unknown",
        department: r.userId?.department ?? "Unknown",
        avatar:     r.userId?.avatar     ?? "",
        item:       dish?.name           ?? "No dish linked",
        dishType:   dish?.dishType       ?? "",
        status:     schedule?.scheduledDate && now < new Date(schedule.scheduledDate).getTime()
          ? "IN PREP" : "SERVED",
      };
    });

    return res.status(200).json({ success: true, data: feed });
  } catch (err) {
    console.error("[getLiveFeed]", err);
    return res.status(500).json({ success: false, msg: err.message });
  }
};