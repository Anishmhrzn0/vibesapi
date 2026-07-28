import { Router } from "express";
import { register, login, whoami, updateProfile } from "../controllers/auth.controller";

import { authorize } from "../middlewares/authorized.middleware";
import { upload } from "../middlewares/upload.middleware";
import { forgotPassword, resetPassword } from "../controllers/password-reset.controller";

const router = Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// Protected routes
router.get("/whoami", authorize, whoami);
router.put("/update", authorize, upload.single("avatar"), updateProfile);

export default router;