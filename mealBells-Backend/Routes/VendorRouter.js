// Routes/VendorRouter.js
import { Router } from "express";
import { ensureJwtValidation } from "../MiddleWare/jwtVerify.js";
import {
  getVendorDashboard,
  getVendorTodayMenu,
  getVendorWeeklyMenu,
  updateVendorTodayDish,
} from "../Controllers/vendorController.js";
import { uplode } from "../utils/multer.js";

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

// ── Menu ───────────────────────────────────────────────────────────────────
router.get("/menu/today",  getVendorTodayMenu);
router.get("/menu/weekly", getVendorWeeklyMenu);
router.put("/menu/today",  upload("image"), updateVendorTodayDish);

export default router;