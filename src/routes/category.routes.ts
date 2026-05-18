import { Router } from "express";
import {
  createCategory,
  deleteCategory,
  getCategories,
  getCategoryById,
  updateCategory,
} from "../controllers/category.controller";
import { protectAdmin } from "../middleware/auth.middleware";

const publicRouter = Router();
const adminRouter = Router();

publicRouter.get("/", getCategories);

adminRouter.use(protectAdmin);
adminRouter.post("/", createCategory);
adminRouter.get("/", getCategories);
adminRouter.get("/:id", getCategoryById);
adminRouter.put("/:id", updateCategory);
adminRouter.delete("/:id", deleteCategory);

export { publicRouter as categoryPublicRoutes, adminRouter as categoryAdminRoutes };
