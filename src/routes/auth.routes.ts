import { Router } from "express";
import {
  adminLogin,
  adminLogout,
  getAdminDashboard,
  getAdminProfile,
  updateAdminCredentials,
} from "../controllers/auth.controller";
import { protectAdmin } from "../middleware/auth.middleware";

const router = Router();

router.post("/login", adminLogin);
router.post("/logout", protectAdmin, adminLogout);
router.get("/me", protectAdmin, getAdminProfile);
router.get("/dashboard", protectAdmin, getAdminDashboard);
router.put("/credentials", protectAdmin, updateAdminCredentials);

export default router;
