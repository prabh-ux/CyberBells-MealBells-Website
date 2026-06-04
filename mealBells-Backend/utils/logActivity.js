import { ActivityLog } from "../Models/activityLog.js";

const COLORS = [
  { bg: "#DBEAFE", color: "#2563EB" },
  { bg: "#FFEDD5", color: "#EA580C" },
  { bg: "#F3E8FF", color: "#9333EA" },
  { bg: "#E0F2FE", color: "#0EA5E9" },
  { bg: "#D1FAE5", color: "#10B981" },
  { bg: "#EDE9FE", color: "#8B5CF6" },
  { bg: "#CCFBF1", color: "#14B8A6" },
  { bg: "#FEF9C3", color: "#A16207" },
];

export async function logActivity({ userId, name, email, action, status = "Success" }) {
  try {
    const parts    = (name ?? "").split(" ");
    const initials = ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
    const clr      = COLORS[Math.floor(Math.random() * COLORS.length)];

    await ActivityLog.create({ userId, name, email, action, status, initials, bgColor: clr.bg, color: clr.color });
  } catch (err) {
    console.error("logActivity error:", err.message); // never crash the main request
  }
}