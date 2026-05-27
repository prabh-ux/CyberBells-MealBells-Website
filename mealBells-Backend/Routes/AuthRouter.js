import { Router } from "express";
import { loginValidator, signUpValidator } from "../MiddleWare/authValidator.js";
import { login, signUp,getMe,logout,updateMe } from "../Controllers/authController.js";
import { ensureJwtValidation } from "../MiddleWare/jwtVerify.js";
import { uplode } from "../utils/multer.js";


const upload = (fieldName) => (req, res, next) => {
  uplode.single(fieldName)(req, res, (err) => {
    if (err) return res.status(400).json({ msg: err.message });
    next();
  });
};
const router = Router();

router.post('/login', loginValidator, login);
router.post('/signup', signUpValidator, signUp);
router.get("/me", ensureJwtValidation, getMe);
router.put ("/me/update", ensureJwtValidation, upload("avatar"), updateMe);

router.post("/logout", logout); 


export default router;