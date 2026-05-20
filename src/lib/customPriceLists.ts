import { priceLists, priceListsById } from "../data/priceLists";
import type { PriceList, PriceListId, PriceListMap } from "../types";

const CUSTOM_PRICE_LISTS_KEY = "primpro-v2.customPriceLists.v1";

function clonePriceLists() {
  return priceLists.map((list) => ({
    ...list,
    products: Object.fromEntries(
      Object.entries(list.products).map(([product, prices]) => [product, { ...prices }]),
    ),
  })) as PriceList[];
}

export function loadPriceLists(): PriceList[] {
  try {
    const raw = localStorage.getItem(CUSTOM_PRICE_LISTS_KEY);

    if (!raw) return clonePriceLists();

    const custom = JSON.parse(raw) as PriceList[];
    const merged = clonePriceLists();

    return merged.map((list) => {
      const customList = custom.find((item) => item.id === list.id);
      return customList?.products ? { ...list, products: customList.products } : list;
    });
  } catch {
    return clonePriceLists();
  }
}

export function savePriceLists(lists: PriceList[]) {
  localStorage.setItem(CUSTOM_PRICE_LISTS_KEY, JSON.stringify(lists));
}

export function resetPriceLists() {
  localStorage.removeItem(CUSTOM_PRICE_LISTS_KEY);
  return clonePriceLists();
}

export function toPriceListMap(lists: PriceList[]) {
  return Object.fromEntries(lists.map((list) => [list.id, list])) as PriceListMap;
}

export function updatePriceValue(
  lists: PriceList[],
  priceListId: PriceListId,
  productKey: string,
  paymentKey: string,
  value: number,
) {
  return lists.map((list) => {
    if (list.id !== priceListId) return list;

    return {
      ...list,
      products: {
        ...list.products,
        [productKey]: {
          ...list.products[productKey],
          [paymentKey]: value,
        },
      },
    };
  });
}

export function getOfficialValue(priceListId: PriceListId, productKey: string, paymentKey: string) {
  return priceListsById[priceListId].products[productKey]?.[paymentKey] ?? 0;
}
