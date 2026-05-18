import { Router } from "express";
import {
  cancelOrder,
  confirmOrder,
  directBuy,
  getAdminOrderById,
  getAdminOrders,
  placeOrder,
  updateOrderStatus,
} from "../controllers/order.controller";
import { protectAdmin } from "../middleware/auth.middleware";

const publicRouter = Router();
const adminRouter = Router();

publicRouter.post("/checkout", placeOrder);
publicRouter.post("/direct-buy", directBuy);

adminRouter.use(protectAdmin);
adminRouter.get("/", getAdminOrders);
adminRouter.get("/:id", getAdminOrderById);
adminRouter.patch("/:id/status", updateOrderStatus);
adminRouter.patch("/:id/confirm", confirmOrder);
adminRouter.patch("/:id/cancel", cancelOrder);

export { publicRouter as orderPublicRoutes, adminRouter as orderAdminRoutes };
