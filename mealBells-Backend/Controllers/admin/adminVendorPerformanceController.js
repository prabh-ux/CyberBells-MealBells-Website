// Controllers/admin/adminVendorPerformanceController.js
import mongoose          from "mongoose";
import { userModel }     from "../../Models/user.js";
import { Review }        from "../../Models/review.js";
import { Delivery }      from "../../Models/delivery.js";
import { MenuSchedule }  from "../../Models/menuSchedule.js";
import { dishModel }     from "../../Models/dish.js";

const DAY_MAP  = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const WEEK_MAP = ["W1", "W2", "W3", "W4"];

const PERIOD_TO_MEAL = {
  "Breakfast": "breakfast",
  "Lunch":     "lunch",
  "Dinner":    "dinner",
};

// Availability values on Dish that map to each period filter.
// "Full Time" filter = show everything (no dish availability filter).
const PERIOD_TO_AVAILABILITY = {
  "Breakfast": "Breakfast",
  "Lunch":     "Lunch",
  "Dinner":    "Dinner",
};

const rangeFromNow = (days) => {
  const end   = new Date(); end.setHours(23, 59, 59, 999);
  const start = new Date(); start.setDate(start.getDate() - (days - 1)); start.setHours(0, 0, 0, 0);
  return { start, end };
};

const toLocalKey = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/**
 * Returns the ObjectId[] of dishes belonging to a vendor,
 * optionally filtered by availability period.
 */
const getVendorDishIds = async (vendorOid, availability) => {
  const query = { vendor: vendorOid };
  if (availability) query.availability = { $in: [availability, "Full Time"] };
  const dishes = await dishModel.find(query).select("_id").lean();
  return dishes.map(d => d._id);
};

/**
 * Given a list of dish ObjectIds, returns a Set<string> of MenuSchedule _id
 * strings whose `dish` field is one of those dish IDs, within [start, end].
 */
const getScheduleIdSetForDishes = async (dishIds, start, end) => {
  if (!dishIds.length) return new Set();
  const schedules = await MenuSchedule.find({
    dish:          { $in: dishIds },
    scheduledDate: { $gte: start, $lte: end },
  }).select("_id").lean();
  return new Set(schedules.map(s => String(s._id)));
};

// GET /admin/vendor-performance/:vendorId?period=Full+Time
export const getVendorPerformance = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const period       = req.query.period ?? "Full Time";
    const mealType     = PERIOD_TO_MEAL[period];          // for MenuSchedule.mealType (if you use it)
    const availability = PERIOD_TO_AVAILABILITY[period];  // for Dish.availability
    const isAll        = vendorId === "all";

    const vendorOid = (!isAll && mongoose.Types.ObjectId.isValid(vendorId))
      ? new mongoose.Types.ObjectId(vendorId)
      : null;

    if (!isAll && !vendorOid) {
      return res.status(400).json({ success: false, msg: "Invalid vendorId." });
    }

    // ── Date ranges ───────────────────────────────────────────────────────
    const days           = 30;
    const { start, end } = rangeFromNow(days);
    const prevEnd        = new Date(start.getTime() - 1);
    const prevStart      = new Date(start.getTime() - (end.getTime() - start.getTime()));

    // ── Resolve vendor dish IDs once (reused across all windows) ──────────
    // For "all", we skip dish filtering entirely.
    let vendorDishIds     = [];
    if (!isAll) {
      vendorDishIds = await getVendorDishIds(vendorOid, availability);
      if (!vendorDishIds.length) {
        // Vendor has no dishes — return zeroed-out response immediately.
        return res.status(200).json({
          success: true,
          data: {
            timeliness: 0, timelinessChange: null,
            rating: 0,     ratingChange: null, ratingReviews: 0,
            accuracy: 0,   accuracyChange: null,
            quality: 0,    positives: 0,
            deliveryData: Array.from({ length: 7 }, (_, i) => {
              const dt = new Date();
              dt.setDate(dt.getDate() - (6 - i));
              return { day: DAY_MAP[dt.getDay()], actual: 0, target: 1 };
            }),
            ratingTrend:    WEEK_MAP.map(week => ({ week, v: 0 })),
            recentFeedback: [],
          },
        });
      }
    }

    // ── 30-day schedules (scoped to vendor if needed) ─────────────────────
    let scopedScheduleIds;
    const scheduleIdToDate = {};

    if (isAll) {
      const schedules = await MenuSchedule.find({
        scheduledDate: { $gte: start, $lte: end },
      }).select("_id scheduledDate").lean();
      schedules.forEach(s => { scheduleIdToDate[String(s._id)] = s.scheduledDate; });
      scopedScheduleIds = schedules.map(s => s._id);
    } else {
      // Directly query schedules whose `dish` belongs to this vendor.
      const schedules = await MenuSchedule.find({
        dish:          { $in: vendorDishIds },
        scheduledDate: { $gte: start, $lte: end },
      }).select("_id scheduledDate").lean();
      schedules.forEach(s => { scheduleIdToDate[String(s._id)] = s.scheduledDate; });
      scopedScheduleIds = schedules.map(s => s._id);
    }

    console.log(`[VendorPerf] vendorId=${vendorId} | period=${period} | scopedSchedules=${scopedScheduleIds.length}`);

    // ── Reviews ───────────────────────────────────────────────────────────
    const reviews = await Review.find({ scheduleId: { $in: scopedScheduleIds } })
      .populate({ path: "dishId",     select: "name image vendor" })
      .populate({ path: "scheduleId", select: "scheduledDate" })
      .lean();

    // For "all" no extra filter needed; for a specific vendor the schedules
    // are already scoped, but a schedule can have dishes from multiple vendors
    // if your data allows it — filter defensively.
    const filteredReviews = isAll
      ? reviews
      : reviews.filter(r => r.dishId && String(r.dishId.vendor) === String(vendorId));

    // ── Deliveries ────────────────────────────────────────────────────────
    const deliveries      = await Delivery.find({ scheduleId: { $in: scopedScheduleIds } }).lean();
    const totalDeliveries = deliveries.length;
    const totalReviews    = filteredReviews.length;

    console.log(`[VendorPerf] reviews=${totalReviews} | deliveries=${totalDeliveries}`);

    // ── KPI calculations ──────────────────────────────────────────────────
    const avgRating = totalReviews
      ? +(filteredReviews.reduce((s, r) => s + r.overallRating, 0) / totalReviews).toFixed(1)
      : 0;

    const avgQuality = totalReviews
      ? Math.round(
          filteredReviews.reduce(
            (s, r) => s + ((r.taste + r.quantity + r.quality + r.freshness) / 4) * 10, 0
          ) / totalReviews
        )
      : 0;

    const accurateCount = filteredReviews.filter(
      r => r.taste >= 7 && r.quantity >= 7 && r.quality >= 7 && r.freshness >= 7
    ).length;
    const accuracy = totalReviews ? Math.round((accurateCount / totalReviews) * 100) : 0;

    const positives = totalReviews
      ? Math.round((filteredReviews.filter(r => r.overallRating >= 4).length / totalReviews) * 100)
      : 0;

    const completedDeliveries = deliveries.filter(d =>
      ["arrived_at_office", "handed_over"].includes(d.status)
    );
    const timeliness = totalDeliveries
      ? Math.round((completedDeliveries.length / totalDeliveries) * 100)
      : 0;

    // ── Daily delivery chart (last 7 days) ────────────────────────────────
    const { start: chartStart } = rangeFromNow(7);

    let chartScopedIds;
    const chartScheduleDateMap = {};

    if (isAll) {
      const chartSchedules = await MenuSchedule.find({
        scheduledDate: { $gte: chartStart, $lte: end },
      }).select("_id scheduledDate").lean();
      chartSchedules.forEach(s => { chartScheduleDateMap[String(s._id)] = s.scheduledDate; });
      chartScopedIds = chartSchedules.map(s => s._id);
    } else {
      const chartSchedules = await MenuSchedule.find({
        dish:          { $in: vendorDishIds },
        scheduledDate: { $gte: chartStart, $lte: end },
      }).select("_id scheduledDate").lean();
      chartSchedules.forEach(s => { chartScheduleDateMap[String(s._id)] = s.scheduledDate; });
      chartScopedIds = chartSchedules.map(s => s._id);
    }

    const chartDeliveries = await Delivery.find({ scheduleId: { $in: chartScopedIds } }).lean();

    const deliveryByDay = {};
    chartDeliveries.forEach(d => {
      const scheduledDate = chartScheduleDateMap[String(d.scheduleId)];
      if (!scheduledDate) return;
      const key = toLocalKey(scheduledDate);
      deliveryByDay[key] = (deliveryByDay[key] ?? 0) + 1;
    });

    const deliveryData = Array.from({ length: 7 }, (_, i) => {
      const dt = new Date();
      dt.setDate(dt.getDate() - (6 - i));
      dt.setHours(0, 0, 0, 0);
      const key = toLocalKey(dt);
      return { day: DAY_MAP[dt.getDay()], actual: deliveryByDay[key] ?? 0, target: 1 };
    });

    // ── Weekly rating trend (W1 oldest → W4 most recent) ──────────────────
    const ratingTrend = WEEK_MAP.map((week, wi) => {
      const weeksAgo = 3 - wi;
      const wEnd   = new Date(); wEnd.setDate(wEnd.getDate() - weeksAgo * 7);           wEnd.setHours(23, 59, 59, 999);
      const wStart = new Date(); wStart.setDate(wStart.getDate() - (weeksAgo + 1) * 7); wStart.setHours(0, 0, 0, 0);
      const slice  = filteredReviews.filter(r => {
        const d = new Date(r.scheduleId?.scheduledDate ?? r.createdAt);
        return d >= wStart && d <= wEnd;
      });
      return {
        week,
        v: slice.length
          ? Math.round((slice.reduce((s, r) => s + r.overallRating, 0) / slice.length) * 20)
          : 0,
      };
    });

    // ── Recent feedback rows ───────────────────────────────────────────────
    const recentFeedback = filteredReviews
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10)
      .map(r => {
        const schedId = r.scheduleId?._id ?? r.scheduleId;
        const del     = deliveries.find(d => String(d.scheduleId) === String(schedId));
        return {
          date:       new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          dish:       r.dishId?.name  ?? "Unknown Dish",
          image:      r.dishId?.image ?? "",
          rating:     r.overallRating,
          complaints: r.comment || "None",
          tags:       r.tags ?? [],
          onTime:     !!(del?.stepTimes?.handed_over) || del?.status === "handed_over",
        };
      });

    // ── Previous period (for delta chips) ─────────────────────────────────
    let prevScopedScheduleIds;

    if (isAll) {
      const prevSchedules = await MenuSchedule.find({
        scheduledDate: { $gte: prevStart, $lte: prevEnd },
      }).select("_id").lean();
      prevScopedScheduleIds = prevSchedules.map(s => s._id);
    } else {
      const prevSchedules = await MenuSchedule.find({
        dish:          { $in: vendorDishIds },
        scheduledDate: { $gte: prevStart, $lte: prevEnd },
      }).select("_id").lean();
      prevScopedScheduleIds = prevSchedules.map(s => s._id);
    }

    const allPrevReviews = await Review.find({ scheduleId: { $in: prevScopedScheduleIds } })
      .populate({ path: "dishId", select: "vendor" })
      .lean();

    const prevReviews = isAll
      ? allPrevReviews
      : allPrevReviews.filter(r => r.dishId && String(r.dishId.vendor) === String(vendorId));

    const prevDeliveries = await Delivery.find({ scheduleId: { $in: prevScopedScheduleIds } }).lean();

    const prevAvgRating = prevReviews.length
      ? +(prevReviews.reduce((s, r) => s + r.overallRating, 0) / prevReviews.length).toFixed(1)
      : null;

    const prevCompletedDeliveries = prevDeliveries.filter(d =>
      ["arrived_at_office", "handed_over"].includes(d.status)
    );
    const prevTimeliness = prevDeliveries.length
      ? Math.round((prevCompletedDeliveries.length / prevDeliveries.length) * 100)
      : null;

    const prevAccurateCount = prevReviews.filter(
      r => r.taste >= 7 && r.quantity >= 7 && r.quality >= 7 && r.freshness >= 7
    ).length;
    const prevAccuracy = prevReviews.length
      ? Math.round((prevAccurateCount / prevReviews.length) * 100)
      : null;

    return res.status(200).json({
      success: true,
      data: {
        timeliness,
        timelinessChange: prevTimeliness !== null ? +(timeliness - prevTimeliness).toFixed(1) : null,
        rating:           avgRating,
        ratingChange:     prevAvgRating  !== null ? +(avgRating  - prevAvgRating ).toFixed(1) : null,
        ratingReviews:    totalReviews,
        accuracy,
        accuracyChange:   prevAccuracy   !== null ? +(accuracy   - prevAccuracy  ).toFixed(1) : null,
        quality:          avgQuality,
        positives,
        deliveryData,
        ratingTrend,
        recentFeedback,
      },
    });
  } catch (err) {
    console.error("Vendor performance error:", err);
    return res.status(500).json({ success: false, msg: "Internal error: " + err.message });
  }
};

// GET /admin/vendor-performance/vendors
export const getVendorList = async (req, res) => {
  try {
    const vendors = await userModel
      .find({ type: "vendor" })
      .select("_id name logo")
      .sort({ name: 1 })
      .lean();
    return res.status(200).json({ success: true, vendors });
  } catch (err) {
    return res.status(500).json({ success: false, msg: "Internal error: " + err.message });
  }
};