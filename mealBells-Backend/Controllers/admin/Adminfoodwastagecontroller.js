// Controllers/admin/adminFoodWastageController.js
import mongoose         from "mongoose";
import { Attendance }   from "../../Models/attendance.js";
import { Delivery }     from "../../Models/delivery.js";
import { MenuSchedule } from "../../Models/menuSchedule.js";
import { userModel }    from "../../Models/user.js";
import { dishModel }    from "../../Models/dish.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

// organizationId in user schema is [ObjectId] array — normalize it
const getAdminOrgId = async (adminUserId) => {
  const admin = await userModel.findById(adminUserId).select("organizationId").lean();
  const ids   = admin?.organizationId ?? [];
  // Return first entry as a single ObjectId (admin belongs to one org)
  return ids.length > 0 ? ids[0] : null;
};

const getOrgUserIds = async (organizationId) => {
  if (!organizationId) return [];
  const users = await userModel.find(
    { type: "user", active: true, organizationId: organizationId },
    "_id"
  ).lean();
  return users.map((u) => u._id);
};

const dayBounds = (date = new Date()) => {
  const start = new Date(date); start.setHours(0,  0,  0,   0);
  const end   = new Date(date); end.setHours(23, 59, 59, 999);
  return { start, end };
};

// ── Resolve schedule scoped to THIS org for the given date + optional filters ─
const resolveScheduleId = async ({ date, vendorId, mealType, organizationId }) => {
  const { start, end } = dayBounds(date);

  // ✅ Always filter by organizationId — no cross-org leakage possible
  const scheduleFilter = {
    organizationId,
    scheduledDate: { $gte: start, $lte: end },
  };

  if (mealType && mealType !== "all" && mealType !== "Both") {
    const dishes = await dishModel.find({ dishType: mealType }, "_id").lean();
    if (!dishes.length) return null;
    scheduleFilter.dish = { $in: dishes.map(d => d._id) };
  }

  const schedule = await MenuSchedule.findOne(scheduleFilter, "_id").lean();
  if (!schedule) return null;

  if (vendorId && vendorId !== "all") {
    const delivery = await Delivery.findOne({
      scheduleId: schedule._id,
      vendorId:   new mongoose.Types.ObjectId(vendorId),
    }, "_id").lean();
    if (!delivery) return null;
  }

  return schedule._id;
};

// ── Core per-day metrics (fully org-scoped via organizationId on models) ───────
const getDayMetrics = async ({ date, vendorId, mealType, orgUserIds, organizationId }) => {
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

    // ✅ Scope schedule lookup to this org — no other org's schedule can match
    const schedule = await MenuSchedule.findOne(
      { organizationId, scheduledDate: { $gte: start, $lte: end } },
      "_id"
    ).lean();

    const delivered = schedule
      ? await Delivery.countDocuments({
          scheduleId:     schedule._id,
          organizationId,                // ✅ double-scoped for safety
          status:         "handed_over",
        })
      : 0;

    return { expected: totalUsers, delivered, eaten, wastage, wastagePercent };
  }

  // ── Filters active ────────────────────────────────────────────────────────
  const scheduleId = await resolveScheduleId({ date, vendorId, mealType, organizationId });
  if (!scheduleId) {
    return { expected: 0, delivered: 0, eaten: 0, wastage: 0, wastagePercent: 0 };
  }

  const expected = await Attendance.countDocuments({
    userId:     { $in: orgUserIds },
    scheduleId,
    date:       { $gte: start, $lte: end },
  });

  const eaten = await Attendance.countDocuments({
    userId:     { $in: orgUserIds },
    scheduleId,
    date:       { $gte: start, $lte: end },
    response:   "yes",
  });

  const wastage        = Math.max(0, expected - eaten);
  const wastagePercent = expected > 0
    ? +((wastage / expected) * 100).toFixed(1)
    : 0;

  const delivered = await Delivery.countDocuments({
    scheduleId,
    organizationId,
    status: "handed_over",
  });

  return { expected, delivered, eaten, wastage, wastagePercent };
};

// ── GET /admin/food-wastage/vendors ──────────────────────────────────────────
export const getWastageVendors = async (req, res) => {
  try {
    const organizationId = await getAdminOrgId(req.user.id);
    if (!organizationId)
      return res.status(200).json({ success: true, vendors: [] });

    const vendors = await userModel
      .find(
        { type: "vendor", organizationId: organizationId },
        "_id name logo foodType status"
      )
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
    const mealType = req.query.mealType || "Both";
    const days     = Math.min(parseInt(req.query.days) || 7, 90);

    const organizationId = await getAdminOrgId(req.user.id);
    const orgUserIds     = await getOrgUserIds(organizationId);

    const now     = new Date();
    const results = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const m = await getDayMetrics({ date, vendorId, mealType, orgUserIds, organizationId });
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
      daily:   results,
    });
  } catch (err) {
    return res.status(500).json({ success: false, msg: err.message });
  }
};

// ── GET /admin/food-wastage/chart ─────────────────────────────────────────────
export const getFoodWastageChart = async (req, res) => {
  try {
    const vendorId = req.query.vendor   || "all";
    const mealType = req.query.mealType || "Both";
    const days     = Math.min(parseInt(req.query.days) || 7, 30);

    const organizationId = await getAdminOrgId(req.user.id);
    const orgUserIds     = await getOrgUserIds(organizationId);

    const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const now  = new Date();
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const { expected, delivered, eaten, wastage } =
        await getDayMetrics({ date, vendorId, mealType, orgUserIds, organizationId });
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

// ── GET /admin/food-wastage/table ─────────────────────────────────────────────
export const getFoodWastageTable = async (req, res) => {
  try {
    const vendorId = req.query.vendor   || "all";
    const mealType = req.query.mealType || "Both";
    const page     = Math.max(1, parseInt(req.query.page)  || 1);
    const limit    = Math.min(   parseInt(req.query.limit) || 5, 31);
    const days     = Math.min(parseInt(req.query.days) || 7, 31);

    const organizationId = await getAdminOrgId(req.user.id);
    const orgUserIds     = await getOrgUserIds(organizationId);

    const now     = new Date();
    const allRows = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const { expected, delivered, eaten, wastage, wastagePercent } =
        await getDayMetrics({ date, vendorId, mealType, orgUserIds, organizationId });
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