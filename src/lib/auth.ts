import type { AppUser, LocalPinRecord } from "../types";

const PIN_KEY = "primpro-v2.localPin.v1";
const SESSION_KEY = "primpro-v2.session.v1";

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex: string) {
  const bytes = new Uint8Array(hex.length / 2);

  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }

  return bytes;
}

async function hashPin(pin: string, saltHex: string) {
  const encoder = new TextEncoder();
  const salt = hexToBytes(saltHex);
  const pinBytes = encoder.encode(pin);
  const combined = new Uint8Array(salt.length + pinBytes.length);
  combined.set(salt);
  combined.set(pinBytes, salt.length);
  const digest = await crypto.subtle.digest("SHA-256", combined);
  return bytesToHex(new Uint8Array(digest));
}

export function hasLocalPin() {
  return Boolean(localStorage.getItem(PIN_KEY));
}

export function loadSession(): AppUser | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AppUser) : null;
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

export async function createLocalPin(pin: string) {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  const saltHex = bytesToHex(salt);
  const record: LocalPinRecord = {
    salt: saltHex,
    hash: await hashPin(pin, saltHex),
  };
  localStorage.setItem(PIN_KEY, JSON.stringify(record));
}

export async function verifyLocalPin(pin: string) {
  const raw = localStorage.getItem(PIN_KEY);

  if (!raw) return false;

  const record = JSON.parse(raw) as LocalPinRecord;
  const hash = await hashPin(pin, record.salt);
  return hash === record.hash;
}

export function resetLocalPin() {
  localStorage.removeItem(PIN_KEY);
  clearSession();
}
