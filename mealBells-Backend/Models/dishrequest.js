// Models/dishRequest.js
import mongoose from "mongoose";

const forwardedToSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    vendorStatus: {
      type: String,
      enum: ["pending", "accepted", "ignored"],
      default: "pending",
    },
    respondedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }, // no extra _id per subdoc
);

const dishRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "organizations",
      default: null,
    },
    requestedDate: {
      type: Date,
      required: true,
    },
    dishSuggestion: {
      type: String,
      trim: true,
      default: "",
    },
    dietaryPreference: {
      type: String,
      enum: ["Veg", "Non-Veg", "Both"],
      default: "Both",
    },
    spiceLevel: {
      type: String,
      enum: ["Mild", "Normal", "Spicy"],
      default: "Normal",
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "approved", "rejected"],
      default: "pending",
    },
    // ── NEW: which vendors the admin forwarded this request to ───────────────
    forwardedTo: {
      type: [forwardedToSchema],
      default: [],
    },
  },
  { timestamps: true },
);

dishRequestSchema.index({ userId: 1, requestedDate: 1 }, { unique: true });

export const DishRequest = mongoose.model("dishRequest", dishRequestSchema);
