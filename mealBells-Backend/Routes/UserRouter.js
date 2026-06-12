// Routes/userRoutes.js
import { Router } from "express";
import { ensureJwtValidation } from "../MiddleWare/jwtVerify.js";

import { getTodayMenu, getWeeklyMenu, getDishDetails }     from "../Controllers/user/userMenuController.js";
import { markAttendance, markAttendanceForDay }            from "../Controllers/user/userAttendanceController.js";
import { submitReview, getMyReviews }                      from "../Controllers/user/userReviewController.js";
import { submitDishRequest }                               from "../Controllers/user/userDishRequestController.js";
import { getConsumptionStats }                             from "../Controllers/user/userStatsController.js";
import { getUserTodayDelivery }                            from "../Controllers/shared/deliveryController.js";
import { getMyOrganization }                            from "../Controllers/shared/organizationController.js";

const router = Router();

router.get  ("/menu-today",               ensureJwtValidation, getTodayMenu);
router.get  ("/menu-weekly",              ensureJwtValidation, getWeeklyMenu);
router.get  ("/dish/:scheduleId",         ensureJwtValidation, getDishDetails);

router.post ("/attendance",               ensureJwtValidation, markAttendance);
router.patch("/attendance/:scheduleId",   ensureJwtValidation, markAttendanceForDay);

router.post ("/review",                   ensureJwtValidation, submitReview);
router.get  ("/reviews",                  ensureJwtValidation, getMyReviews);

router.post ("/dish-request",             ensureJwtValidation, submitDishRequest);

router.get  ("/consumption-stats",        ensureJwtValidation, getConsumptionStats);

// ✅ FIX: was missing ensureJwtValidation, req.user was undefined
router.get  ("/delivery/today",           ensureJwtValidation, getUserTodayDelivery);

router.get("/organization", ensureJwtValidation, getMyOrganization);

export default router;