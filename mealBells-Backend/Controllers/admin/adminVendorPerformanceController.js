// Controllers/admin/adminVendorPerformanceController.js
import mongoose         from "mongoose";
import { userModel }    from "../../Models/user.js";
import { Review }       from "../../Models/review.js";
import { Delivery }     from "../../Models/delivery.js";
import { MenuSchedule } from "../../Models/menuSchedule.js";
import { dishModel }    from "../../Models/dish.js";

const DAY_MAP  = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const WEEK_MAP = ["W1", "W2", "W3", "W4"];

const PERIOD_TO_AVAILABILITY = {
  Breakfast: "Breakfast",
  Lunch:     "Lunch",
  Dinner:    "Dinner",
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

// ─────────────────────────────────────────────────────────────────────────────
// BUG FIX #1: MenuSchedule has NO vendorId field.
// The only way to scope schedules to a vendor is:
//   MenuSchedule.dish → Dish.vendor (ObjectId)
// So we must:
//   1. Find all dish _ids where dish.vendor === vendorOid
//   2. Find all MenuSchedule where schedule.dish is in those dish ids
// This replaces every previous MenuSchedule.find({ vendorId }) call.
// ─────────────────────────────────────────────────────────────────────────────
const getVendorDishIds = async (vendorOid, availability) => {
  const query = { vendor: vendorOid };
  if (availability) query.availability = { $in: [availability, "Full Time"] };
  const dishes = await dishModel.find(query, "_id").lean();
  return dishes.map(d => d._id);
};

const getSchedulesForDishes = async (dishIds, start, end) => {
  if (!dishIds.length) return [];
  return MenuSchedule.find(
    { dish: { $in: dishIds }, scheduledDate: { $gte: start, $lte: end } },
    "_id scheduledDate"
  ).lean();
};

// ─────────────────────────────────────────────────────────────────────────────
// BUG FIX #2: Menu Accuracy was computed as:
//   reviews where taste>=7 && quantity>=7 && quality>=7 && freshness>=7
// That is a quality score, NOT accuracy.
// "Menu Accuracy" should mean: of all scheduled menus in the period,
// how many were actually delivered (status = handed_over)?
//   accuracy = (schedules with handed_over delivery / total schedules) * 100
// ─────────────────────────────────────────────────────────────────────────────
const computeAccuracy = async (scheduleIds) => {
  if (!scheduleIds.length) return 0;
  const total     = scheduleIds.length;
  const delivered = await Delivery.countDocuments({
    scheduleId: { $in: scheduleIds },
    status:     "handed_over",
  });
  return Math.round((delivered / total) * 100);
};

// ─── Zeroed-out fallback ──────────────────────────────────────────────────────
const emptyResponse = () => ({
  timeliness: 0, timelinessChange: null,
  rating:     0, ratingChange:     null, ratingReviews: 0,
  accuracy:   0, accuracyChange:   null,
  quality:    0, positives:        0,
  deliveryData: Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(); dt.setDate(dt.getDate() - (6 - i));
    return { day: DAY_MAP[dt.getDay()], actual: 0, target: 1 };
  }),
  ratingTrend:    WEEK_MAP.map(week => ({ week, v: 0 })),
  recentFeedback: [],
});

// ── GET /admin/vendor-performance/:vendorId?period=Full+Time ──────────────────
export const getVendorPerformance = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const period       = req.query.period ?? "Full Time";
    const availability = PERIOD_TO_AVAILABILITY[period]; // undefined for "Full Time" = no filter
    const isAll        = vendorId === "all";

    const vendorOid = (!isAll && mongoose.Types.ObjectId.isValid(vendorId))
      ? new mongoose.Types.ObjectId(vendorId)
      : null;

    if (!isAll && !vendorOid)
      return res.status(400).json({ success: false, msg: "Invalid vendorId." });

    // ── Date ranges ───────────────────────────────────────────────────────────
    const { start, end } = rangeFromNow(30);
    const prevEnd        = new Date(start.getTime() - 1);
    const prevStart      = new Date(start.getTime() - (end.getTime() - start.getTime()));

    // ── Resolve dish ids & schedules (current period) ─────────────────────────
    // BUG FIX: for a specific vendor we MUST go Dish→Schedule because
    // MenuSchedule has no vendorId field.
    let currentSchedules = [];

    if (isAll) {
      currentSchedules = await MenuSchedule.find(
        { scheduledDate: { $gte: start, $lte: end } },
        "_id scheduledDate"
      ).lean();
    } else {
      const vendorDishIds = await getVendorDishIds(vendorOid, availability);
      if (!vendorDishIds.length)
        return res.status(200).json({ success: true, data: emptyResponse() });
      currentSchedules = await getSchedulesForDishes(vendorDishIds, start, end);
    }

    const currentScheduleIds  = currentSchedules.map(s => s._id);
    const scheduleIdToDate    = Object.fromEntries(
      currentSchedules.map(s => [String(s._id), s.scheduledDate])
    );

    console.log(`[VendorPerf] vendorId=${vendorId} | period=${period} | schedules=${currentScheduleIds.length}`);

    // ── Reviews (current period) ──────────────────────────────────────────────
    // BUG FIX: reviews are found by scheduleId which links to MenuSchedule._id —
    // this now works correctly because currentScheduleIds is properly scoped
    // via Dish.vendor → MenuSchedule.dish (not the missing MenuSchedule.vendorId).
    const allReviews = await Review.find({ scheduleId: { $in: currentScheduleIds } })
      .populate({ path: "dishId",     select: "name image vendor" })
      .populate({ path: "scheduleId", select: "scheduledDate"     })
      .lean();

    // For a specific vendor, defensively filter reviews whose dish.vendor matches.
    // For "all", keep everything.
    const reviews = isAll
      ? allReviews
      : allReviews.filter(r => r.dishId && String(r.dishId.vendor) === String(vendorId));

    // ── Deliveries (current period) ───────────────────────────────────────────
    const deliveries   = await Delivery.find({ scheduleId: { $in: currentScheduleIds } }).lean();
    const totalReviews = reviews.length;
    const totalDel     = deliveries.length;

    console.log(`[VendorPerf] reviews=${totalReviews} | deliveries=${totalDel}`);

    // ── KPIs ──────────────────────────────────────────────────────────────────

    // Rating: overallRating is 1–5
    const avgRating = totalReviews
      ? +(reviews.reduce((s, r) => s + r.overallRating, 0) / totalReviews).toFixed(1)
      : 0;

    // Quality: composite of sub-scores (each 0–10), expressed as 0–100
    const avgQuality = totalReviews
      ? Math.round(
          reviews.reduce(
            (s, r) => s + ((r.taste + r.quantity + r.quality + r.freshness) / 4) * 10, 0
          ) / totalReviews
        )
      : 0;

    // BUG FIX: Accuracy = scheduled menus actually delivered / total scheduled * 100
    const accuracy = await computeAccuracy(currentScheduleIds);

    // Positive sentiment: reviews with overallRating >= 4 (out of 5)
    const positives = totalReviews
      ? Math.round((reviews.filter(r => r.overallRating >= 4).length / totalReviews) * 100)
      : 0;

    // Timeliness: deliveries that reached arrived_at_office or handed_over
    const completedDel = deliveries.filter(d =>
      ["arrived_at_office", "handed_over"].includes(d.status)
    );
    const timeliness = totalDel
      ? Math.round((completedDel.length / totalDel) * 100)
      : 0;

    // ── Daily delivery chart (last 7 days) ────────────────────────────────────
    const { start: chartStart } = rangeFromNow(7);
    let chartSchedules = [];

    if (isAll) {
      chartSchedules = await MenuSchedule.find(
        { scheduledDate: { $gte: chartStart, $lte: end } },
        "_id scheduledDate"
      ).lean();
    } else {
      const vendorDishIds = await getVendorDishIds(vendorOid, availability);
      chartSchedules = await getSchedulesForDishes(vendorDishIds, chartStart, end);
    }

    const chartScheduleIds    = chartSchedules.map(s => s._id);
    const chartScheduleDateMap = Object.fromEntries(
      chartSchedules.map(s => [String(s._id), s.scheduledDate])
    );

    const chartDeliveries = await Delivery.find({ scheduleId: { $in: chartScheduleIds } }).lean();

    const deliveryByDay = {};
    chartDeliveries.forEach(d => {
      const scheduledDate = chartScheduleDateMap[String(d.scheduleId)];
      if (!scheduledDate) return;
      const key = toLocalKey(scheduledDate);
      deliveryByDay[key] = (deliveryByDay[key] ?? 0) + 1;
    });

    const deliveryData = Array.from({ length: 7 }, (_, i) => {
      const dt = new Date(); dt.setDate(dt.getDate() - (6 - i)); dt.setHours(0, 0, 0, 0);
      const key = toLocalKey(dt);
      return { day: DAY_MAP[dt.getDay()], actual: deliveryByDay[key] ?? 0, target: 1 };
    });

    // ── Weekly rating trend ───────────────────────────────────────────────────
    const ratingTrend = WEEK_MAP.map((week, wi) => {
      const weeksAgo = 3 - wi;
      const wEnd   = new Date(); wEnd.setDate(wEnd.getDate() -  weeksAgo      * 7); wEnd.setHours(23, 59, 59, 999);
      const wStart = new Date(); wStart.setDate(wStart.getDate() - (weeksAgo + 1) * 7); wStart.setHours(0, 0, 0, 0);
      const slice  = reviews.filter(r => {
        const d = new Date(r.scheduleId?.scheduledDate ?? r.createdAt);
        return d >= wStart && d <= wEnd;
      });
      // overallRating is 1–5, scale to 0–100 by * 20
      return {
        week,
        v: slice.length
          ? Math.round((slice.reduce((s, r) => s + r.overallRating, 0) / slice.length) * 20)
          : 0,
      };
    });

    // ── Recent feedback ───────────────────────────────────────────────────────
    const recentFeedback = reviews
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
          onTime:     del?.status === "handed_over" || !!(del?.stepTimes?.handed_over),
        };
      });

    // ── Previous period (delta chips) ─────────────────────────────────────────
    let prevSchedules = [];

    if (isAll) {
      prevSchedules = await MenuSchedule.find(
        { scheduledDate: { $gte: prevStart, $lte: prevEnd } },
        "_id"
      ).lean();
    } else {
      const vendorDishIds = await getVendorDishIds(vendorOid, availability);
      prevSchedules = await getSchedulesForDishes(vendorDishIds, prevStart, prevEnd);
    }

    const prevScheduleIds = prevSchedules.map(s => s._id);

    const allPrevReviews = await Review.find({ scheduleId: { $in: prevScheduleIds } })
      .populate({ path: "dishId", select: "vendor" })
      .lean();

    const prevReviews = isAll
      ? allPrevReviews
      : allPrevReviews.filter(r => r.dishId && String(r.dishId.vendor) === String(vendorId));

    const prevDeliveries = await Delivery.find({ scheduleId: { $in: prevScheduleIds } }).lean();

    const prevAvgRating = prevReviews.length
      ? +(prevReviews.reduce((s, r) => s + r.overallRating, 0) / prevReviews.length).toFixed(1)
      : null;

    const prevCompletedDel = prevDeliveries.filter(d =>
      ["arrived_at_office", "handed_over"].includes(d.status)
    );
    const prevTimeliness = prevDeliveries.length
      ? Math.round((prevCompletedDel.length / prevDeliveries.length) * 100)
      : null;

    // BUG FIX: prevAccuracy also uses delivery-based calculation now
    const prevAccuracy = prevScheduleIds.length
      ? await computeAccuracy(prevScheduleIds)
      : null;

    return res.status(200).json({
      success: true,
      data: {
        timeliness,
        timelinessChange: prevTimeliness !== null ? +(timeliness - prevTimeliness).toFixed(1) : null,
        rating:           avgRating,
        ratingChange:     prevAvgRating  !== null ? +(avgRating - prevAvgRating).toFixed(1)   : null,
        ratingReviews:    totalReviews,
        accuracy,
        accuracyChange:   prevAccuracy   !== null ? +(accuracy - prevAccuracy).toFixed(1)     : null,
        quality:          avgQuality,
        positives,
        deliveryData,
        ratingTrend,
        recentFeedback,
      },
    });
  } catch (err) {
    console.error("[getVendorPerformance]", err);
    return res.status(500).json({ success: false, msg: "Internal error: " + err.message });
  }
};

// ── GET /admin/vendor-performance/vendors ─────────────────────────────────────
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