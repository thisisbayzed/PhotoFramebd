import { NextFunction, Request, Response } from "express";
import { BlacklistedToken } from "../models/BlacklistedToken";
import { verifyAdminToken } from "../utils/jwt";

export const protectAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      message: "Not authorized. Please login again.",
    });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const blacklisted = await BlacklistedToken.findOne({ token });

    if (blacklisted) {
      res.status(401).json({
        success: false,
        message: "You have been logged out. Please login again.",
      });
      return;
    }

    req.admin = verifyAdminToken(token);
    next();
  } catch {
    res.status(401).json({
      success: false,
      message: "Session expired or invalid. Please login again.",
    });
  }
};
