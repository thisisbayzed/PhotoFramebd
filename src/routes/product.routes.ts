import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getProductById,
  getProducts,
  updateProduct,
} from "../controllers/product.controller";
import { protectAdmin } from "../middleware/auth.middleware";
import { handleProductUpload } from "../middleware/uploadProduct.middleware";

const publicRouter = Router();
const adminRouter = Router();

publicRouter.get("/", getProducts);
publicRouter.get("/:id", getProductById);

adminRouter.use(protectAdmin);
adminRouter.get("/", getProducts);
adminRouter.get("/:id", getProductById);
adminRouter.post("/", handleProductUpload, createProduct);
adminRouter.put("/:id", handleProductUpload, updateProduct);
adminRouter.delete("/:id", deleteProduct);

export { publicRouter as productPublicRoutes, adminRouter as productAdminRoutes };
