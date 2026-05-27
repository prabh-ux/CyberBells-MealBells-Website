// Models/review.js
import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "users",
      required: true,
    },
    dishId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "dishes",
      required: true,
    },
    scheduleId: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     "menuSchedule",
      default: null,
    },
    organizationId: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     "organizations",
      default: null,
    },
    overallRating: {
      type:     Number,
      required: true,
      min:      1,
      max:      5,
    },
    taste:     { type: Number, min: 0, max: 10, default: 5 },
    quantity:  { type: Number, min: 0, max: 10, default: 5 },
    quality:   { type: Number, min: 0, max: 10, default: 5 },
    freshness: { type: Number, min: 0, max: 10, default: 5 },
    comment: {
      type:    String,
      trim:    true,
      default: "",
    },
    tags: {
      type:    [String],
      default: [],
    },
  },
  { timestamps: true }
);

reviewSchema.index({ userId: 1, scheduleId: 1 }, { unique: true, sparse: true });

export const Review = mongoose.model("review", reviewSchema);