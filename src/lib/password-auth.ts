import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const PASSWORD_HASH_KEY_LENGTH = 64;
const PASSWORD_RESET_TOKEN_TTL_MS = 1000 * 60 * 60;

export function normalizeAuthEmail(value: string) {
  return value.trim().toLowerCase();
}

export function normalizeProfileName(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length >= 2 ? normalized : null;
}

export function isStrongEnoughPassword(value: string) {
  return value.length >= 8;
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, PASSWORD_HASH_KEY_LENGTH)) as Buffer;
  return `scrypt$${salt}$${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [algorithm, salt, expectedHash] = storedHash.split("$");
  if (algorithm !== "scrypt" || !salt || !expectedHash) {
    return false;
  }

  const derivedKey = (await scrypt(password, salt, PASSWORD_HASH_KEY_LENGTH)) as Buffer;
  const expected = Buffer.from(expectedHash, "hex");

  return expected.length === derivedKey.length && timingSafeEqual(expected, derivedKey);
}

export function createPasswordResetToken() {
  return randomBytes(24).toString("base64url");
}

export function hashPasswordResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function getPasswordResetExpiryDate(now = Date.now()) {
  return new Date(now + PASSWORD_RESET_TOKEN_TTL_MS);
}
