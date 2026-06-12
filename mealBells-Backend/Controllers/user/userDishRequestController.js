// Controllers/user/userDishRequestController.js
import { DishRequest } from "../../Models/dishrequest.js";

const getDayRange = (date = new Date()) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// ── POST /user/dish-request ───────────────────────────────────────────────────
export const submitDishRequest = async (req, res) => {
  try {
    const { id: userId, organizationId: userOrgIds } = req.user;
    const {
      requestedDate,
      dishSuggestion    = "",
      dietaryPreference = "Both",
      spiceLevel        = "Normal",
    } = req.body;

    if (!requestedDate) {
      return res.status(400).json({ success: false, msg: "requestedDate is required" });
    }

    const date = new Date(requestedDate);
    if (isNaN(date.getTime())) {
      return res.status(400).json({ success: false, msg: "Invalid requestedDate" });
    }

    // ✅ user belongs to a single org
    const organizationId = Array.isArray(userOrgIds) ? userOrgIds[0] : userOrgIds;
    if (!organizationId) {
      return res.status(400).json({ success: false, msg: "User has no associated organization" });
    }

    const { start, end } = getDayRange(date);

    const request = await DishRequest.findOneAndUpdate(
      { userId, requestedDate: { $gte: start, $lte: end } },
      {
        $set: {
          userId,
          organizationId,
          requestedDate:  date,
          dishSuggestion,
          dietaryPreference,
          spiceLevel,
          status: "pending",
        },
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({ success: true, data: request });
  } catch (err) {
    console.error("submitDishRequest:", err);
    return res.status(500).json({ success: false, msg: "Internal server error" });
  }
};