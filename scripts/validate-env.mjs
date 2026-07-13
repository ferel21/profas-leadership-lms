import fs from "node:fs";
import path from "node:path";

function loadEnvFile() {
  const envFile = process.env.ENV_FILE || ".env";
  if (!fs.existsSync(envFile)) return;
  const content = fs.readFileSync(envFile, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key) || process.env[key] !== undefined) continue;
    let value = line.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadEnvFile();

const forceProduction = process.argv.includes("--production");
const production = forceProduction || process.env.NODE_ENV === "production";
const errors = [];
const warnings = [];

const value = key => (process.env[key] || "").trim().replace(/^['"]|['"]$/g, "");
const isPlaceholder = input => /^(ganti|change[-_ ]?me|replace[-_ ]?me|your[-_ ]|example|secret[-_ ]?here|sk-ant-ganti)/i.test(input);

function required(key, { minLength, message } = {}) {
  const input = value(key);
  if (!input || isPlaceholder(input)) {
    errors.push(`${key} wajib diisi dengan nilai produksi yang nyata.`);
    return "";
  }
  if (minLength && input.length < minLength) {
    errors.push(`${key} minimal harus ${minLength} karakter.`);
  }
  if (message && !message(input)) errors.push(`${key} memiliki format yang tidak valid.`);
  return input;
}

function urlValue(key, { requireHttps = false } = {}) {
  const input = required(key);
  if (!input) return null;
  try {
    const parsed = new URL(input);
    if (!parsed.protocol || !parsed.host) throw new Error("missing host");
    if (requireHttps && parsed.protocol !== "https:") errors.push(`${key} wajib menggunakan HTTPS pada production.`);
    if (requireHttps && ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname)) {
      errors.push(`${key} tidak boleh menunjuk ke localhost pada production.`);
    }
    return parsed;
  } catch {
    errors.push(`${key} harus berupa URL absolut yang valid.`);
    return null;
  }
}

if (production && process.env.NODE_ENV && process.env.NODE_ENV !== "production") {
  errors.push("NODE_ENV harus bernilai production.");
}

const databaseUrl = required("DATABASE_URL");
const directUrl = required("DIRECT_URL");
if (production && databaseUrl && !/^postgres(?:ql)?:\/\//i.test(databaseUrl)) {
  errors.push("DATABASE_URL production harus menggunakan PostgreSQL; database tidak dipindahkan oleh image ini.");
}
if (production && directUrl && !/^postgres(?:ql)?:\/\//i.test(directUrl)) {
  errors.push("DIRECT_URL production harus menggunakan PostgreSQL direct connection.");
}

required("JWT_SECRET", { minLength: 32 });
const nextAuthSecret = value("NEXTAUTH_SECRET");
if (nextAuthSecret && (isPlaceholder(nextAuthSecret) || nextAuthSecret.length < 32)) {
  errors.push("NEXTAUTH_SECRET jika diisi minimal harus 32 karakter dan bukan placeholder.");
}

if (production) {
  urlValue("NEXTAUTH_URL", { requireHttps: true });
  urlValue("NEXT_PUBLIC_APP_URL", { requireHttps: true });
} else {
  urlValue("NEXTAUTH_URL");
  urlValue("NEXT_PUBLIC_APP_URL");
}

const uploadDir = required("PRIVATE_UPLOAD_DIR");
if (production && uploadDir && !path.isAbsolute(uploadDir)) {
  errors.push("PRIVATE_UPLOAD_DIR production harus berupa path absolut pada volume persistent.");
}
if (uploadDir && /(?:^|[\\/])public[\\/]uploads(?:$|[\\/])/i.test(uploadDir)) {
  errors.push("PRIVATE_UPLOAD_DIR tidak boleh berada di public/uploads karena dapat bypass authorization.");
}

const healthToken = value("HEALTHCHECK_TOKEN");
if (production && value("REQUIRE_HEALTHCHECK_TOKEN").toLowerCase() === "true") {
  if (!healthToken || isPlaceholder(healthToken) || healthToken.length < 32) {
    errors.push("HEALTHCHECK_TOKEN wajib minimal 32 karakter ketika REQUIRE_HEALTHCHECK_TOKEN=true.");
  }
} else if (!healthToken) {
  warnings.push("HEALTHCHECK_TOKEN belum diisi; detail monitoring tetap nonaktif dan endpoint hanya memberi readiness minimal.");
}

const googleId = value("GOOGLE_CLIENT_ID");
const googleSecret = value("GOOGLE_CLIENT_SECRET");
if (Boolean(googleId) !== Boolean(googleSecret)) {
  errors.push("GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET harus diisi berpasangan.");
}

for (const [key, input] of Object.entries(process.env)) {
  if (/^NEXT_PUBLIC_.*(?:SECRET|TOKEN|PASSWORD|PRIVATE_KEY)/i.test(key) && input) {
    errors.push(`${key} berpotensi mengekspos secret melalui bundle browser.`);
  }
}

if (warnings.length) {
  for (const warning of warnings) console.warn(`[ENV_WARNING] ${warning}`);
}

if (errors.length) {
  console.error("Environment validation gagal:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Environment validation lulus (${production ? "production" : "development"}). Secret tidak dicetak.`);
