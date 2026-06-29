import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";

/** 근로자 비밀번호 해시 (scrypt). 저장 형식: "salt:hash" (hex) */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string | null | undefined): boolean {
  if (!stored || !stored.includes(":")) return false;
  const [salt, hash] = stored.split(":");
  const calc = scryptSync(password, salt, 64);
  const orig = Buffer.from(hash, "hex");
  if (calc.length !== orig.length) return false;
  return timingSafeEqual(calc, orig);
}
