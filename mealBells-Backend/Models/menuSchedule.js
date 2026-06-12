// Models/menuSchedule.js
import mongoose from "mongoose";

const menuScheduleSchema = new mongoose.Schema(
  {
    dish: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "dishes",
      required: true,
    },
    scheduledDate: {
      type:     Date,
      required: true,
      // ❌ removed global unique:true — uniqueness is now per-org (see index below)
    },
    scheduledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  "users",
    },
    // ✅ Added — every schedule belongs to one org
    organizationId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "organizations",
      required: true,
    },
  },
  { timestamps: true }
);

// ✅ One schedule per org per day (replaces the old global unique on scheduledDate)
menuScheduleSchema.index({ organizationId: 1, scheduledDate: 1 }, { unique: true });

export const MenuSchedule = mongoose.model("menuSchedule", menuScheduleSchema);