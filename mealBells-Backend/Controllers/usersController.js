// Controllers/menu.controller.js
import mongoose from "mongoose";
import { dishModel }    from "../Models/dish.js";
import { MenuSchedule } from "../Models/menuSchedule.js";
import { Attendance }   from "../Models/attendance.js";
import { DishRequest }  from "../Models/dishrequest.js";
import { Review }       from "../Models/review.js";
import { userModel }    from "../Models/user.js";

// ── helpers ───────────────────────────────────────────────────────────────────

const getDayRange = (date = new Date()) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const DISH_POPULATE = {
  path:   "dish",
  select: "name description dishType image ingredients availability qualityScore estimatedCalories prepTime protein carbs tags",
  populate: {
    path:   "vendor",
    select: "name logo rating foodType deliveryTiming",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// TODAY'S MENU
// GET /user/menu-today
// ─────────────────────────────────────────────────────────────────────────────
export const getTodayMenu = async (req, res) => {
  try {
    const { start, end } = getDayRange();
    const { id: userId, organizationId } = req.user;

    const schedule = await MenuSchedule
      .findOne({ scheduledDate: { $gte: start, $lte: end } })
      .populate(DISH_POPULATE)
      .lean();

    if (!schedule || !schedule.dish) {
      return res.status(404).json({ success: false, msg: "No menu scheduled for today" });
    }

    const yesAttendances = await Attendance.find({
      organizationId,
      date:     { $gte: start, $lte: end },
      response: "yes",
    })
      .select("userId")
      .lean();

    const colleaguesEating = yesAttendances.length;

    const colleagueUserIds = yesAttendances
      .map(a => a.userId?.toString())
      .filter(id => id && id !== userId.toString())
      .slice(0, 3);

    const colleagueUsers = await userModel
      .find({ _id: { $in: colleagueUserIds } })
      .select("avatar name")
      .lean();

    const colleagueAvatars = colleagueUsers
      .map(u => u.avatar)
      .filter(Boolean);

    const myAttendance = await Attendance
      .findOne({ userId, date: { $gte: start, $lte: end } })
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        scheduleId:      schedule._id,
        scheduledDate:   schedule.scheduledDate,
        dish:            schedule.dish,
        colleaguesEating,
        colleagueAvatars,
        myResponse:      myAttendance?.response ?? null,
      },
    });
  } catch (err) {
    console.error("getTodayMenu:", err);
    return res.status(500).json({ success: false, msg: "Internal server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// MARK ATTENDANCE (yes / no) for today
// POST /user/attendance
// ─────────────────────────────────────────────────────────────────────────────
export const markAttendance = async (req, res) => {
  try {
    const { response, scheduleId } = req.body;
    const { id: userId, organizationId } = req.user;

    if (!["yes", "no"].includes(response)) {
      return res.status(400).json({ success: false, msg: 'response must be "yes" or "no"' });
    }

    const { start, end } = getDayRange();

    await Attendance.findOneAndUpdate(
      { userId, date: { $gte: start, $lte: end } },
      { $set: { userId, organizationId, scheduleId: scheduleId ?? null, response, date: new Date() } },
      { upsert: true, new: true }
    );

    const yesAttendances = await Attendance.find({
      organizationId,
      date:     { $gte: start, $lte: end },
      response: "yes",
    })
      .select("userId")
      .lean();

    const colleaguesEating = yesAttendances.length;

    const colleagueUserIds = yesAttendances
      .map(a => a.userId?.toString())
      .filter(id => id && id !== userId.toString())
      .slice(0, 3);

    const colleagueUsers = await userModel
      .find({ _id: { $in: colleagueUserIds } })
      .select("avatar name")
      .lean();

    const colleagueAvatars = colleagueUsers
      .map(u => u.avatar)
      .filter(Boolean);

    return res.status(200).json({
      success: true,
      data: { myResponse: response, colleaguesEating, colleagueAvatars },
    });
  } catch (err) {
    console.error("markAttendance:", err);
    return res.status(500).json({ success: false, msg: "Internal server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// WEEKLY MENU
// GET /user/menu-weekly?offset=0
// ─────────────────────────────────────────────────────────────────────────────
export const getWeeklyMenu = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const offset = parseInt(req.query.offset ?? "0", 10);

    const now  = new Date();
    const day  = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;

    const monday = new Date(now);
    monday.setDate(now.getDate() + diff + offset * 7);
    monday.setHours(0, 0, 0, 0);

    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    friday.setHours(23, 59, 59, 999);

    const [schedules, attendances] = await Promise.all([
      MenuSchedule
        .find({ scheduledDate: { $gte: monday, $lte: friday } })
        .populate(DISH_POPULATE)
        .sort({ scheduledDate: 1 })
        .lean(),
      Attendance
        .find({ userId, date: { $gte: monday, $lte: friday } })
        .lean(),
    ]);

    const attMap = {};
    attendances.forEach(a => {
      attMap[new Date(a.date).toISOString().split("T")[0]] = a.response;
    });

    const result = schedules.map(s => ({
      scheduleId:    s._id,
      scheduledDate: s.scheduledDate,
      dish:          s.dish,
      myResponse:    attMap[new Date(s.scheduledDate).toISOString().split("T")[0]] ?? null,
    }));

    return res.status(200).json({
      success: true,
      data: { weekStart: monday, weekEnd: friday, schedules: result },
    });
  } catch (err) {
    console.error("getWeeklyMenu:", err);
    return res.status(500).json({ success: false, msg: "Internal server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DISH DETAILS
// GET /user/dish/:scheduleId
// ─────────────────────────────────────────────────────────────────────────────
export const getDishDetails = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const { id: userId }  = req.user;

    const schedule = await MenuSchedule
      .findById(scheduleId)
      .populate({
        path:     "dish",
        populate: { path: "vendor", select: "name logo rating foodType" },
      })
      .lean();

    if (!schedule || !schedule.dish) {
      return res.status(404).json({ success: false, msg: "Dish not found" });
    }

    const dish = schedule.dish;

    const ingredientsList = dish.ingredients
      ? dish.ingredients.split(",").map(i => i.trim()).filter(Boolean)
      : [];

    const { start, end } = getDayRange(schedule.scheduledDate);

    const [myAttendance, myReview] = await Promise.all([
      Attendance.findOne({ userId, date: { $gte: start, $lte: end } }).lean(),
      Review.findOne({ userId, scheduleId }).lean(),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        scheduleId:    schedule._id,
        scheduledDate: schedule.scheduledDate,
        dish: { ...dish, ingredientsList },
        myAttendance:  myAttendance?.response ?? null,
        hasReviewed:   Boolean(myReview),
        myReview:      myReview ?? null,
      },
    });
  } catch (err) {
    console.error("getDishDetails:", err);
    return res.status(500).json({ success: false, msg: "Internal server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// MARK ATTENDANCE FOR A SPECIFIC DAY
// PATCH /user/attendance/:scheduleId
// ─────────────────────────────────────────────────────────────────────────────
export const markAttendanceForDay = async (req, res) => {
  try {
    const { scheduleId }  = req.params;
    const { response }    = req.body;
    const { id: userId, organizationId } = req.user;

    if (!["yes", "no"].includes(response)) {
      return res.status(400).json({ success: false, msg: 'response must be "yes" or "no"' });
    }

    const schedule = await MenuSchedule.findById(scheduleId).lean();
    if (!schedule) {
      return res.status(404).json({ success: false, msg: "Schedule not found" });
    }

    const { start, end } = getDayRange(schedule.scheduledDate);

    await Attendance.findOneAndUpdate(
      { userId, date: { $gte: start, $lte: end } },
      { $set: { userId, organizationId, scheduleId, response, date: new Date(schedule.scheduledDate) } },
      { upsert: true, new: true }
    );

    const colleaguesEating = await Attendance.countDocuments({
      organizationId,
      date:     { $gte: start, $lte: end },
      response: "yes",
    });

    return res.status(200).json({
      success: true,
      data: { myResponse: response, colleaguesEating },
    });
  } catch (err) {
    console.error("markAttendanceForDay:", err);
    return res.status(500).json({ success: false, msg: "Internal server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// SUBMIT / UPDATE REVIEW
// POST /user/review
// ─────────────────────────────────────────────────────────────────────────────
export const submitReview = async (req, res) => {
  try {
    const { id: userId, organizationId } = req.user;
    const {
      scheduleId,
      overallRating,
      taste     = 5,
      quantity  = 5,
      quality   = 5,
      freshness = 5,
      comment   = "",
      tags      = [],
    } = req.body;

    if (!scheduleId) {
      return res.status(400).json({ success: false, msg: "scheduleId is required" });
    }
    if (!overallRating || overallRating < 1 || overallRating > 5) {
      return res.status(400).json({ success: false, msg: "overallRating must be 1–5" });
    }

    const schedule = await MenuSchedule.findById(scheduleId).lean();
    if (!schedule) {
      return res.status(404).json({ success: false, msg: "Schedule not found" });
    }

    const review = await Review.findOneAndUpdate(
      { userId, scheduleId },
      {
        $set: {
          userId,
          dishId:         schedule.dish,
          scheduleId,
          organizationId: organizationId ?? null,
          overallRating,
          taste,
          quantity,
          quality,
          freshness,
          comment,
          tags,
        },
      },
      { upsert: true, new: true }
    );

    const dish = await dishModel
      .findById(schedule.dish)
      .select("vendor")
      .lean();

    if (dish?.vendor) {
      const allDishIds = await dishModel.find({ vendor: dish.vendor }).distinct("_id");
      const agg = await Review.aggregate([
        { $match: { dishId: { $in: allDishIds } } },
        { $group: { _id: null, avg: { $avg: "$overallRating" }, count: { $sum: 1 } } },
      ]);
      if (agg.length) {
        await userModel.findByIdAndUpdate(dish.vendor, {
          rating:       Math.round(agg[0].avg * 10) / 10,
          totalReviews: agg[0].count,
        });
      }
    }

    return res.status(200).json({ success: true, data: review });
  } catch (err) {
    console.error("submitReview:", err);
    return res.status(500).json({ success: false, msg: "Internal server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// MY REVIEWS
// GET /user/reviews?page=1&limit=10
// ─────────────────────────────────────────────────────────────────────────────
export const getMyReviews = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const page  = Math.max(1, parseInt(req.query.page  ?? "1",  10));
    const limit = Math.min(50, parseInt(req.query.limit ?? "10", 10));
    const skip  = (page - 1) * limit;

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const [reviews, total, stats] = await Promise.all([
      Review.find({ userId: userObjectId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path:   "dishId",
          select: "name image dishType availability tags",
          populate: { path: "vendor", select: "name logo" },
        })
        .lean(),
      Review.countDocuments({ userId: userObjectId }),
      Review.aggregate([
        { $match: { userId: userObjectId } },
        { $group: { _id: null, avg: { $avg: "$overallRating" }, count: { $sum: 1 } } },
      ]),
    ]);

    let avgRating = 0;
    if (stats[0]?.avg != null) {
      avgRating = Math.round(stats[0].avg * 10) / 10;
    } else if (total === 1 && reviews[0]?.overallRating) {
      avgRating = reviews[0].overallRating;
    }

    return res.status(200).json({
      success: true,
      data: {
        reviews,
        totalReviews: total,
        avgRating,
        page,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("getMyReviews:", err);
    return res.status(500).json({ success: false, msg: "Internal server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DISH REQUEST
// POST /user/dish-request
// ─────────────────────────────────────────────────────────────────────────────
export const submitDishRequest = async (req, res) => {
  try {
    const { id: userId, organizationId } = req.user;
    const {
      requestedDate,
      dishSuggestion    = "",
      dietaryPreference = "Both",
      spiceLevel        = "Normal",
    } = req.body;

    if (!requestedDate) {
      return res.status(400).json({ success: false, msg: "requestedDate is required" });
    }

    const date = new Date(requestedDate);
    if (isNaN(date.getTime())) {
      return res.status(400).json({ success: false, msg: "Invalid requestedDate" });
    }

    const { start, end } = getDayRange(date);

    const request = await DishRequest.findOneAndUpdate(
      { userId, requestedDate: { $gte: start, $lte: end } },
      {
        $set: {
          userId,
          organizationId: organizationId ?? null,
          requestedDate:  date,
          dishSuggestion,
          dietaryPreference,
          spiceLevel,
          status: "pending",
        },
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({ success: true, data: request });
  } catch (err) {
    console.error("submitDishRequest:", err);
    return res.status(500).json({ success: false, msg: "Internal server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CONSUMPTION STATS
// GET /user/consumption-stats?period=week|month|year
// ─────────────────────────────────────────────────────────────────────────────
export const getConsumptionStats = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const period = req.query.period ?? "week";

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const now = new Date();
    let start, end;

    if (period === "week") {
      const day  = now.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      start = new Date(now);
      start.setDate(now.getDate() + diff);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else if (period === "month") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else {
      start = new Date(now.getFullYear(), 0, 1);
      end   = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    }

    const allAttendances = await Attendance.find({
      userId: userObjectId,
      date: { $gte: start, $lte: end },
    }).lean();

    const attended = allAttendances.filter(a => a.response === "yes");
    const skipped  = allAttendances.filter(a => a.response === "no");

    let chartData = [];

    if (period === "week") {
      const days   = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const counts = Array(7).fill(0);
      attended.forEach(a => {
        const d   = new Date(a.date);
        const idx = d.getDay() === 0 ? 6 : d.getDay() - 1;
        counts[idx]++;
      });
      chartData = days.map((day, i) => ({ day, meals: counts[i] }));

    } else if (period === "month") {
      const counts = [0, 0, 0, 0];
      attended.forEach(a => {
        const weekIdx = Math.min(Math.floor((new Date(a.date).getDate() - 1) / 7), 3);
        counts[weekIdx]++;
      });
      chartData = ["W1", "W2", "W3", "W4"].map((day, i) => ({ day, meals: counts[i] }));

    } else {
      const counts = Array(12).fill(0);
      attended.forEach(a => { counts[new Date(a.date).getMonth()]++; });
      chartData = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
        .map((day, i) => ({ day, meals: counts[i] }));
    }

    const scheduleIds = attended.map(a => a.scheduleId).filter(Boolean);
    const schedules   = await MenuSchedule.find({ _id: { $in: scheduleIds } })
      .populate({ path: "dish", select: "name" })
      .lean();

    const freq = {};
    schedules.forEach(s => {
      const name = s.dish?.name;
      if (name) freq[name] = (freq[name] ?? 0) + 1;
    });
    const mostEaten = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

    const allYes = await Attendance.find({ userId: userObjectId, response: "yes" })
      .sort({ date: -1 })
      .lean();

    let streak = 0;
    let cursor = new Date();
    cursor.setHours(0, 0, 0, 0);

    for (const a of allYes) {
      const d = new Date(a.date);
      d.setHours(0, 0, 0, 0);
      const diff = Math.round((cursor.getTime() - d.getTime()) / 86400000);
      if (diff === 0 || diff === 1) { streak++; cursor = d; }
      else break;
    }

    return res.status(200).json({
      success: true,
      data: {
        period,
        daysAttended:  attended.length,
        daysSkipped:   skipped.length,
        totalMeals:    attended.length,
        mostEaten,
        currentStreak: streak,
        chartData,
      },
    });
  } catch (err) {
    console.error("getConsumptionStats:", err);
    return res.status(500).json({ success: false, msg: "Internal server error" });
  }
};