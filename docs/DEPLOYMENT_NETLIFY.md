# 🌐 Panduan Deployment PROFAS Leadership LMS ke Netlify

Netlify adalah salah satu platform hosting modern terbaik yang mendukung penuh **Next.js 15 App Router** melalui **Netlify Next.js Runtime (`@netlify/plugin-nextjs`)**.

Saya telah membuatkan berkas konfigurasi resmi **`netlify.toml`** di direktori utama Anda, sehingga Netlify akan otomatis mengenali pengaturan build dan database Prisma Anda!

---

## 🚀 Langkah-Langkah Deploy ke Netlify (3 Menit Selesai!):

### 1️⃣ Buat Akun & Hubungkan Repositori GitHub
1. Buka browser dan masuk ke **[app.netlify.com](https://app.netlify.com)**.
2. Klik tombol **Add new site** -> **Import an existing project**.
3. Pilih **GitHub** dan pilih repositori Anda:
   ```text
   ferel21/profas-leadership-lms
   ```

### 2️⃣ Konfigurasi Build & Environment Variables
Netlify akan membaca berkas `netlify.toml` secara otomatis:
- **Build command**: `npx prisma generate && npm run build` (Otomatis terisi!)
- **Publish directory**: `.next` (Otomatis terisi!)

Sebelum mengklik tombol Deploy, klik **Add environment variables** *(atau masuk ke Site configuration -> Environment variables)* dan masukkan variabel berikut dari file `.env` Anda:

| Key | Value | Keterangan |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://postgres:[PASSWORD]@db.nvbtuncksyxguwsreeov.supabase.co:5432/postgres` | Koneksi utama Supabase (Transaction) |
| `DIRECT_URL` | `postgresql://postgres:[PASSWORD]@db.nvbtuncksyxguwsreeov.supabase.co:5432/postgres` | Koneksi langsung Prisma (Migration) |
| `NEXTAUTH_SECRET` | *(Ketik string acak rahasia Anda)* | Untuk keamanan sesi login |
| `NEXTAUTH_URL` | `https://nama-web-anda.netlify.app` | URL domain Netlify Anda |
| `GOOGLE_CLIENT_ID` | `...apps.googleusercontent.com` | ID Google OAuth (opsional/jika ada) |
| `GOOGLE_CLIENT_SECRET` | `...` | Secret Google OAuth (opsional/jika ada) |

### 3️⃣ Klik Deploy Site!
Klik tombol **Deploy profas-leadership-lms**! Dalam 2-3 menit, situs Anda akan online dengan domain SSL gratis dari Netlify (misal: `https://profas-leadership-lms.netlify.app`).

---

## ⚠️ Catatan Penting Mengenai Google OAuth di Netlify
Setelah situs Anda aktif di Netlify dan Anda mendapatkan URL domain resmi dari Netlify:
1. Buka **Google Cloud Console** (Google Auth Platform).
2. Tambahkan URL callback Netlify Anda ke dalam **Authorized redirect URIs**:
   ```text
   https://nama-web-anda.netlify.app/api/auth/callback/google
   ```
3. Simpan perubahan! Login Google OAuth kini siap digunakan di Netlify!

---

## 💡 Keunggulan Netlify vs Vercel untuk Proyek Ini
- **Netlify Next.js Runtime**: Mengoptimalkan pemuatan halaman secara lebih konsisten.
- **CDN Global**: Distribusi aset statis (gambar, CSS, JS) sangat cepat di seluruh dunia.
- **Rollback Mudah**: Anda bisa mengembalikan versi website ke commit sebelumnya cukup dengan 1 klik di dasbor Netlify.
