import cors from "cors";
import express from "express";
import authRoutes from "./routes/auth.routes";
import healthRoutes from "./routes/health.routes";
import {
  categoryAdminRoutes,
  categoryPublicRoutes,
} from "./routes/category.routes";
import {
  productAdminRoutes,
  productPublicRoutes,
} from "./routes/product.routes";
import cartRoutes from "./routes/cart.routes";
import customerRoutes from "./routes/customer.routes";
import {
  testimonialAdminRoutes,
  testimonialPublicRoutes,
} from "./routes/testimonial.routes";
import {
  orderAdminRoutes,
  orderPublicRoutes,
} from "./routes/order.routes";
import userRoutes from "./routes/user.routes";

const app = express();

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((url) => url.trim())
  : true;

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use(express.json());
app.use("/api", healthRoutes);
app.use("/api/admin", authRoutes);
app.use("/api/admin/users", userRoutes);
app.use("/api/categories", categoryPublicRoutes);
app.use("/api/admin/categories", categoryAdminRoutes);
app.use("/api/products", productPublicRoutes);
app.use("/api/admin/products", productAdminRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderPublicRoutes);
app.use("/api/admin/orders", orderAdminRoutes);
app.use("/api/admin/customers", customerRoutes);
app.use("/api/testimonials", testimonialPublicRoutes);
app.use("/api/admin/testimonials", testimonialAdminRoutes);

export default app;
