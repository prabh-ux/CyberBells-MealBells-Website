// Controllers/vendor/vendorDashboardController.js
import mongoose from "mongoose";
import { dishModel }    from "../../Models/dish.js";
import { MenuSchedule } from "../../Models/menuSchedule.js";
import { Attendance }   from "../../Models/attendance.js";
import { Review }       from "../../Models/review.js";
import { userModel }    from "../../Models/user.js";
import { Delivery }     from "../../Models/delivery.js";

const getUTCMidnight = (offsetDays = 0) => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d;
};

const getWeekRange = () => {
  const day          = new Date().getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday       = getUTCMidnight(diffToMonday);
  const sunday       = getUTCMidnight(diffToMonday + 6);
  return { start: monday, end: sunday };
};

// ── Helper: get all org IDs this vendor serves ────────────────────────────────
const getVendorOrgIds = async (vendorUserId) => {
  const vendor = await userModel.findById(vendorUserId).select("organizationId").lean();
  return vendor?.organizationId ?? [];
};

// ── Helper: resolve & validate orgId ─────────────────────────────────────────
const resolveOrgId = async (vendorUserId, orgIdParam) => {
  const vendorOrgIds = await getVendorOrgIds(vendorUserId);
  if (!vendorOrgIds.length) return null;
  if (orgIdParam) {
    const match = vendorOrgIds.find(id => id.toString() === orgIdParam);
    return match ?? null;
  }
  return vendorOrgIds[0]; // default: first org
};

// ── GET /vendor/dashboard?orgId=<id> ─────────────────────────────────────────
export const getVendorDashboard = async (req, res) => {
  try {
    const vendorId = new mongoose.Types.ObjectId(req.user.id);

    // ✅ FIX: resolve which org this dashboard is for
    const organizationId = await resolveOrgId(req.user.id, req.query.orgId);
    if (!organizationId) {
      return res.status(200).json({
        success: true,
        data: {
          todayOrders: 0, pendingDelivery: 0,
          reviewsToday: { avg: 0, count: 0 },
          mealsThisWeek: 0,
          attendance: { present: 0, absent: 0 },
          todayDish: null,
        },
      });
    }

    const today                              = getUTCMidnight();
    const { start: weekStart, end: weekEnd } = getWeekRange();

    const vendorDishIds = await dishModel.find({ vendor: vendorId }).distinct("_id");

    // ✅ FIX: week schedules scoped to this org
    const weekScheduleIds = await MenuSchedule.find({
      dish:          { $in: vendorDishIds },
      organizationId,                          // ✅ org-scoped
      scheduledDate: { $gte: weekStart, $lte: weekEnd },
    }).distinct("_id");

    const mealsThisWeek = await Attendance.countDocuments({
      scheduleId: { $in: weekScheduleIds },
      response:   "yes",
    });

    // ✅ FIX: today's schedule scoped to this org
    const todaySchedule = await MenuSchedule
      .findOne({
        dish:          { $in: vendorDishIds },
        organizationId,                        // ✅ org-scoped
        scheduledDate: today,
      })
      .populate("dish", "name image dishType estimatedCalories ingredients description tags protein carbs prepTime")
      .lean();

    if (!todaySchedule) {
      return res.status(200).json({
        success: true,
        data: {
          todayOrders:     0,
          pendingDelivery: 0,
          reviewsToday:    { avg: 0, count: 0 },
          mealsThisWeek,
          attendance:      { present: 0, absent: 0 },
          todayDish:       null,
        },
      });
    }

    const [todayAttendance, todayDelivery] = await Promise.all([
      Attendance.find({ scheduleId: todaySchedule._id }).lean(),
      // ✅ FIX: delivery scoped to org too
      Delivery.findOne({ scheduleId: todaySchedule._id, vendorId, organizationId }).lean(),
    ]);

    const presentToday    = todayAttendance.filter(a => a.response === "yes").length;
    const pendingDelivery = todayDelivery?.status === "handed_over" ? 0 : presentToday;

    // ✅ FIX: count only users from THIS org, not all orgs
    const totalOrgUsers = await userModel.countDocuments({
      organizationId, // single ObjectId — no $in wrap
      type:           "user",
      active:         true,
    });
    const absentToday = Math.max(0, totalOrgUsers - presentToday);

    const todayReviews = await Review.aggregate([
      {
        $match: {
          dishId:    { $in: vendorDishIds },
          createdAt: { $gte: today },
        },
      },
      {
        $group: {
          _id:   null,
          avg:   { $avg: "$overallRating" },
          count: { $sum: 1 },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: {
        todayOrders:     presentToday,
        pendingDelivery,
        reviewsToday: {
          avg:   todayReviews[0] ? Math.round(todayReviews[0].avg * 10) / 10 : 0,
          count: todayReviews[0]?.count ?? 0,
        },
        mealsThisWeek,
        attendance: { present: presentToday, absent: absentToday },
        todayDish:  todaySchedule.dish,
      },
    });
  } catch (err) {
    console.error("getVendorDashboard:", err);
    return res.status(500).json({ success: false, msg: "Internal server error" });
  }
};