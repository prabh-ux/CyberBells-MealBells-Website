// Controllers/vendor/vendorDishRequestController.js
import mongoose from "mongoose";
import { DishRequest } from "../../Models/dishrequest.js";

export const getVendorDishRequests = async (req, res) => {
  try {
    const vendorId = new mongoose.Types.ObjectId(req.user.id);
    const { status = "pending", orgId } = req.query;

    const match =
      status === "all"
        ? { "forwardedTo.vendorId": vendorId }
        : {
            forwardedTo: {
              $elemMatch: { vendorId, vendorStatus: status },
            },
          };

    // ✅ scope to the vendor's currently active org
    if (orgId) {
      match.organizationId = new mongoose.Types.ObjectId(orgId);
    }

    const requests = await DishRequest.find(match)
      .sort({ requestedDate: 1, createdAt: -1 })
      .populate({ path: "userId", select: "name email avatar department" })
      .lean();

    const formatted = requests.map((r) => {
      const myEntry = r.forwardedTo.find(
        (f) => f.vendorId.toString() === vendorId.toString()
      );
      return {
        _id:               r._id,
        requestedDate:     r.requestedDate,
        dishSuggestion:    r.dishSuggestion,
        dietaryPreference: r.dietaryPreference,
        spiceLevel:        r.spiceLevel,
        createdAt:         r.createdAt,
        vendorStatus:      myEntry?.vendorStatus ?? "pending",
        respondedAt:       myEntry?.respondedAt  ?? null,
        user: {
          _id:        r.userId?._id,
          name:       r.userId?.name       ?? "Unknown",
          email:      r.userId?.email      ?? "",
          avatar:     r.userId?.avatar     ?? "",
          department: r.userId?.department ?? "",
        },
      };
    });

    return res.status(200).json({ success: true, data: formatted });
  } catch (err) {
    console.error("getVendorDishRequests:", err);
    return res.status(500).json({ success: false, msg: "Internal server error" });
  }
};

export const respondToDishRequest = async (req, res) => {
  try {
    const vendorId   = new mongoose.Types.ObjectId(req.user.id);
    const { id }     = req.params;
    const { action } = req.body;

    if (!["accepted", "ignored"].includes(action))
      return res.status(400).json({ success: false, msg: 'action must be "accepted" or "ignored"' });

    const result = await DishRequest.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id), "forwardedTo.vendorId": vendorId },
      { $set: { "forwardedTo.$.vendorStatus": action, "forwardedTo.$.respondedAt": new Date() } },
      { new: true }
    );

    if (!result)
      return res.status(404).json({ success: false, msg: "Request not found or not forwarded to you" });

    return res.status(200).json({ success: true, msg: `Request ${action}`, data: { _id: result._id, action } });
  } catch (err) {
    console.error("respondToDishRequest:", err);
    return res.status(500).json({ success: false, msg: "Internal server error" });
  }
};