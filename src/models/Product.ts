import mongoose, { Document, Schema } from "mongoose";

export interface IProduct extends Document {
  name: string;
  price: number;
  shortDescription: string;
  material: string;
  size: string;
  finish: string;
  category: mongoose.Types.ObjectId;
  isPremium: boolean;
  fullDescription: string;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    shortDescription: {
      type: String,
      required: true,
      trim: true,
    },
    material: {
      type: String,
      required: true,
      trim: true,
    },
    size: {
      type: String,
      required: true,
      trim: true,
    },
    finish: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    fullDescription: {
      type: String,
      required: true,
    },
    images: {
      type: [String],
      validate: {
        validator: (images: string[]) => images.length === 4,
        message: "Product must have exactly 4 images",
      },
      required: true,
    },
  },
  { collection: "products", timestamps: true }
);

export const Product = mongoose.model<IProduct>("Product", productSchema);
