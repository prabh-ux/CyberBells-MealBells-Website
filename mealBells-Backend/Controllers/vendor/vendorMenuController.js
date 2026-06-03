import mongoose from "mongoose";
import { dishModel }    from "../../Models/dish.js";
import { MenuSchedule } from "../../Models/menuSchedule.js";
import { Attendance }   from "../../Models/attendance.js";

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

const applyDishUpdates = async (dishId, body, file) => {
  const fields = [
    "name", "dishType", "description", "ingredients",
    "estimatedCalories", "tags", "protein", "carbs",
    "availability", "qualityScore", "prepTime",
  ];
  const updates = {};
  fields.forEach(f => { if (body[f] !== undefined) updates[f] = body[f]; });
  if (file?.path) updates.image = file.path;

  return dishModel.findByIdAndUpdate(dishId, { $set: updates }, { new: true }).lean();
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
    const vendorId                           = new mongoose.Types.ObjectId(req.user.id);
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

// ── GET /vendor/menu/schedule/:scheduleId ─────────────────────────────────────
export const getVendorScheduleById = async (req, res) => {
  try {
    const vendorId      = new mongoose.Types.ObjectId(req.user.id);
    const vendorDishIds = await dishModel.find({ vendor: vendorId }).distinct("_id");

    const schedule = await MenuSchedule
      .findOne({ _id: req.params.scheduleId, dish: { $in: vendorDishIds } })
      .populate("dish", "name image dishType estimatedCalories tags description")
      .lean();

    if (!schedule) {
      return res.status(404).json({ success: false, msg: "Schedule not found" });
    }

    return res.status(200).json({ success: true, data: schedule });
  } catch (err) {
    console.error("getVendorScheduleById:", err);
    return res.status(500).json({ success: false, msg: "Internal server error" });
  }
};

// ── PUT /vendor/menu/schedule/:scheduleId ─────────────────────────────────────
export const updateVendorScheduleDish = async (req, res) => {
  try {
    const vendorId      = new mongoose.Types.ObjectId(req.user.id);
    const vendorDishIds = await dishModel.find({ vendor: vendorId }).distinct("_id");

    const schedule = await MenuSchedule.findOne({
      _id:  req.params.scheduleId,
      dish: { $in: vendorDishIds },
    });

    if (!schedule) {
      return res.status(404).json({ success: false, msg: "Schedule not found" });
    }

    const { dishId } = req.body;
    if (!dishId) return res.status(400).json({ success: false, msg: "dishId is required" });

    const belongs = vendorDishIds.some(id => id.toString() === dishId);
    if (!belongs) {
      return res.status(403).json({ success: false, msg: "Dish does not belong to this vendor" });
    }

    schedule.dish = dishId;
    await schedule.save();

    const populated = await MenuSchedule
      .findById(schedule._id)
      .populate("dish", "name image dishType estimatedCalories tags description")
      .lean();

    return res.status(200).json({ success: true, data: populated });
  } catch (err) {
    console.error("updateVendorScheduleDish:", err);
    return res.status(500).json({ success: false, msg: "Internal server error" });
  }
};

// ── POST /vendor/menu/schedule ────────────────────────────────────────────────
export const createVendorSchedule = async (req, res) => {
  try {
    const vendorId      = new mongoose.Types.ObjectId(req.user.id);
    const vendorDishIds = await dishModel.find({ vendor: vendorId }).distinct("_id");

    const { dishId, date } = req.body;
    if (!dishId || !date) {
      return res.status(400).json({ success: false, msg: "dishId and date are required" });
    }

    const belongs = vendorDishIds.some(id => id.toString() === dishId);
    if (!belongs) {
      return res.status(403).json({ success: false, msg: "Dish does not belong to this vendor" });
    }

    const dayStart = new Date(date); dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd   = new Date(date); dayEnd.setUTCHours(23, 59, 59, 999);

    const conflict = await MenuSchedule.findOne({
      scheduledDate: { $gte: dayStart, $lte: dayEnd },
    });
    if (conflict) {
      return res.status(409).json({ success: false, msg: "A dish is already scheduled on this date" });
    }

    const schedule = await MenuSchedule.create({
      dish:          dishId,
      scheduledDate: dayStart,
      scheduledBy:   req.user.id,
    });

    const populated = await MenuSchedule
      .findById(schedule._id)
      .populate("dish", "name image dishType estimatedCalories tags description")
      .lean();

    return res.status(201).json({ success: true, data: populated });
  } catch (err) {
    console.error("createVendorSchedule:", err);
    return res.status(500).json({ success: false, msg: "Internal server error" });
  }
};
