import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema(
  {
    companyName: {
      type:    String,
      trim:    true,
      default: "",
    },
    contactEmail: {
      type:      String,
      lowercase: true,
      trim:      true,
      default:   "",
    },
    officeAddress: {
      type:    String,
      trim:    true,
      default: "",
    },

    // ── Meal Settings ─────────────────────────────────────────────────────────
    mealTime: {
      type:    String,
      default: "12:30",   // "HH:mm" 24-hour
    },
    cutoffTime: {
      type:    String,
      default: "09:00",   // "HH:mm" 24-hour  — attendance locked after this
    },
    allowDishRequests: {
      type:    Boolean,
      default: true,
    },
  },
  {
    timestamps:  true,
    collection: "organizations",
  }
);

export const organizationModel = mongoose.model("organizations", organizationSchema);