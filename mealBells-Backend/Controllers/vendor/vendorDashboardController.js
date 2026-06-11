import mongoose from "mongoose";
import { dishModel }    from "../../Models/dish.js";
import { MenuSchedule } from "../../Models/menuSchedule.js";
import { Attendance }   from "../../Models/attendance.js";
import { Review }       from "../../Models/review.js";
import { userModel }    from "../../Models/user.js";
import { Delivery }     from "../../Models/delivery.js";   // ← add this import

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

// ── GET /vendor/dashboard ─────────────────────────────────────────────────────
export const getVendorDashboard = async (req, res) => {
  try {
    const vendorId = new mongoose.Types.ObjectId(req.user.id);

    const today                              = getUTCMidnight();
    const { start: weekStart, end: weekEnd } = getWeekRange();

    const vendorDishIds = await dishModel.find({ vendor: vendorId }).distinct("_id");

    const weekScheduleIds = await MenuSchedule.find({
      dish:          { $in: vendorDishIds },
      scheduledDate: { $gte: weekStart, $lte: weekEnd },
    }).distinct("_id");

    const mealsThisWeek = await Attendance.countDocuments({
      scheduleId: { $in: weekScheduleIds },
      response:   "yes",
    });

    const todaySchedule = await MenuSchedule
      .findOne({
        dish:          { $in: vendorDishIds },
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
      Delivery.findOne({ scheduleId: todaySchedule._id, vendorId }).lean(),
    ]);

    const presentToday = todayAttendance.filter(a => a.response === "yes").length;

    // Once handed_over, nothing is pending anymore
    const pendingDelivery = todayDelivery?.status === "handed_over" ? 0 : presentToday;

    const totalOrgUsers = await userModel.countDocuments({
      organizationId: req.user.organizationId ?? null,
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

    const reviewsToday = {
      avg:   todayReviews[0] ? Math.round(todayReviews[0].avg * 10) / 10 : 0,
      count: todayReviews[0]?.count ?? 0,
    };

    return res.status(200).json({
      success: true,
      data: {
        todayOrders:     presentToday,
        pendingDelivery,              // ← 0 when handed_over, else presentToday
        reviewsToday,
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