// Models/dish.js
import mongoose from "mongoose";

const dishSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: true,
      trim:     true,
    },
    dishType: {
      type:    String,
      enum:    ["Veg", "Non-Veg"],
      default: "Veg",
    },
    description: {
      type:    String,
      trim:    true,
      default: "",
    },
    ingredients: {
      type:    String,
      trim:    true,
      default: "",
    },
    image: {
      type:    String,
      default: "",
    },
    vendor: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     "users",
      default: null,
    },
    availability: {
      type:    String,
      enum:    ["Full Time", "Breakfast", "Lunch", "Dinner"],
      default: "Full Time",
    },

    // ── stat card fields ──────────────────────────────────────────────────────
    qualityScore: {
      type:    String,
      trim:    true,
      default: "High",
    },
    estimatedCalories: {
      type:    String,
      trim:    true,
      default: "450 kcal",
    },
    prepTime: {
      type:    String,
      trim:    true,
      default: "20 mins",
    },

    protein: {
      type:    String,   
      trim:    true,
      default: "",
    },
    carbs: {
      type:    String,  
      trim:    true,
      default: "",
    },

    tags: {
      type:    [String],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: "dishes",
  }
);

export const dishModel = mongoose.model("dishes", dishSchema);