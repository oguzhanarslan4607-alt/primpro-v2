import { priceListsById } from "../data/priceLists";
import type { CommissionBreakdownLine, CommissionInput, CommissionResult, PriceListMap } from "../types";

export const VAT_RATE = 1.2;

const highRateProducts = new Set([
  "TR (1300564)",
  "RO - Unique (1300035D)",
  "RO - Unique M5 (1300035M5)",
  "RO - Diamond (1300095)",
]);

const mediumRateProducts = new Set(["RO - Platinum (1300334)", "RO - Silver (1300534)"]);

function getCardRate(productKey: string) {
  if (mediumRateProducts.has(productKey)) return 13;
  if (productKey.includes("Klima")) return 11;
  return 21;
}

function getCashRate(productKey: string) {
  if (highRateProducts.has(productKey)) return 21;
  if (mediumRateProducts.has(productKey)) return 13;
  if (productKey.includes("Klima")) return 11;
  return 0;
}

function getInstallmentRates(productKey: string, paymentKey: string) {
  const installmentCount = Number.parseInt(paymentKey.split("+")[1] ?? "0", 10) || 0;

  if (productKey === "TR (1300564)") {
    return installmentCount > 12 ? { cashRate: 21, noteRate: 11 } : { cashRate: 21, noteRate: 17 };
  }

  if (["RO - Unique (1300035D)", "RO - Unique M5 (1300035M5)", "RO - Diamond (1300095)"].includes(productKey)) {
    return installmentCount > 7 ? { cashRate: 21, noteRate: 11 } : { cashRate: 21, noteRate: 17 };
  }

  if (mediumRateProducts.has(productKey)) {
    return { cashRate: 13, noteRate: 11 };
  }

  if (productKey.includes("Klima")) {
    return { cashRate: 11, noteRate: 9 };
  }

  return { cashRate: 0, noteRate: 0 };
}

function makeLine(label: string, grossAmount: number, rate: number): CommissionBreakdownLine {
  const netAmount = grossAmount / VAT_RATE;
  return {
    label,
    grossAmount,
    netAmount,
    rate,
    commission: netAmount * (rate / 100),
  };
}

export function calculateCommission(input: CommissionInput, listMap: PriceListMap = priceListsById): CommissionResult {
  const priceList = listMap[input.priceListId];
  const productPrices = priceList.products[input.productKey];

  if (!productPrices) {
    throw new Error(`Ürün bulunamadı: ${input.productKey}`);
  }

  const saleAmount = productPrices[input.paymentKey];

  if (typeof saleAmount !== "number") {
    throw new Error(`Ödeme tipi bulunamadı: ${input.paymentKey}`);
  }

  const breakdown =
    input.mode === "card"
      ? calculateCardBreakdown(input.productKey, input.cardSettlementAmount ?? 0)
      : calculateStandardBreakdown(input.productKey, input.paymentKey, saleAmount, input.cashAmount);

  return {
    priceListId: input.priceListId,
    productKey: input.productKey,
    paymentKey: input.paymentKey,
    mode: input.mode,
    saleAmount,
    totalNetAmount: breakdown.reduce((total, line) => total + line.netAmount, 0),
    totalCommission: breakdown.reduce((total, line) => total + line.commission, 0),
    breakdown,
  };
}

function calculateCardBreakdown(productKey: string, cardSettlementAmount: number) {
  return [makeLine("Kredi Kartı", Math.max(cardSettlementAmount, 0), getCardRate(productKey))];
}

function calculateStandardBreakdown(productKey: string, paymentKey: string, saleAmount: number, cashAmountInput?: number) {
  if (paymentKey === "PEŞİN") {
    return [makeLine("Nakit", saleAmount, getCashRate(productKey))];
  }

  const cashAmount = Math.max(cashAmountInput ?? 0, 0);
  const noteAmount = Math.max(saleAmount - cashAmount, 0);
  const { cashRate, noteRate } = getInstallmentRates(productKey, paymentKey);
  const lines: CommissionBreakdownLine[] = [];

  if (cashAmount > 0) {
    lines.push(makeLine("Nakit / Peşinat", cashAmount, cashRate));
  }

  if (noteAmount > 0) {
    lines.push(makeLine("Senet", noteAmount, noteRate));
  }

  return lines;
}
