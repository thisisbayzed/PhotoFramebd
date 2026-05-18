import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import { Admin } from "../models/Admin";
import { BlacklistedToken } from "../models/BlacklistedToken";
import { getDashboardStats } from "../services/dashboardStats";
import { signAdminToken } from "../utils/jwt";

export const adminLogin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
      return;
    }

    const admin = await Admin.findOne({
      email: String(email).toLowerCase().trim(),
    });

    if (!admin) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    const token = signAdminToken({
      id: admin._id.toString(),
      email: admin.email,
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        email: admin.email,
        token,
      },
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};

export const adminLogout = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (!token) {
      res.status(400).json({
        success: false,
        message: "Token is required",
      });
      return;
    }

    const decoded = jwt.decode(token) as { exp?: number } | null;
    const expiresAt = decoded?.exp
      ? new Date(decoded.exp * 1000)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await BlacklistedToken.findOneAndUpdate(
      { token },
      { token, expiresAt },
      { upsert: true }
    );

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};

export const getAdminProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const admin = await Admin.findById(req.admin?.id).select("-password");

    if (!admin) {
      res.status(404).json({
        success: false,
        message: "Admin not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        id: admin._id,
        email: admin.email,
      },
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};

export const getAdminDashboard = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const admin = await Admin.findById(req.admin?.id).select("-password");

    if (!admin) {
      res.status(404).json({
        success: false,
        message: "Admin not found",
      });
      return;
    }

    const stats = await getDashboardStats();

    res.status(200).json({
      success: true,
      message: "Welcome to admin dashboard",
      data: {
        admin: {
          id: admin._id,
          email: admin.email,
        },
        stats,
      },
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};

export const updateAdminCredentials = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { currentPassword, newEmail, newPassword } = req.body;

    if (!currentPassword) {
      res.status(400).json({
        success: false,
        message: "Current password is required",
      });
      return;
    }

    if (!newEmail && !newPassword) {
      res.status(400).json({
        success: false,
        message: "Provide a new email or new password to update",
      });
      return;
    }

    const admin = await Admin.findById(req.admin?.id);

    if (!admin) {
      res.status(404).json({
        success: false,
        message: "Admin not found",
      });
      return;
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      admin.password
    );

    if (!isCurrentPasswordValid) {
      res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
      return;
    }

    if (newEmail) {
      const normalizedEmail = String(newEmail).toLowerCase().trim();

      const emailTaken = await Admin.findOne({
        email: normalizedEmail,
        _id: { $ne: admin._id },
      });

      if (emailTaken) {
        res.status(409).json({
          success: false,
          message: "This email is already in use",
        });
        return;
      }

      admin.email = normalizedEmail;
    }

    if (newPassword) {
      if (String(newPassword).length < 6) {
        res.status(400).json({
          success: false,
          message: "New password must be at least 6 characters",
        });
        return;
      }

      admin.password = await bcrypt.hash(String(newPassword), 10);
    }

    await admin.save();

    const token = signAdminToken({
      id: admin._id.toString(),
      email: admin.email,
    });

    res.status(200).json({
      success: true,
      message: "Credentials updated successfully",
      data: {
        email: admin.email,
        token,
      },
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};
