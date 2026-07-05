# Panduan Migrasi Database: SQLite ke Cloud PostgreSQL (Neon / Supabase)

Dokumen ini adalah panduan arsitektur dan langkah-langkah teknis untuk melakukan migrasi database PROFAS Leadership LMS dari **SQLite** (lokal/semantara) ke **Cloud PostgreSQL** (permanen di produksi Vercel).

---

## ❓ Mengapa Migrasi ke PostgreSQL?
Saat ini, PROFAS Leadership LMS berjalan di Vercel menggunakan **SQLite**. Karena Vercel adalah platform *Serverless* dengan sistem berkas *read-only*, aplikasi menggunakan mekanisme penyalinan otomatis database `dev.db` ke direktori sementara `/tmp` setiap kali serverless container aktif.

**Keterbatasan SQLite di Serverless:**
1. **Penyimpanan Sementara (Volatile)**: Data di `/tmp` akan hilang ketika serverless container mengalami *cold start* atau *redeploy*.
2. **Keterbatasan Konkurensi**: SQLite tidak dirancang untuk menangani banyak rute *write* simultan oleh ribuan peserta LMS.

**Keunggulan Cloud PostgreSQL (Neon / Supabase):**
1. **Permanen & Real-time**: Data pengguna, progres belajar, nilai kuis, dan sertifikat tersimpan aman secara permanen di cloud.
2. **Connection Pooling**: Neon dan Supabase menyediakan *connection pooling* (mis. PgBouncer/Neon Serverless Driver) yang sangat cocok dengan arsitektur Vercel Serverless.

---

## 🛠️ Langkah-Langkah Migrasi

### Langkah 1: Siapkan Cloud PostgreSQL
1. Daftar dan buat proyek baru di [Neon.tech](https://neon.tech) atau [Supabase.com](https://supabase.com).
2. Salin **Connection String** (PostgreSQL URL). Jika menggunakan Neon/Supabase, Anda biasanya akan mendapatkan dua URL:
   - `DATABASE_URL` (Pooled connection / Transaction mode untuk aplikasi)
   - `DIRECT_URL` (Direct connection / Session mode untuk migrasi Prisma)

---

### Langkah 2: Perbarui Konfigurasi Lingkungan (`.env` dan Vercel)
Di file `.env` lokal Anda dan di panel **Vercel Project Settings > Environment Variables**, tambahkan:

```env
DATABASE_URL="postgresql://user:password@ep-xxxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
# Jika menggunakan Supabase/Neon dengan Direct URL:
DIRECT_URL="postgresql://user:password@ep-xxxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&connect_timeout=10"
```

---

### Langkah 3: Perbarui `prisma/schema.prisma`
Buka berkas `prisma/schema.prisma`, lalu ubah blok `datasource` dari `sqlite` menjadi `postgresql`:

```diff
  datasource db {
-   provider = "sqlite"
+   provider = "postgresql"
    url      = env("DATABASE_URL")
+   directUrl = env("DIRECT_URL") // Opsional jika menggunakan Supabase/Neon pooled connection
  }
```

---

### Langkah 4: Sesuaikan `lib/prisma.ts` (Hapus Logika `/tmp`)
Setelah berpindah ke PostgreSQL, Anda **tidak lagi memerlukan** logika penyalinan berkas SQLite ke `/tmp`.
Buka `lib/prisma.ts`, dan sederhanakan menjadi:

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

---

### Langkah 5: Sinkronisasi Skema & Seeding Data
Jalankan perintah berikut di terminal Anda untuk menerapkan skema relasional ke database cloud PostgreSQL baru:

```bash
# 1. Hapus folder migrasi lama (jika ada migrasi sqlite)
rm -rf prisma/migrations

# 2. Push skema ke Cloud PostgreSQL
npx prisma db push

# 3. Generate Prisma Client baru
npx prisma generate

# 4. Isi data awal (Seeding: Admin, Mentor, Kursus, dan Kuis)
npm run db:seed
```

---

### Langkah 6: Verifikasi & Deploy ke Vercel
1. Uji secara lokal dengan `npm run dev` untuk memastikan aplikasi berhasil membaca dan menulis ke database PostgreSQL.
2. Lakukan *commit* dan *push* ke GitHub:
   ```bash
   git add .
   git commit -m "feat(db): prepare cloud postgresql migration"
   git push origin main
   ```
3. Vercel akan secara otomatis membangun ulang (*rebuild*) aplikasi dengan konfigurasi database cloud yang baru!
