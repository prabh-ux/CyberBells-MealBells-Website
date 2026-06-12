import { MenuSchedule } from "../../Models/menuSchedule.js";
import { Attendance }   from "../../Models/attendance.js";
import { Review }       from "../../Models/review.js";
import { userModel }    from "../../Models/user.js";
import { Delivery }     from "../../Models/delivery.js"; 

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

// GET /user/menu-today
export const getTodayMenu = async (req, res) => {
  try {
    const { start, end } = getDayRange();
    const { id: userId, organizationId } = req.user;

    const schedule = await MenuSchedule
      .findOne({
        organizationId,
        scheduledDate: { $gte: start, $lte: end }
      })
      .populate(DISH_POPULATE)
      .lean();

    if (!schedule || !schedule.dish) {
      return res.status(404).json({ success: false, msg: "No menu scheduled for today" });
    }

    const [yesAttendances, myAttendance, delivery] = await Promise.all([
      Attendance.find({
        organizationId,
        date:     { $gte: start, $lte: end },
        response: "yes",
      }).select("userId").lean(),

      Attendance.findOne({ userId, date: { $gte: start, $lte: end } }).lean(),

      Delivery.findOne({ scheduleId: schedule._id }).lean(),
    ]);

    const colleaguesEating = yesAttendances.length;

    const colleagueUserIds = yesAttendances
      .map(a => a.userId?.toString())
      .filter(id => id && id !== userId.toString())
      .slice(0, 3);

    const colleagueUsers = await userModel
      .find({ _id: { $in: colleagueUserIds } })
      .select("avatar name")
      .lean();

    const colleagueAvatars = colleagueUsers.map(u => u.avatar).filter(Boolean);

    return res.status(200).json({
      success: true,
      data: {
        scheduleId:        schedule._id,
        scheduledDate:     schedule.scheduledDate,
        dish:              schedule.dish,
        colleaguesEating,
        colleagueAvatars,
        myResponse:        myAttendance?.response ?? null,
        deliveryCompleted: delivery?.status === "handed_over" ?? false,
      },
    });
  } catch (err) {
    console.error("getTodayMenu:", err);
    return res.status(500).json({ success: false, msg: "Internal server error" });
  }
};

// GET /user/menu-weekly
export const getWeeklyMenu = async (req, res) => {
  try {
    const { id: userId, organizationId } = req.user;
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
        .find({
          organizationId,
          scheduledDate: { $gte: monday, $lte: friday }
        })
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


// ── GET /user/dish/:scheduleId ────────────────────────────────────────────────
export const getDishDetails = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const { id: userId, organizationId } = req.user;

    const schedule = await MenuSchedule
      .findOne({ _id: scheduleId, organizationId })
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