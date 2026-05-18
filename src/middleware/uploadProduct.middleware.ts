import { NextFunction, Request, Response } from "express";
import multer from "multer";
import { uploadProductImages } from "./upload.middleware";

export const handleProductUpload = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  uploadProductImages(req, res, (err: unknown) => {
    if (!err) {
      next();
      return;
    }

    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        res.status(400).json({
          success: false,
          message: "Each image must be smaller than 5MB",
        });
        return;
      }

      if (
        err.code === "LIMIT_FILE_COUNT" ||
        err.code === "LIMIT_UNEXPECTED_FILE"
      ) {
        res.status(400).json({
          success: false,
          message: "Please upload exactly 4 product images",
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: err.message,
      });
      return;
    }

    if (err instanceof Error) {
      res.status(400).json({
        success: false,
        message: err.message,
      });
      return;
    }

    next(err);
  });
};
