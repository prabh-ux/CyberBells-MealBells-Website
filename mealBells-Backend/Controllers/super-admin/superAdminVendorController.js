// Controllers/super-admin/superAdminVendorController.js
import mongoose      from "mongoose";
import bcrypt        from "bcryptjs";
import { userModel } from "../../Models/user.js";

// ── Helper: generate random password ─────────────────────────────────────────
const generatePassword = (length = 10) => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

// ── Helper: generate vendorId ─────────────────────────────────────────────────
const generateVendorId = () => `VND-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

// ── POST /super-admin/vendors/add ─────────────────────────────────────────────
/**
 * Body (multipart/form-data):
 *   name, email, phone, capacity, delivery, status, foodType, orgId
 *   logo (file, optional)
 *
 * orgId can be:
 *   - A valid MongoDB ObjectId → assign vendor to that organization
 *   - Empty string / omitted   → "New Organization" flow; organizationId stored as []
 *                                 The vendor will create their own org after first login.
 */
export const addSuperVendor = async (req, res) => {
  try {
    const { name, email, phone, capacity, delivery, status, foodType, orgId } = req.body;

    // ── Basic field validation ────────────────────────────────────────────────
    if (!name?.trim())     return res.status(400).json({ success: false, msg: "Vendor name is required."     });
    if (!email?.trim())    return res.status(400).json({ success: false, msg: "Email is required."           });
    if (!phone?.trim())    return res.status(400).json({ success: false, msg: "Phone is required."           });
    if (!capacity)         return res.status(400).json({ success: false, msg: "Capacity is required."        });
    if (!delivery?.trim()) return res.status(400).json({ success: false, msg: "Delivery timing is required." });

    // ── orgId validation ──────────────────────────────────────────────────────
    // Empty string = "New Organization" flow (vendor sets up their own org later)
    const isNewOrg = !orgId || orgId.trim() === "";

    if (!isNewOrg && !mongoose.Types.ObjectId.isValid(orgId)) {
      return res.status(400).json({ success: false, msg: "Invalid organization selected." });
    }

    // ── Duplicate email check ─────────────────────────────────────────────────
    const exists = await userModel.findOne({ email: email.toLowerCase().trim() });
    if (exists) return res.status(409).json({ success: false, msg: "A user with this email already exists." });

    // ── Create vendor ─────────────────────────────────────────────────────────
    const plainPassword  = generatePassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 12);

    const vendor = new userModel({
      name:           name.trim(),
      email:          email.toLowerCase().trim(),
      password:       hashedPassword,
      type:           "vendor",
      role:           "Vendor",
      phone:          phone.trim(),
      capacity:       Number(capacity),
      deliveryTiming: delivery.trim(),
      status:         status === "true" || status === true,
      foodType:       foodType || "Both",
      active:         true,
      // Empty array when "New Organization" — will be populated when vendor creates their org
      organizationId: isNewOrg ? [] : [new mongoose.Types.ObjectId(orgId)],
      vendorId:       generateVendorId(),
      logo:           req.file?.path ?? "",
    });

    await vendor.save();

    return res.status(201).json({
      success: true,
      msg:     "Vendor created successfully.",
      data: {
        vendor:      { _id: vendor._id, name: vendor.name, email: vendor.email },
        credentials: { name: vendor.name, email: vendor.email, password: plainPassword },
      },
    });
  } catch (err) {
    console.error("[addSuperVendor]", err);
    return res.status(500).json({ success: false, msg: "Internal server error." });
  }
};

// ── GET /super-admin/vendors ──────────────────────────────────────────────────
export const getSuperVendors = async (req, res) => {
  try {
    const { orgId = "all", status, foodType } = req.query;
    const filter = { type: "vendor" };

    if (orgId && orgId !== "all") {
      if (!mongoose.Types.ObjectId.isValid(orgId))
        return res.status(400).json({ success: false, msg: "Invalid orgId." });
      filter.organizationId = new mongoose.Types.ObjectId(orgId);
    }

    if (status === "active")   filter.active = true;
    if (status === "inactive") filter.active = false;
    if (foodType && foodType !== "all") filter.foodType = foodType;

    const vendors = await userModel
      .find(filter, "name email phone logo capacity deliveryTiming status foodType rating totalReviews active organizationId createdAt")
      .populate({ path: "organizationId", select: "name" })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ success: true, data: vendors });
  } catch (err) {
    console.error("[getSuperVendors]", err);
    return res.status(500).json({ success: false, msg: "Internal server error." });
  }
};

// ── PATCH /super-admin/vendors/:id/status ────────────────────────────────────
export const toggleSuperVendorStatus = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, msg: "Invalid vendor id." });

    const vendor = await userModel.findOne({ _id: id, type: "vendor" });
    if (!vendor) return res.status(404).json({ success: false, msg: "Vendor not found." });

    vendor.active = !vendor.active;
    await vendor.save();

    return res.status(200).json({
      success: true,
      msg:     `Vendor ${vendor.active ? "activated" : "deactivated"} successfully.`,
      data:    { _id: vendor._id, active: vendor.active },
    });
  } catch (err) {
    console.error("[toggleSuperVendorStatus]", err);
    return res.status(500).json({ success: false, msg: "Internal server error." });
  }
};

// ── PUT /super-admin/vendors/:id ─────────────────────────────────────────────
export const updateSuperVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, capacity, deliveryTiming, foodType, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, msg: "Invalid vendor id." });

    const vendor = await userModel.findOne({ _id: id, type: "vendor" });
    if (!vendor) return res.status(404).json({ success: false, msg: "Vendor not found." });

    if (name)                 vendor.name           = name.trim();
    if (phone)                vendor.phone          = phone.trim();
    if (capacity)             vendor.capacity       = Number(capacity);
    if (deliveryTiming)       vendor.deliveryTiming = deliveryTiming.trim();
    if (foodType)             vendor.foodType       = foodType;
    if (status !== undefined) vendor.status         = Boolean(status);
    if (req.file?.path)       vendor.logo           = req.file.path;

    await vendor.save();

    const updated = await userModel
      .findById(id, "name email phone logo capacity deliveryTiming status foodType rating totalReviews active organizationId createdAt")
      .populate({ path: "organizationId", select: "name" })
      .lean();

    return res.status(200).json({ success: true, msg: "Vendor updated.", data: updated });
  } catch (err) {
    console.error("[updateSuperVendor]", err);
    return res.status(500).json({ success: false, msg: "Internal server error." });
  }
};

// ── DELETE /super-admin/vendors/:id ──────────────────────────────────────────
export const deleteSuperVendor = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, msg: "Invalid vendor id." });

    const vendor = await userModel.findOneAndDelete({ _id: id, type: "vendor" });
    if (!vendor) return res.status(404).json({ success: false, msg: "Vendor not found." });

    return res.status(200).json({ success: true, msg: "Vendor deleted successfully." });
  } catch (err) {
    console.error("[deleteSuperVendor]", err);
    return res.status(500).json({ success: false, msg: "Internal server error." });
  }
};