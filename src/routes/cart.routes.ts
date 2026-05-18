import { Router } from "express";
import {
  addToCart,
  createCart,
  deleteCart,
  getCart,
  getCartSummary,
  removeFromCart,
} from "../controllers/cart.controller";

const router = Router();

router.post("/", createCart);
router.get("/:cartId/summary", getCartSummary);
router.get("/:cartId", getCart);
router.post("/:cartId/add", addToCart);
router.delete("/:cartId/items/:productId", removeFromCart);
router.delete("/:cartId", deleteCart);

export default router;
