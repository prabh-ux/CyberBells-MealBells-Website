// Routes/adminRoutes.js
import { Router } from "express";
import { ensureJwtValidation } from "../MiddleWare/jwtVerify.js";
import {
  addUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  toggleUserStatus,
} from "../Controllers/admin/adminUserController.js";
import {
  addVendor,
  getVendors,
  toggleVendorStatus,
  updateVendor,
} from "../Controllers/admin/adminVendorController.js";
import {
  addDish,
  getDishes,
  getDishById,
  updateDish,
  deleteDish,
  getSchedules,
} from "../Controllers/admin/adminDishController.js";
import { uplode } from "../utils/multer.js";
import {
  getAnalyticsSummary,
  getAttendanceChart,
  getMealsChart,
  getRecentActivity,
  getFilterOptions,
  getConsumptionBreakdown,
  getLiveFeed,
} from "../Controllers/admin/adminAnalyticsController.js";
import {
  getVendorPerformance,
  getVendorList,
} from "../Controllers/admin/adminVendorPerformanceController.js";
import {
  getDishRequests,
  forwardDishRequest,
} from "../Controllers/admin/adminDishRequestController.js";
import {
  getFoodWastageSummary,
  getFoodWastageChart,
  getFoodWastageTable,
} from "../Controllers/admin/adminFoodWastageController.js";

const router = Router();

const upload = (fieldName) => (req, res, next) => {
  uplode.single(fieldName)(req, res, (err) => {
    if (err) return res.status(400).json({ msg: err.message });
    next();
  });
};

// ── Analytics ─────────────────────────────────────────────────────────────────
router.get("/analytics/summary",        ensureJwtValidation, getAnalyticsSummary);
router.get("/analytics/meals",          ensureJwtValidation, getMealsChart);
router.get("/analytics/activity",       ensureJwtValidation, getRecentActivity);
router.get("/analytics/attendance",     ensureJwtValidation, getAttendanceChart);
router.get("/analytics/filter-options", ensureJwtValidation, getFilterOptions);
router.get("/analytics/consumption-breakdown", ensureJwtValidation, getConsumptionBreakdown);
router.get("/analytics/live-feed",             ensureJwtValidation, getLiveFeed);

// ── Food Wastage ──────────────────────────────────────────────────────────────
router.get("/food-wastage/summary", ensureJwtValidation, getFoodWastageSummary);
router.get("/food-wastage/chart",   ensureJwtValidation, getFoodWastageChart);
router.get("/food-wastage/table",   ensureJwtValidation, getFoodWastageTable);

// ── Vendor Performance ────────────────────────────────────────────────────────
router.get("/vendor-performance/vendors",   ensureJwtValidation, getVendorList);
router.get("/vendor-performance/:vendorId", ensureJwtValidation, getVendorPerformance);

// ── Users ─────────────────────────────────────────────────────────────────────
router.post("/users/add",        ensureJwtValidation, upload("avatar"), addUser);
router.get("/users",             ensureJwtValidation, getUsers);
router.get("/users/:id",         ensureJwtValidation, getUserById);
router.put("/user/:id/update",   ensureJwtValidation, upload("avatar"), updateUser);
router.patch("/user/:id/status", ensureJwtValidation, toggleUserStatus);
router.delete("/users/:id",      ensureJwtValidation, deleteUser);

// ── Dish Requests ─────────────────────────────────────────────────────────────
router.get("/dish-requests",             ensureJwtValidation, getDishRequests);
router.post("/dish-requests/:id/forward",ensureJwtValidation, forwardDishRequest);

// ── Vendors ───────────────────────────────────────────────────────────────────
router.post("/vendors/add",        ensureJwtValidation, upload("logo"), addVendor);
router.get("/vendors",             ensureJwtValidation, getVendors);
router.patch("/vendor/:id/status", ensureJwtValidation, toggleVendorStatus);
router.put("/vendor/:id/update",   ensureJwtValidation, upload("logo"), updateVendor);

// ── Dishes ────────────────────────────────────────────────────────────────────
router.post("/dishes/add",       ensureJwtValidation, upload("image"), addDish);
router.get("/dishes",            ensureJwtValidation, getDishes);
router.get("/dishes/:id",        ensureJwtValidation, getDishById);
router.put("/dishes/:id/update", ensureJwtValidation, upload("image"), updateDish);
router.delete("/dishes/:id",     ensureJwtValidation, deleteDish);
router.get("/menu/schedules",    ensureJwtValidation, getSchedules);

export default router;