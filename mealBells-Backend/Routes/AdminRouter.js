// Routes/adminRoutes.js
import { Router } from "express";
import { ensureJwtValidation } from "../MiddleWare/jwtVerify.js";
import {
  addUser, getUsers, getUserById,
  updateUser, deleteUser, toggleUserStatus,
} from "../Controllers/adminUserController.js";
import { addVendor, getVendors, toggleVendorStatus, updateVendor } from "../Controllers/adminVendorController.js";
import {
  addDish, getDishes, getDishById, updateDish, deleteDish, getSchedules,
} from "../Controllers/adminDishController.js";
import { uplode } from "../utils/multer.js";

const router = Router();

const upload = (fieldName) => (req, res, next) => {
  uplode.single(fieldName)(req, res, (err) => {
    if (err) return res.status(400).json({ msg: err.message });
    next();
  });
};

// ── Users ─────────────────────────────────────────────────────────────────────
router.post  ("/users/add",         ensureJwtValidation, upload("avatar"), addUser);
router.get   ("/users",             ensureJwtValidation, getUsers);
router.get   ("/users/:id",         ensureJwtValidation, getUserById);
router.put   ("/user/:id/update",   ensureJwtValidation, upload("avatar"), updateUser);
router.patch ("/user/:id/status",   ensureJwtValidation, toggleUserStatus);
router.delete("/users/:id",         ensureJwtValidation, deleteUser);

// ── Vendors ───────────────────────────────────────────────────────────────────
router.post  ("/vendors/add",       ensureJwtValidation, upload("logo"), addVendor);
router.get   ("/vendors",           ensureJwtValidation, getVendors);
router.patch ("/vendor/:id/status", ensureJwtValidation, toggleVendorStatus);
router.put   ("/vendor/:id/update", ensureJwtValidation, upload("logo"), updateVendor);

// ── Dishes ────────────────────────────────────────────────────────────────────
router.post  ("/dishes/add",          ensureJwtValidation, upload("image"), addDish);
router.get   ("/dishes",              ensureJwtValidation, getDishes);
router.get   ("/dishes/:id",          ensureJwtValidation, getDishById);
router.put   ("/dishes/:id/update",   ensureJwtValidation, upload("image"), updateDish);
router.delete("/dishes/:id",          ensureJwtValidation, deleteDish);
router.get   ("/menu/schedules",      ensureJwtValidation, getSchedules);

export default router;