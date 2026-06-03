import mongoose from "mongoose";
import { dishModel }    from "../../Models/dish.js";
import { MenuSchedule } from "../../Models/menuSchedule.js";
import { Attendance }   from "../../Models/attendance.js";
import { Review }       from "../../Models/review.js";

const getUTCMidnight = (offsetDays = 0) => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d;
};

const getPeriodRange = (period) => {
  const now = new Date();

  if (period === "month") {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const end   = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));

    const buckets = [];
    let cursor = new Date(start);
    let week   = 1;
    while (cursor <= end) {
      const bucketEnd = new Date(Math.min(
        new Date(cursor).setUTCDate(cursor.getUTCDate() + 6),
        end
      ));
      buckets.push({ label: `W${week}`, start: new Date(cursor), end: new Date(bucketEnd) });
      cursor.setUTCDate(cursor.getUTCDate() + 7);
      week++;
    }
    return { start, end, buckets };
  }

  if (period === "year") {
    const start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
    const end   = new Date(Date.UTC(now.getUTCFullYear(), 11, 31, 23, 59, 59, 999));

    const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const buckets = MONTHS.map((label, i) => ({
      label,
      start: new Date(Date.UTC(now.getUTCFullYear(), i, 1)),
      end:   new Date(Date.UTC(now.getUTCFullYear(), i + 1, 0, 23, 59, 59, 999)),
    }));
    return { start, end, buckets };
  }

  // Default: "week"
  const day          = now.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday       = getUTCMidnight(diffToMonday);
  const sunday       = new Date(monday);
  sunday.setUTCDate(sunday.getUTCDate() + 6);
  sunday.setUTCHours(23, 59, 59, 999);

  const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const buckets = DAYS.map((label, i) => {
    const s = new Date(monday); s.setUTCDate(s.getUTCDate() + i);
    const e = new Date(s);      e.setUTCHours(23, 59, 59, 999);
    return { label, start: s, end: e };
  });
  return { start: monday, end: sunday, buckets };
};

const analyticsEmptyPayload = (buckets) => ({
  period:         "week",
  totalBoxes:     0,
  avgDailyMeals:  0,
  peakDay:        { label: "—", orders: 0 },
  avgRating:      0,
  totalReviews:   0,
  vegCount:       0,
  nonVegCount:    0,
  vegPct:         0,
  nonVegPct:      0,
  boxesDelivered: buckets.map((b) => ({ day: b.label, boxes: 0 })),
  mostPopular:    null,
  leastPopular:   null,
});

// ── GET /vendor/analytics?period=week|month|year ──────────────────────────────
export const getVendorAnalytics = async (req, res) => {
  try {
    const vendorId = new mongoose.Types.ObjectId(req.user.id);
    const period   = ["week", "month", "year"].includes(req.query.period)
      ? req.query.period
      : "week";

    const { start, end, buckets } = getPeriodRange(period);

    const vendorDishes = await dishModel
      .find({ vendor: vendorId })
      .select("_id name dishType image")
      .lean();
    const vendorDishIds = vendorDishes.map((d) => d._id);

    if (!vendorDishIds.length) {
      return res.status(200).json({ success: true, data: analyticsEmptyPayload(buckets) });
    }

    const schedules = await MenuSchedule.find({
      dish:          { $in: vendorDishIds },
      scheduledDate: { $gte: start, $lte: end },
    })
      .select("_id scheduledDate dish")
      .lean();

    const scheduleIds = schedules.map((s) => s._id);

    const attendances = await Attendance.find({
      scheduleId: { $in: scheduleIds },
      response:   "yes",
    })
      .select("scheduleId createdAt")
      .lean();

    const schedDateMap = {};
    schedules.forEach((s) => { schedDateMap[s._id.toString()] = s.scheduledDate; });

    const schedDishMap = {};
    schedules.forEach((s) => { schedDishMap[s._id.toString()] = s.dish.toString(); });

    const boxesDelivered = buckets.map(({ label, start: bs, end: be }) => {
      const count = attendances.filter((a) => {
        const d = new Date(schedDateMap[a.scheduleId.toString()]);
        return d >= bs && d <= be;
      }).length;
      return { day: label, boxes: count };
    });

    const totalBoxes = attendances.length;

    const dishTypeMap = {};
    vendorDishes.forEach((d) => { dishTypeMap[d._id.toString()] = d.dishType; });

    let vegCount    = 0;
    let nonVegCount = 0;
    attendances.forEach((a) => {
      const dishId = schedDishMap[a.scheduleId.toString()];
      const type   = dishTypeMap[dishId] ?? "Veg";
      if (type === "Non-Veg") nonVegCount++;
      else vegCount++;
    });

    const vegPct    = totalBoxes > 0 ? Math.round((vegCount    / totalBoxes) * 100) : 0;
    const nonVegPct = totalBoxes > 0 ? Math.round((nonVegCount / totalBoxes) * 100) : 0;

    const peakBucket    = [...boxesDelivered].sort((a, b) => b.boxes - a.boxes)[0];
    const activeDays    = boxesDelivered.filter((b) => b.boxes > 0).length || 1;
    const avgDailyMeals = Math.round(totalBoxes / activeDays);

    const reviewStats = await Review.aggregate([
      {
        $match: {
          dishId:    { $in: vendorDishIds },
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id:          null,
          avgRating:    { $avg: "$overallRating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    const avgRating    = reviewStats[0] ? Math.round(reviewStats[0].avgRating * 10) / 10 : 0;
    const totalReviews = reviewStats[0]?.totalReviews ?? 0;

    const dishOrderMap = {};
    attendances.forEach((a) => {
      const dishId = schedDishMap[a.scheduleId.toString()];
      if (dishId) dishOrderMap[dishId] = (dishOrderMap[dishId] ?? 0) + 1;
    });

    const dishOrderEntries = Object.entries(dishOrderMap).sort((a, b) => b[1] - a[1]);

    const buildDishEntry = (entry) => {
      if (!entry) return null;
      const [dishId, count] = entry;
      const dish = vendorDishes.find((d) => d._id.toString() === dishId);
      return dish
        ? {
            dishId:  dish._id,
            name:    dish.name,
            image:   dish.image,
            orders:  count,
            percent: totalBoxes > 0 ? Math.round((count / totalBoxes) * 100) : 0,
          }
        : null;
    };

    const mostPopular  = buildDishEntry(dishOrderEntries[0]);
    const leastPopular = buildDishEntry(dishOrderEntries[dishOrderEntries.length - 1]);

    return res.status(200).json({
      success: true,
      data: {
        period,
        totalBoxes,
        avgDailyMeals,
        peakDay:      { label: peakBucket?.day ?? "—", orders: peakBucket?.boxes ?? 0 },
        avgRating,
        totalReviews,
        vegCount,
        nonVegCount,
        vegPct,
        nonVegPct,
        boxesDelivered,
        mostPopular,
        leastPopular,
      },
    });
  } catch (err) {
    console.error("getVendorAnalytics:", err);
    return res.status(500).json({ success: false, msg: "Internal server error" });
  }
};
