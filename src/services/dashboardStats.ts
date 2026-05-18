import { Order } from "../models/Order";
import { Product } from "../models/Product";

export interface DashboardStats {
  totalOrders: number;
  totalProducts: number;
  pendingOrders: number;
  totalSales: number;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const [totalOrders, totalProducts, pendingOrders, salesResult] =
    await Promise.all([
      Order.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments({ status: "pending" }),
      Order.aggregate([
        { $match: { status: "confirmed" } },
        { $group: { _id: null, total: { $sum: "$grandTotal" } } },
      ]),
    ]);

  const totalSales = salesResult[0]?.total ?? 0;

  return {
    totalOrders,
    totalProducts,
    pendingOrders,
    totalSales,
  };
};
