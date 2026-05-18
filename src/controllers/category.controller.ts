import { Request, Response } from "express";
import { Category, createSlug } from "../models/Category";

const formatCategory = (category: InstanceType<typeof Category>) => ({
  id: category._id,
  name: category.name,
  slug: category.slug,
  createdAt: category.createdAt,
  updatedAt: category.updatedAt,
});

export const createCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name } = req.body;

    if (!name || !String(name).trim()) {
      res.status(400).json({
        success: false,
        message: "Category name is required",
      });
      return;
    }

    const trimmedName = String(name).trim();
    const slug = createSlug(trimmedName);

    const existing = await Category.findOne({
      $or: [{ name: trimmedName }, { slug }],
    });

    if (existing) {
      res.status(409).json({
        success: false,
        message: "Category already exists",
      });
      return;
    }

    const category = await Category.create({
      name: trimmedName,
      slug,
    });

    res.status(201).json({
      success: true,
      message: "Category added successfully",
      data: formatCategory(category),
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};

export const getCategories = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const categories = await Category.find().sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: categories.map(formatCategory),
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};

export const getCategoryById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      res.status(404).json({
        success: false,
        message: "Category not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: formatCategory(category),
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};

export const updateCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name } = req.body;

    if (!name || !String(name).trim()) {
      res.status(400).json({
        success: false,
        message: "Category name is required",
      });
      return;
    }

    const category = await Category.findById(req.params.id);

    if (!category) {
      res.status(404).json({
        success: false,
        message: "Category not found",
      });
      return;
    }

    const trimmedName = String(name).trim();
    const slug = createSlug(trimmedName);

    const existing = await Category.findOne({
      $or: [{ name: trimmedName }, { slug }],
      _id: { $ne: category._id },
    });

    if (existing) {
      res.status(409).json({
        success: false,
        message: "Category already exists",
      });
      return;
    }

    category.name = trimmedName;
    category.slug = slug;
    await category.save();

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: formatCategory(category),
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};

export const deleteCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      res.status(404).json({
        success: false,
        message: "Category not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};
