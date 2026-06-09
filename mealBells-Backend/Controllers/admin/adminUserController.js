import { userModel }   from "../../Models/user.js";
import bcrypt          from "bcrypt";
import cloudinary      from "../../utils/cloudnary.js";
import { logActivity } from "../../utils/logActivity.js";

// ── Add User ──────────────────────────────────────────────────────────────────
export const addUser = async (req, res) => {
  try {
    const { fullName, email, phone, gender, department, role, active } = req.body;

    if (!fullName || !email)
      return res.status(400).json({ msg: "Full name and email are required" });

    const existing = await userModel.findOne({ email });
    if (existing)
      return res.status(409).json({ msg: "Email already in use" });

    // ── Get admin's organizationId so new user inherits it ──────────────────
    const admin = await userModel.findById(req.user.id).select("organizationId");
    if (!admin?.organizationId)
      return res.status(400).json({
        msg: "Please complete your organization settings before adding users.",
      });

    const avatarUrl      = req.file?.path     || "";
    const avatarPublicId = req.file?.filename || "";

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
      organizationId: admin.organizationId,   // ← key fix
    });

    await logActivity({
      userId: user._id,
      name:   user.name,
      email:  user.email,
      action: "New User Registered",
      status: "Success",
    });

    return res.status(201).json({
      success: true,
      msg:     "User created successfully",
      tempPassword,
      user: {
        _id:        user._id,
        name:       user.name,
        email:      user.email,
        phone:      user.phone,
        gender:     user.gender,
        department: user.department,
        role:       user.role,
        active:     user.active,
        avatar:     user.avatar,
        type:       user.type,
        createdAt:  user.createdAt,
      },
    });
  } catch (err) {
    console.error("Add user error:", err);
    return res.status(500).json({ msg: "Internal error: " + err.message });
  }
};

// ── Toggle User Status ────────────────────────────────────────────────────────
export const toggleUserStatus = async (req, res) => {
  try {
    const user = await userModel.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const currentActive = req.body.active ?? user.active;
    const newActive     = !currentActive;

    const updated = await userModel
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
      msg:     newActive ? "User activated successfully" : "User deactivated successfully",
      user:    updated,
    });
  } catch (err) {
    return res.status(500).json({ msg: "Failed to toggle status: " + err.message });
  }
};

// ── Get All Users ─────────────────────────────────────────────────────────────
export const getUsers = async (req, res) => {
  try {
    const users = await userModel
      .find({ type: "user" })
      .select("-password -avatarPublicId")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, users });
  } catch (err) {
    console.error("Get users error:", err);
    return res.status(500).json({ msg: "Internal error: " + err.message });
  }
};

// ── Get Single User ───────────────────────────────────────────────────────────
export const getUserById = async (req, res) => {
  try {
    const user = await userModel
      .findById(req.params.id)
      .select("-password -avatarPublicId");

    if (!user) return res.status(404).json({ msg: "User not found" });

    return res.status(200).json({ success: true, user });
  } catch (err) {
    console.error("Get user error:", err);
    return res.status(500).json({ msg: "Internal error: " + err.message });
  }
};

// ── Update User ───────────────────────────────────────────────────────────────
export const updateUser = async (req, res) => {
  try {
    const { fullName, email, phone, gender, department, role, active } = req.body;

    const user = await userModel.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    if (email && email !== user.email) {
      const existing = await userModel.findOne({ email });
      if (existing) return res.status(409).json({ msg: "Email already in use" });
    }

    let avatarUrl      = user.avatar;
    let avatarPublicId = user.avatarPublicId;

    if (req.file) {
      if (user.avatarPublicId) {
        await cloudinary.uploader.destroy(user.avatarPublicId);
      }
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
    ).select("-password -avatarPublicId");

    await logActivity({
      userId: updated._id,
      name:   updated.name,
      email:  updated.email,
      action: "User Profile Updated",
      status: "Success",
    });

    return res.status(200).json({ success: true, msg: "User updated successfully", user: updated });
  } catch (err) {
    console.error("Update user error:", err);
    return res.status(500).json({ msg: "Internal error: " + err.message });
  }
};

// ── Delete User ───────────────────────────────────────────────────────────────
export const deleteUser = async (req, res) => {
  try {
    const user = await userModel.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    if (user.avatarPublicId) {
      await cloudinary.uploader.destroy(user.avatarPublicId);
    }

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
    console.error("Delete user error:", err);
    return res.status(500).json({ msg: "Internal error: " + err.message });
  }
};