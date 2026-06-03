import { dishModel }    from "../../Models/dish.js";
import { userModel }    from "../../Models/user.js";
import { MenuSchedule } from "../../Models/menuSchedule.js";

// ── Shared: core field update for a dish document ─────────────────────────────
export const applyDishUpdates = async (dishId, body, file) => {
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

// ── POST /admin/dishes/add ────────────────────────────────────────────────────
export const addDish = async (req, res) => {
  try {
    const {
      name, dishType, description, ingredients,
      vendor, availability,
      qualityScore, estimatedCalories, prepTime,
      scheduledDate,
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ success: false, msg: "Dish name is required" });
    }

    let vendorId = null;
    if (vendor && vendor !== "All Vendors") {
      const found = await userModel.findOne({ _id: vendor, type: "vendor" });
      if (!found) return res.status(404).json({ success: false, msg: "Vendor not found" });
      vendorId = found._id;
    }

    const dish = await dishModel.create({
      name:              name.trim(),
      dishType:          dishType          || "Veg",
      description:       description       || "",
      ingredients:       ingredients       || "",
      image:             req.file?.path    ?? "",
      vendor:            vendorId,
      availability:      availability      || "Full Time",
      qualityScore:      qualityScore      || "High",
      estimatedCalories: estimatedCalories || "450 kcal",
      prepTime:          prepTime          || "20 mins",
    });

    let schedule = null;
    if (scheduledDate) {
      const dayStart = new Date(scheduledDate); dayStart.setHours(0, 0, 0, 0);
      const dayEnd   = new Date(scheduledDate); dayEnd.setHours(23, 59, 59, 999);

      const conflict = await MenuSchedule.findOne({
        scheduledDate: { $gte: dayStart, $lte: dayEnd },
      });

      if (conflict) {
        const populated = await dish.populate("vendor", "name email");
        return res.status(409).json({
          success:       false,
          msg:           "Dish saved but a dish is already scheduled on this date",
          dish:          populated,
          scheduleError: true,
        });
      }

      schedule = await MenuSchedule.create({
        dish:          dish._id,
        scheduledDate: new Date(scheduledDate),
        scheduledBy:   req.user.id,
      });
    }

    const populated = await dish.populate("vendor", "name email");
    return res.status(201).json({
      success:  true,
      msg:      scheduledDate ? "Dish created and scheduled" : "Dish created successfully",
      dish:     populated,
      schedule,
    });
  } catch (err) {
    console.error("Add dish error:", err);
    return res.status(500).json({ success: false, msg: "Internal error: " + err.message });
  }
};

// ── GET /admin/dishes ─────────────────────────────────────────────────────────
export const getDishes = async (req, res) => {
  try {
    const { dishType, vendor, availability } = req.query;
    const filter = {};
    if (dishType)     filter.dishType     = dishType;
    if (vendor)       filter.vendor       = vendor;
    if (availability) filter.availability = availability;

    const dishes = await dishModel
      .find(filter)
      .populate("vendor", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, dishes });
  } catch (err) {
    return res.status(500).json({ success: false, msg: "Internal error: " + err.message });
  }
};

// ── GET /admin/dishes/:id ─────────────────────────────────────────────────────
export const getDishById = async (req, res) => {
  try {
    const dish = await dishModel
      .findById(req.params.id)
      .populate("vendor", "name email");

    if (!dish) return res.status(404).json({ success: false, msg: "Dish not found" });

    const schedule = await MenuSchedule.findOne({ dish: req.params.id }).lean();

    return res.status(200).json({ success: true, dish, schedule: schedule ?? null });
  } catch (err) {
    return res.status(500).json({ success: false, msg: "Internal error: " + err.message });
  }
};

// ── PUT /admin/dishes/:id/update ──────────────────────────────────────────────
export const updateDish = async (req, res) => {
  try {
    const existing = await dishModel.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, msg: "Dish not found" });

    // resolve vendor change if provided
    if (req.body.vendor !== undefined) {
      if (!req.body.vendor || req.body.vendor === "All Vendors") {
        req.body.vendor = null;
      } else {
        const found = await userModel.findOne({ _id: req.body.vendor, type: "vendor" });
        if (!found) return res.status(404).json({ success: false, msg: "Vendor not found" });
        req.body.vendor = found._id;
      }
    }

    // handle schedule conflict if scheduledDate provided
    if (req.body.scheduledDate) {
      const dayStart = new Date(req.body.scheduledDate); dayStart.setHours(0, 0, 0, 0);
      const dayEnd   = new Date(req.body.scheduledDate); dayEnd.setHours(23, 59, 59, 999);

      const conflict = await MenuSchedule.findOne({
        scheduledDate: { $gte: dayStart, $lte: dayEnd },
        dish:          { $ne: req.params.id },
      });

      if (conflict) {
        const updated = await applyDishUpdates(req.params.id, req.body, req.file);
        const populated = await dishModel.findById(updated._id).populate("vendor", "name email");
        return res.status(409).json({
          success:       false,
          msg:           "Dish updated but another dish is already scheduled on this date",
          dish:          populated,
          scheduleError: true,
        });
      }

      await MenuSchedule.findOneAndUpdate(
        { dish: req.params.id },
        {
          dish:          req.params.id,
          scheduledDate: new Date(req.body.scheduledDate),
          scheduledBy:   req.user.id,
        },
        { upsert: true, new: true }
      );
    }

    const updated   = await applyDishUpdates(req.params.id, req.body, req.file);
    const populated = await dishModel.findById(updated._id).populate("vendor", "name email");
    return res.status(200).json({ success: true, msg: "Dish updated successfully", dish: populated });
  } catch (err) {
    console.error("Update dish error:", err);
    return res.status(500).json({ success: false, msg: "Internal error: " + err.message });
  }
};

// ── DELETE /admin/dishes/:id ──────────────────────────────────────────────────
export const deleteDish = async (req, res) => {
  try {
    const dish = await dishModel.findByIdAndDelete(req.params.id);
    if (!dish) return res.status(404).json({ success: false, msg: "Dish not found" });

    await MenuSchedule.deleteOne({ dish: req.params.id });

    return res.status(200).json({ success: true, msg: "Dish deleted successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, msg: "Internal error: " + err.message });
  }
};

// ── GET /admin/menu/schedules ─────────────────────────────────────────────────
export const getSchedules = async (req, res) => {
  try {
    const schedules = await MenuSchedule
      .find()
      .populate({
        path:     "dish",
        populate: { path: "vendor", select: "name email logo rating foodType" },
      })
      .sort({ scheduledDate: -1 });

    const valid = schedules.filter(s => s.dish != null);

    return res.status(200).json({ success: true, schedules: valid });
  } catch (err) {
    return res.status(500).json({ success: false, msg: "Internal error: " + err.message });
  }
};