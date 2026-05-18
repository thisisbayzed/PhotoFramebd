import { Router } from "express";
import { getUniqueCustomers } from "../controllers/customer.controller";
import { protectAdmin } from "../middleware/auth.middleware";

const router = Router();

router.use(protectAdmin);
router.get("/", getUniqueCustomers);

export default router;
