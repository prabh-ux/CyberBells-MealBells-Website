import { Router } from "express";
import { ensureJwtValidation } from "../MiddleWare/jwtVerify.js";
import { getMyOrganization, updateMyOrganization } from "../Controllers/organizationController.js";

const router = Router();

router.get("/me", ensureJwtValidation, getMyOrganization);
router.put("/me/update", ensureJwtValidation, updateMyOrganization);

export default router;