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
      unique:   true, 
    },
    scheduledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  "users", 
    },
  },
  { timestamps: true }
);

export const MenuSchedule = mongoose.model("menuSchedule", menuScheduleSchema);