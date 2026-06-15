import { Router } from "express";
import { ensureJwtValidation } from "../MiddleWare/jwtVerify.js";
import { uplode } from "../utils/multer.js"; // ← match your actual export name
import {
  getSuperOrgOptions,
  getSuperAnalyticsSummary,
  getSuperMealsChart,
  getSuperAttendanceChart,
  getSuperRecentActivity,
} from "../Controllers/super-admin/superAdminAnalyticsController.js";
import {
  getSuperUsers,
  addSuperUser,
  updateSuperUser,
  toggleSuperUserStatus,
  deleteSuperUser,
} from "../Controllers/super-admin/superAdminUserController.js";
import {
  getSuperDishRequests,
  getSuperDishRequestVendors,
  superForwardDishRequest,
} from "../Controllers/super-admin/superAdminDishRequestController.js";
import {
  getSuperVendors,
  addSuperVendor,          
  toggleSuperVendorStatus,
  updateSuperVendor,
  deleteSuperVendor,
} from "../Controllers/super-admin/superAdminVendorController.js";
import {
  getSuperVendorList,
  getSuperVendorPerformance,
} from "../Controllers/super-admin/superAdminVendorPerformanceController.js";
 
// ── same wrapper pattern as authRoutes ────────────────────────────────────────
const upload = (fieldName) => (req, res, next) => {
  uplode.single(fieldName)(req, res, (err) => {
    if (err) return res.status(400).json({ msg: err.message });
    next();
  });
};

const router = Router();

const ensureSuperAdmin = (req, res, next) => {
  if (req.user?.type !== "admin") {
    return res.status(403).json({ msg: "Forbidden: Super admin access required" });
  }
  next();
};

router.use(ensureJwtValidation);
router.use(ensureSuperAdmin);

// Analytics
router.get("/analytics/org-options", getSuperOrgOptions);
router.get("/analytics/summary",     getSuperAnalyticsSummary);
router.get("/analytics/meals",       getSuperMealsChart);
router.get("/analytics/attendance",  getSuperAttendanceChart);
router.get("/analytics/activity",    getSuperRecentActivity);

// Users
router.get   ("/users",            getSuperUsers);
router.post  ("/users/add",        upload("avatar"), addSuperUser);
router.put   ("/users/:id/update", upload("avatar"), updateSuperUser);
router.patch ("/users/:id/status", toggleSuperUserStatus);
router.delete("/users/:id",        deleteSuperUser);


// ── Dish Requests (Super Admin) ───────────────────────────────────────────────
router.get ("/dish-requests",              getSuperDishRequests);
router.get ("/dish-requests/vendors",      getSuperDishRequestVendors);   // ?orgId=xxx
router.post("/dish-requests/:id/forward",  superForwardDishRequest);

// ── Vendors (Super Admin) ─────────────────────────────────────────────────────
router.get   ("/vendors",              getSuperVendors);
router.post  ("/vendors/add",          upload("logo"), addSuperVendor);   // ← add this
router.patch ("/vendors/:id/status",   toggleSuperVendorStatus);
router.put   ("/vendors/:id",          upload("logo"), updateSuperVendor);
router.delete("/vendors/:id",          deleteSuperVendor);

// ── Vendors performance (Super Admin) ─────────────────────────────────────────────────────

router.get("/vendor-performance/vendors",   getSuperVendorList);
router.get("/vendor-performance/:vendorId", getSuperVendorPerformance);

export default router;