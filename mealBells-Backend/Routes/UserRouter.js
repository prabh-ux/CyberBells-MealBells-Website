// Routes/userRoutes.js
import { Router } from "express";
import { ensureJwtValidation } from "../MiddleWare/jwtVerify.js";
import {
  getTodayMenu,
  markAttendance,
  getWeeklyMenu,
  getDishDetails,
  markAttendanceForDay,
  submitReview,
  getMyReviews,
  submitDishRequest,
  getConsumptionStats,
} from "../Controllers/usersController.js";

const router = Router();

router.get ("/menu-today",  ensureJwtValidation, getTodayMenu);
router.post("/attendance",  ensureJwtValidation, markAttendance);


router.get("/menu-weekly", ensureJwtValidation, getWeeklyMenu);

router.get  ("/dish/:scheduleId",         ensureJwtValidation, getDishDetails);
router.patch("/attendance/:scheduleId",   ensureJwtValidation, markAttendanceForDay);

router.post("/review", ensureJwtValidation, submitReview);

router.get("/reviews", ensureJwtValidation, getMyReviews);

router.post("/dish-request", ensureJwtValidation, submitDishRequest);
router.get("/consumption-stats", ensureJwtValidation, getConsumptionStats);
export default router;