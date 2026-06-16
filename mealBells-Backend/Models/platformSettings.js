import mongoose from "mongoose";

// Singleton document — there's always exactly one row in this collection.
// findOne() / findOneAndUpdate({}, ..., { upsert: true }) is the access pattern.

const platformSettingsSchema = new mongoose.Schema(
  {
    // ── New-org defaults ─────────────────────────────────────────────────────
    defaultMealTime: {
      type:    String,
      default: "12:30",
    },
    defaultCutoffTime: {
      type:    String,
      default: "09:00",
    },
    defaultCapacity: {
      type:    Number,
      default: 50,
      min:     0,
    },
    defaultBillingPlan: {
      type:    String,
      enum:    ["starter", "pro", "enterprise"],
      default: "pro",
    },
    defaultAllowDishRequests: {
      type:    Boolean,
      default: true,
    },

    // ── Platform limits ───────────────────────────────────────────────────────
    maxOrgsPerVendor: {
      type:    Number,
      default: 20,
      min:     1,
    },
    maxMembersPerOrg: {
      type:    Number,
      default: 500,
      min:     1,
    },
    maxDishRequestsPerDay: {
      type:    Number,
      default: 10,
      min:     0,
    },
    attendanceLockHours: {
      type:    Number,
      default: 3,
      min:     0,
    },

    // ── Feature flags ─────────────────────────────────────────────────────────
    vendorOnboarding: {
      type:    Boolean,
      default: true,
    },
    selfServeOrgCreation: {
      type:    Boolean,
      default: true,
    },
    emailNotifications: {
      type:    Boolean,
      default: true,
    },
    maintenanceMode: {
      type:    Boolean,
      default: false,
    },

    // ── Meta ──────────────────────────────────────────────────────────────────
    supportEmail: {
      type:      String,
      lowercase: true,
      trim:      true,
      default:   "",
    },
    platformVersion: {
      type:    String,
      default: "1.0.0",
    },
  },
  {
    timestamps:  true,
    collection:  "platform_settings",
  }
);

export const platformSettingsModel = mongoose.model(
  "platform_settings",
  platformSettingsSchema
);
