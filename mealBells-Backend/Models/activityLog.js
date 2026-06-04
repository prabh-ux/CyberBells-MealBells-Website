import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    name:     { type: String, required: true },
    email:    { type: String, default: "" },
    action:   { type: String, required: true },
    status:   { type: String, enum: ["Success", "Pending", "Critical"], default: "Success" },
    initials: { type: String, default: "" },
    bgColor:  { type: String, default: "#DBEAFE" },
    color:    { type: String, default: "#2563EB" },
  },
  { timestamps: true }
);

export const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);