// Controllers/super-admin/superAdminUserController.js
import { userModel }   from "../../Models/user.js";
import bcrypt          from "bcrypt";
import cloudinary      from "../../utils/cloudnary.js";
import { logActivity } from "../../utils/logActivity.js";
import { organizationModel } from "../../Models/organization.js";
import mongoose from "mongoose";

// ── Get all users (scoped by orgId query param) ───────────────────────────────
export const getSuperUsers = async (req, res) => {
  try {
    const { orgId } = req.query;

    const filter = { type: "user" };
    if (orgId && orgId !== "all" && mongoose.Types.ObjectId.isValid(orgId)) {
      filter.organizationId = { $in: [new mongoose.Types.ObjectId(orgId)] };
    }

    const users = await userModel
      .find(filter)
      .select("-password -avatarPublicId")
      .sort({ createdAt: -1 })
      .lean();

    // Attach org name to each user
    const orgIds = [...new Set(users.flatMap(u => u.organizationId?.map(String) ?? []))];
    const orgs   = await organizationModel.find({ _id: { $in: orgIds } }, "companyName").lean();
    const orgMap = Object.fromEntries(orgs.map(o => [String(o._id), o.companyName]));

    const enriched = users.map(u => ({
      ...u,
      organizationName: u.organizationId?.[0]
        ? orgMap[String(u.organizationId[0])] ?? "Unknown"
        : "Unknown",
    }));

    return res.status(200).json({ success: true, users: enriched });
  } catch (err) {
    return res.status(500).json({ msg: "Internal error: " + err.message });
  }
};

// ── Add user to a specific org ────────────────────────────────────────────────
export const addSuperUser = async (req, res) => {
  try {
    const { fullName, email, phone, gender, department, role, active, orgId } = req.body;

    if (!fullName || !email)
      return res.status(400).json({ msg: "Full name and email are required" });

    if (!orgId || !mongoose.Types.ObjectId.isValid(orgId))
      return res.status(400).json({ msg: "A valid organization is required" });

    const existing = await userModel.findOne({ email });
    if (existing) return res.status(409).json({ msg: "Email already in use" });

    const org = await organizationModel.findById(orgId);
    if (!org) return res.status(404).json({ msg: "Organization not found" });

    const avatarUrl      = req.file?.path     || "";
    const avatarPublicId = req.file?.filename  || "";

    const tempPassword = Math.random().toString(36).slice(-8);
    const capitalized  = tempPassword.charAt(0).toUpperCase() + tempPassword.slice(1);
    const hashed       = await bcrypt.hash(capitalized, 10);

    const user = await userModel.create({
      type:           "user",
      name:           fullName,
      email,
      phone:          phone      || "",
      gender:         gender     || "",
      department:     department || "",
      role:           role       || "Standard User",
      active:         active === "false" ? false : true,
      avatar:         avatarUrl,
      avatarPublicId,
      password:       hashed,
      organizationId: [new mongoose.Types.ObjectId(orgId)],
    });

    await logActivity({
      userId: user._id,
      name:   user.name,
      email:  user.email,
      action: "New User Registered (Super Admin)",
      status: "Success",
    });

    return res.status(201).json({
      success:     true,
      msg:         "User created successfully",
      tempPassword: capitalized,
      user: {
        _id:              user._id,
        name:             user.name,
        email:            user.email,
        phone:            user.phone,
        gender:           user.gender,
        department:       user.department,
        role:             user.role,
        active:           user.active,
        avatar:           user.avatar,
        type:             user.type,
        organizationId:   user.organizationId,
        organizationName: org.companyName,
        createdAt:        user.createdAt,
      },
    });
  } catch (err) {
    return res.status(500).json({ msg: "Internal error: " + err.message });
  }
};

// ── Update user ───────────────────────────────────────────────────────────────
export const updateSuperUser = async (req, res) => {
  try {
    const { fullName, email, phone, gender, department, role, active } = req.body;

    const user = await userModel.findOne({ _id: req.params.id, type: "user" });
    if (!user) return res.status(404).json({ msg: "User not found" });

    if (email && email !== user.email) {
      const exists = await userModel.findOne({ email });
      if (exists) return res.status(409).json({ msg: "Email already in use" });
    }

    let avatarUrl      = user.avatar;
    let avatarPublicId = user.avatarPublicId;

    if (req.file) {
      if (user.avatarPublicId) await cloudinary.uploader.destroy(user.avatarPublicId);
      avatarUrl      = req.file.path;
      avatarPublicId = req.file.filename;
    }

    const updated = await userModel.findByIdAndUpdate(
      req.params.id,
      {
        name:          fullName   || user.name,
        email:         email      || user.email,
        phone:         phone      ?? user.phone,
        gender:        gender     ?? user.gender,
        department:    department ?? user.department,
        role:          role       ?? user.role,
        active:        active !== undefined ? active === "false" ? false : true : user.active,
        avatar:        avatarUrl,
        avatarPublicId,
      },
      { new: true }
    ).select("-password -avatarPublicId").lean();

    // attach org name
    const orgId = updated.organizationId?.[0];
    let organizationName = "Unknown";
    if (orgId) {
      const org = await organizationModel.findById(orgId, "companyName").lean();
      organizationName = org?.companyName ?? "Unknown";
    }

    await logActivity({
      userId: updated._id,
      name:   updated.name,
      email:  updated.email,
      action: "User Profile Updated",
      status: "Success",
    });

    return res.status(200).json({
      success: true,
      msg:     "User updated successfully",
      user:    { ...updated, organizationName },
    });
  } catch (err) {
    return res.status(500).json({ msg: "Internal error: " + err.message });
  }
};

// ── Toggle active status ──────────────────────────────────────────────────────
export const toggleSuperUserStatus = async (req, res) => {
  try {
    const user = await userModel.findOne({ _id: req.params.id, type: "user" });
    if (!user) return res.status(404).json({ msg: "User not found" });

    const newActive = !user.active;
    const updated   = await userModel
      .findByIdAndUpdate(req.params.id, { active: newActive }, { new: true })
      .select("-password -avatarPublicId");

    await logActivity({
      userId: updated._id,
      name:   updated.name,
      email:  updated.email,
      action: newActive ? "User Activated" : "User Deactivated",
      status: "Success",
    });

    return res.status(200).json({
      success: true,
      msg:     newActive ? "User activated" : "User deactivated",
      user:    updated,
    });
  } catch (err) {
    return res.status(500).json({ msg: "Internal error: " + err.message });
  }
};

// ── Delete user ───────────────────────────────────────────────────────────────
export const deleteSuperUser = async (req, res) => {
  try {
    const user = await userModel.findOne({ _id: req.params.id, type: "user" });
    if (!user) return res.status(404).json({ msg: "User not found" });

    if (user.avatarPublicId) await cloudinary.uploader.destroy(user.avatarPublicId);

    await logActivity({
      userId: user._id,
      name:   user.name,
      email:  user.email,
      action: "User Deleted",
      status: "Critical",
    });

    await userModel.findByIdAndDelete(req.params.id);

    return res.status(200).json({ success: true, msg: "User deleted successfully" });
  } catch (err) {
    return res.status(500).json({ msg: "Internal error: " + err.message });
  }
};