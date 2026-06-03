import mongoose from "mongoose";
import { dishModel }    from "../../Models/dish.js";
import { MenuSchedule } from "../../Models/menuSchedule.js";
import { Delivery }     from "../../Models/delivery.js";

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
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const fmtTime = (date) =>
  date
    ? new Date(date).toLocaleTimeString("en-US", {
        hour: "numeric", minute: "2-digit", hour12: true,
      })
    : null;

// Builds steps for the vendor view (completed / current / pending + subtitle)
const buildVendorSteps = (delivery) => {
  const currentIdx = STEPS.indexOf(delivery.status);
  return STEPS.map((key, idx) => {
    const status =
      idx < currentIdx  ? "completed"
      : idx === currentIdx ? "current"
      : "pending";

    const subtitle =
      status === "completed" && delivery.stepTimes[key]
        ? `Completed at ${fmtTime(delivery.stepTimes[key])}`
        : "";

    return { key, label: STEP_LABELS[key].label, status, subtitle };
  });
};

// Builds steps for the user view (done / active / pending + time + icon)
const buildUserSteps = (delivery) => {
  const currentIdx = STEPS.indexOf(delivery.status);
  return STEPS.map((key, idx) => {
    const status =
      idx < currentIdx  ? "done"
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

const findTodayScheduleForVendor = async (vendorId) => {
  const vendorDishIds = await dishModel.find({ vendor: vendorId }).distinct("_id");
  return MenuSchedule.findOne({
    dish:          { $in: vendorDishIds },
    scheduledDate: getUTCMidnight(),
  }).lean();
};

// ─────────────────────────────────────────────────────────────────────────────
// VENDOR: GET today's delivery
// GET /vendor/delivery/today
// ─────────────────────────────────────────────────────────────────────────────
export const getTodayDelivery = async (req, res) => {
  try {
    const vendorId = new mongoose.Types.ObjectId(req.user.id);
    const schedule = await findTodayScheduleForVendor(vendorId);
    if (!schedule)
      return res.status(404).json({ success: false, msg: "No dish scheduled for today" });

    // auto-create delivery if it doesn't exist yet
    let delivery = await Delivery.findOne({ scheduleId: schedule._id, vendorId });
    if (!delivery) {
      delivery = await Delivery.create({
        scheduleId: schedule._id,
        vendorId,
        status:    "preparing",
        stepTimes: { preparing: new Date() },
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

// ─────────────────────────────────────────────────────────────────────────────
// VENDOR: Advance delivery status
// PUT /vendor/delivery/:deliveryId/advance
// ─────────────────────────────────────────────────────────────────────────────
export const advanceDeliveryStatus = async (req, res) => {
  try {
    const vendorId = new mongoose.Types.ObjectId(req.user.id);
    const delivery = await Delivery.findOne({ _id: req.params.deliveryId, vendorId });
    if (!delivery)
      return res.status(404).json({ success: false, msg: "Delivery not found" });

    const currentIdx = STEPS.indexOf(delivery.status);
    if (currentIdx === STEPS.length - 1)
      return res.status(400).json({ success: false, msg: "Already completed" });

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

// ─────────────────────────────────────────────────────────────────────────────
// USER: GET today's delivery status
// GET /user/delivery/today
// ─────────────────────────────────────────────────────────────────────────────
export const getUserTodayDelivery = async (req, res) => {
  try {
    const { start, end } = getDayRange();

    const schedule = await MenuSchedule
      .findOne({ scheduledDate: { $gte: start, $lte: end } })
      .populate({ path: "dish", select: "name image" })
      .lean();

    if (!schedule) {
      return res.status(404).json({ success: false, msg: "No menu scheduled for today" });
    }

    const delivery = await Delivery.findOne({ scheduleId: schedule._id }).lean();

    if (!delivery) {
      return res.status(404).json({ success: false, msg: "Delivery not started yet" });
    }

    const currentIdx = STEPS.indexOf(delivery.status);

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