// Routes/VendorRouter.js
import { Router } from "express";
import { ensureJwtValidation } from "../MiddleWare/jwtVerify.js";
import { uplode } from "../utils/multer.js";

import { getVendorDashboard }                        from "../Controllers/vendor/vendorDashboardController.js";
import { getVendorAnalytics }                        from "../Controllers/vendor/vendorAnalyticsController.js";
import { getVendorReviews }                          from "../Controllers/vendor/vendorReviewController.js";
import { getVendorDishes, updateVendorDish, createVendorDish } from "../Controllers/vendor/vendorDishController.js";
import {
  getVendorTodayMenu,
  getVendorWeeklyMenu,
  updateVendorTodayDish,
  getVendorScheduleById,
  updateVendorScheduleDish,
  createVendorSchedule,
} from "../Controllers/vendor/vendorMenuController.js";
import { getTodayDelivery, advanceDeliveryStatus }   from "../Controllers/shared/deliveryController.js";

const router = Router();

const upload = (fieldName) => (req, res, next) => {
  uplode.single(fieldName)(req, res, (err) => {
    if (err) return res.status(400).json({ msg: err.message });
    next();
  });
};

router.use(ensureJwtValidation);

// ── Dashboard ──────────────────────────────────────────────────────────────
router.get("/dashboard", getVendorDashboard);

// ── Analytics ──────────────────────────────────────────────────────────────
router.get("/analytics", getVendorAnalytics);

// ── Menu ───────────────────────────────────────────────────────────────────
router.get ("/menu/today",                getVendorTodayMenu);
router.get ("/menu/weekly",               getVendorWeeklyMenu);
router.put ("/menu/today",                upload("image"), updateVendorTodayDish);
router.get ("/menu/schedule/:scheduleId", getVendorScheduleById);
router.put ("/menu/schedule/:scheduleId", updateVendorScheduleDish);
router.post("/menu/schedule",             createVendorSchedule);

// ── Dishes ─────────────────────────────────────────────────────────────────
router.get ("/dishes",       getVendorDishes);
router.post("/dishes",       upload("image"), createVendorDish);
router.put ("/dish/:dishId", upload("image"), updateVendorDish);

// ── Delivery ───────────────────────────────────────────────────────────────
router.get("/delivery/today",               getTodayDelivery);
router.put("/delivery/:deliveryId/advance", advanceDeliveryStatus);

// ── Reviews ────────────────────────────────────────────────────────────────
router.get("/reviews", getVendorReviews);

export default router;