// Models/attendance.js
import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
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
    scheduleId: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     "menuSchedule",
      default: null,
    },
    date: {
      type:     Date,
      required: true,
    },
    response: {
      type:    String,
      enum:    ["yes", "no"],
      default: "yes",
    },
  },
  { timestamps: true }
);

// one attendance record per user per day
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

export const Attendance = mongoose.model("attendance", attendanceSchema);