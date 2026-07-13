// Controllers/vendor/vendorOrganizationController.js
import { organizationModel }     from "../../Models/organization.js";
import { userModel }             from "../../Models/user.js";
import { platformSettingsModel } from "../../Models/platformSettings.js";
import bcrypt                    from "bcryptjs";

const generatePassword = () => {
  return Math.random().toString(36).slice(-8) + "1!";
};

// ── GET /vendor/organizations ─────────────────────────────────────────────────
export const getVendorOrganizations = async (req, res) => {
  try {
    const orgs = await organizationModel
      .find({ createdBy: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    const enriched = await Promise.all(
      orgs.map(async (org) => {
        const admin = await userModel
          .findOne({ organizationId: org._id, type: "admin" })
          .select("_id name email")
          .lean();

        const memberCount = await userModel.countDocuments({
          organizationId: org._id,
          type:           "user",
          active:         true,
        });

        return { ...org, admin: admin ?? null, memberCount };
      })
    );

    return res.status(200).json({ success: true, data: enriched });
  } catch (err) {
    return res.status(500).json({ msg: "Internal error: " + err.message });
  }
};

// ── POST /vendor/organizations ────────────────────────────────────────────────
export const createVendorOrganization = async (req, res) => {
  try {
    const {
      companyName,
      contactEmail,
      officeAddress,
      mealTime,
      cutoffTime,
      allowDishRequests,
      capacity,
      adminName,
      adminEmail,
      adminPhone,
    } = req.body;

    if (!companyName || !contactEmail || !officeAddress || !adminName || !adminEmail) {
      return res.status(400).json({ msg: "Missing required fields." });
    }

    const existing = await userModel.findOne({ email: adminEmail.toLowerCase().trim() });
    if (existing) return res.status(409).json({ msg: "Admin email is already in use." });

    // Pull platform defaults — fall back to schema defaults if no settings doc yet
    const platformSettings = await platformSettingsModel.findOne().lean();

    const org = await organizationModel.create({
      companyName:       companyName.trim(),
      contactEmail:      contactEmail.trim(),
      officeAddress:     officeAddress.trim(),
      mealTime:          mealTime          ?? platformSettings?.defaultMealTime          ?? "12:30",
      cutoffTime:        cutoffTime        ?? platformSettings?.defaultCutoffTime        ?? "09:00",
      allowDishRequests: allowDishRequests !== undefined
                           ? allowDishRequests
                           : (platformSettings?.defaultAllowDishRequests ?? true),
      capacity:          capacity !== undefined
                           ? Number(capacity)
                           : (platformSettings?.defaultCapacity ?? 50),
      createdBy:         req.user.id,
    });

    const plainPassword = generatePassword();
    const hashed        = await bcrypt.hash(plainPassword, 10);

    await userModel.create({
      name:           adminName.trim(),
      email:          adminEmail.toLowerCase().trim(),
      password:       hashed,
      type:           "admin",
      role:           "System Admin",
      phone:          adminPhone?.trim() ?? "",
      organizationId: [org._id],
      active:         true,
    });

    await userModel.findByIdAndUpdate(
      req.user.id,
      { $addToSet: { organizationId: org._id } }
    );

    return res.status(201).json({
      success: true,
      data: {
        org: {
          ...org.toObject(),
          admin:       { name: adminName.trim(), email: adminEmail.trim() },
          memberCount: 0,
          status:      true,
        },
        credentials: {
          orgName:       companyName.trim(),
          adminName:     adminName.trim(),
          adminEmail:    adminEmail.trim(),
          adminPassword: plainPassword,
        },
      },
    });
  } catch (err) {
    return res.status(500).json({ msg: "Internal error: " + err.message });
  }
};

// ── PATCH /vendor/organizations/:id/toggle-status ─────────────────────────────
export const toggleVendorOrgStatus = async (req, res) => {
  try {
    const org = await organizationModel.findById(req.params.id);
    if (!org) return res.status(404).json({ msg: "Organization not found." });

    org.status = !org.status;
    await org.save();

    return res.status(200).json({
      success: true,
      msg:     `Organization ${org.status ? "activated" : "deactivated"} successfully.`,
      data:    { id: org._id, status: org.status },
    });
  } catch (err) {
    return res.status(500).json({ msg: "Internal error: " + err.message });
  }
};

// ── PUT /vendor/organizations/:id ─────────────────────────────────────────────
export const updateVendorOrg = async (req, res) => {
  try {
    const {
      companyName,
      contactEmail,
      officeAddress,
      mealTime,
      cutoffTime,
      allowDishRequests,
      capacity,
    } = req.body;

    const updates = {
      ...(companyName       !== undefined && { companyName }),
      ...(contactEmail      !== undefined && { contactEmail }),
      ...(officeAddress     !== undefined && { officeAddress }),
      ...(mealTime          !== undefined && { mealTime }),
      ...(cutoffTime        !== undefined && { cutoffTime }),
      ...(allowDishRequests !== undefined && { allowDishRequests }),
      ...(capacity          !== undefined && { capacity: Number(capacity) }),
    };

    const org = await organizationModel.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );

    if (!org) return res.status(404).json({ msg: "Organization not found." });

    return res.status(200).json({ success: true, data: org });
  } catch (err) {
    return res.status(500).json({ msg: "Internal error: " + err.message });
  }
};