import { randomUUID } from "crypto";
import { Request, Response } from "express";
import mongoose from "mongoose";
import { Cart } from "../models/Cart";
import { Product } from "../models/Product";
import {
  calculateCartSummary,
  isValidDeliveryZone,
} from "../utils/cartPricing";

const populateCartItems = { path: "items.product", select: "name price images shortDescription" };

const buildCartItemsResponse = (cart: InstanceType<typeof Cart>) => {
  return cart.items.map((item) => {
    const product = item.product as unknown as {
      _id: mongoose.Types.ObjectId;
      name: string;
      price: number;
      images: string[];
      shortDescription: string;
    };

    return {
      productId: product._id,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
      lineTotal: product.price * item.quantity,
      image: product.images?.[0] ?? null,
      shortDescription: product.shortDescription,
    };
  });
};

const getCartSubtotal = (items: ReturnType<typeof buildCartItemsResponse>): number =>
  items.reduce((sum, item) => sum + item.lineTotal, 0);

const getCartItemCount = (items: ReturnType<typeof buildCartItemsResponse>): number =>
  items.reduce((sum, item) => sum + item.quantity, 0);

export const createCart = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const cart = await Cart.create({ cartId: randomUUID() });

    res.status(201).json({
      success: true,
      message: "Cart created successfully",
      data: {
        cartId: cart.cartId,
        items: [],
        itemCount: 0,
      },
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};

export const addToCart = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { productId, quantity = 1 } = req.body;
    const { cartId } = req.params;

    if (!productId) {
      res.status(400).json({
        success: false,
        message: "productId is required",
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(String(productId))) {
      res.status(400).json({
        success: false,
        message: "Invalid product id",
      });
      return;
    }

    const parsedQuantity = Number(quantity);

    if (Number.isNaN(parsedQuantity) || parsedQuantity < 1) {
      res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
      });
      return;
    }

    const cart = await Cart.findOne({ cartId });

    if (!cart) {
      res.status(404).json({
        success: false,
        message: "Cart not found",
      });
      return;
    }

    const product = await Product.findById(productId);

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    const existingItem = cart.items.find(
      (item) => item.product.toString() === String(productId)
    );

    if (existingItem) {
      existingItem.quantity += parsedQuantity;
    } else {
      cart.items.push({
        product: new mongoose.Types.ObjectId(String(productId)),
        quantity: parsedQuantity,
      });
    }

    await cart.save();

    const populatedCart = await Cart.findOne({ cartId }).populate(populateCartItems);
    const items = buildCartItemsResponse(populatedCart!);

    res.status(200).json({
      success: true,
      message: "Product added to cart",
      data: {
        cartId: cart.cartId,
        items,
        itemCount: getCartItemCount(items),
        subtotal: getCartSubtotal(items),
      },
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};

export const removeFromCart = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { cartId, productId } = req.params;

    const cart = await Cart.findOne({ cartId });

    if (!cart) {
      res.status(404).json({
        success: false,
        message: "Cart not found",
      });
      return;
    }

    const initialLength = cart.items.length;
    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId
    );

    if (cart.items.length === initialLength) {
      res.status(404).json({
        success: false,
        message: "Product not found in cart",
      });
      return;
    }

    await cart.save();

    const populatedCart = await Cart.findOne({ cartId }).populate(populateCartItems);
    const items = buildCartItemsResponse(populatedCart!);

    res.status(200).json({
      success: true,
      message: "Product removed from cart",
      data: {
        cartId: cart.cartId,
        items,
        itemCount: getCartItemCount(items),
        subtotal: getCartSubtotal(items),
      },
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};

export const deleteCart = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const cart = await Cart.findOneAndDelete({ cartId: req.params.cartId });

    if (!cart) {
      res.status(404).json({
        success: false,
        message: "Cart not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Cart deleted successfully",
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};

export const getCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const cart = await Cart.findOne({ cartId: req.params.cartId }).populate(
      populateCartItems
    );

    if (!cart) {
      res.status(404).json({
        success: false,
        message: "Cart not found",
      });
      return;
    }

    const items = buildCartItemsResponse(cart);

    res.status(200).json({
      success: true,
      data: {
        cartId: cart.cartId,
        items,
        itemCount: getCartItemCount(items),
        subtotal: getCartSubtotal(items),
      },
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};

export const getCartSummary = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { deliveryZone } = req.query;

    if (!deliveryZone || !isValidDeliveryZone(String(deliveryZone))) {
      res.status(400).json({
        success: false,
        message:
          "deliveryZone is required. Use inside_dhaka or outside_dhaka",
      });
      return;
    }

    const cart = await Cart.findOne({ cartId: req.params.cartId }).populate(
      populateCartItems
    );

    if (!cart) {
      res.status(404).json({
        success: false,
        message: "Cart not found",
      });
      return;
    }

    const items = buildCartItemsResponse(cart);
    const subtotal = getCartSubtotal(items);
    const itemCount = getCartItemCount(items);

    const summary = calculateCartSummary(
      subtotal,
      deliveryZone as "inside_dhaka" | "outside_dhaka",
      itemCount
    );

    res.status(200).json({
      success: true,
      data: {
        cartId: cart.cartId,
        items,
        ...summary,
      },
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};
