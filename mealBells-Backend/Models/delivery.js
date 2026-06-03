import mongoose from "mongoose";

const deliverySchema = new mongoose.Schema(
  {
    scheduleId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "MenuSchedule",
      required: true,
      unique:   true,
    },
    vendorId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
    },
    status: {
      type:    String,
      enum:    ["preparing", "packed", "out_for_delivery", "arrived_at_office", "handed_over"],
      default: "preparing",
    },
    stepTimes: {
      preparing:         { type: Date, default: null },
      packed:            { type: Date, default: null },
      out_for_delivery:  { type: Date, default: null },
      arrived_at_office: { type: Date, default: null },
      handed_over:       { type: Date, default: null },
    },
  },
  { timestamps: true }
);

export const Delivery = mongoose.model("Delivery", deliverySchema);