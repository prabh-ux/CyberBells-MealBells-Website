import mongoose from "mongoose";

const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    // ── required for login & signup ──────────────────────
    name: {
      type:     String,
      required: true,
      trim:     true,
    },
    email: {
      type:      String,
      required:  true,
      unique:    true,
      lowercase: true,
      trim:      true,
    },
    password: {
      type:     String,
      required: true,
      select:   false,
    },

    // ── type ─────────────────────────────────────────────
    type: {
  type:    String,
  enum:    ["user", "vendor", "admin"],
  default: "user",
},

    // ── shared optional ───────────────────────────────────
    phone: {
      type:    String,
      trim:    true,
      default: "",
    },
    avatar: {
      type:    String,
      default: "",
    },
    organizationId: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     "organizations",
      default: null,
    },

    // ── user (employee) only ──────────────────────────────
    gender: {
      type:    String,
      enum:    ["Male", "Female", "Other", ""],
      default: "",
    },
    department: {
      type:    String,
      trim:    true,
      default: "",
    },
    role: {
      type:    String,
      enum:    ["Standard User", "Department Head", "System Admin"],
      default: "Standard User",
    },
    active: {
      type:    Boolean,
      default: true,
    },

    // ── vendor only ───────────────────────────────────────
    vendorId: {
      type:    String,
      default: null,    // ← null so sparse index ignores non-vendors
      unique:  true,
      sparse:  true,    // ← only enforces uniqueness on non-null values
    },
    capacity: {
      type:    Number,
      default: 0,
      min:     0,
    },
    deliveryTiming: {
      type:    String,
      trim:    true,
      default: "",
    },
    status: {
      type:    Boolean,
      default: true,
    },
    foodType: {
      type:    String,
      enum:    ["Veg", "Non-Veg", "Both", ""],
      default: "",
    },
    logo: {
      type:    String,
      default: "",
    },
    rating: {
      type:    Number,
      default: 0,
      min:     0,
      max:     5,
    },
    totalReviews: {
      type:    Number,
      default: 0,
      min:     0,
    },
  },
  {
    timestamps: true,
    collection: "users",
  },
);

export const userModel = mongoose.model("users", userSchema);