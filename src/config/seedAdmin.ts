import bcrypt from "bcryptjs";
import { Admin } from "../models/Admin";

const ADMIN_EMAIL = "photoframe021@gmail.com";
const ADMIN_PASSWORD = "123456789";

export const seedAdmin = async (): Promise<void> => {
  const existing = await Admin.findOne({ email: ADMIN_EMAIL });

  if (existing) {
    return;
  }

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

  await Admin.create({
    email: ADMIN_EMAIL,
    password: hashedPassword,
  });

  console.log("Default admin account created in database");
};
