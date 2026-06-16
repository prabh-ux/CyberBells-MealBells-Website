import mongoose         from "mongoose";
import { Attendance }   from "../../Models/attendance.js";
import { Delivery }     from "../../Models/delivery.js";
import { MenuSchedule } from "../../Models/menuSchedule.js";
import { userModel }    from "../../Models/user.js";
import { dishModel }    from "../../Models/dish.js";
import { organizationModel } from "../../Models/organization.js";

// ── Helpers (reuse resolveOrgIds pattern from analytics) ─────────────────────

const resolveOrgIds = async (orgId) => {
  if (orgId && orgId !== "all" && mongoose.Types.ObjectId.isValid(orgId)) {
    return [new mongoose.Types.ObjectId(orgId)];
  }
  const orgs = await organizationModel.find({}, "_id").lean();
  return orgs.map(o => o._id);
};

const resolveUserIds = async (orgIds) => {
  const users = await userModel.find(
    { type: "user", active: true, organizationId: { $in: orgIds } },
    "_id"
  ).lean();
  return users.map(u => u._id);
};

const dayBounds = (date = new Date()) => {
  const start = new Date(date); start.setHours(0,  0,  0,   0);
  const end   = new Date(date); end.setHours(23, 59, 59, 999);
  return { start, end };
};

const getDayMetrics = async ({ date, vendorId, mealType, orgUserIds, orgIds }) => {
  const { start, end } = dayBounds(date);

  const noFilters =
    (!vendorId || vendorId === "all") &&
    (!mealType || mealType === "all" || mealType === "Both");

  if (noFilters) {
    const totalUsers = orgUserIds.length;

    const eaten = await Attendance.countDocuments({
      userId:   { $in: orgUserIds },
      date:     { $gte: start, $lte: end },
      response: "yes",
    });

    const wastage        = Math.max(0, totalUsers - eaten);
    const wastagePercent = totalUsers > 0
      ? +((wastage / totalUsers) * 100).toFixed(1)
      : 0;

    const schedules = await MenuSchedule.find(
      { organizationId: { $in: orgIds }, scheduledDate: { $gte: start, $lte: end } },
      "_id"
    ).lean();

    const delivered = schedules.length
      ? await Delivery.countDocuments({
          scheduleId: { $in: schedules.map(s => s._id) },
          status:     "handed_over",
        })
      : 0;

    return { expected: totalUsers, delivered, eaten, wastage, wastagePercent };
  }

  // ── Filters active ────────────────────────────────────────────────────────
  const scheduleFilter = {
    organizationId:  { $in: orgIds },
    scheduledDate:   { $gte: start, $lte: end },
  };

  if (mealType && mealType !== "all" && mealType !== "Both") {
    const dishes = await dishModel.find({ dishType: mealType }, "_id").lean();
    if (!dishes.length) return { expected: 0, delivered: 0, eaten: 0, wastage: 0, wastagePercent: 0 };
    scheduleFilter.dish = { $in: dishes.map(d => d._id) };
  }

  const schedules = await MenuSchedule.find(scheduleFilter, "_id").lean();
  if (!schedules.length) return { expected: 0, delivered: 0, eaten: 0, wastage: 0, wastagePercent: 0 };

  const scheduleIds = schedules.map(s => s._id);

  if (vendorId && vendorId !== "all" && mongoose.Types.ObjectId.isValid(vendorId)) {
    const deliveries = await Delivery.find(
      { scheduleId: { $in: scheduleIds }, vendorId: new mongoose.Types.ObjectId(vendorId) },
      "scheduleId"
    ).lean();
    if (!deliveries.length) return { expected: 0, delivered: 0, eaten: 0, wastage: 0, wastagePercent: 0 };
    scheduleIds.length = 0;
    scheduleIds.push(...deliveries.map(d => d.scheduleId));
  }

  const expected = await Attendance.countDocuments({
    userId:     { $in: orgUserIds },
    scheduleId: { $in: scheduleIds },
    date:       { $gte: start, $lte: end },
  });

  const eaten = await Attendance.countDocuments({
    userId:     { $in: orgUserIds },
    scheduleId: { $in: scheduleIds },
    date:       { $gte: start, $lte: end },
    response:   "yes",
  });

  const wastage        = Math.max(0, expected - eaten);
  const wastagePercent = expected > 0
    ? +((wastage / expected) * 100).toFixed(1)
    : 0;

  const delivered = await Delivery.countDocuments({
    scheduleId: { $in: scheduleIds },
    status:     "handed_over",
  });

  return { expected, delivered, eaten, wastage, wastagePercent };
};

// ── GET /super-admin/food-wastage/vendors ─────────────────────────────────────
export const getSuperWastageVendors = async (req, res) => {
  try {
    const orgId  = req.query.orgId || "all";
    const orgIds = await resolveOrgIds(orgId);

    const vendors = await userModel
      .find(
        { type: "vendor", organizationId: { $in: orgIds } },
        "_id name logo foodType status"
      )
      .lean();

    return res.status(200).json({ success: true, vendors });
  } catch (err) {
    return res.status(500).json({ success: false, msg: err.message });
  }
};

// ── GET /super-admin/food-wastage/summary ─────────────────────────────────────
export const getSuperFoodWastageSummary = async (req, res) => {
  try {
    const orgId    = req.query.orgId    || "all";
    const vendorId = req.query.vendor   || "all";
    const mealType = req.query.mealType || "Both";
    const days     = Math.min(parseInt(req.query.days) || 7, 90);

    const orgIds     = await resolveOrgIds(orgId);
    const orgUserIds = await resolveUserIds(orgIds);

    const now     = new Date();
    const results = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const m = await getDayMetrics({ date, vendorId, mealType, orgUserIds, orgIds });
      results.push({ date: date.toISOString().split("T")[0], ...m });
    }

    const totalExpected  = results.reduce((s, r) => s + r.expected,  0);
    const totalDelivered = results.reduce((s, r) => s + r.delivered, 0);
    const totalEaten     = results.reduce((s, r) => s + r.eaten,     0);
    const totalWastage   = results.reduce((s, r) => s + r.wastage,   0);

    const activeDays        = results.filter(r => r.expected > 0);
    const avgWastagePercent = activeDays.length > 0
      ? +(activeDays.reduce((s, r) => s + r.wastagePercent, 0) / activeDays.length).toFixed(1)
      : 0;

    const efficiency = totalExpected > 0
      ? +((totalEaten / totalExpected) * 100).toFixed(1)
      : 0;

    const half = Math.floor(results.length / 2);
    const fH   = results.slice(0, half);
    const sH   = results.slice(half);
    const fPct = fH.reduce((s,r) => s + r.expected, 0) > 0
      ? (fH.reduce((s,r) => s + r.wastage, 0) / fH.reduce((s,r) => s + r.expected, 0)) * 100 : 0;
    const sPct = sH.reduce((s,r) => s + r.expected, 0) > 0
      ? (sH.reduce((s,r) => s + r.wastage, 0) / sH.reduce((s,r) => s + r.expected, 0)) * 100 : 0;
    const wasteTrend = fPct > 0
      ? +((sPct - fPct) / fPct * 100).toFixed(1)
      : null;

    return res.status(200).json({
      success: true,
      summary: { totalExpected, totalDelivered, totalEaten, totalWastage, avgWastagePercent, efficiency, wasteTrend },
    });
  } catch (err) {
    return res.status(500).json({ success: false, msg: err.message });
  }
};

// ── GET /super-admin/food-wastage/chart ───────────────────────────────────────
export const getSuperFoodWastageChart = async (req, res) => {
  try {
    const orgId    = req.query.orgId    || "all";
    const vendorId = req.query.vendor   || "all";
    const mealType = req.query.mealType || "Both";
    const days     = Math.min(parseInt(req.query.days) || 7, 30);

    const orgIds     = await resolveOrgIds(orgId);
    const orgUserIds = await resolveUserIds(orgIds);

    const DAYS = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
    const now  = new Date();
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const { expected, delivered, eaten, wastage } =
        await getDayMetrics({ date, vendorId, mealType, orgUserIds, orgIds });
      data.push({
        day:       DAYS[date.getDay()],
        fullDate:  date.toISOString().split("T")[0],
        Expected:  expected,
        Delivered: delivered,
        Eaten:     eaten,
        Wastage:   wastage,
      });
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, msg: err.message });
  }
};

// ── GET /super-admin/food-wastage/table ───────────────────────────────────────
export const getSuperFoodWastageTable = async (req, res) => {
  try {
    const orgId    = req.query.orgId    || "all";
    const vendorId = req.query.vendor   || "all";
    const mealType = req.query.mealType || "Both";
    const page     = Math.max(1, parseInt(req.query.page)  || 1);
    const limit    = Math.min(   parseInt(req.query.limit) || 5, 31);
    const days     = Math.min(parseInt(req.query.days) || 7, 31);

    const orgIds     = await resolveOrgIds(orgId);
    const orgUserIds = await resolveUserIds(orgIds);

    const now     = new Date();
    const allRows = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const { expected, delivered, eaten, wastage, wastagePercent } =
        await getDayMetrics({ date, vendorId, mealType, orgUserIds, orgIds });
      allRows.push({
        date:          date.toLocaleDateString("en-US", { month: "short", day: "2-digit" }),
        fullDate:      date.toISOString().split("T")[0],
        expected,
        delivered,
        eaten,
        wastageCount:  wastage,
        wastagePercent,
      });
    }

    return res.status(200).json({
      success: true,
      data:    allRows.slice((page - 1) * limit, page * limit),
      pagination: {
        total:      allRows.length,
        page,
        limit,
        totalPages: Math.ceil(allRows.length / limit),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, msg: err.message });
  }
};