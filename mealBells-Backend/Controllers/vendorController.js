import mongoose from "mongoose";
import { dishModel }        from "../Models/dish.js";
import { MenuSchedule }     from "../Models/menuSchedule.js";
import { Attendance }       from "../Models/attendance.js";
import { Review }           from "../Models/review.js";
import { userModel }        from "../Models/user.js";
import { applyDishUpdates } from "./adminDishController.js";

// ── helpers ───────────────────────────────────────────────────────────────────

const getUTCMidnight = (offsetDays = 0) => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d;
};

const getWeekRange = () => {
  const day          = new Date().getUTCDay(); // 0 = Sunday
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday       = getUTCMidnight(diffToMonday);
  const sunday       = getUTCMidnight(diffToMonday + 6);
  return { start: monday, end: sunday };
};

// ── GET /vendor/dashboard ─────────────────────────────────────────────────────
export const getVendorDashboard = async (req, res) => {
  try {
    const vendorId = new mongoose.Types.ObjectId(req.user.id);

    const today                      = getUTCMidnight();
    const { start: weekStart, end: weekEnd } = getWeekRange();

    const vendorDishIds = await dishModel.find({ vendor: vendorId }).distinct("_id");

    // ── always calculate mealsThisWeek first ──
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

    const todayAttendance = await Attendance.find({
      scheduleId: todaySchedule._id,
    }).lean();

    const presentToday = todayAttendance.filter(a => a.response === "yes").length;

    const totalOrgUsers = await userModel.countDocuments({
      organizationId: req.user.organizationId ?? null,
      type:           "user",
      active:         true,
    });
    const absentToday = Math.max(0, totalOrgUsers - presentToday);

    const todayOrders     = presentToday;
    const pendingDelivery = presentToday;

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
        todayOrders,
        pendingDelivery,
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

// ── GET /vendor/menu/today ────────────────────────────────────────────────────
export const getVendorTodayMenu = async (req, res) => {
  try {
    const vendorId = new mongoose.Types.ObjectId(req.user.id);
    const today    = getUTCMidnight();

    const vendorDishIds = await dishModel.find({ vendor: vendorId }).distinct("_id");

    const schedule = await MenuSchedule
      .findOne({
        dish:          { $in: vendorDishIds },
        scheduledDate: today,
      })
      .populate("dish", "name image dishType estimatedCalories ingredients description tags protein carbs prepTime")
      .lean();

    if (!schedule) {
      return res.status(404).json({ success: false, msg: "No dish scheduled for today" });
    }

    const portions = await Attendance.countDocuments({
      scheduleId: schedule._id,
      response:   "yes",
    });

    return res.status(200).json({
      success: true,
      data: {
        scheduleId:       schedule._id,
        scheduledDate:    schedule.scheduledDate,
        expectedPortions: portions,
        dish:             schedule.dish,
      },
    });
  } catch (err) {
    console.error("getVendorTodayMenu:", err);
    return res.status(500).json({ success: false, msg: "Internal server error" });
  }
};

// ── GET /vendor/menu/weekly ───────────────────────────────────────────────────
export const getVendorWeeklyMenu = async (req, res) => {
  try {
    const vendorId                   = new mongoose.Types.ObjectId(req.user.id);
    const { start: weekStart, end: weekEnd } = getWeekRange();

    const vendorDishIds = await dishModel.find({ vendor: vendorId }).distinct("_id");

    const schedules = await MenuSchedule
      .find({
        dish:          { $in: vendorDishIds },
        scheduledDate: { $gte: weekStart, $lte: weekEnd },
      })
      .populate("dish", "name image dishType estimatedCalories tags description")
      .sort({ scheduledDate: 1 })
      .lean();

    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const result = days.map((day, i) => {
      const target = getUTCMidnight(0);
      const day0   = new Date().getUTCDay();
      const diff   = day0 === 0 ? -6 : 1 - day0;
      target.setUTCDate(target.getUTCDate() + diff + i);

      const match = schedules.find(s =>
        new Date(s.scheduledDate).toUTCString() === target.toUTCString()
      );

      return {
        day,
        date:     target.toISOString(),
        schedule: match ? { scheduleId: match._id, dish: match.dish } : null,
      };
    });

    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error("getVendorWeeklyMenu:", err);
    return res.status(500).json({ success: false, msg: "Internal server error" });
  }
};

// ── PUT /vendor/menu/today ────────────────────────────────────────────────────
export const updateVendorTodayDish = async (req, res) => {
  try {
    const vendorId = new mongoose.Types.ObjectId(req.user.id);
    const today    = getUTCMidnight();

    const vendorDishIds = await dishModel.find({ vendor: vendorId }).distinct("_id");

    const schedule = await MenuSchedule.findOne({
      dish:          { $in: vendorDishIds },
      scheduledDate: today,
    }).lean();

    if (!schedule) {
      return res.status(404).json({ success: false, msg: "No dish scheduled for today" });
    }

    const updated = await applyDishUpdates(schedule.dish, req.body, req.file);
    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error("updateVendorTodayDish:", err);
    return res.status(500).json({ success: false, msg: "Internal server error" });
  }
};

