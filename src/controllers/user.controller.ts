import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import mongoose from "mongoose";
import { USER_ROLES, User } from "../models/User";

const isValidRole = (role: string): boolean =>
  USER_ROLES.includes(role as (typeof USER_ROLES)[number]);

export const createUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      res.status(400).json({
        success: false,
        message: "Name, email, password, and role are required",
      });
      return;
    }

    if (!isValidRole(role)) {
      res.status(400).json({
        success: false,
        message: `Role must be one of: ${USER_ROLES.join(", ")}`,
      });
      return;
    }

    if (String(password).length < 6) {
      res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
      return;
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: "A user with this email already exists",
      });
      return;
    }

    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password: await bcrypt.hash(String(password), 10),
      role,
      createdBy: new mongoose.Types.ObjectId(req.admin!.id),
    });

    res.status(201).json({
      success: true,
      message: "User added successfully",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};

export const getUserById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};

export const updateUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { name, email, password, role, isActive } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    if (role && !isValidRole(role)) {
      res.status(400).json({
        success: false,
        message: `Role must be one of: ${USER_ROLES.join(", ")}`,
      });
      return;
    }

    if (email) {
      const normalizedEmail = String(email).toLowerCase().trim();
      const emailTaken = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: user._id },
      });

      if (emailTaken) {
        res.status(409).json({
          success: false,
          message: "A user with this email already exists",
        });
        return;
      }

      user.email = normalizedEmail;
    }

    if (name) user.name = String(name).trim();
    if (role) user.role = role;
    if (typeof isActive === "boolean") user.isActive = isActive;

    if (password) {
      if (String(password).length < 6) {
        res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters",
        });
        return;
      }

      user.password = await bcrypt.hash(String(password), 10);
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        updatedAt: user.updatedAt,
      },
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};

export const deleteUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};
