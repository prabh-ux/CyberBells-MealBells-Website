// Controllers/vendor/vendorDishController.js
import mongoose from "mongoose";
import { dishModel }    from "../../Models/dish.js";
import { MenuSchedule } from "../../Models/menuSchedule.js";
import { userModel }    from "../../Models/user.js";

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

// ── Helper: resolve & validate orgId for this vendor ─────────────────────────
const resolveOrgId = async (vendorUserId, orgIdParam) => {
  const vendor = await userModel.findById(vendorUserId).select("organizationId").lean();
  const vendorOrgIds = vendor?.organizationId ?? [];
  if (!vendorOrgIds.length) return null;
  if (orgIdParam) {
    const match = vendorOrgIds.find(id => id.toString() === orgIdParam);
    return match ?? null;
  }
  return vendorOrgIds[0];
};

// ── GET /vendor/dishes ────────────────────────────────────────────────────────
// Dishes belong to the vendor, not an org — no org filter needed here.
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
// Body: { name, dishType, description, ingredients, estimatedCalories, date, orgId }
// orgId is required when scheduling — tells us which org's calendar to put it on
export const createVendorDish = async (req, res) => {
  try {
    const vendorId = new mongoose.Types.ObjectId(req.user.id);
    const { name, dishType, description, ingredients, estimatedCalories, date, orgId } = req.body;

    if (!name?.trim()) return res.status(400).json({ success: false, msg: "Dish name is required" });

    // ✅ FIX: store organizationId on the dish itself
    // If orgId provided, validate + use it; otherwise use vendor's first org
    const organizationId = await resolveOrgId(req.user.id, orgId);
    if (!organizationId) {
      return res.status(400).json({ success: false, msg: "Vendor has no associated organization" });
    }

    const dish = await dishModel.create({
      name:              name.trim(),
      dishType:          dishType          || "Veg",
      description:       description       || "",
      ingredients:       ingredients       || "",
      estimatedCalories: estimatedCalories || "",
      image:             req.file?.path    ?? "",
      vendor:            vendorId,
      organizationId,                        // ✅ NEW — tag dish with org
    });

    let schedule = null;
    if (date) {
      const dayStart = new Date(date); dayStart.setUTCHours(0, 0, 0, 0);
      const dayEnd   = new Date(date); dayEnd.setUTCHours(23, 59, 59, 999);

      // ✅ FIX: conflict check scoped to this org only
      const conflict = await MenuSchedule.findOne({
        organizationId,                        // ✅ org-scoped conflict
        scheduledDate: { $gte: dayStart, $lte: dayEnd },
      });
      if (conflict) {
        return res.status(409).json({ success: false, msg: "A dish is already scheduled on this date for this organization" });
      }

      // ✅ FIX: save organizationId on schedule
      schedule = await MenuSchedule.create({
        dish:          dish._id,
        scheduledDate: dayStart,
        scheduledBy:   req.user.id,
        organizationId,                        // ✅ org-scoped
      });
    }

    return res.status(201).json({ success: true, data: { dish, schedule } });
  } catch (err) {
    console.error("createVendorDish:", err);
    return res.status(500).json({ success: false, msg: "Internal server error" });
  }
};