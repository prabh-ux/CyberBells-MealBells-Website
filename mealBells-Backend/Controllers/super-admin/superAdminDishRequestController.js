// Controllers/super-admin/superAdminDishRequestController.js
import mongoose        from "mongoose";
import { userModel }   from "../../Models/user.js";
import { DishRequest } from "../../Models/dishrequest.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

const POPULATE_USER   = { path: "userId",              select: "name email avatar department organizationId" };
const POPULATE_VENDOR = { path: "forwardedTo.vendorId", select: "name logo email" };

/**
 * Returns all user _ids that belong to the given organizationId.
 */
const getOrgUserIds = async (organizationId) => {
  const users = await userModel
    .find({ type: "user", active: true, organizationId }, "_id")
    .lean();
  return users.map((u) => u._id);
};

// ── GET /super-admin/dish-requests ────────────────────────────────────────────
/**
 * Query params:
 *   orgId   — ObjectId string | "all"  → cross-org view
 *   status  — "pending" | "reviewed" | "all"  (default: "pending")
 *   date    — ISO date string (optional)
 */
export const getSuperDishRequests = async (req, res) => {
  try {
    const { orgId = "all", status = "pending", date } = req.query;

    const filter = {};

    // Status filter
    if (status !== "all") filter.status = status;

    // Date filter
    if (date) {
      const start = new Date(date); start.setHours(0,  0,  0,   0);
      const end   = new Date(date); end.setHours(23, 59, 59, 999);
      filter.requestedDate = { $gte: start, $lte: end };
    }

    // Org filter — scope to users of the selected org (or all orgs)
    if (orgId && orgId !== "all") {
      if (!mongoose.Types.ObjectId.isValid(orgId))
        return res.status(400).json({ success: false, msg: "Invalid orgId." });

      const orgUserIds = await getOrgUserIds(orgId);
      filter.userId = { $in: orgUserIds };
    }

    const requests = await DishRequest.find(filter)
      .sort({ requestedDate: 1, createdAt: -1 })
      .populate(POPULATE_USER)
      .populate(POPULATE_VENDOR)
      .lean();

    return res.status(200).json({ success: true, data: requests });
  } catch (err) {
    console.error("[getSuperDishRequests]", err);
    return res.status(500).json({ success: false, msg: "Internal server error." });
  }
};

// ── GET /super-admin/dish-requests/vendors?orgId=xxx ─────────────────────────
/**
 * Returns vendors (type: "vendor") that belong to the given organization.
 * Vendors share the users collection — no separate Vendor model needed.
 * Query params:
 *   orgId — required, must not be "all"
 */
export const getSuperDishRequestVendors = async (req, res) => {
  try {
    const { orgId } = req.query;

    if (!orgId || orgId === "all")
      return res.status(400).json({ success: false, msg: "orgId is required." });

    if (!mongoose.Types.ObjectId.isValid(orgId))
      return res.status(400).json({ success: false, msg: "Invalid orgId." });

    const vendors = await userModel
      .find(
        { type: "vendor", active: true, organizationId: orgId },
        "name logo email"
      )
      .lean();

    return res.status(200).json({ success: true, data: vendors });
  } catch (err) {
    console.error("[getSuperDishRequestVendors]", err);
    return res.status(500).json({ success: false, msg: "Internal server error." });
  }
};

// ── POST /super-admin/dish-requests/:id/forward ──────────────────────────────
/**
 * Body: { vendorIds: string[] }
 * Super admin can forward any request — no org ownership check needed.
 */
export const superForwardDishRequest = async (req, res) => {
  try {
    const { id }        = req.params;
    const { vendorIds } = req.body;

    if (!Array.isArray(vendorIds) || vendorIds.length === 0)
      return res.status(400).json({ success: false, msg: "vendorIds must be a non-empty array." });

    const dishRequest = await DishRequest.findById(id);
    if (!dishRequest)
      return res.status(404).json({ success: false, msg: "Dish request not found." });

    // Add only vendors not already in forwardedTo
    const alreadyForwarded = new Set(
      dishRequest.forwardedTo.map((f) => f.vendorId.toString())
    );

    const newEntries = vendorIds
      .filter((vid) => !alreadyForwarded.has(vid.toString()))
      .map((vid) => ({
        vendorId:     new mongoose.Types.ObjectId(vid),
        vendorStatus: "pending",
        respondedAt:  null,
      }));

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
    console.error("[superForwardDishRequest]", err);
    return res.status(500).json({ success: false, msg: "Internal server error." });
  }
};