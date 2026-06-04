import bcrypt              from "bcrypt";
import { generateVendorId } from "../../utils/generateVendorId.js";
import { userModel }       from "../../Models/user.js";
import { logActivity }     from "../../utils/logActivity.js";

// ── Add Vendor ────────────────────────────────────────────────────────────────
export const addVendor = async (req, res) => {
  try {
    const { name, email, phone, capacity, delivery, status, foodType } = req.body;

    if (!name || !email)
      return res.status(400).json({ msg: "Vendor name and email are required" });

    const existing = await userModel.findOne({ email });
    if (existing)
      return res.status(409).json({ msg: "Email already in use" });

    const logo         = req.file?.path || "";
    const vendorId     = await generateVendorId();
    const tempPassword = Math.random().toString(36).slice(-8);
    const capitalized  = tempPassword.charAt(0).toUpperCase() + tempPassword.slice(1);
    const hashed       = await bcrypt.hash(capitalized, 10);

    const vendor = await userModel.create({
      type:           "vendor",
      role:           "Vendor",
      name,
      email,
      phone:          phone     || "",
      capacity:       Number(capacity) || 0,
      deliveryTiming: delivery  || "",
      status:         status === "false" ? false : true,
      foodType:       foodType  || "Both",
      logo,
      vendorId,
      rating:         0,
      totalReviews:   0,
      password:       hashed,
    });

    await logActivity({
      userId: vendor._id,
      name:   vendor.name,
      email:  vendor.email,
      action: "Vendor Added",
      status: "Success",
    });

    return res.status(201).json({
      success:      true,
      msg:          "Vendor created successfully",
      tempPassword: capitalized,
      vendor: {
        _id:            vendor._id,
        vendorId:       vendor.vendorId,
        name:           vendor.name,
        email:          vendor.email,
        phone:          vendor.phone,
        capacity:       vendor.capacity,
        deliveryTiming: vendor.deliveryTiming,
        status:         vendor.status,
        foodType:       vendor.foodType,
        logo:           vendor.logo,
        rating:         vendor.rating,
        totalReviews:   vendor.totalReviews,
        type:           vendor.type,
        createdAt:      vendor.createdAt,
      },
    });
  } catch (err) {
    console.error("Add vendor error:", err);
    return res.status(500).json({ msg: "Internal error: " + err.message });
  }
};

// ── Get All Vendors ───────────────────────────────────────────────────────────
export const getVendors = async (req, res) => {
  try {
    const vendors = await userModel
      .find({ type: "vendor" })
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, vendors });
  } catch (err) {
    console.error("Get vendors error:", err);
    return res.status(500).json({ msg: "Internal error: " + err.message });
  }
};

// ── Toggle Vendor Status ──────────────────────────────────────────────────────
export const toggleVendorStatus = async (req, res) => {
  try {
    const vendor = await userModel.findById(req.params.id);
    if (!vendor) return res.status(404).json({ msg: "Vendor not found" });

    const newStatus = !req.body.active;

    const updated = await userModel
      .findByIdAndUpdate(req.params.id, { status: newStatus }, { new: true })
      .select("-password");

    await logActivity({
      userId: updated._id,
      name:   updated.name,
      email:  updated.email,
      action: newStatus ? "Vendor Activated" : "Vendor Deactivated",
      status: "Success",
    });

    return res.status(200).json({
      success: true,
      msg:     newStatus ? "Vendor activated" : "Vendor deactivated",
      vendor:  updated,
    });
  } catch (err) {
    return res.status(500).json({ msg: "Failed to toggle status: " + err.message });
  }
};

// ── Update Vendor ─────────────────────────────────────────────────────────────
export const updateVendor = async (req, res) => {
  try {
    const { name, email, phone, capacity, delivery, foodType } = req.body;

    const vendor = await userModel.findById(req.params.id);
    if (!vendor) return res.status(404).json({ msg: "Vendor not found" });

    if (email && email !== vendor.email) {
      const exists = await userModel.findOne({ email });
      if (exists) return res.status(409).json({ msg: "Email already in use" });
    }

    const logo = req.file?.path || vendor.logo;

    const updated = await userModel
      .findByIdAndUpdate(
        req.params.id,
        {
          name:           name     || vendor.name,
          email:          email    || vendor.email,
          phone:          phone    ?? vendor.phone,
          capacity:       Number(capacity) || vendor.capacity,
          deliveryTiming: delivery ?? vendor.deliveryTiming,
          foodType:       foodType ?? vendor.foodType,
          logo,
        },
        { new: true }
      )
      .select("-password");

    await logActivity({
      userId: updated._id,
      name:   updated.name,
      email:  updated.email,
      action: "Vendor Profile Updated",
      status: "Success",
    });

    return res.status(200).json({ success: true, msg: "Vendor updated successfully", vendor: updated });
  } catch (err) {
    return res.status(500).json({ msg: "Internal error: " + err.message });
  }
};

// ── Delete Vendor ─────────────────────────────────────────────────────────────
export const deleteVendor = async (req, res) => {
  try {
    const vendor = await userModel.findById(req.params.id);
    if (!vendor) return res.status(404).json({ msg: "Vendor not found" });

    await logActivity({
      userId: vendor._id,
      name:   vendor.name,
      email:  vendor.email,
      action: "Vendor Deleted",
      status: "Critical",
    });

    await userModel.findByIdAndDelete(req.params.id);

    return res.status(200).json({ success: true, msg: "Vendor deleted successfully" });
  } catch (err) {
    return res.status(500).json({ msg: "Internal error: " + err.message });
  }
};