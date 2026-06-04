import mongoose from "mongoose";
import { DishRequest } from "../../Models/dishrequest.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

const getDayRange = (date = new Date()) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

const POPULATE_USER   = { path: "userId",              select: "name email avatar department" };
const POPULATE_VENDOR = { path: "forwardedTo.vendorId", select: "name logo email"             };

// ── GET /admin/dish-requests ──────────────────────────────────────────────────
// Query params:
//   status – "pending" | "reviewed" | "all"  (default: "pending")
//   date   – ISO date string                 (optional)

export const getDishRequests = async (req, res) => {
  try {
    const { status = "pending", date } = req.query;

    const filter = {};

    if (status !== "all") filter.status = status;

    if (date) {
      const { start, end } = getDayRange(new Date(date));
      filter.requestedDate = { $gte: start, $lte: end };
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

export const forwardDishRequest = async (req, res) => {
  try {
    const { id }        = req.params;
    const { vendorIds } = req.body;

    if (!Array.isArray(vendorIds) || vendorIds.length === 0) {
      return res.status(400).json({
        success: false,
        msg: "vendorIds must be a non-empty array.",
      });
    }

    const dishRequest = await DishRequest.findById(id);

    if (!dishRequest) {
      return res.status(404).json({ success: false, msg: "Dish request not found." });
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