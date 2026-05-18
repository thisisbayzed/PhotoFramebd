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

router.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Admin API — use POST /api/admin/login with email and password",
  });
});

router.post("/login", adminLogin);
router.post("/logout", protectAdmin, adminLogout);
router.get("/me", protectAdmin, getAdminProfile);
router.get("/dashboard", protectAdmin, getAdminDashboard);
router.put("/credentials", protectAdmin, updateAdminCredentials);

export default router;
