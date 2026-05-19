import { describe, expect, it } from "vitest";
import { getDefaultPriceListId, priceLists } from "../data/priceLists";
import { calculateCommission } from "./commissionCalculator";

describe("price list migration", () => {
  it("keeps all three legacy price lists", () => {
    expect(priceLists.map((list) => list.id)).toEqual(["older", "current", "next"]);
    expect(priceLists.every((list) => Object.keys(list.products).length === 12)).toBe(true);
  });

  it("matches the legacy switch date behavior", () => {
    expect(getDefaultPriceListId(new Date("2026-06-01T23:59:00"))).toBe("current");
    expect(getDefaultPriceListId(new Date("2026-06-02T00:00:00"))).toBe("next");
  });
});

describe("calculateCommission", () => {
  it("calculates TR cash sales from the current list", () => {
    const result = calculateCommission({
      priceListId: "current",
      productKey: "TR (1300564)",
      paymentKey: "PEŞİN",
      mode: "standard",
    });

    expect(result.saleAmount).toBe(65000);
    expect(result.breakdown[0].rate).toBe(21);
    expect(result.totalCommission).toBeCloseTo(11375, 2);
  });

  it("splits long TR installments into cash and lower-rate note commission", () => {
    const result = calculateCommission({
      priceListId: "current",
      productKey: "TR (1300564)",
      paymentKey: "1+15",
      mode: "standard",
      cashAmount: 20000,
    });

    expect(result.saleAmount).toBe(95000);
    expect(result.breakdown.map((line) => line.rate)).toEqual([21, 11]);
    expect(result.totalCommission).toBeCloseTo(10375, 2);
  });

  it("uses medium product rates for platinum cash sales", () => {
    const result = calculateCommission({
      priceListId: "current",
      productKey: "RO - Platinum (1300334)",
      paymentKey: "PEŞİN",
      mode: "standard",
    });

    expect(result.breakdown[0].rate).toBe(13);
    expect(result.totalCommission).toBeCloseTo(1733.33, 2);
  });

  it("uses klima rates for mixed installment sales", () => {
    const result = calculateCommission({
      priceListId: "next",
      productKey: "Klima-12 (3502357)",
      paymentKey: "1+9",
      mode: "standard",
      cashAmount: 10000,
    });

    expect(result.breakdown.map((line) => line.rate)).toEqual([11, 9]);
    expect(result.totalCommission).toBeCloseTo(3391.67, 2);
  });

  it("uses settlement amount for card commission", () => {
    const result = calculateCommission({
      priceListId: "current",
      productKey: "RO - Silver (1300534)",
      paymentKey: "K.KARTI 9 TAKSİT",
      mode: "card",
      cardSettlementAmount: 7600,
    });

    expect(result.saleAmount).toBe(7600);
    expect(result.breakdown[0].rate).toBe(13);
    expect(result.totalCommission).toBeCloseTo(823.33, 2);
  });
});
