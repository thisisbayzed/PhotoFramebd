export const DELIVERY_CHARGE_INSIDE_DHAKA = 80;
export const DELIVERY_CHARGE_OUTSIDE_DHAKA = 150;
export const VAT_AMOUNT = 10;
export const PLATFORM_FEE = 7;

export type DeliveryZone = "inside_dhaka" | "outside_dhaka";

export const isValidDeliveryZone = (zone: string): zone is DeliveryZone =>
  zone === "inside_dhaka" || zone === "outside_dhaka";

export const getDeliveryCharge = (zone: DeliveryZone): number =>
  zone === "inside_dhaka"
    ? DELIVERY_CHARGE_INSIDE_DHAKA
    : DELIVERY_CHARGE_OUTSIDE_DHAKA;

export interface CartSummaryTotals {
  subtotal: number;
  deliveryCharge: number;
  vat: number;
  platformFee: number;
  grandTotal: number;
  deliveryZone: DeliveryZone;
  itemCount: number;
}

export const calculateCartSummary = (
  subtotal: number,
  deliveryZone: DeliveryZone,
  itemCount: number
): CartSummaryTotals => {
  const deliveryCharge = getDeliveryCharge(deliveryZone);
  const vat = VAT_AMOUNT;
  const platformFee = PLATFORM_FEE;
  const grandTotal = subtotal + deliveryCharge + vat + platformFee;

  return {
    subtotal,
    deliveryCharge,
    vat,
    platformFee,
    grandTotal,
    deliveryZone,
    itemCount,
  };
};
