// organization.js (Model)
import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      trim: true,
      default: "",
    },
    contactEmail: {
      type: String,
      lowercase: true,
      trim: true,
      default: "",
    },
    officeAddress: {
      type: String,
      trim: true,
      default: "",
    },
    mealTime: {
      type: String,
      default: "12:30",
    },
    cutoffTime: {
      type: String,
      default: "09:00",
    },
    allowDishRequests: {
      type: Boolean,
      default: true,
    },
    capacity: {
  
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
  },
  {
    timestamps: true,
    collection: "organizations",
  },
);

export const organizationModel = mongoose.model(
  "organizations",
  organizationSchema,
);
