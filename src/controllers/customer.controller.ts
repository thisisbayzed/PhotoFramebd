import { Request, Response } from "express";
import { Customer } from "../models/Customer";

export const getUniqueCustomers = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const customers = await Customer.find().sort({ lastOrderedAt: -1 });

    res.status(200).json({
      success: true,
      data: customers.map((customer) => ({
        id: customer._id,
        phone: customer.phone,
        name: customer.name,
        address: customer.address,
        totalOrders: customer.totalOrders,
        firstOrderedAt: customer.firstOrderedAt,
        lastOrderedAt: customer.lastOrderedAt,
      })),
      total: customers.length,
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};
