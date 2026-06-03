import { Router } from "express";
import { ensureJwtValidation } from "../MiddleWare/jwtVerify.js";
import { getMyOrganization, updateMyOrganization } from "../Controllers/shared/organizationController.js";

const router = Router();

// ── Admin only middleware ──────────────────────────────────────────
const ensureAdmin = (req, res, next) => {
  if (req.user?.type !== "admin") {
    return res.status(403).json({ msg: "Access denied. Admins only." });
  }
  next();
};

router.get("/me",        ensureJwtValidation,             getMyOrganization);
router.put("/me/update", ensureJwtValidation, ensureAdmin, updateMyOrganization);

export default router;