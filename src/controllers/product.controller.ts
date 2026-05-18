import { Request, Response } from "express";
import mongoose from "mongoose";
import { Category } from "../models/Category";
import { Product } from "../models/Product";
import {
  deleteMultipleImages,
  uploadMultipleImages,
} from "../utils/cloudinaryUpload";

interface ProductInput {
  name: string;
  price: number;
  shortDescription: string;
  material: string;
  size: string;
  finish: string;
  category: string;
  isPremium: boolean;
  fullDescription: string;
}

const parseBoolean = (value: unknown): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return value === "true" || value === "1";
  }
  return false;
};

const parseProductFields = (
  body: Record<string, unknown>
): { data?: ProductInput; error?: string } => {
  const {
    name,
    price,
    shortDescription,
    material,
    size,
    finish,
    category,
    isPremium,
    fullDescription,
  } = body;

  if (
    !name ||
    price === undefined ||
    !shortDescription ||
    !material ||
    !size ||
    !finish ||
    !category ||
    !fullDescription
  ) {
    return {
      error:
        "name, price, shortDescription, material, size, finish, category, and fullDescription are required",
    };
  }

  const parsedPrice = Number(price);

  if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
    return { error: "Price must be a valid positive number" };
  }

  if (!mongoose.Types.ObjectId.isValid(String(category))) {
    return { error: "Invalid category id" };
  }

  return {
    data: {
      name: String(name).trim(),
      price: parsedPrice,
      shortDescription: String(shortDescription).trim(),
      material: String(material).trim(),
      size: String(size).trim(),
      finish: String(finish).trim(),
      category: String(category),
      isPremium: parseBoolean(isPremium),
      fullDescription: String(fullDescription).trim(),
    },
  };
};

const formatProduct = (product: {
  _id: unknown;
  name: string;
  price: number;
  shortDescription: string;
  material: string;
  size: string;
  finish: string;
  category: unknown;
  isPremium: boolean;
  fullDescription: string;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}) => ({
  id: product._id,
  name: product.name,
  price: product.price,
  shortDescription: product.shortDescription,
  material: product.material,
  size: product.size,
  finish: product.finish,
  category: product.category,
  isPremium: product.isPremium,
  fullDescription: product.fullDescription,
  images: product.images,
  createdAt: product.createdAt,
  updatedAt: product.updatedAt,
});

export const createProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const parsed = parseProductFields(req.body);

    if (parsed.error || !parsed.data) {
      res.status(400).json({ success: false, message: parsed.error });
      return;
    }

    const files = req.files as Express.Multer.File[] | undefined;

    if (!files || files.length !== 4) {
      res.status(400).json({
        success: false,
        message: "Please upload exactly 4 product images",
      });
      return;
    }

    const categoryExists = await Category.findById(parsed.data.category);

    if (!categoryExists) {
      res.status(404).json({
        success: false,
        message: "Category not found",
      });
      return;
    }

    const imageUrls = await uploadMultipleImages(files);

    const product = await Product.create({
      ...parsed.data,
      category: new mongoose.Types.ObjectId(parsed.data.category),
      images: imageUrls,
    });

    const populated = await Product.findById(product._id).populate(
      "category",
      "name slug"
    );

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: formatProduct(populated!.toObject()),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong. Please try again.";

    res.status(500).json({
      success: false,
      message,
    });
  }
};

export const getProducts = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const products = await Product.find()
      .populate("category", "name slug")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: products.map((p) => formatProduct(p.toObject())),
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};

export const getProductById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "category",
      "name slug"
    );

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: formatProduct(product.toObject()),
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};

export const updateProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    const parsed = parseProductFields(req.body);

    if (parsed.error || !parsed.data) {
      res.status(400).json({ success: false, message: parsed.error });
      return;
    }

    const categoryExists = await Category.findById(parsed.data.category);

    if (!categoryExists) {
      res.status(404).json({
        success: false,
        message: "Category not found",
      });
      return;
    }

    const files = req.files as Express.Multer.File[] | undefined;
    const oldImages = [...product.images];

    if (files && files.length > 0) {
      if (files.length !== 4) {
        res.status(400).json({
          success: false,
          message: "Please upload exactly 4 product images when replacing images",
        });
        return;
      }

      const imageUrls = await uploadMultipleImages(files);
      product.images = imageUrls;
      await deleteMultipleImages(oldImages);
    }

    product.name = parsed.data.name;
    product.price = parsed.data.price;
    product.shortDescription = parsed.data.shortDescription;
    product.material = parsed.data.material;
    product.size = parsed.data.size;
    product.finish = parsed.data.finish;
    product.category = new mongoose.Types.ObjectId(parsed.data.category);
    product.isPremium = parsed.data.isPremium;
    product.fullDescription = parsed.data.fullDescription;

    await product.save();

    const populated = await Product.findById(product._id).populate(
      "category",
      "name slug"
    );

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: formatProduct(populated!.toObject()),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong. Please try again.";

    res.status(500).json({
      success: false,
      message,
    });
  }
};

export const deleteProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    await deleteMultipleImages(product.images);

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};
