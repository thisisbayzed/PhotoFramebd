import mongoose, { Document, Schema } from "mongoose";
import { DeliveryZone } from "../utils/cartPricing";

export const ORDER_STATUSES = ["pending", "confirmed", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  lineTotal: number;
  image: string | null;
}

export const ORDER_TYPES = ["cart", "direct"] as const;
export type OrderType = (typeof ORDER_TYPES)[number];

export interface IOrder extends Document {
  orderNumber: string;
  orderType: OrderType;
  customerName: string;
  phone: string;
  address: string;
  deliveryZone: DeliveryZone;
  items: IOrderItem[];
  subtotal: number;
  deliveryCharge: number;
  vat: number;
  platformFee: number;
  grandTotal: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true },
    image: { type: String, default: null },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    orderType: {
      type: String,
      enum: ORDER_TYPES,
      default: "cart",
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    deliveryZone: {
      type: String,
      enum: ["inside_dhaka", "outside_dhaka"],
      required: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
    },
    subtotal: { type: Number, required: true },
    deliveryCharge: { type: Number, required: true },
    vat: { type: Number, required: true },
    platformFee: { type: Number, required: true },
    grandTotal: { type: Number, required: true },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: "pending",
    },
  },
  { collection: "orders", timestamps: true }
);

export const Order = mongoose.model<IOrder>("Order", orderSchema);
