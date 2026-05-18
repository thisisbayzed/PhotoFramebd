import mongoose, { Document, Schema } from "mongoose";

export interface ICustomer extends Document {
  phone: string;
  name: string;
  address: string;
  totalOrders: number;
  firstOrderedAt: Date;
  lastOrderedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    totalOrders: {
      type: Number,
      default: 1,
      min: 0,
    },
    firstOrderedAt: {
      type: Date,
      required: true,
    },
    lastOrderedAt: {
      type: Date,
      required: true,
    },
  },
  { collection: "customers", timestamps: true }
);

export const Customer = mongoose.model<ICustomer>("Customer", customerSchema);
