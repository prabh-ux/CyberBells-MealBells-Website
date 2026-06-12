import { dishModel }    from "../../Models/dish.js";
import { userModel }    from "../../Models/user.js";
import { MenuSchedule } from "../../Models/menuSchedule.js";
import { logActivity }  from "../../utils/logActivity.js";

// ── Org helpers ───────────────────────────────────────────────────────────────
const getAdminOrgId = async (adminUserId) => {
  const admin = await userModel.findById(adminUserId).select("organizationId").lean();
  return admin?.organizationId?.[0] ?? null;  // always extract index [0] — it's an array
};

const getOrgVendorIds = async (organizationId) => {
  if (!organizationId) return [];
  const vendors = await userModel.find(
    { type: "vendor", organizationId: organizationId }, // ✅ no $in wrap — already a single ObjectId
    "_id"
  ).lean();
  return vendors.map(v => v._id);
};

// ── Shared: apply core field updates ─────────────────────────────────────────
export const applyDishUpdates = async (dishId, body, file) => {
  const fields = [
    "name", "dishType", "description", "ingredients",
    "estimatedCalories", "tags", "protein", "carbs",
    "availability", "qualityScore", "prepTime",
  ];
  const updates = {};
  fields.forEach((f) => { if (body[f] !== undefined) updates[f] = body[f]; });
  if (file?.path) updates.image = file.path;

  return dishModel.findByIdAndUpdate(dishId, { $set: updates }, { new: true }).lean();
};

// ── POST /admin/dishes/add ────────────────────────────────────────────────────
export const addDish = async (req, res) => {
  try {
    // ✅ FIX: get org first — needed for scoping MenuSchedule and the dish itself
    const organizationId = await getAdminOrgId(req.user.id);
    if (!organizationId) {
      return res.status(403).json({ success: false, msg: "Admin has no organization." });
    }

    const {
      name, dishType, description, ingredients,
      vendor, availability, qualityScore,
      estimatedCalories, prepTime, scheduledDate,
    } = req.body;

    if (!name?.trim())
      return res.status(400).json({ success: false, msg: "Dish name is required" });

    let vendorId = null;
    if (vendor && vendor !== "All Vendors") {
      // ✅ FIX: verify vendor belongs to this org, not just any vendor
      const orgVendorIds = await getOrgVendorIds(organizationId);
      const found = await userModel.findOne({
        _id:            vendor,
        type:           "vendor",
        organizationId: organizationId, // ✅ scoped to org
      });
      if (!found) return res.status(404).json({ success: false, msg: "Vendor not found" });
      vendorId = found._id;
    }

    // ✅ FIX: store organizationId on the dish so it can be queried later
    const dish = await dishModel.create({
      name:              name.trim(),
      dishType:          dishType          || "Veg",
      description:       description       || "",
      ingredients:       ingredients       || "",
      image:             req.file?.path    ?? "",
      vendor:            vendorId,
      organizationId,                         // ✅ NEW
      availability:      availability      || "Full Time",
      qualityScore:      qualityScore      || "High",
      estimatedCalories: estimatedCalories || "450 kcal",
      prepTime:          prepTime          || "20 mins",
    });

    await logActivity({
      userId: req.user.id,
      name:   req.user.name  ?? "Admin",
      email:  req.user.email ?? "",
      action: `Dish Added: ${dish.name}`,
      status: "Success",
    });

    let schedule = null;
    if (scheduledDate) {
      const dayStart = new Date(scheduledDate); dayStart.setHours(0,  0,  0,   0);
      const dayEnd   = new Date(scheduledDate); dayEnd.setHours(23, 59, 59, 999);

      // ✅ FIX: scope conflict check to THIS org only
      const conflict = await MenuSchedule.findOne({
        organizationId,                         // ✅ NEW
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

      // ✅ FIX: store organizationId when creating the schedule
      schedule = await MenuSchedule.create({
        dish:          dish._id,
        scheduledDate: new Date(scheduledDate),
        scheduledBy:   req.user.id,
        organizationId,                         // ✅ NEW
      });

      await logActivity({
        userId: req.user.id,
        name:   req.user.name  ?? "Admin",
        email:  req.user.email ?? "",
        action: `Dish Scheduled: ${dish.name}`,
        status: "Success",
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
    const { dishType, availability } = req.query;

    const organizationId = await getAdminOrgId(req.user.id);
    if (!organizationId) return res.status(200).json({ success: true, dishes: [] });

    // ✅ FIX: scope by organizationId on the dish directly — no vendor detour needed
    const filter = { organizationId };

    // vendor sub-filter: still validate it belongs to this org
    if (req.query.vendor) {
      const orgVendorIds = await getOrgVendorIds(organizationId);
      const requestedVendor = orgVendorIds.find(id => String(id) === req.query.vendor);
      if (requestedVendor) filter.vendor = requestedVendor;
      else return res.status(200).json({ success: true, dishes: [] });
    }

    if (dishType)     filter.dishType     = dishType;
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
    const organizationId = await getAdminOrgId(req.user.id);
    if (!organizationId) return res.status(404).json({ success: false, msg: "Dish not found" });

    // ✅ FIX: scope by organizationId on the dish itself
    const dish = await dishModel
      .findOne({ _id: req.params.id, organizationId })
      .populate("vendor", "name email");

    if (!dish) return res.status(404).json({ success: false, msg: "Dish not found" });

    // ✅ FIX: scope schedule lookup to this org
    const schedule = await MenuSchedule.findOne({
      dish:           req.params.id,
      organizationId,                           // ✅ NEW
    }).lean();

    return res.status(200).json({ success: true, dish, schedule: schedule ?? null });
  } catch (err) {
    return res.status(500).json({ success: false, msg: "Internal error: " + err.message });
  }
};

// ── PUT /admin/dishes/:id/update ──────────────────────────────────────────────
export const updateDish = async (req, res) => {
  try {
    const organizationId = await getAdminOrgId(req.user.id);
    if (!organizationId) return res.status(404).json({ success: false, msg: "Dish not found" });

    // ✅ FIX: scope the ownership check to this org's dishes directly
    const existing = await dishModel.findOne({
      _id:            req.params.id,
      organizationId,                           // ✅ instead of vendor: { $in: orgVendorIds }
    });
    if (!existing) return res.status(404).json({ success: false, msg: "Dish not found" });

    if (req.body.vendor !== undefined) {
      if (!req.body.vendor || req.body.vendor === "All Vendors") {
        req.body.vendor = null;
      } else {
        // ✅ FIX: verify new vendor is in this org
        const found = await userModel.findOne({
          _id:            req.body.vendor,
          type:           "vendor",
          organizationId,                       // ✅ scoped to org
        });
        if (!found) return res.status(404).json({ success: false, msg: "Vendor not found" });
        req.body.vendor = found._id;
      }
    }

    if (req.body.scheduledDate) {
      const dayStart = new Date(req.body.scheduledDate); dayStart.setHours(0,  0,  0,   0);
      const dayEnd   = new Date(req.body.scheduledDate); dayEnd.setHours(23, 59, 59, 999);

      // ✅ FIX: conflict check scoped to this org
      const conflict = await MenuSchedule.findOne({
        organizationId,                         // ✅ NEW
        scheduledDate: { $gte: dayStart, $lte: dayEnd },
        dish:          { $ne: req.params.id },
      });

      if (conflict) {
        const updated   = await applyDishUpdates(req.params.id, req.body, req.file);
        const populated = await dishModel.findById(updated._id).populate("vendor", "name email");

        await logActivity({
          userId: req.user.id,
          name:   req.user.name  ?? "Admin",
          email:  req.user.email ?? "",
          action: `Dish Updated: ${populated.name}`,
          status: "Pending",
        });

        return res.status(409).json({
          success:       false,
          msg:           "Dish updated but another dish is already scheduled on this date",
          dish:          populated,
          scheduleError: true,
        });
      }

      // ✅ FIX: upsert includes organizationId so new schedules are org-scoped
      await MenuSchedule.findOneAndUpdate(
        { dish: req.params.id, organizationId },  // ✅ scope the lookup
        {
          dish:          req.params.id,
          scheduledDate: new Date(req.body.scheduledDate),
          scheduledBy:   req.user.id,
          organizationId,                         // ✅ NEW — set on create via upsert
        },
        { upsert: true, new: true }
      );
    }

    const updated   = await applyDishUpdates(req.params.id, req.body, req.file);
    const populated = await dishModel.findById(updated._id).populate("vendor", "name email");

    await logActivity({
      userId: req.user.id,
      name:   req.user.name  ?? "Admin",
      email:  req.user.email ?? "",
      action: `Dish Updated: ${populated.name}`,
      status: "Success",
    });

    return res.status(200).json({ success: true, msg: "Dish updated successfully", dish: populated });
  } catch (err) {
    console.error("Update dish error:", err);
    return res.status(500).json({ success: false, msg: "Internal error: " + err.message });
  }
};

// ── DELETE /admin/dishes/:id ──────────────────────────────────────────────────
export const deleteDish = async (req, res) => {
  try {
    const organizationId = await getAdminOrgId(req.user.id);
    if (!organizationId) return res.status(404).json({ success: false, msg: "Dish not found" });

    // ✅ FIX: scope ownership check to this org's dishes
    const dish = await dishModel.findOne({
      _id:            req.params.id,
      organizationId,                           // ✅ instead of vendor lookup
    });
    if (!dish) return res.status(404).json({ success: false, msg: "Dish not found" });

    await dishModel.findByIdAndDelete(req.params.id);

    // ✅ FIX: also scope schedule deletion (belt-and-suspenders)
    await MenuSchedule.deleteOne({ dish: req.params.id, organizationId });

    await logActivity({
      userId: req.user.id,
      name:   req.user.name  ?? "Admin",
      email:  req.user.email ?? "",
      action: `Dish Deleted: ${dish.name}`,
      status: "Critical",
    });

    return res.status(200).json({ success: true, msg: "Dish deleted successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, msg: "Internal error: " + err.message });
  }
};

// ── GET /admin/menu/schedules ─────────────────────────────────────────────────
export const getSchedules = async (req, res) => {
  try {
    const organizationId = await getAdminOrgId(req.user.id);
    if (!organizationId) return res.status(200).json({ success: true, schedules: [] });

    // ✅ FIX: query schedules directly by organizationId — no dish ID detour needed
    const schedules = await MenuSchedule
      .find({ organizationId })                  // ✅ single field, no extra lookups
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