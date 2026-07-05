/**
 * Script Otomatisasi Koneksi dan Seeding Supabase PostgreSQL
 * PROFAS Leadership LMS
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("\n🚀 =====================================================");
console.log("💎 PROFAS LEADERSHIP LMS - SUPABASE AUTO-SETUP ENGINE");
console.log("=====================================================\n");

// 1. Cek file .env
const envPath = path.join(__dirname, "..", ".env");
if (!fs.existsSync(envPath)) {
  console.error("❌ File .env tidak ditemukan di root project!");
  console.log("💡 Tips: Salin .env.example menjadi .env dan isi DATABASE_URL Supabase Anda.");
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, "utf8");
if (envContent.includes("file:./dev.db") && !envContent.includes("postgresql://") && !envContent.includes("postgres://")) {
  console.error("⚠️ DATABASE_URL di file .env Anda masih menggunakan SQLite ('file:./dev.db')!");
  console.log("\n💡 CARA MENGHUBUNGKAN KE SUPABASE:");
  console.log("1. Buka dasbor Supabase Anda -> Project Settings -> Database -> Connection String.");
  console.log("2. Salin URL dengan mode 'Transaction pooler' (Port 6543) dan masukkan ke DATABASE_URL di file .env.");
  console.log("3. Salin URL dengan mode 'Session / Direct' (Port 5432) dan masukkan ke DIRECT_URL di file .env.");
  console.log("4. Jalankan kembali perintah ini: npm run db:supabase\n");
  process.exit(1);
}

console.log("✅ DATABASE_URL Supabase terdeteksi di .env!");
console.log("⏳ Mengsinkronisasikan skema database ke Supabase PostgreSQL (Prisma DB Push)...");

try {
  execSync("npx prisma db push --accept-data-loss", { stdio: "inherit" });
  console.log("✅ Skema database berhasil dibuat di Supabase!");

  console.log("\n⏳ Menghasilkan Prisma Client baru untuk PostgreSQL...");
  execSync("npx prisma generate", { stdio: "inherit" });
  console.log("✅ Prisma Client berhasil diperbarui!");

  console.log("\n⏳ Mengisi data awal (Mentor, Peserta, Kursus, dan Kuis) ke Supabase...");
  execSync("npm run db:seed", { stdio: "inherit" });
  console.log("\n🎉 BERHASIL 100%! Database PROFAS Leadership LMS sekarang resmi terhubung dan berjalan di Supabase PostgreSQL!");
} catch (error) {
  console.error("\n❌ Terjadi kesalahan saat menghubungkan ke Supabase:");
  console.error(error.message);
  process.exit(1);
}
