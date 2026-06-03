import mongoose from "mongoose";
import { dishModel }    from "../../Models/dish.js";
import { MenuSchedule } from "../../Models/menuSchedule.js";

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

// ── GET /vendor/dishes ────────────────────────────────────────────────────────
export const getVendorDishes = async (req, res) => {
  try {
    const vendorId = new mongoose.Types.ObjectId(req.user.id);
    const dishes = await dishModel
      .find({ vendor: vendorId })
      .select("name image dishType estimatedCalories tags")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ success: true, dishes });
  } catch (err) {
    console.error("getVendorDishes:", err);
    return res.status(500).json({ success: false, msg: "Internal server error" });
  }
};

// ── PUT /vendor/dish/:dishId ──────────────────────────────────────────────────
export const updateVendorDish = async (req, res) => {
  try {
    const vendorId      = new mongoose.Types.ObjectId(req.user.id);
    const vendorDishIds = await dishModel.find({ vendor: vendorId }).distinct("_id");

    const belongs = vendorDishIds.some(id => id.toString() === req.params.dishId);
    if (!belongs) return res.status(403).json({ success: false, msg: "Dish not found or not yours" });

    const updated = await applyDishUpdates(req.params.dishId, req.body, req.file);
    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error("updateVendorDish:", err);
    return res.status(500).json({ success: false, msg: "Internal server error" });
  }
};

// ── POST /vendor/dishes ───────────────────────────────────────────────────────
export const createVendorDish = async (req, res) => {
  try {
    const vendorId = new mongoose.Types.ObjectId(req.user.id);
    const { name, dishType, description, ingredients, estimatedCalories, date } = req.body;

    if (!name?.trim()) return res.status(400).json({ success: false, msg: "Dish name is required" });

    const dish = await dishModel.create({
      name:              name.trim(),
      dishType:          dishType          || "Veg",
      description:       description       || "",
      ingredients:       ingredients       || "",
      estimatedCalories: estimatedCalories || "",
      image:             req.file?.path    ?? "",
      vendor:            vendorId,
    });

    let schedule = null;
    if (date) {
      const dayStart = new Date(date); dayStart.setUTCHours(0, 0, 0, 0);
      const dayEnd   = new Date(date); dayEnd.setUTCHours(23, 59, 59, 999);

      const conflict = await MenuSchedule.findOne({
        scheduledDate: { $gte: dayStart, $lte: dayEnd },
      });
      if (conflict) {
        return res.status(409).json({ success: false, msg: "A dish is already scheduled on this date" });
      }

      schedule = await MenuSchedule.create({
        dish:          dish._id,
        scheduledDate: dayStart,
        scheduledBy:   req.user.id,
      });
    }

    return res.status(201).json({ success: true, data: { dish, schedule } });
  } catch (err) {
    console.error("createVendorDish:", err);
    return res.status(500).json({ success: false, msg: "Internal server error" });
  }
};
