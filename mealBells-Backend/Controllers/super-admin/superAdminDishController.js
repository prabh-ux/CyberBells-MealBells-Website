// Controllers/super-admin/superAdminDishController.js
import mongoose    from "mongoose";
import { dishModel as Dish } from "../../Models/dish.js";
import { userModel }         from "../../Models/user.js";
import { MenuSchedule }      from "../../Models/menuSchedule.js";
import { organizationModel as Organization } from "../../Models/organization.js";
import { logActivity } from "../../utils/logActivity.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

const resolveOrgId = async (orgId) => {
  if (orgId && orgId !== "all" && mongoose.Types.ObjectId.isValid(orgId))
    return new mongoose.Types.ObjectId(orgId);
  return null;
};

const getOrgVendors = async (organizationId) => {
  if (!organizationId) return [];
  return userModel
    .find({ type: "vendor", active: true, organizationId }, "_id name logo email")
    .lean();
};

// ── GET /super-admin/menu/schedules?orgId=xxx ─────────────────────────────────
export const getSuperSchedules = async (req, res) => {
  try {
    const { orgId = "all" } = req.query;

    let filter = {};
    if (orgId !== "all") {
      const oid = await resolveOrgId(orgId);
      if (!oid) return res.status(400).json({ success: false, msg: "Invalid orgId." });
      filter.organizationId = oid;
    }

    const schedules = await MenuSchedule
      .find(filter)
      .populate({
        path:     "dish",
        populate: { path: "vendor", select: "name email logo rating foodType" },
      })
      .sort({ scheduledDate: -1 });

    const valid = schedules.filter(s => s.dish != null);
    return res.status(200).json({ success: true, schedules: valid });
  } catch (err) {
    console.error("[getSuperSchedules]", err);
    return res.status(500).json({ success: false, msg: "Internal error: " + err.message });
  }
};

// ── GET /super-admin/dishes?orgId=xxx ─────────────────────────────────────────
export const getSuperDishes = async (req, res) => {
  try {
    const { orgId = "all" } = req.query;

    let filter = {};
    if (orgId !== "all") {
      const oid = await resolveOrgId(orgId);
      if (!oid) return res.status(400).json({ success: false, msg: "Invalid orgId." });
      filter.organizationId = oid;
    }

    const dishes = await Dish
      .find(filter)
      .populate("vendor", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, dishes });
  } catch (err) {
    console.error("[getSuperDishes]", err);
    return res.status(500).json({ success: false, msg: "Internal error: " + err.message });
  }
};

// ── GET /super-admin/dishes/:id ───────────────────────────────────────────────
export const getSuperDishById = async (req, res) => {
  try {
    const dish = await Dish
      .findById(req.params.id)
      .populate("vendor", "name email");

    if (!dish) return res.status(404).json({ success: false, msg: "Dish not found." });

    const schedule = await MenuSchedule
      .findOne({ dish: req.params.id })
      .lean();

    return res.status(200).json({ success: true, dish, schedule: schedule ?? null });
  } catch (err) {
    console.error("[getSuperDishById]", err);
    return res.status(500).json({ success: false, msg: "Internal error: " + err.message });
  }
};

// ── GET /super-admin/menu/vendors?orgId=xxx ───────────────────────────────────
export const getSuperMenuVendors = async (req, res) => {
  try {
    const { orgId } = req.query;
    if (!orgId || orgId === "all")
      return res.status(400).json({ success: false, msg: "orgId is required." });

    const oid = await resolveOrgId(orgId);
    if (!oid) return res.status(400).json({ success: false, msg: "Invalid orgId." });

    const vendors = await getOrgVendors(oid);
    return res.status(200).json({ success: true, vendors });
  } catch (err) {
    console.error("[getSuperMenuVendors]", err);
    return res.status(500).json({ success: false, msg: "Internal error: " + err.message });
  }
};

// ── POST /super-admin/dishes/add ──────────────────────────────────────────────
export const addSuperDish = async (req, res) => {
  try {
    const {
      name, dishType, description, ingredients,
      vendor, availability, qualityScore,
      estimatedCalories, prepTime, scheduledDate, orgId,
    } = req.body;

    if (!name?.trim())
      return res.status(400).json({ success: false, msg: "Dish name is required." });
    if (!orgId || orgId === "all")
      return res.status(400).json({ success: false, msg: "Organization is required." });

    const organizationId = await resolveOrgId(orgId);
    if (!organizationId)
      return res.status(400).json({ success: false, msg: "Invalid orgId." });

    let vendorId = null;
    if (vendor && vendor !== "All Vendors") {
      const found = await userModel.findOne({
        _id: vendor, type: "vendor", organizationId,
      });
      if (!found) return res.status(404).json({ success: false, msg: "Vendor not found." });
      vendorId = found._id;
    }

    const dish = await Dish.create({
      name:              name.trim(),
      dishType:          dishType          || "Veg",
      description:       description       || "",
      ingredients:       ingredients       || "",
      image:             req.file?.path    ?? "",
      vendor:            vendorId,
      organizationId,
      availability:      availability      || "Full Time",
      qualityScore:      qualityScore      || "High",
      estimatedCalories: estimatedCalories || "450 kcal",
      prepTime:          prepTime          || "20 mins",
    });

    await logActivity({
      userId: req.user.id,
      name:   req.user.name  ?? "Super Admin",
      email:  req.user.email ?? "",
      action: `Dish Added: ${dish.name}`,
      status: "Success",
    });

    let schedule = null;
    if (scheduledDate) {
      const dayStart = new Date(scheduledDate); dayStart.setHours(0,  0,  0,   0);
      const dayEnd   = new Date(scheduledDate); dayEnd.setHours(23, 59, 59, 999);

      const conflict = await MenuSchedule.findOne({
        organizationId,
        scheduledDate: { $gte: dayStart, $lte: dayEnd },
      });

      if (conflict) {
        const populated = await dish.populate("vendor", "name email");
        return res.status(409).json({
          success: false,
          msg: "Dish saved but a dish is already scheduled on this date.",
          dish: populated,
          scheduleError: true,
        });
      }

      schedule = await MenuSchedule.create({
        dish:          dish._id,
        scheduledDate: new Date(scheduledDate),
        scheduledBy:   req.user.id,
        organizationId,
      });
    }

    const populated = await dish.populate("vendor", "name email");
    return res.status(201).json({
      success:  true,
      msg:      scheduledDate ? "Dish created and scheduled." : "Dish created successfully.",
      dish:     populated,
      schedule,
    });
  } catch (err) {
    console.error("[addSuperDish]", err);
    return res.status(500).json({ success: false, msg: "Internal error: " + err.message });
  }
};

// ── PUT /super-admin/dishes/:id ───────────────────────────────────────────────
export const updateSuperDish = async (req, res) => {
  try {
    const existing = await Dish.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, msg: "Dish not found." });

    const fields = [
      "name", "dishType", "description", "ingredients",
      "availability", "qualityScore", "estimatedCalories", "prepTime",
    ];
    const updates = {};
    fields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    if (req.file?.path) updates.image = req.file.path;

    // Vendor update
    if (req.body.vendor !== undefined) {
      if (!req.body.vendor || req.body.vendor === "All Vendors") {
        updates.vendor = null;
      } else {
        const found = await userModel.findOne({
          _id: req.body.vendor, type: "vendor",
          organizationId: existing.organizationId,
        });
        if (!found) return res.status(404).json({ success: false, msg: "Vendor not found." });
        updates.vendor = found._id;
      }
    }

    // Schedule update
    if (req.body.scheduledDate) {
      const dayStart = new Date(req.body.scheduledDate); dayStart.setHours(0,  0,  0,   0);
      const dayEnd   = new Date(req.body.scheduledDate); dayEnd.setHours(23, 59, 59, 999);

      const conflict = await MenuSchedule.findOne({
        organizationId: existing.organizationId,
        scheduledDate:  { $gte: dayStart, $lte: dayEnd },
        dish:           { $ne: req.params.id },
      });

      if (conflict) {
        await Dish.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true });
        const populated = await Dish.findById(req.params.id).populate("vendor", "name email");
        return res.status(409).json({
          success: false,
          msg: "Dish updated but another dish is already scheduled on this date.",
          dish: populated,
          scheduleError: true,
        });
      }

      await MenuSchedule.findOneAndUpdate(
        { dish: req.params.id, organizationId: existing.organizationId },
        {
          dish:          req.params.id,
          scheduledDate: new Date(req.body.scheduledDate),
          scheduledBy:   req.user.id,
          organizationId: existing.organizationId,
        },
        { upsert: true, new: true }
      );
    }

    await Dish.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true });
    const populated = await Dish.findById(req.params.id).populate("vendor", "name email");

    await logActivity({
      userId: req.user.id,
      name:   req.user.name  ?? "Super Admin",
      email:  req.user.email ?? "",
      action: `Dish Updated: ${populated.name}`,
      status: "Success",
    });

    return res.status(200).json({ success: true, msg: "Dish updated successfully.", dish: populated });
  } catch (err) {
    console.error("[updateSuperDish]", err);
    return res.status(500).json({ success: false, msg: "Internal error: " + err.message });
  }
};

// ── DELETE /super-admin/dishes/:id ────────────────────────────────────────────
export const deleteSuperDish = async (req, res) => {
  try {
    const dish = await Dish.findById(req.params.id);
    if (!dish) return res.status(404).json({ success: false, msg: "Dish not found." });

    await Dish.findByIdAndDelete(req.params.id);
    await MenuSchedule.deleteOne({ dish: req.params.id });

    await logActivity({
      userId: req.user.id,
      name:   req.user.name  ?? "Super Admin",
      email:  req.user.email ?? "",
      action: `Dish Deleted: ${dish.name}`,
      status: "Critical",
    });

    return res.status(200).json({ success: true, msg: "Dish deleted successfully." });
  } catch (err) {
    console.error("[deleteSuperDish]", err);
    return res.status(500).json({ success: false, msg: "Internal error: " + err.message });
  }
};