// Controllers/shared/deliveryController.js
import mongoose from "mongoose";
import { dishModel }    from "../../Models/dish.js";
import { MenuSchedule } from "../../Models/menuSchedule.js";
import { Delivery }     from "../../Models/delivery.js";
import { userModel }    from "../../Models/user.js";

const STEPS = [
  "preparing",
  "packed",
  "out_for_delivery",
  "arrived_at_office",
  "handed_over",
];

const STEP_LABELS = {
  preparing:         { label: "Preparing",        icon: "Utensils"    },
  packed:            { label: "Packed",            icon: "Package"     },
  out_for_delivery:  { label: "Out for Delivery",  icon: "Bike"        },
  arrived_at_office: { label: "Arrived at Office", icon: "MapPin"      },
  handed_over:       { label: "Ready for Pickup",  icon: "ShoppingBag" },
};

const getUTCMidnight = () => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

const getDayRange = (date = new Date()) => {
  const start = new Date(date); start.setHours(0,  0,  0,   0);
  const end   = new Date(date); end.setHours(23, 59, 59, 999);
  return { start, end };
};

const fmtTime = (date) =>
  date
    ? new Date(date).toLocaleTimeString("en-US", {
        hour: "numeric", minute: "2-digit", hour12: true,
      })
    : null;

const buildVendorSteps = (delivery) => {
  const currentIdx = STEPS.indexOf(delivery.status);
  return STEPS.map((key, idx) => {
    const status =
      idx < currentIdx     ? "completed"
      : idx === currentIdx ? "current"
      : "pending";
    const subtitle =
      status === "completed" && delivery.stepTimes[key]
        ? `Completed at ${fmtTime(delivery.stepTimes[key])}`
        : "";
    return { key, label: STEP_LABELS[key].label, status, subtitle };
  });
};

const buildUserSteps = (delivery) => {
  const currentIdx = STEPS.indexOf(delivery.status);
  return STEPS.map((key, idx) => {
    const status =
      idx < currentIdx     ? "done"
      : idx === currentIdx ? "active"
      : "pending";
    return {
      id:    key,
      label: STEP_LABELS[key].label,
      icon:  STEP_LABELS[key].icon,
      status,
      time:  status === "done" || status === "active"
               ? fmtTime(delivery.stepTimes[key])
               : null,
    };
  });
};

const getUserOrgId = async (userId) => {
  const user = await userModel.findById(userId).select("organizationId").lean();
  const ids  = user?.organizationId ?? [];
  return ids.length > 0 ? ids[0] : null;
};

const getVendorOrgIds = async (vendorUserId) => {
  const vendor = await userModel.findById(vendorUserId).select("organizationId").lean();
  return vendor?.organizationId ?? [];
};

const resolveVendorOrgId = async (vendorUserId, orgIdParam) => {
  const vendorOrgIds = await getVendorOrgIds(vendorUserId);
  if (!vendorOrgIds.length) return null;
  if (orgIdParam) {
    const match = vendorOrgIds.find(id => id.toString() === orgIdParam);
    return match ?? null;
  }
  return vendorOrgIds[0];
};

const findTodayScheduleForVendor = async (vendorId, organizationId) => {
  const vendorDishIds = await dishModel.find({ vendor: vendorId }).distinct("_id");
  return MenuSchedule.findOne({
    dish:          { $in: vendorDishIds },
    organizationId,
    scheduledDate: getUTCMidnight(),
  }).lean();
};

// ── VENDOR: GET today's delivery?orgId=<id> ───────────────────────────────────
export const getTodayDelivery = async (req, res) => {
  try {
    const vendorId = new mongoose.Types.ObjectId(req.user.id);

    const organizationId = await resolveVendorOrgId(req.user.id, req.query.orgId);
    if (!organizationId) {
      return res.status(400).json({ success: false, msg: "Valid orgId is required" });
    }

    const schedule = await findTodayScheduleForVendor(vendorId, organizationId);
    if (!schedule) {
      return res.status(404).json({ success: false, msg: "No dish scheduled for today" });
    }

    let delivery = await Delivery.findOne({
      scheduleId:    schedule._id,
      vendorId,
      organizationId,
    });

    if (!delivery) {
      delivery = await Delivery.create({
        scheduleId:    schedule._id,
        vendorId,
        organizationId,
        status:        "preparing",
        stepTimes:     { preparing: new Date() },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        _id:         delivery._id,
        status:      delivery.status,
        isCompleted: delivery.status === "handed_over",
        canAdvance:  delivery.status !== "handed_over",
        steps:       buildVendorSteps(delivery),
      },
    });
  } catch (err) {
    console.error("getTodayDelivery:", err);
    return res.status(500).json({ success: false, msg: "Internal server error" });
  }
};

// ── VENDOR: Advance delivery status ──────────────────────────────────────────
// ✅ FIX: scope to organizationId too (passed via ?orgId=), in addition to vendorId,
// so advancing always operates on the delivery for the org currently shown in UI.
export const advanceDeliveryStatus = async (req, res) => {
  try {
    const vendorId = new mongoose.Types.ObjectId(req.user.id);
    const { orgId } = req.query;

    const match = { _id: req.params.deliveryId, vendorId };
    if (orgId) {
      match.organizationId = new mongoose.Types.ObjectId(orgId);
    }

    const delivery = await Delivery.findOne(match);
    if (!delivery) {
      return res.status(404).json({ success: false, msg: "Delivery not found" });
    }

    const currentIdx = STEPS.indexOf(delivery.status);
    if (currentIdx === STEPS.length - 1) {
      return res.status(400).json({ success: false, msg: "Already completed" });
    }

    const next = STEPS[currentIdx + 1];
    delivery.status          = next;
    delivery.stepTimes[next] = new Date();
    delivery.markModified("stepTimes");
    await delivery.save();

    return res.status(200).json({
      success: true,
      data: {
        _id:         delivery._id,
        status:      delivery.status,
        isCompleted: delivery.status === "handed_over",
        canAdvance:  delivery.status !== "handed_over",
        steps:       buildVendorSteps(delivery),
      },
    });
  } catch (err) {
    console.error("advanceDeliveryStatus:", err);
    return res.status(500).json({ success: false, msg: "Internal server error" });
  }
};

// ── USER: GET today's delivery status ─────────────────────────────────────────
export const getUserTodayDelivery = async (req, res) => {
  try {
    const { start, end } = getDayRange();

    const organizationId = await getUserOrgId(req.user.id);
    if (!organizationId) {
      return res.status(400).json({ success: false, msg: "User has no associated organization" });
    }

    const schedule = await MenuSchedule
      .findOne({
        organizationId,
        scheduledDate: { $gte: start, $lte: end },
      })
      .populate({ path: "dish", select: "name image" })
      .lean();

    if (!schedule) {
      return res.status(404).json({ success: false, msg: "No menu scheduled for today" });
    }

    const delivery = await Delivery.findOne({
      scheduleId:    schedule._id,
      organizationId,
    }).lean();

    if (!delivery) {
      return res.status(404).json({ success: false, msg: "Delivery not started yet" });
    }

    return res.status(200).json({
      success: true,
      data: {
        deliveryId:       delivery._id,
        status:           delivery.status,
        isCompleted:      delivery.status === "handed_over",
        canAdvance:       false,
        estimatedArrival: delivery.estimatedArrival ? fmtTime(delivery.estimatedArrival) : null,
        steps:            buildUserSteps(delivery),
        dish: {
          name:  schedule.dish?.name  ?? "",
          image: schedule.dish?.image ?? "",
        },
      },
    });
  } catch (err) {
    console.error("getUserTodayDelivery:", err);
    return res.status(500).json({ success: false, msg: "Internal server error" });
  }
};