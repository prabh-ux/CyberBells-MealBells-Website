import mongoose from "mongoose";
import { dishModel } from "../../Models/dish.js";
import { Review }    from "../../Models/review.js";

// ── GET /vendor/reviews?page=1&limit=10 ──────────────────────────────────────
export const getVendorReviews = async (req, res) => {
  try {
    const vendorId = new mongoose.Types.ObjectId(req.user.id);

    const page  = Math.max(1, parseInt(req.query.page  ?? "1",  10));
    const limit = Math.min(50, parseInt(req.query.limit ?? "10", 10));
    const skip  = (page - 1) * limit;

    const vendorDishIds = await dishModel.find({ vendor: vendorId }).distinct("_id");

    const [reviews, total, stats] = await Promise.all([
      Review.find({ dishId: { $in: vendorDishIds } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({ path: "userId", select: "name avatar" })
        .populate({ path: "dishId", select: "name image dishType" })
        .lean(),
      Review.countDocuments({ dishId: { $in: vendorDishIds } }),
      Review.aggregate([
        { $match: { dishId: { $in: vendorDishIds } } },
        {
          $group: {
            _id:          null,
            avg:          { $avg: "$overallRating" },
            count:        { $sum: 1 },
            avgTaste:     { $avg: "$taste" },
            avgQuantity:  { $avg: "$quantity" },
            avgQuality:   { $avg: "$quality" },
            avgFreshness: { $avg: "$freshness" },
          },
        },
      ]),
    ]);

    const round1 = (n) => Math.round(n * 10) / 10;

    const summary = stats[0]
      ? {
          avgRating:    round1(stats[0].avg),
          totalReviews: stats[0].count,
          avgTaste:     round1(stats[0].avgTaste),
          avgQuantity:  round1(stats[0].avgQuantity),
          avgQuality:   round1(stats[0].avgQuality),
          avgFreshness: round1(stats[0].avgFreshness),
        }
      : {
          avgRating: 0, totalReviews: 0,
          avgTaste: 0, avgQuantity: 0, avgQuality: 0, avgFreshness: 0,
        };

    return res.status(200).json({
      success: true,
      data: {
        reviews,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        summary,
      },
    });
  } catch (err) {
    console.error("getVendorReviews:", err);
    return res.status(500).json({ success: false, msg: "Internal server error" });
  }
};
