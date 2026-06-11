// Controllers/admin/adminDishRequestController.js
import mongoose    from "mongoose";
import { userModel }    from "../../Models/user.js";
import { DishRequest }  from "../../Models/dishrequest.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

const getDayRange = (date = new Date()) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const POPULATE_USER   = { path: "userId",               select: "name email avatar department" };
const POPULATE_VENDOR = { path: "forwardedTo.vendorId",  select: "name logo email"             };

// ── Shared: get admin's organizationId ────────────────────────────────────────
const getAdminOrgId = async (adminUserId) => {
  const admin = await userModel.findById(adminUserId).select("organizationId").lean();
  return admin?.organizationId ?? null;
};

// ── Shared: get all active user IDs in an org ─────────────────────────────────
const getOrgUserIds = async (organizationId) => {
  const users = await userModel.find(
    { type: "user", active: true, organizationId },
    "_id"
  ).lean();
  return users.map((u) => u._id);
};

// ── GET /admin/dish-requests ──────────────────────────────────────────────────
// Query params:
//   status – "pending" | "reviewed" | "all"  (default: "pending")
//   date   – ISO date string                 (optional)
//
// Results are scoped to users who belong to the same organization as the admin.

export const getDishRequests = async (req, res) => {
  try {
    const { status = "pending", date } = req.query;
    const adminUserId = req.user.id;

    const organizationId = await getAdminOrgId(adminUserId);

    const filter = {};

    if (status !== "all") filter.status = status;

    if (date) {
      const { start, end } = getDayRange(new Date(date));
      filter.requestedDate = { $gte: start, $lte: end };
    }

    // ── Scope to org users ───────────────────────────────────────────────────
    if (organizationId) {
      const orgUserIds = await getOrgUserIds(organizationId);
      filter.userId = { $in: orgUserIds };
    } else {
      // Admin has no org — return empty
      return res.status(200).json({ success: true, data: [] });
    }

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

// ── POST /admin/dish-requests/:id/forward ────────────────────────────────────
// Body: { vendorIds: string[] }
// Adds new vendors to forwardedTo (skips duplicates), marks status "reviewed",
// and returns the fully-populated document so the client never gets raw ObjectIds.
//
// The request itself is still verified to belong to the admin's org before
// forwarding so an admin cannot forward another org's requests.

export const forwardDishRequest = async (req, res) => {
  try {
    const { id }        = req.params;
    const { vendorIds } = req.body;
    const adminUserId   = req.user.id;

    if (!Array.isArray(vendorIds) || vendorIds.length === 0) {
      return res.status(400).json({
        success: false,
        msg: "vendorIds must be a non-empty array.",
      });
    }

    const dishRequest = await DishRequest.findById(id).populate("userId", "organizationId");

    if (!dishRequest) {
      return res.status(404).json({ success: false, msg: "Dish request not found." });
    }

    // ── Verify this request belongs to the admin's org ───────────────────────
    const organizationId = await getAdminOrgId(adminUserId);

    if (organizationId) {
      const requestOrgId = dishRequest.userId?.organizationId;
      if (!requestOrgId || String(requestOrgId) !== String(organizationId)) {
        return res.status(403).json({
          success: false,
          msg: "You do not have permission to forward this request.",
        });
      }
    }

    // Skip vendors that are already forwarded to
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

    // Populate before returning so the client always gets full vendor objects,
    // not raw ObjectIds — prevents the "Cannot read properties of undefined" crash.
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