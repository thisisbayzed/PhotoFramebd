import { Customer } from "../models/Customer";
import { normalizePhone } from "../utils/phone";

export const upsertCustomerOnOrder = async (data: {
  phone: string;
  name: string;
  address: string;
}): Promise<void> => {
  const phone = normalizePhone(data.phone);
  const now = new Date();

  await Customer.findOneAndUpdate(
    { phone },
    {
      $set: {
        name: data.name.trim(),
        address: data.address.trim(),
        lastOrderedAt: now,
      },
      $inc: { totalOrders: 1 },
      $setOnInsert: {
        phone,
        firstOrderedAt: now,
      },
    },
    { upsert: true }
  );
};
