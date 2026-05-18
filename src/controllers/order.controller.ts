import { Request, Response } from "express";
import mongoose from "mongoose";
import { Cart } from "../models/Cart";
import { ORDER_STATUSES, Order, OrderStatus } from "../models/Order";
import { Product } from "../models/Product";
import {
  calculateCartSummary,
  isValidDeliveryZone,
} from "../utils/cartPricing";
import { upsertCustomerOnOrder } from "../services/customerService";
import { generateOrderNumber } from "../utils/orderNumber";
import { normalizePhone } from "../utils/phone";

const populateCartItems = {
  path: "items.product",
  select: "name price images",
};

const formatOrder = (order: InstanceType<typeof Order>) => ({
  id: order._id,
  orderNumber: order.orderNumber,
  orderType: order.orderType,
  customerName: order.customerName,
  phone: order.phone,
  address: order.address,
  deliveryZone: order.deliveryZone,
  items: order.items,
  productSummary: order.items.map((i) => i.name).join(", "),
  subtotal: order.subtotal,
  deliveryCharge: order.deliveryCharge,
  vat: order.vat,
  platformFee: order.platformFee,
  grandTotal: order.grandTotal,
  status: order.status,
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
});

export const placeOrder = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { cartId, customerName, phone, address, deliveryZone } = req.body;

    if (!cartId || !customerName || !phone || !address || !deliveryZone) {
      res.status(400).json({
        success: false,
        message:
          "cartId, customerName, phone, address, and deliveryZone are required",
      });
      return;
    }

    if (!isValidDeliveryZone(String(deliveryZone))) {
      res.status(400).json({
        success: false,
        message: "deliveryZone must be inside_dhaka or outside_dhaka",
      });
      return;
    }

    const cart = await Cart.findOne({ cartId }).populate(populateCartItems);

    if (!cart || cart.items.length === 0) {
      res.status(400).json({
        success: false,
        message: "Cart is empty or not found",
      });
      return;
    }

    const orderItems = cart.items.map((item) => {
      const product = item.product as unknown as {
        _id: mongoose.Types.ObjectId;
        name: string;
        price: number;
        images: string[];
      };

      return {
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        lineTotal: product.price * item.quantity,
        image: product.images?.[0] ?? null,
      };
    });

    const subtotal = orderItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const itemCount = orderItems.reduce((sum, item) => sum + item.quantity, 0);
    const pricing = calculateCartSummary(
      subtotal,
      deliveryZone,
      itemCount
    );

    const orderNumber = await generateOrderNumber();
    const trimmedName = String(customerName).trim();
    const trimmedPhone = normalizePhone(String(phone));
    const trimmedAddress = String(address).trim();

    const order = await Order.create({
      orderNumber,
      orderType: "cart",
      customerName: trimmedName,
      phone: trimmedPhone,
      address: trimmedAddress,
      deliveryZone,
      items: orderItems,
      subtotal: pricing.subtotal,
      deliveryCharge: pricing.deliveryCharge,
      vat: pricing.vat,
      platformFee: pricing.platformFee,
      grandTotal: pricing.grandTotal,
      status: "pending",
    });

    await upsertCustomerOnOrder({
      phone: trimmedPhone,
      name: trimmedName,
      address: trimmedAddress,
    });

    await Cart.findOneAndDelete({ cartId });

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: formatOrder(order),
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};

export const directBuy = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      productId,
      quantity = 1,
      customerName,
      phone,
      mobileNumber,
      address,
      deliveryZone,
    } = req.body;

    const customerPhone = phone || mobileNumber;

    if (!productId || !customerName || !customerPhone || !address || !deliveryZone) {
      res.status(400).json({
        success: false,
        message:
          "productId, customerName, phone (or mobileNumber), address, and deliveryZone are required",
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

    if (!isValidDeliveryZone(String(deliveryZone))) {
      res.status(400).json({
        success: false,
        message: "deliveryZone must be inside_dhaka or outside_dhaka",
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

    const product = await Product.findById(productId);

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    const orderItems = [
      {
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: parsedQuantity,
        lineTotal: product.price * parsedQuantity,
        image: product.images?.[0] ?? null,
      },
    ];

    const subtotal = orderItems[0].lineTotal;
    const pricing = calculateCartSummary(
      subtotal,
      deliveryZone,
      parsedQuantity
    );

    const orderNumber = await generateOrderNumber();
    const trimmedName = String(customerName).trim();
    const trimmedPhone = normalizePhone(String(customerPhone));
    const trimmedAddress = String(address).trim();

    const order = await Order.create({
      orderNumber,
      orderType: "direct",
      customerName: trimmedName,
      phone: trimmedPhone,
      address: trimmedAddress,
      deliveryZone,
      items: orderItems,
      subtotal: pricing.subtotal,
      deliveryCharge: pricing.deliveryCharge,
      vat: pricing.vat,
      platformFee: pricing.platformFee,
      grandTotal: pricing.grandTotal,
      status: "pending",
    });

    await upsertCustomerOnOrder({
      phone: trimmedPhone,
      name: trimmedName,
      address: trimmedAddress,
    });

    res.status(201).json({
      success: true,
      message: "Direct order placed successfully",
      data: formatOrder(order),
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};

export const getAdminOrders = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { status } = req.query;
    const filter: { status?: OrderStatus } = {};

    if (status && status !== "all") {
      if (!ORDER_STATUSES.includes(status as OrderStatus)) {
        res.status(400).json({
          success: false,
          message: "Invalid status filter",
        });
        return;
      }
      filter.status = status as OrderStatus;
    }

    const orders = await Order.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: orders.map(formatOrder),
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};

export const getAdminOrderById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404).json({
        success: false,
        message: "Order not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: formatOrder(order),
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};

export const updateOrderStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { status } = req.body;

    if (!status || !ORDER_STATUSES.includes(status)) {
      res.status(400).json({
        success: false,
        message: "status must be pending, confirmed, or cancelled",
      });
      return;
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404).json({
        success: false,
        message: "Order not found",
      });
      return;
    }

    if (order.status === status) {
      res.status(400).json({
        success: false,
        message: `Order is already ${status}`,
      });
      return;
    }

    if (order.status === "cancelled") {
      res.status(400).json({
        success: false,
        message: "Cancelled orders cannot be updated",
      });
      return;
    }

    order.status = status as OrderStatus;
    await order.save();

    res.status(200).json({
      success: true,
      message: `Order ${status} successfully`,
      data: formatOrder(order),
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};

export const confirmOrder = async (
  req: Request,
  res: Response
): Promise<void> => {
  req.body = { status: "confirmed" };
  await updateOrderStatus(req, res);
};

export const cancelOrder = async (
  req: Request,
  res: Response
): Promise<void> => {
  req.body = { status: "cancelled" };
  await updateOrderStatus(req, res);
};
