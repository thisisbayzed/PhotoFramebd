import { Order } from "../models/Order";

export const generateOrderNumber = async (): Promise<string> => {
  const lastOrder = await Order.findOne()
    .sort({ createdAt: -1 })
    .select("orderNumber");

  if (!lastOrder?.orderNumber) {
    return "FH-2401";
  }

  const match = lastOrder.orderNumber.match(/FH-(\d+)/);

  if (!match) {
    return "FH-2401";
  }

  const nextNumber = parseInt(match[1], 10) + 1;
  return `FH-${nextNumber}`;
};
