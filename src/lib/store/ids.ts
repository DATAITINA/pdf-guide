import { randomBytes, createHash, createHmac, timingSafeEqual } from "node:crypto";

export function newId(prefix?: string): string {
  const id = randomBytes(12).toString("hex");
  return prefix ? `${prefix}_${id}` : id;
}

export function newToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashValue(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function hmacSha512(secret: string, payload: string): string {
  return createHmac("sha512", secret).update(payload).digest("hex");
}

export function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}
