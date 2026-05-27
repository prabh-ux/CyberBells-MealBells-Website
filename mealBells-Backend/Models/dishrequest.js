// Models/dishRequest.js
import mongoose from "mongoose";

const dishRequestSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "users",
      required: true,
    },
    organizationId: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     "organizations",
      default: null,
    },
    requestedDate: {
      type:     Date,
      required: true,
    },
    dishSuggestion: {
      type:    String,
      trim:    true,
      default: "",
    },
    dietaryPreference: {
      type:    String,
      enum:    ["Veg", "Non-Veg", "Both"],
      default: "Both",
    },
    spiceLevel: {
      type:    String,
      enum:    ["Mild", "Normal", "Spicy"],
      default: "Normal",
    },
    status: {
      type:    String,
      enum:    ["pending", "reviewed", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

dishRequestSchema.index({ userId: 1, requestedDate: 1 }, { unique: true });

export const DishRequest = mongoose.model("dishRequest", dishRequestSchema);