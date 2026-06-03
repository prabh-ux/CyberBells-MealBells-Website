import mongoose from "mongoose";
import { dishModel }    from "../../Models/dish.js";
import { MenuSchedule } from "../../Models/menuSchedule.js";
import { Review }       from "../../Models/review.js";
import { userModel }    from "../../Models/user.js";

// ── POST /user/review ─────────────────────────────────────────────────────────
export const submitReview = async (req, res) => {
  try {
    const { id: userId, organizationId } = req.user;
    const {
      scheduleId,
      overallRating,
      taste     = 5,
      quantity  = 5,
      quality   = 5,
      freshness = 5,
      comment   = "",
      tags      = [],
    } = req.body;

    if (!scheduleId) {
      return res.status(400).json({ success: false, msg: "scheduleId is required" });
    }
    if (!overallRating || overallRating < 1 || overallRating > 5) {
      return res.status(400).json({ success: false, msg: "overallRating must be 1–5" });
    }

    const schedule = await MenuSchedule.findById(scheduleId).lean();
    if (!schedule) {
      return res.status(404).json({ success: false, msg: "Schedule not found" });
    }

    const review = await Review.findOneAndUpdate(
      { userId, scheduleId },
      {
        $set: {
          userId,
          dishId:         schedule.dish,
          scheduleId,
          organizationId: organizationId ?? null,
          overallRating,
          taste,
          quantity,
          quality,
          freshness,
          comment,
          tags,
        },
      },
      { upsert: true, new: true }
    );

    const dish = await dishModel.findById(schedule.dish).select("vendor").lean();

    if (dish?.vendor) {
      const allDishIds = await dishModel.find({ vendor: dish.vendor }).distinct("_id");
      const agg = await Review.aggregate([
        { $match: { dishId: { $in: allDishIds } } },
        { $group: { _id: null, avg: { $avg: "$overallRating" }, count: { $sum: 1 } } },
      ]);
      if (agg.length) {
        await userModel.findByIdAndUpdate(dish.vendor, {
          rating:       Math.round(agg[0].avg * 10) / 10,
          totalReviews: agg[0].count,
        });
      }
    }

    return res.status(200).json({ success: true, data: review });
  } catch (err) {
    console.error("submitReview:", err);
    return res.status(500).json({ success: false, msg: "Internal server error" });
  }
};

// ── GET /user/reviews ─────────────────────────────────────────────────────────
export const getMyReviews = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const page  = Math.max(1, parseInt(req.query.page  ?? "1",  10));
    const limit = Math.min(50, parseInt(req.query.limit ?? "10", 10));
    const skip  = (page - 1) * limit;

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const [reviews, total, stats] = await Promise.all([
      Review.find({ userId: userObjectId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path:   "dishId",
          select: "name image dishType availability tags",
          populate: { path: "vendor", select: "name logo" },
        })
        .lean(),
      Review.countDocuments({ userId: userObjectId }),
      Review.aggregate([
        { $match: { userId: userObjectId } },
        { $group: { _id: null, avg: { $avg: "$overallRating" }, count: { $sum: 1 } } },
      ]),
    ]);

    let avgRating = 0;
    if (stats[0]?.avg != null) {
      avgRating = Math.round(stats[0].avg * 10) / 10;
    } else if (total === 1 && reviews[0]?.overallRating) {
      avgRating = reviews[0].overallRating;
    }

    return res.status(200).json({
      success: true,
      data: {
        reviews,
        totalReviews: total,
        avgRating,
        page,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("getMyReviews:", err);
    return res.status(500).json({ success: false, msg: "Internal server error" });
  }
};
