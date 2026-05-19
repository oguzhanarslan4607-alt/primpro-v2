import type { PriceList, PriceListId } from "../types";

export const PRICE_LIST_SWITCH_DATE = new Date("2026-06-02T00:00:00");

export const priceLists: PriceList[] = [
  {
    id: "older",
    label: "Önceki Liste",
    shortLabel: "Önceki",
    description: "Eski uygulamadaki `satisMapDahaEski` verisinden taşındı.",
    products: {
      "TR (1300564)": { "PEŞİN": 65000, "1+1": 68000, "1+5": 80000, "1+8": 85000, "1+12": 90000, "1+15": 95000, "1+18": 100000, "1+21": 105000, "1+24": 110000, "K.KARTI TEK ÇEKİM": 65000, "K.KARTI 2 TAKSİT": 68000, "K.KARTI 5 TAKSİT": 75000, "K.KARTI 9 TAKSİT": 80000 },
      "RO - Unique (1300035D)": { "PEŞİN": 25000, "1+1": 26000, "1+4": 28000, "1+7": 31000, "1+12": 32000, "1+15": 34000, "1+18": 36000, "1+21": 38000, "K.KARTI TEK ÇEKİM": 25000, "K.KARTI 2 TAKSİT": 26000, "K.KARTI 5 TAKSİT": 28000, "K.KARTI 9 TAKSİT": 31000 },
      "RO - Unique M5 (1300035M5)": { "PEŞİN": 25500, "1+1": 26500, "1+4": 29000, "1+7": 32000, "1+12": 33000, "1+15": 35000, "1+18": 37000, "1+21": 39000, "K.KARTI TEK ÇEKİM": 25500, "K.KARTI 2 TAKSİT": 26500, "K.KARTI 5 TAKSİT": 29000, "K.KARTI 9 TAKSİT": 32000 },
      "RO - Platinum (1300334)": { "PEŞİN": 15000, "1+1": 15500, "1+4": 17000, "1+7": 18000, "1+12": 20000, "1+15": 21000, "K.KARTI TEK ÇEKİM": 15000, "K.KARTI 2 TAKSİT": 15500, "K.KARTI 9 TAKSİT": 18500 },
      "RO - Silver (1300534)": { "PEŞİN": 5900, "1+1": 6200, "1+4": 6700, "1+7": 7200, "1+12": 7700, "1+15": 8200, "K.KARTI TEK ÇEKİM": 5900, "K.KARTI 2 TAKSİT": 6200, "K.KARTI 9 TAKSİT": 7000 },
      "RO - Diamond (1300095)": { "PEŞİN": 26000, "1+1": 27000, "1+4": 30000, "1+7": 32000, "1+12": 34000, "1+15": 36000, "1+18": 39000, "1+21": 42000, "K.KARTI TEK ÇEKİM": 26000, "K.KARTI 2 TAKSİT": 27000, "K.KARTI 6 TAKSİT": 30000, "K.KARTI 9 TAKSİT": 32000 },
      "Klima-12 (3502357)": { "PEŞİN": 29900, "1+1": 31000, "1+4": 35900, "1+9": 43000, "1+12": 48600, "K.KARTI TEK ÇEKİM": 31000, "K.KARTI 9 TAKSİT": 35900 },
      "Klima-18 (3502358)": { "PEŞİN": 40900, "1+1": 42500, "1+4": 49000, "1+9": 58900, "K.KARTI TEK ÇEKİM": 42500, "K.KARTI 9 TAKSİT": 49000 },
      "Klima-24 Ayaklı (3502453)": { "PEŞİN": 56900, "1+1": 59200, "1+4": 68300, "1+9": 81900, "1+12": 92500, "K.KARTI TEK ÇEKİM": 59200, "K.KARTI 9 TAKSİT": 68300 },
      "Klima-24 Split (3502876)": { "PEŞİN": 48900, "1+1": 50800, "1+4": 58700, "1+9": 70400, "1+12": 79500, "K.KARTI TEK ÇEKİM": 50800, "K.KARTI 9 TAKSİT": 58700 },
      "Klima-27 Multi Sistem (3502890)": { "PEŞİN": 81500, "1+1": 84700, "1+4": 97800, "1+9": 117400, "1+12": 132600, "K.KARTI TEK ÇEKİM": 84700, "K.KARTI 9 TAKSİT": 97800 },
      "Klima-45 (3502877)": { "PEŞİN": 109000, "1+1": 113400, "1+4": 130800, "1+9": 157000, "1+12": 177400, "K.KARTI TEK ÇEKİM": 113400, "K.KARTI 9 TAKSİT": 130800 },
    },
  },
  {
    id: "current",
    label: "Mevcut Fiyat Listesi",
    shortLabel: "Mevcut",
    description: "Eski uygulamada 2 Haziran 2026 öncesi varsayılan açılan liste.",
    products: {
      "TR (1300564)": { "PEŞİN": 65000, "1+1": 70000, "1+5": 80000, "1+8": 85000, "1+12": 90000, "1+15": 95000, "1+18": 100000, "1+21": 105000, "1+24": 110000, "K.KARTI TEK ÇEKİM": 65000, "K.KARTI 5 TAKSİT": 70000, "K.KARTI 9 TAKSİT": 75000 },
      "RO - Unique (1300035D)": { "PEŞİN": 25000, "1+1": 26000, "1+4": 28000, "1+7": 31000, "1+12": 32000, "1+15": 34000, "1+18": 36000, "1+21": 38000, "K.KARTI TEK ÇEKİM": 25000, "K.KARTI 2 TAKSİT": 26000, "K.KARTI 5 TAKSİT": 27000, "K.KARTI 9 TAKSİT": 29000 },
      "RO - Unique M5 (1300035M5)": { "PEŞİN": 25500, "1+1": 26500, "1+4": 29000, "1+7": 32000, "1+12": 33000, "1+15": 35000, "1+18": 37000, "1+21": 39000, "K.KARTI TEK ÇEKİM": 25500, "K.KARTI 2 TAKSİT": 26500, "K.KARTI 5 TAKSİT": 28000, "K.KARTI 9 TAKSİT": 30000 },
      "RO - Platinum (1300334)": { "PEŞİN": 16000, "1+1": 17000, "1+4": 18000, "1+7": 20000, "1+12": 22000, "1+15": 24000, "K.KARTI TEK ÇEKİM": 16500, "K.KARTI 2 TAKSİT": 17500, "K.KARTI 9 TAKSİT": 20500 },
      "RO - Silver (1300534)": { "PEŞİN": 6200, "1+1": 6500, "1+4": 7200, "1+7": 7700, "1+12": 8300, "1+15": 8800, "K.KARTI TEK ÇEKİM": 6200, "K.KARTI 2 TAKSİT": 6500, "K.KARTI 9 TAKSİT": 7600 },
      "RO - Diamond (1300095)": { "PEŞİN": 26000, "1+1": 27000, "1+4": 30000, "1+7": 32000, "1+12": 34000, "1+15": 36000, "1+18": 39000, "1+21": 42000, "K.KARTI TEK ÇEKİM": 26000, "K.KARTI 2 TAKSİT": 27000, "K.KARTI 6 TAKSİT": 30000, "K.KARTI 9 TAKSİT": 32000 },
      "Klima-12 (3502357)": { "PEŞİN": 29900, "1+1": 31000, "1+4": 35900, "1+9": 43000, "1+12": 48600, "K.KARTI TEK ÇEKİM": 31000, "K.KARTI 9 TAKSİT": 35900 },
      "Klima-18 (3502358)": { "PEŞİN": 40900, "1+1": 42500, "1+4": 49000, "1+9": 58900, "K.KARTI TEK ÇEKİM": 42500, "K.KARTI 9 TAKSİT": 49000 },
      "Klima-24 Ayaklı (3502453)": { "PEŞİN": 59900, "1+1": 62300, "1+4": 71880, "1+9": 81900, "1+12": 91700, "K.KARTI TEK ÇEKİM": 62300, "K.KARTI 9 TAKSİT": 71880 },
      "Klima-24 Split (3502876)": { "PEŞİN": 52900, "1+1": 55000, "1+4": 63500, "1+9": 76200, "1+12": 86000, "K.KARTI TEK ÇEKİM": 55000, "K.KARTI 9 TAKSİT": 63500 },
      "Klima-27 Multi Sistem (3502890)": { "PEŞİN": 81500, "1+1": 84700, "1+4": 97800, "1+9": 117400, "1+12": 132600, "K.KARTI TEK ÇEKİM": 84700, "K.KARTI 9 TAKSİT": 97800 },
      "Klima-45 (3502877)": { "PEŞİN": 113900, "1+1": 118500, "1+4": 136700, "1+9": 164000, "1+12": 185300, "K.KARTI TEK ÇEKİM": 118500, "K.KARTI 9 TAKSİT": 136700 },
    },
  },
  {
    id: "next",
    label: "Yeni Fiyat Listesi",
    shortLabel: "Yeni",
    description: "Eski uygulamada 2 Haziran 2026 itibarıyla varsayılan olacak liste.",
    products: {
      "TR (1300564)": { "PEŞİN": 70000, "1+1": 75000, "1+5": 78000, "1+8": 90000, "1+12": 95000, "1+15": 100000, "1+18": 105000, "1+21": 110000, "1+24": 115000, "K.KARTI TEK ÇEKİM": 70000, "K.KARTI 5 TAKSİT": 75000, "K.KARTI 9 TAKSİT": 80000 },
      "RO - Unique (1300035D)": { "PEŞİN": 28000, "1+1": 29000, "1+4": 32000, "1+7": 34000, "1+12": 38000, "1+15": 40000, "1+18": 42000, "1+21": 46000, "K.KARTI TEK ÇEKİM": 28000, "K.KARTI 2 TAKSİT": 29000, "K.KARTI 5 TAKSİT": 30000, "K.KARTI 9 TAKSİT": 32000 },
      "RO - Unique M5 (1300035M5)": { "PEŞİN": 28500, "1+1": 29500, "1+4": 33000, "1+7": 35000, "1+12": 39000, "1+15": 41000, "1+18": 43000, "1+21": 47000, "K.KARTI TEK ÇEKİM": 28500, "K.KARTI 2 TAKSİT": 29500, "K.KARTI 5 TAKSİT": 31000, "K.KARTI 9 TAKSİT": 33000 },
      "RO - Platinum (1300334)": { "PEŞİN": 17000, "1+1": 18000, "1+4": 20000, "1+7": 22000, "1+12": 24000, "1+15": 26000, "K.KARTI TEK ÇEKİM": 17000, "K.KARTI 2 TAKSİT": 18000, "K.KARTI 9 TAKSİT": 21000 },
      "RO - Silver (1300534)": { "PEŞİN": 7200, "1+1": 7500, "1+4": 8200, "1+7": 8700, "1+12": 9500, "1+15": 10500, "K.KARTI TEK ÇEKİM": 7200, "K.KARTI 2 TAKSİT": 7500, "K.KARTI 9 TAKSİT": 8600 },
      "RO - Diamond (1300095)": { "PEŞİN": 29000, "1+1": 30000, "1+4": 34000, "1+7": 36000, "1+12": 38000, "1+15": 40000, "1+18": 44000, "1+21": 48000, "K.KARTI TEK ÇEKİM": 29000, "K.KARTI 2 TAKSİT": 30000, "K.KARTI 6 TAKSİT": 33000, "K.KARTI 9 TAKSİT": 35000 },
      "Klima-12 (3502357)": { "PEŞİN": 29900, "1+1": 31000, "1+4": 35900, "1+9": 43000, "1+12": 48600, "K.KARTI TEK ÇEKİM": 31000, "K.KARTI 9 TAKSİT": 35900 },
      "Klima-18 (3502358)": { "PEŞİN": 40900, "1+1": 42500, "1+4": 49000, "1+9": 58900, "K.KARTI TEK ÇEKİM": 42500, "K.KARTI 9 TAKSİT": 49000 },
      "Klima-24 Ayaklı (3502453)": { "PEŞİN": 59900, "1+1": 62300, "1+4": 71880, "1+9": 81900, "1+12": 91700, "K.KARTI TEK ÇEKİM": 62300, "K.KARTI 9 TAKSİT": 71880 },
      "Klima-24 Split (3502876)": { "PEŞİN": 52900, "1+1": 55000, "1+4": 63500, "1+9": 76200, "1+12": 86000, "K.KARTI TEK ÇEKİM": 55000, "K.KARTI 9 TAKSİT": 63500 },
      "Klima-27 Multi Sistem (3502890)": { "PEŞİN": 81500, "1+1": 84700, "1+4": 97800, "1+9": 117400, "1+12": 132600, "K.KARTI TEK ÇEKİM": 84700, "K.KARTI 9 TAKSİT": 97800 },
      "Klima-45 (3502877)": { "PEŞİN": 113900, "1+1": 118500, "1+4": 136700, "1+9": 164000, "1+12": 185300, "K.KARTI TEK ÇEKİM": 118500, "K.KARTI 9 TAKSİT": 136700 },
    },
  },
];

export const priceListsById = Object.fromEntries(priceLists.map((list) => [list.id, list])) as Record<PriceListId, PriceList>;

export function getDefaultPriceListId(today = new Date()): PriceListId {
  return today >= PRICE_LIST_SWITCH_DATE ? "next" : "current";
}

export function getStandardPaymentKeys(productPrices: Record<string, number>) {
  return Object.keys(productPrices).filter((key) => !key.includes("K.KARTI"));
}

export function getCardPaymentKeys(productPrices: Record<string, number>) {
  return Object.keys(productPrices).filter((key) => key.includes("K.KARTI"));
}
