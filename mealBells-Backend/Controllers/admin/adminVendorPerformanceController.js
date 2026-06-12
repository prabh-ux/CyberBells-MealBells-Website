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

// ── Org helpers ───────────────────────────────────────────────────────────────

const getAdminOrgId = async (adminUserId) => {
  const admin = await userModel.findById(adminUserId).select("organizationId").lean();
  return admin?.organizationId?.[0] ?? null;   // single ObjectId
};

const getOrgVendorIds = async (organizationId) => {
  if (!organizationId) return [];
  const vendors = await userModel.find(
    { type: "vendor", organizationId: organizationId },  // ✅ no extra array wrap
    "_id"
  ).lean();
  return vendors.map((v) => v._id);
};

const getOrgDishIds = async (orgVendorIds, availability) => {
  if (!orgVendorIds?.length) return [];
  const query = { vendor: { $in: orgVendorIds } };
  if (availability) query.availability = { $in: [availability, "Full Time"] };
  const dishes = await dishModel.find(query, "_id").lean();
  return dishes.map(d => d._id);
};

// ── Vendor helpers ────────────────────────────────────────────────────────────

const getVendorDishIds = async (vendorOid, availability) => {
  const query = { vendor: vendorOid };
  if (availability) query.availability = { $in: [availability, "Full Time"] };
  const dishes = await dishModel.find(query, "_id").lean();
  return dishes.map(d => d._id);
};

// ✅ All schedule lookups now include organizationId
const getSchedulesForDishes = async (dishIds, start, end, organizationId) => {
  if (!dishIds.length) return [];
  return MenuSchedule.find(
    {
      dish:          { $in: dishIds },
      scheduledDate: { $gte: start, $lte: end },
      organizationId,                            // ✅ org-scoped
    },
    "_id scheduledDate"
  ).lean();
};

// ✅ Delivery accuracy scoped to org
const computeAccuracy = async (scheduleIds, organizationId) => {
  if (!scheduleIds.length) return 0;
  const total     = scheduleIds.length;
  const delivered = await Delivery.countDocuments({
    scheduleId:    { $in: scheduleIds },
    organizationId,                              // ✅ org-scoped
    status:        "handed_over",
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

// ── GET /admin/vendor-performance/:vendorId?period=Full+Time ──────────────────
export const getVendorPerformance = async (req, res) => {
  try {
    const { vendorId }  = req.params;
    const period        = req.query.period ?? "Full Time";
    const availability  = PERIOD_TO_AVAILABILITY[period];
    const isAll         = vendorId === "all";
    const adminUserId   = req.user.id;

    const vendorOid = (!isAll && mongoose.Types.ObjectId.isValid(vendorId))
      ? new mongoose.Types.ObjectId(vendorId)
      : null;

    if (!isAll && !vendorOid)
      return res.status(400).json({ success: false, msg: "Invalid vendorId." });

    // ── Resolve org context ───────────────────────────────────────────────────
    const organizationId = await getAdminOrgId(adminUserId);
    if (!organizationId)
      return res.status(200).json({ success: true, data: emptyResponse() });

    const orgVendorIds = await getOrgVendorIds(organizationId);

    // ── Date ranges ───────────────────────────────────────────────────────────
    const { start, end } = rangeFromNow(30);
    const prevEnd        = new Date(start.getTime() - 1);
    const prevStart      = new Date(start.getTime() - (end.getTime() - start.getTime()));

    // ── Current period schedules ──────────────────────────────────────────────
    let currentSchedules = [];

    if (isAll) {
      const orgDishIds = await getOrgDishIds(orgVendorIds, availability);
      if (!orgDishIds.length)
        return res.status(200).json({ success: true, data: emptyResponse() });
      // ✅ org-scoped
      currentSchedules = await MenuSchedule.find(
        {
          dish:          { $in: orgDishIds },
          scheduledDate: { $gte: start, $lte: end },
          organizationId,
        },
        "_id scheduledDate"
      ).lean();
    } else {
      const vendorDishIds = await getVendorDishIds(vendorOid, availability);
      if (!vendorDishIds.length)
        return res.status(200).json({ success: true, data: emptyResponse() });
      currentSchedules = await getSchedulesForDishes(vendorDishIds, start, end, organizationId);
    }

    const currentScheduleIds = currentSchedules.map(s => s._id);

    // ── Reviews (scoped by organizationId on review doc) ─────────────────────
    const reviewFilter = {
      scheduleId:     { $in: currentScheduleIds },
      organizationId,
    };

    const allReviews = await Review.find(reviewFilter)
      .populate({ path: "dishId",     select: "name image vendor" })
      .populate({ path: "scheduleId", select: "scheduledDate"     })
      .lean();

    const reviews = isAll
      ? allReviews
      : allReviews.filter(r => r.dishId && String(r.dishId.vendor) === String(vendorId));

    // ── Deliveries (org-scoped) ───────────────────────────────────────────────
    const deliveries = await Delivery.find({
      scheduleId:    { $in: currentScheduleIds },
      organizationId,                            // ✅ org-scoped
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

    const accuracy = await computeAccuracy(currentScheduleIds, organizationId);

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
    let chartSchedules = [];

    if (isAll) {
      const orgDishIds = await getOrgDishIds(orgVendorIds, availability);
      chartSchedules   = orgDishIds.length
        ? await MenuSchedule.find(
            {
              dish:          { $in: orgDishIds },
              scheduledDate: { $gte: chartStart, $lte: end },
              organizationId,                              // ✅ org-scoped
            },
            "_id scheduledDate"
          ).lean()
        : [];
    } else {
      const vendorDishIds = await getVendorDishIds(vendorOid, availability);
      chartSchedules = await getSchedulesForDishes(vendorDishIds, chartStart, end, organizationId);
    }

    const chartScheduleIds     = chartSchedules.map(s => s._id);
    const chartScheduleDateMap = Object.fromEntries(
      chartSchedules.map(s => [String(s._id), s.scheduledDate])
    );

    // ✅ org-scoped chart deliveries
    const chartDeliveries = await Delivery.find({
      scheduleId:    { $in: chartScheduleIds },
      organizationId,
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
    let prevSchedules = [];

    if (isAll) {
      const orgDishIds = await getOrgDishIds(orgVendorIds, availability);
      prevSchedules    = orgDishIds.length
        ? await MenuSchedule.find(
            {
              dish:          { $in: orgDishIds },
              scheduledDate: { $gte: prevStart, $lte: prevEnd },
              organizationId,                              // ✅ org-scoped
            },
            "_id"
          ).lean()
        : [];
    } else {
      const vendorDishIds = await getVendorDishIds(vendorOid, availability);
      prevSchedules = await getSchedulesForDishes(vendorDishIds, prevStart, prevEnd, organizationId);
    }

    const prevScheduleIds = prevSchedules.map(s => s._id);

    const allPrevReviews = await Review.find({
      scheduleId:     { $in: prevScheduleIds },
      organizationId,
    })
      .populate({ path: "dishId", select: "vendor" })
      .lean();

    const prevReviews = isAll
      ? allPrevReviews
      : allPrevReviews.filter(r => r.dishId && String(r.dishId.vendor) === String(vendorId));

    // ✅ org-scoped prev deliveries
    const prevDeliveries = await Delivery.find({
      scheduleId:    { $in: prevScheduleIds },
      organizationId,
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
      ? await computeAccuracy(prevScheduleIds, organizationId)
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
    const organizationId = await getAdminOrgId(req.user.id);
    if (!organizationId)
      return res.status(200).json({ success: true, vendors: [] });

    const vendors = await userModel
      .find(
        { type: "vendor", organizationId: organizationId },   // ✅ no extra array wrap
        "_id name logo"
      )
      .sort({ name: 1 })
      .lean();

    return res.status(200).json({ success: true, vendors });
  } catch (err) {
    return res.status(500).json({ success: false, msg: "Internal error: " + err.message });
  }
};