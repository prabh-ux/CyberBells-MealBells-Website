// Controllers/super-admin/superAdminVendorPerformanceController.js
import mongoose         from "mongoose";
import { userModel }    from "../../Models/user.js";
import { Review }       from "../../Models/review.js";
import { Delivery }     from "../../Models/delivery.js";
import { MenuSchedule } from "../../Models/menuSchedule.js";
import { dishModel }    from "../../Models/dish.js";
import { organizationModel as Organization } from "../../Models/organization.js";

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

// ── Org resolution (mirrors superAdminAnalyticsController) ───────────────────

const resolveOrgIds = async (orgId) => {
  if (orgId && orgId !== "all" && mongoose.Types.ObjectId.isValid(orgId)) {
    return [new mongoose.Types.ObjectId(orgId)];
  }
  const orgs = await Organization.find({}, "_id").lean();
  return orgs.map(o => o._id);
};

// ── Vendor helpers ────────────────────────────────────────────────────────────

/**
 * Returns all vendor _ids belonging to the resolved org scope.
 * If a specific vendorId is provided (not "all"), validates it belongs to the scope.
 */
const resolveVendorIds = async (orgIds, vendorId) => {
  if (vendorId !== "all" && mongoose.Types.ObjectId.isValid(vendorId)) {
    // Return only if this vendor belongs to one of the orgs
    const v = await userModel.findOne(
      { _id: new mongoose.Types.ObjectId(vendorId), type: "vendor", organizationId: { $in: orgIds } },
      "_id"
    ).lean();
    return v ? [v._id] : [];
  }
  // "all" — every vendor across the orgs
  const vendors = await userModel.find(
    { type: "vendor", organizationId: { $in: orgIds } },
    "_id"
  ).lean();
  return vendors.map(v => v._id);
};

const getDishIds = async (vendorIds, availability) => {
  if (!vendorIds?.length) return [];
  const query = { vendor: { $in: vendorIds } };
  if (availability) query.availability = { $in: [availability, "Full Time"] };
  const dishes = await dishModel.find(query, "_id").lean();
  return dishes.map(d => d._id);
};

const getSchedulesForDishes = async (dishIds, start, end, orgIds) => {
  if (!dishIds.length) return [];
  return MenuSchedule.find(
    {
      dish:           { $in: dishIds },
      scheduledDate:  { $gte: start, $lte: end },
      organizationId: { $in: orgIds },
    },
    "_id scheduledDate"
  ).lean();
};

const computeAccuracy = async (scheduleIds, orgIds) => {
  if (!scheduleIds.length) return 0;
  const total     = scheduleIds.length;
  const delivered = await Delivery.countDocuments({
    scheduleId:     { $in: scheduleIds },
    organizationId: { $in: orgIds },
    status:         "handed_over",
  });
  return Math.round((delivered / total) * 100);
};

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

// ── GET /super-admin/vendor-performance/vendors?orgId=xxx ────────────────────
export const getSuperVendorList = async (req, res) => {
  try {
    const orgId  = req.query.orgId || "all";
    const orgIds = await resolveOrgIds(orgId);

    const vendors = await userModel
      .find(
        { type: "vendor", organizationId: { $in: orgIds } },
        "_id name logo"
      )
      .sort({ name: 1 })
      .lean();

    return res.status(200).json({ success: true, vendors });
  } catch (err) {
    console.error("[getSuperVendorList]", err);
    return res.status(500).json({ success: false, msg: "Internal error: " + err.message });
  }
};

// ── GET /super-admin/vendor-performance/:vendorId?orgId=xxx&period=Full+Time ─
export const getSuperVendorPerformance = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const period       = req.query.period ?? "Full Time";
    const orgId        = req.query.orgId  ?? "all";
    const availability = PERIOD_TO_AVAILABILITY[period];
    const isAll        = vendorId === "all";

    if (!isAll && !mongoose.Types.ObjectId.isValid(vendorId)) {
      return res.status(400).json({ success: false, msg: "Invalid vendorId." });
    }

    // ── Resolve org scope ─────────────────────────────────────────────────────
    const orgIds    = await resolveOrgIds(orgId);
    const vendorIds = await resolveVendorIds(orgIds, vendorId);

    if (!vendorIds.length)
      return res.status(200).json({ success: true, data: emptyResponse() });

    // ── Date ranges ───────────────────────────────────────────────────────────
    const { start, end } = rangeFromNow(30);
    const prevEnd        = new Date(start.getTime() - 1);
    const prevStart      = new Date(start.getTime() - (end.getTime() - start.getTime()));

    // ── Dish IDs for the resolved vendors ────────────────────────────────────
    const dishIds = await getDishIds(vendorIds, availability);
    if (!dishIds.length)
      return res.status(200).json({ success: true, data: emptyResponse() });

    // ── Current period schedules ──────────────────────────────────────────────
    const currentSchedules = await getSchedulesForDishes(dishIds, start, end, orgIds);

    if (!currentSchedules.length)
      return res.status(200).json({ success: true, data: emptyResponse() });

    const currentScheduleIds = currentSchedules.map(s => s._id);

    // ── Reviews ───────────────────────────────────────────────────────────────
    const reviewFilter = {
      scheduleId:     { $in: currentScheduleIds },
      organizationId: { $in: orgIds },
    };

    const allReviews = await Review.find(reviewFilter)
      .populate({ path: "dishId",     select: "name image vendor" })
      .populate({ path: "scheduleId", select: "scheduledDate"     })
      .lean();

    // If filtering by a specific vendor, narrow reviews to that vendor's dishes
    const reviews = isAll
      ? allReviews
      : allReviews.filter(r => r.dishId && String(r.dishId.vendor) === vendorId);

    // ── Deliveries ────────────────────────────────────────────────────────────
    const deliveries = await Delivery.find({
      scheduleId:     { $in: currentScheduleIds },
      organizationId: { $in: orgIds },
    }).lean();

    const totalReviews = reviews.length;
    const totalDel     = deliveries.length;

    // ── KPIs ──────────────────────────────────────────────────────────────────
    const avgRating = totalReviews
      ? +(reviews.reduce((s, r) => s + r.overallRating, 0) / totalReviews).toFixed(1)
      : 0;

    const avgQuality = totalReviews
      ? Math.round(
          reviews.reduce(
            (s, r) => s + ((r.taste + r.quantity + r.quality + r.freshness) / 4) * 10, 0
          ) / totalReviews
        )
      : 0;

    const accuracy = await computeAccuracy(currentScheduleIds, orgIds);

    const positives = totalReviews
      ? Math.round((reviews.filter(r => r.overallRating >= 4).length / totalReviews) * 100)
      : 0;

    const completedDel = deliveries.filter(d =>
      ["arrived_at_office", "handed_over"].includes(d.status)
    );
    const timeliness = totalDel
      ? Math.round((completedDel.length / totalDel) * 100)
      : 0;

    // ── Daily delivery chart (last 7 days) ────────────────────────────────────
    const { start: chartStart } = rangeFromNow(7);
    const chartDishIds          = await getDishIds(vendorIds, availability);
    const chartSchedules        = await getSchedulesForDishes(chartDishIds, chartStart, end, orgIds);

    const chartScheduleIds     = chartSchedules.map(s => s._id);
    const chartScheduleDateMap = Object.fromEntries(
      chartSchedules.map(s => [String(s._id), s.scheduledDate])
    );

    const chartDeliveries = await Delivery.find({
      scheduleId:     { $in: chartScheduleIds },
      organizationId: { $in: orgIds },
    }).lean();

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
      const wEnd   = new Date(); wEnd.setDate(wEnd.getDate() - weeksAgo * 7); wEnd.setHours(23, 59, 59, 999);
      const wStart = new Date(); wStart.setDate(wStart.getDate() - (weeksAgo + 1) * 7); wStart.setHours(0, 0, 0, 0);
      const slice  = reviews.filter(r => {
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

    // ── Previous period deltas ────────────────────────────────────────────────
    const prevDishIds   = await getDishIds(vendorIds, availability);
    const prevSchedules = await getSchedulesForDishes(prevDishIds, prevStart, prevEnd, orgIds);
    const prevScheduleIds = prevSchedules.map(s => s._id);

    const allPrevReviews = await Review.find({
      scheduleId:     { $in: prevScheduleIds },
      organizationId: { $in: orgIds },
    })
      .populate({ path: "dishId", select: "vendor" })
      .lean();

    const prevReviews = isAll
      ? allPrevReviews
      : allPrevReviews.filter(r => r.dishId && String(r.dishId.vendor) === vendorId);

    const prevDeliveries = await Delivery.find({
      scheduleId:     { $in: prevScheduleIds },
      organizationId: { $in: orgIds },
    }).lean();

    const prevAvgRating = prevReviews.length
      ? +(prevReviews.reduce((s, r) => s + r.overallRating, 0) / prevReviews.length).toFixed(1)
      : null;

    const prevCompletedDel = prevDeliveries.filter(d =>
      ["arrived_at_office", "handed_over"].includes(d.status)
    );
    const prevTimeliness = prevDeliveries.length
      ? Math.round((prevCompletedDel.length / prevDeliveries.length) * 100)
      : null;

    const prevAccuracy = prevScheduleIds.length
      ? await computeAccuracy(prevScheduleIds, orgIds)
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
    console.error("[getSuperVendorPerformance]", err);
    return res.status(500).json({ success: false, msg: "Internal error: " + err.message });
  }
};
