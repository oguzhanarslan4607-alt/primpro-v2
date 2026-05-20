export type PriceListId = "older" | "current" | "next";

export type PaymentMode = "standard" | "card";

export type ProductPriceMap = Record<string, Record<string, number>>;

export interface PriceList {
  id: PriceListId;
  label: string;
  shortLabel: string;
  description: string;
  products: ProductPriceMap;
}

export interface CommissionInput {
  priceListId: PriceListId;
  productKey: string;
  paymentKey: string;
  mode: PaymentMode;
  cashAmount?: number;
  cardSettlementAmount?: number;
}

export interface CommissionBreakdownLine {
  label: string;
  grossAmount: number;
  netAmount: number;
  rate: number;
  commission: number;
}

export interface CommissionResult {
  priceListId: PriceListId;
  productKey: string;
  paymentKey: string;
  mode: PaymentMode;
  saleAmount: number;
  totalNetAmount: number;
  totalCommission: number;
  breakdown: CommissionBreakdownLine[];
}

export interface SavedCalculation {
  id: string;
  createdAt: string;
  customerName: string;
  result: CommissionResult;
}

export type PriceListMap = Record<PriceListId, PriceList>;

export interface LocalPinRecord {
  salt: string;
  hash: string;
}

export interface AppUser {
  id: string;
  email?: string;
  mode: "local" | "firebase";
}
