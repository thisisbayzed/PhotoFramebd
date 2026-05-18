export const normalizePhone = (phone: string): string =>
  String(phone).replace(/[\s\-+]/g, "").trim();
