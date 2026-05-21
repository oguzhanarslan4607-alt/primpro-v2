import type { AppUser, UserRole } from "../types";

const SESSION_KEY = "primpro-v2.session.v1";
const ROLE_PINS: Record<UserRole, string> = {
  admin: "1905",
  user: "2026",
};

function isValidUser(value: AppUser | null): value is AppUser {
  return Boolean(value?.id && value.mode && (value.role === "admin" || value.role === "user"));
}

export function verifyLocalPin(pin: string): UserRole | null {
  const normalizedPin = pin.trim();

  if (normalizedPin === ROLE_PINS.admin) return "admin";
  if (normalizedPin === ROLE_PINS.user) return "user";

  return null;
}

export function loadSession(): AppUser | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    const parsed = raw ? (JSON.parse(raw) as AppUser) : null;
    return isValidUser(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveSession(user: AppUser) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}
