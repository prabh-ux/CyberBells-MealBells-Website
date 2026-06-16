// Controllers/authController.js
import { userModel } from "../../Models/user.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const cookieOptions = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge:   24 * 60 * 60 * 1000,
};

export const signUp = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existing = await userModel.findOne({ email });
    if (existing) {
      return res.status(409).json({ msg: "User with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new userModel({ name, email, password: hashedPassword });
    await newUser.save();

    const token = jwt.sign(
      {
        email:          newUser.email,
        id:             newUser._id,
        organizationId: newUser.organizationId,
        type:           newUser.type,
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res
      .cookie('token', token, cookieOptions)
      .status(200)
      .json({ msg: "Signup successful", success: true, name: newUser.name });

  } catch (error) {
    res.status(500).json({ msg: "Internal error occurred while signing up: " + error });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ msg: "Email or password incorrect" });
    }

    const passwordEqual = await bcrypt.compare(password, user.password);
    if (!passwordEqual) {
      return res.status(401).json({ msg: "Email or password incorrect" });
    }

    const token = jwt.sign(
      {
        email:          user.email,
        id:             user._id,
        organizationId: user.organizationId,
        type:           user.type,
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res
      .cookie('token', token, cookieOptions)
      .status(200)
      .json({ msg: "Login successful", success: true, email, name: user.name });

  } catch (error) {
    res.status(500).json({ msg: "Internal error occurred while logging in: " + error });
  }
};

export const logout = (req, res) => {
  res
    .clearCookie('token', cookieOptions)
    .status(200)
    .json({ msg: "Logged out successfully" });
};

export const getMe = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ msg: "User not found" });
    return res.status(200).json({ success: true, user });
  } catch (err) {
    return res.status(500).json({ msg: "Internal error: " + err.message });
  }
};

export const updateMe = async (req, res) => {
  try {
    const { name, phone, email, role } = req.body;

    
    if (role === "Super Admin" && req.user.type !== "super_admin") {
      return res.status(403).json({ msg: "Only a Super Admin can assign the Super Admin role." });
    }

    if (email) {
      const exists = await userModel.findOne({ email, _id: { $ne: req.user.id } });
      if (exists) return res.status(409).json({ msg: "Email already in use" });
    }

    const avatar = req.file?.path;

    const updated = await userModel.findByIdAndUpdate(
      req.user.id,
      {
        ...(name   && { name }),
        ...(phone  && { phone }),
        ...(email  && { email }),
        ...(role   && { role }),
        ...(avatar && { avatar }),
      },
      { new: true }
    ).select("-password");

    return res.status(200).json({ success: true, user: updated });
  } catch (err) {
    return res.status(500).json({ msg: "Internal error: " + err.message });
  }
};

// ── POST /auth/me/change-password ─────────────────────────────────────────────
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ msg: "Current password and new password are required." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ msg: "New password must be at least 6 characters." });
    }

    // Fetch user with password field (selected: false by default)
    const user = await userModel.findById(req.user.id).select("+password");
    if (!user) return res.status(404).json({ msg: "User not found." });

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ msg: "Current password is incorrect." });
    }

    // Hash and save new password
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.status(200).json({ success: true, msg: "Password changed successfully." });
  } catch (err) {
    return res.status(500).json({ msg: "Internal error: " + err.message });
  }
};