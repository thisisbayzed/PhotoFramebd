import { Router, Request, Response } from "express";

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "PhotoFrameBD API is running",
    baseUrl: "/api",
    note: "All API routes start with /api. Opening POST routes in the browser will show Not Found.",
    endpoints: {
      health: "GET /api/health",
      products: "GET /api/products",
      categories: "GET /api/categories",
      testimonials: "GET /api/testimonials",
      cart: "POST /api/cart",
      checkout: "POST /api/orders/checkout",
      directBuy: "POST /api/orders/direct-buy",
      adminLogin: "POST /api/admin/login",
      adminDashboard: "GET /api/admin/dashboard (requires token)",
    },
  });
});

export default router;
