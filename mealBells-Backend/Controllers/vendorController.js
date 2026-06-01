import mongoose from "mongoose";
import { dishModel }        from "../Models/dish.js";
import { MenuSchedule }     from "../Models/menuSchedule.js";
import { Attendance }       from "../Models/attendance.js";
import { Review }           from "../Models/review.js";
import { userModel }        from "../Models/user.js";
import { applyDishUpdates } from "./adminDishController.js";

// ── helpers ───────────────────────────────────────────────────────────────────

const getDayRange = (date = new Date()) => {
  const start = new Date(date); start.setHours(0, 0, 0, 0);
  const end   = new Date(date); end.setHours(23, 59, 59, 999);
  return { start, end };
};

const getWeekRange = (date = new Date()) => {
  const day    = date.getDay();
  const diff   = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
};

// ── GET /vendor/dashboard ─────────────────────────────────────────────────────
export const getVendorDashboard = async (req, res) => {
  try {
    const vendorId = new mongoose.Types.ObjectId(req.user.id);

    const { start: dayStart,  end: dayEnd  } = getDayRange();
    const { start: weekStart, end: weekEnd } = getWeekRange();

    const vendorDishIds = await dishModel.find({ vendor: vendorId }).distinct("_id");

    const todaySchedule = await MenuSchedule
      .findOne({
        dish:          { $in: vendorDishIds },
        scheduledDate: { $gte: dayStart, $lte: dayEnd },
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
          mealsThisWeek:   0,
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
          createdAt: { $gte: dayStart, $lte: dayEnd },
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

    const weekScheduleIds = await MenuSchedule.find({
      dish:          { $in: vendorDishIds },
      scheduledDate: { $gte: weekStart, $lte: weekEnd },
    }).distinct("_id");

    const mealsThisWeek = await Attendance.countDocuments({
      scheduleId: { $in: weekScheduleIds },
      response:   "yes",
    });

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
    const vendorId       = new mongoose.Types.ObjectId(req.user.id);
    const { start, end } = getDayRange();

    const vendorDishIds = await dishModel.find({ vendor: vendorId }).distinct("_id");

    const schedule = await MenuSchedule
      .findOne({
        dish:          { $in: vendorDishIds },
        scheduledDate: { $gte: start, $lte: end },
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
    const vendorId       = new mongoose.Types.ObjectId(req.user.id);
    const { start, end } = getWeekRange();

    const vendorDishIds = await dishModel.find({ vendor: vendorId }).distinct("_id");

    const schedules = await MenuSchedule
      .find({
        dish:          { $in: vendorDishIds },
        scheduledDate: { $gte: start, $lte: end },
      })
      .populate("dish", "name image dishType estimatedCalories tags description")
      .sort({ scheduledDate: 1 })
      .lean();

    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const result = days.map((day, i) => {
      const target = new Date(start);
      target.setDate(start.getDate() + i);
      const match = schedules.find(s => {
        const d = new Date(s.scheduledDate);
        return d.toDateString() === target.toDateString();
      });
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
    const vendorId       = new mongoose.Types.ObjectId(req.user.id);
    const { start, end } = getDayRange();

    const vendorDishIds = await dishModel.find({ vendor: vendorId }).distinct("_id");

    const schedule = await MenuSchedule.findOne({
      dish:          { $in: vendorDishIds },
      scheduledDate: { $gte: start, $lte: end },
    }).lean();

    if (!schedule) {
      return res.status(404).json({ success: false, msg: "No dish scheduled for today" });
    }

    // reuse shared helper — no schedule or vendor reassignment allowed for vendor
    const updated = await applyDishUpdates(schedule.dish, req.body, req.file);
    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error("updateVendorTodayDish:", err);
    return res.status(500).json({ success: false, msg: "Internal server error" });
  }
};