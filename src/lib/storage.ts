import type { SavedCalculation } from "../types";

const HISTORY_KEY = "primpro-v2.history.v1";

export function loadHistory(): SavedCalculation[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as SavedCalculation[]) : [];
  } catch {
    return [];
  }
}

export function saveHistory(history: SavedCalculation[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}
