import { Router } from "express";
import {
  createTestimonial,
  deleteTestimonial,
  getTestimonialById,
  getTestimonials,
  updateTestimonial,
} from "../controllers/testimonial.controller";
import { protectAdmin } from "../middleware/auth.middleware";

const publicRouter = Router();
const adminRouter = Router();

publicRouter.get("/", getTestimonials);
publicRouter.get("/:id", getTestimonialById);

adminRouter.use(protectAdmin);
adminRouter.post("/", createTestimonial);
adminRouter.get("/", getTestimonials);
adminRouter.get("/:id", getTestimonialById);
adminRouter.put("/:id", updateTestimonial);
adminRouter.delete("/:id", deleteTestimonial);

export {
  publicRouter as testimonialPublicRoutes,
  adminRouter as testimonialAdminRoutes,
};
