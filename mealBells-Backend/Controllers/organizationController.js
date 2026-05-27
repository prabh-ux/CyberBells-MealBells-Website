import { organizationModel } from "../Models/organization.js";
import { userModel }         from "../Models/user.js";

export const getMyOrganization = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id).select("organizationId");
    if (!user) return res.status(404).json({ msg: "User not found" });

    if (!user.organizationId)
      return res.status(404).json({ msg: "No organization linked to this user" });

    const org = await organizationModel.findById(user.organizationId);
    if (!org) return res.status(404).json({ msg: "Organization not found" });

    return res.status(200).json({ success: true, organization: org });
  } catch (err) {
    return res.status(500).json({ msg: "Internal error: " + err.message });
  }
};

export const updateMyOrganization = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id).select("organizationId");
    if (!user) return res.status(404).json({ msg: "User not found" });

    const { companyName, contactEmail, officeAddress } = req.body;

    const updates = {
      ...(companyName    !== undefined && { companyName }),
      ...(contactEmail   !== undefined && { contactEmail }),
      ...(officeAddress  !== undefined && { officeAddress }),
    };

    let org;

    if (user.organizationId) {
      // Update existing
      org = await organizationModel.findByIdAndUpdate(
        user.organizationId,
        updates,
        { new: true }
      );
    } else {
      // First save — create org and link to user
      org = await organizationModel.create(updates);
      await userModel.findByIdAndUpdate(req.user.id, { organizationId: org._id });
    }

    return res.status(200).json({ success: true, organization: org });
  } catch (err) {
    return res.status(500).json({ msg: "Internal error: " + err.message });
  }
};