import jwt, { SignOptions } from "jsonwebtoken";

export interface AdminTokenPayload {
  id: string;
  email: string;
}

export const signAdminToken = (payload: AdminTokenPayload): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }

  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as SignOptions["expiresIn"],
  };

  return jwt.sign(payload, secret, options);
};

export const verifyAdminToken = (token: string): AdminTokenPayload => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }

  return jwt.verify(token, secret) as AdminTokenPayload;
};
