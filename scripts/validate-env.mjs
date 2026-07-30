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
const isTruthy = input => ["1", "true", "yes"].includes(input.toLowerCase());
const isCiOrBuildDummy = () => process.env.CI === "true" || value("DATABASE_URL").includes("build:build@127.0.0.1") || value("NODE_ENV") === "test";
const isVercel = () => isTruthy(value("VERCEL"));
const objectStorageEnabled = isVercel() || isTruthy(value("SUPABASE_STORAGE_ENABLED"));
const vercelAppUrl = () => {
  const host = value("VERCEL_PROJECT_PRODUCTION_URL") || value("VERCEL_URL");
  if (!host) return "";
  return /^https?:\/\//i.test(host) ? host : `https://${host}`;
};
const isPlaceholder = input => {
  if (!input) return true;
  if (/^(ganti|change[-_ ]?me|replace[-_ ]?me|your[-_ ]|example|secret[-_ ]?here|sk-ant-ganti)/i.test(input)) return true;
  if (/\[(?:password|region|project|host|user|secret|token)\]/i.test(input)) return true;
  if (production && !isCiOrBuildDummy() && /(change-in-production|build-only|ganti-dengan-secret|secret-here|placeholder)/i.test(input)) return true;
  return false;
};

function required(key, { minLength, message } = {}) {
  let input = value(key);
  if (!input && key === "NEXT_PUBLIC_APP_URL") input = vercelAppUrl();
  if (!input && key === "PRIVATE_UPLOAD_DIR") input = path.resolve(process.cwd(), ".data", "uploads");
  if (!input) {
    errors.push(`${key} wajib diisi.`);
    return "";
  }
  if (isPlaceholder(input)) {
    errors.push(`${key} wajib diisi dengan nilai nyata, bukan placeholder.`);
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
    if (requireHttps && ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname) && !isCiOrBuildDummy()) {
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
if (databaseUrl && !/^postgres(?:ql)?:\/\//i.test(databaseUrl)) {
  errors.push("DATABASE_URL harus menggunakan PostgreSQL sesuai provider Prisma.");
}
if (directUrl && !/^postgres(?:ql)?:\/\//i.test(directUrl)) {
  errors.push("DIRECT_URL harus menggunakan PostgreSQL direct connection.");
}

required("JWT_SECRET", { minLength: 32 });

if (production) {
  urlValue("NEXT_PUBLIC_APP_URL", { requireHttps: true });
} else {
  urlValue("NEXT_PUBLIC_APP_URL");
}

const uploadDir = objectStorageEnabled ? value("PRIVATE_UPLOAD_DIR") : required("PRIVATE_UPLOAD_DIR");
if (!objectStorageEnabled && production && uploadDir && !path.isAbsolute(uploadDir)) {
  errors.push("PRIVATE_UPLOAD_DIR production harus berupa path absolut pada volume persistent.");
}
if (!objectStorageEnabled && uploadDir && /(?:^|[\\/])public[\\/]uploads(?:$|[\\/])/i.test(uploadDir)) {
  errors.push("PRIVATE_UPLOAD_DIR tidak boleh berada di public/uploads karena dapat bypass authorization.");
}

const healthToken = value("HEALTHCHECK_TOKEN");
if (production && value("REQUIRE_HEALTHCHECK_TOKEN").toLowerCase() !== "false" && !isCiOrBuildDummy()) {
  if (!healthToken || isPlaceholder(healthToken) || healthToken.length < 32) {
    errors.push("HEALTHCHECK_TOKEN wajib diisi minimal 32 karakter ketika REQUIRE_HEALTHCHECK_TOKEN=true di production.");
  }
} else if (!healthToken && value("REQUIRE_HEALTHCHECK_TOKEN").toLowerCase() !== "false") {
  warnings.push("HEALTHCHECK_TOKEN belum diisi; detail monitoring tetap nonaktif dan endpoint hanya memberi readiness minimal.");
}

const googleId = value("GOOGLE_CLIENT_ID");
const googleSecret = value("GOOGLE_CLIENT_SECRET");
if (Boolean(googleId) !== Boolean(googleSecret)) {
  errors.push("GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET harus diisi berpasangan.");
}
if (production && !isCiOrBuildDummy() && [googleId, googleSecret].some(input => input && isPlaceholder(input))) {
  errors.push("Kredensial Google OAuth tidak boleh memakai placeholder pada production.");
}

const aiConfigKeys = [
  "PHI3_API_KEY",
  "PHI3_BASE_URL",
  "PHI3_MODEL",
  "OPENAI_API_KEY",
  "OPENAI_BASE_URL",
  "OPENAI_MODEL",
];
for (const key of aiConfigKeys) {
  const input = value(key);
  if (input && isPlaceholder(input)) {
    const message = `${key} berisi placeholder; kosongkan untuk fallback lokal atau isi dengan konfigurasi provider nyata.`;
    if (production && !isCiOrBuildDummy()) errors.push(message);
    else warnings.push(message);
  }
}
for (const key of ["PHI3_BASE_URL", "OPENAI_BASE_URL"]) {
  const input = value(key);
  if (!input || isPlaceholder(input)) continue;
  try {
    const parsed = new URL(input);
    if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("unsupported protocol");
  } catch {
    errors.push(`${key} harus berupa URL HTTP(S) absolut yang valid.`);
  }
}
if (value("PHI3_API_KEY") && value("OPENAI_API_KEY")) {
  warnings.push("PHI3_API_KEY dan OPENAI_API_KEY sama-sama terisi; runtime akan memprioritaskan konfigurasi PHI3_*.");
}

const storageUrl = value("SUPABASE_URL");
const storageServiceKey = value("SUPABASE_SERVICE_ROLE_KEY");
const storageBucket = value("SUPABASE_STORAGE_BUCKET") || "lms-private";
if (objectStorageEnabled) {
  if (!storageUrl || isPlaceholder(storageUrl)) {
    errors.push("SUPABASE_URL wajib diisi saat Supabase Storage aktif.");
  } else {
    try {
      const parsed = new URL(storageUrl);
      const localEndpoint = ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname);
      if (parsed.protocol !== "https:" && !localEndpoint) {
        errors.push("SUPABASE_URL wajib menggunakan HTTPS kecuali untuk endpoint local.");
      }
    } catch {
      errors.push("SUPABASE_URL harus berupa URL absolut yang valid.");
    }
  }
  if (!storageServiceKey || isPlaceholder(storageServiceKey)) {
    errors.push("SUPABASE_SERVICE_ROLE_KEY wajib diisi saat Supabase Storage aktif.");
  }
  if (!/^[a-zA-Z0-9._-]{1,100}$/.test(storageBucket)) {
    errors.push("SUPABASE_STORAGE_BUCKET hanya boleh berisi huruf, angka, titik, garis bawah, atau tanda hubung (maksimal 100 karakter).");
  }
} else if (storageUrl || storageServiceKey) {
  warnings.push("Kredensial Supabase Storage terisi tetapi tidak aktif pada non-Vercel; set SUPABASE_STORAGE_ENABLED=true jika memang ingin menggunakannya.");
}
if (objectStorageEnabled && uploadDir) {
  warnings.push("PRIVATE_UPLOAD_DIR diabaikan saat Supabase Storage aktif.");
}

for (const [key, input] of Object.entries(process.env)) {
  if (key.startsWith("NEXT_PUBLIC_") && input) {
    if (/(?:SECRET|TOKEN|PASSWORD|PRIVATE_KEY|API_KEY|AUTH)/i.test(key)) {
      errors.push(`${key} berpotensi mengekspos secret melalui nama variable di bundle browser.`);
    }
    if (/^ey[A-Za-z0-9_-]{20,}\.ey[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/.test(input) || /BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY/.test(input)) {
      errors.push(`${key} berisiko membocorkan token JWT atau Private Key rahasia ke publik.`);
    }
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
