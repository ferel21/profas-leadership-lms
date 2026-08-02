import { createHash, randomBytes } from "node:crypto";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 12;

export function normalizeCohortCode(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function hashCohortCode(value: string): string {
  return createHash("sha256").update(normalizeCohortCode(value), "utf8").digest("hex");
}

export function formatCohortCode(normalizedCode: string): string {
  return normalizedCode.match(/.{1,4}/g)?.join("-") ?? normalizedCode;
}

export function generateCohortCode(): { code: string; hash: string; hint: string } {
  const bytes = randomBytes(CODE_LENGTH);
  let normalizedCode = "";
  for (const byte of bytes) normalizedCode += CODE_ALPHABET[byte % CODE_ALPHABET.length];

  const code = formatCohortCode(normalizedCode);
  return {
    code,
    hash: hashCohortCode(normalizedCode),
    hint: `${normalizedCode.slice(0, 2)}••••••••${normalizedCode.slice(-2)}`,
  };
}
