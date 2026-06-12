// Controllers/admin/adminDishRequestController.js
import mongoose    from "mongoose";
import { userModel }    from "../../Models/user.js";
import { DishRequest }  from "../../Models/dishrequest.js";

const getDayRange = (date = new Date()) => {
  const start = new Date(date); start.setHours(0, 0, 0, 0);
  const end   = new Date(date); end.setHours(23, 59, 59, 999);
  return { start, end };
};

const POPULATE_USER   = { path: "userId",              select: "name email avatar department" };
const POPULATE_VENDOR = { path: "forwardedTo.vendorId", select: "name logo email"            };

const getAdminOrgId = async (adminUserId) => {
  const admin = await userModel.findById(adminUserId).select("organizationId").lean();
  return admin?.organizationId ?? null;
};

const getOrgUserIds = async (organizationId) => {
  const users = await userModel.find(
    { type: "user", active: true, organizationId }, "_id"
  ).lean();
  return users.map((u) => u._id);
};

export const getDishRequests = async (req, res) => {
  try {
    const { status = "pending", date } = req.query;
    const organizationId = await getAdminOrgId(req.user.id);

    if (!organizationId)
      return res.status(200).json({ success: true, data: [] });

    const filter = {};
    if (status !== "all") filter.status = status;
    if (date) {
      const { start, end } = getDayRange(new Date(date));
      filter.requestedDate = { $gte: start, $lte: end };
    }

    const orgUserIds = await getOrgUserIds(organizationId);
    filter.userId = { $in: orgUserIds };

    const requests = await DishRequest.find(filter)
      .sort({ requestedDate: 1, createdAt: -1 })
      .populate(POPULATE_USER)
      .populate(POPULATE_VENDOR)
      .lean();

    return res.status(200).json({ success: true, data: requests });
  } catch (err) {
    console.error("[getDishRequests]", err);
    return res.status(500).json({ success: false, msg: "Internal server error." });
  }
};

export const forwardDishRequest = async (req, res) => {
  try {
    const { id }        = req.params;
    const { vendorIds } = req.body;

    if (!Array.isArray(vendorIds) || vendorIds.length === 0)
      return res.status(400).json({ success: false, msg: "vendorIds must be a non-empty array." });

    const dishRequest = await DishRequest.findById(id).populate("userId", "organizationId");
    if (!dishRequest)
      return res.status(404).json({ success: false, msg: "Dish request not found." });

    const organizationId = await getAdminOrgId(req.user.id);
    if (organizationId) {
      const requestOrgIds = dishRequest.userId?.organizationId ?? [];
      const isSameOrg = requestOrgIds.some(id => String(id) === String(organizationId));
      if (!isSameOrg)
        return res.status(403).json({ success: false, msg: "You do not have permission to forward this request." });
    }

    const alreadyForwarded = new Set(dishRequest.forwardedTo.map((f) => f.vendorId.toString()));
    const newEntries = vendorIds
      .filter((vid) => !alreadyForwarded.has(vid.toString()))
      .map((vid) => ({ vendorId: new mongoose.Types.ObjectId(vid), vendorStatus: "pending", respondedAt: null }));

    if (newEntries.length > 0) dishRequest.forwardedTo.push(...newEntries);
    dishRequest.status = "reviewed";
    await dishRequest.save();

    const populated = await DishRequest.findById(dishRequest._id)
      .populate(POPULATE_USER)
      .populate(POPULATE_VENDOR)
      .lean();

    return res.status(200).json({
      success: true,
      msg:     `Request forwarded to ${newEntries.length} new vendor(s).`,
      data:    populated,
    });
  } catch (err) {
    console.error("[forwardDishRequest]", err);
    return res.status(500).json({ success: false, msg: "Internal server error." });
  }
};