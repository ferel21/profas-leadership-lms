# PROFAS Leadership LMS — Production-Ready Online Learning System 🚀

Platform LMS (*Learning Management System*) full-stack berstandar produksi yang dirancang khusus untuk pelatihan kepemimpinan profesional **PROFAS Leadership / Institut**. Sistem ini mendukung ekosistem pembelajaran interaktif berdasar peran (*role-based*) untuk **Super Admin**, **Mentor**, dan **Peserta** dengan alur kerja end-to-end yang nyata, terukur, dan aman.

---

## 🌟 1. Penjelasan Fitur Utama LMS

### 🛡️ Super Admin & Analytics
- **Dashboard Statistik Real-time**: Memantau total pengguna terdaftar, peserta aktif, program terbit, dan sertifikat yang telah diterbitkan.
- **Manajemen Pengguna & Hak Akses (Role Access Control)**: Fitur pencarian instan dan pengubahan role langsung (*Student* ↔ *Mentor* ↔ *Super Admin*) tanpa reload halaman, dilengkapi proteksi diri agar Admin tidak menurunkan hak aksesnya sendiri secara tidak sengaja.
- **Manajemen Program & Kurikulum**: Kemampuan membuat, mempublikasikan, atau menonaktifkan program kepemimpinan dari dasbor pusat.
- **Tabel Laporan & Rekapitulasi**: Pantauan progres per peserta, status kelulusan, dan nilai rata-rata asesmen.

### 👨‍🏫 Mentor & Pengajaran
- **Pembuatan Program Baru**: Mentor dapat membuat kelas baru dengan menentukan judul, kategori, tingkat/level (*Basic, Intermediate, Advanced*), harga, durasi, dan deskripsi.
- **Course Builder Interaktif**: Penyusunan hierarki modul dan materi pelajaran dengan drag-and-drop atau reorder sequence.
- **⚡ Upload Materi Cepat (*Quick Material Upload*)**:
  - **Opsi Tautan / Video / Drive**: Sangat optimal untuk lingkungan serverless (Vercel) tanpa membebani penyimpanan sementara.
  - **Opsi Berkas (PDF/Doc/Image)**: Mendukung unggahan dokumen berkas hingga 50MB disertai notifikasi otomatis ke seluruh peserta yang aktif.
- **Evaluasi & Penilaian Tugas**: Memeriksa tugas esai atau unggahan peserta, memberikan umpan balik konstruktif, serta memberikan nilai kelulusan.

### 🎓 Peserta & Alur Belajar Wajib
- **Eksplorasi Katalog & Pendaftaran**: Memilih program kepemimpinan sesuai persona (*Entrepreneur, Academic, Organization, Cooperative*).
- **Course Player Interaktif**: Menonton video materi, membaca modul teks/PDF, serta mengunduh berkas lampiran.
- **Sistem Progres & XP Otomatis**: Progres dihitung akurat di sisi server (*server-authoritative*) setiap kali materi selesai.
- **Asisten AI Leadership**: Tutor kontekstual menggunakan Claude melalui SDK Anthropic resmi jika `ANTHROPIC_API_KEY` tersedia, dengan fallback lokal agar alur belajar tetap bisa dipakai.
- **🎉 Animasi Penyelesaian & Auto-Redirect**:
  - Setelah menyelesaikan materi, peserta menerima perayaan animasi (*confetti & badge scale-in*).
  - Sistem otomatis mengarahkan kembali ke dasbor atau materi berikutnya.
  - **Sertifikat Kelulusan Otomatis**: Jika seluruh materi dan evaluasi dalam program mencapai 100%, peserta langsung diarahkan ke halaman sertifikat kelulusan dengan nomor unik terverifikasi.

---

## 👥 2. Penjelasan Role Pengguna

| Role | Keterangan & Hak Akses | Email Demo | Password |
|---|---|---|---|
| **`STUDENT` (Peserta)** | Mengikuti kelas, menonton/membaca materi, mengerjakan evaluasi, mengumpulkan XP, dan mengunduh sertifikat kelulusan. | `peserta@profas.id` | `profas123` |
| **`MENTOR` (Mentor)** | Mengelola program yang diampu, menyusun modul, mengunggah materi pelajaran dengan cepat, dan menilai tugas peserta. | `mentor@profas.id` | `profas123` |
| **`SUPER_ADMIN` (Admin)** | Memiliki akses penuh ke seluruh analitik LMS, kelola role pengguna, moderasi program, dan konfigurasi sistem. | `admin@profas.id` | `profas123` |
| **`INSTITUSI` (Admin Institusi)** | Memantau perkembangan kohort atau kelompok belajar dari organisasi tertentu. | `institusi@profas.id` | `profas123` |

---

## 🛠️ 3. Cara Install (Instalasi Lokal)

Pastikan Anda memiliki **Node.js (v18 atau lebih baru)** dan **npm** terinstal di sistem Anda.

```bash
# 1. Kloning repositori proyek
git clone https://github.com/ferel21/profas-leadership-lms.git
cd "PROFAS LEADERSHIP LANDING PAGE"

# 2. Install seluruh dependensi proyek
npm install
```

---

## 💻 4. Cara Menjalankan Development

```bash
# 1. Salin konfigurasi environment
cp .env.example .env

# 2. Inisialisasi database SQLite lokal & isi data seed demo
npm run setup

# 3. Jalankan server pengembangan
npm run dev
```

Buka peramban web dan akses **`http://localhost:3000`**.

---

## 🏗️ 5. Cara Build & Validasi Produksi

Sebelum melakukan *push* atau *deploy*, pastikan seluruh kode memenuhi standar kualitas mutlak tanpa cacat tipe data atau linting:

```bash
# 1. Periksa pengetikan statis TypeScript (0 errors wajib)
npm run typecheck

# 2. Periksa standar penulisan kode (ESLint)
npm run lint

# 3. Kompilasi build produksi Next.js & sinkronisasi Prisma
npm run build

# 4. Jalankan mode produksi lokal untuk pengetesan akhir
npm start
```

---

## ☁️ 6. Cara Deploy ke Vercel (Production Deployment)

Proyek ini telah dikonfigurasi 100% kompatibel dengan arsitektur serverless **Vercel**.

### Langkah-langkah Deployment:
1. Hubungkan repositori GitHub ini ke dasbor Vercel Anda (**New Project -> Import Git Repository**).
2. Pada bagian **Environment Variables** di Vercel, tambahkan seluruh variabel sesuai `.env.example`:
   - `DATABASE_URL`: Gunakan koneksi database PostgreSQL / Supabase produksi (contoh: `postgresql://...`). *Catatan: Jangan gunakan SQLite lokal (`file:./dev.db`) di Vercel karena filesystem serverless bersifat ephemeral/sementara.*
   - `JWT_SECRET` & `NEXTAUTH_SECRET`: Isi dengan string rahasia acak minimal 32 karakter.
   - `NEXTAUTH_URL` & `NEXT_PUBLIC_APP_URL`: Isi dengan domain produksi Anda (contoh: `https://profas-leadership-lms.vercel.app`).
   - `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: Kredensial OAuth 2.0 dari Google Cloud Console.
   - `ANTHROPIC_API_KEY`: Opsional untuk mengaktifkan tutor Claude di course player. Key ini hanya dipakai di server dan tidak boleh diawali `NEXT_PUBLIC_`.
3. Klik **Deploy**.
4. **PENTING (Google OAuth Callback)**: Pastikan Anda telah menambahkan URL callback produksi di Google Cloud Console:
   - `https://profas-leadership-lms.vercel.app/api/auth/google/callback`

---

## 🧪 7. Cara Testing Manual (QA Checklist)

Untuk memastikan sistem berjalan sempurna di lingkungan baru, lakukan pengujian alur berikut:
1. **Test Login & Role Access**:
   - Masuk sebagai `peserta@profas.id` -> Pastikan tidak bisa mengakses URL `/mentor` atau dasbor Admin.
   - Masuk sebagai `mentor@profas.id` -> Pastikan bisa membuka Course Builder dan Upload Materi Cepat.
   - Masuk sebagai `admin@profas.id` -> Pastikan bisa membuka komponen Manajemen Pengguna dan mengubah role akun lain.
2. **Test Alur Mentor (Create Course & Upload Material)**:
   - Di dasbor Mentor, klik **"+ Buat Program Baru"** -> Isi judul dan simpan -> Verifikasi program muncul di daftar.
   - Klik **"⚡ Upload Materi Cepat"** -> Pilih program & modul -> Pilih tipe Tautan/Video URL -> Klik Upload -> Verifikasi materi berhasil ditambahkan.
3. **Test Alur Belajar Peserta (Progress & Certificate Auto-Redirect)**:
   - Masuk sebagai Peserta -> Buka program pembelajaran -> Klik materi pelajaran -> Klik **"Tandai Selesai"**.
   - Verifikasi animasi perayaan muncul dan progres bar bertambah.
   - Selesaikan seluruh materi hingga mencapai 100% -> Verifikasi sistem secara otomatis mengarahkan Anda ke halaman **Sertifikat Kelulusan** dengan nomor unik.

---

## 📝 8. Catatan Perubahan (Changelog)

- **`v2.0.0` (Production Readiness & Master Skills Overhaul)**:
  - ✨ *Feat*: Penambahan fitur pembuatan program baru oleh Mentor dan Admin secara langsung dari dasbor (`app/api/mentor/courses`).
  - ✨ *Feat*: Fitur Upload Materi Cepat (*Quick Material Upload*) mendukung tautan video/drive dan berkas PDF/Doc (`components/MentorCourseActions`).
  - ✨ *Feat*: Antarmuka Manajemen Pengguna & Role Access Control (*RAC*) di dasbor Super Admin (`app/api/admin/users` & `components/AdminUserManagement`).
  - 🛡️ *Security*: Penguncian mutlak callback Google OAuth ke domain resmi Vercel untuk mencegah *redirect_uri_mismatch*.
  - ⚡ *Perf*: Fallback sertifikat dinamis untuk isolasi multi-instance `/tmp` SQLite di lingkungan serverless Vercel.
  - 🎨 *UI/UX*: Perbaikan tipografi sistem (*Inter/Outfit*) dan pembersihan properti CSS shorthand yang kedaluwarsa.
  - 📜 *Docs*: Pembaruan kompas teknis (`soul.md`), `.env.example`, dan `README.md` berstandar 12 Master Skills Antigravity.

---

## 🤖 9. Autopilot & Engineering Agent Guidelines

Proyek ini dipelihara di bawah pengawasan sistem **Antigravity Autonomous Engineering Agent**.
Setiap kontribusi atau pengubahan kode wajib mematuhi pedoman di [`soul.md`](./soul.md) dan mengaktifkan pola kerja dari **12 Master Skills**:
`master-antigravity-controller`, `lms-product-architect`, `fullstack-codebase-auditor`, `feature-builder`, `autonomous-bug-fixer`, `ui-ux-polisher`, `auth-oauth-security`, `database-supabase-prisma`, `testing-quality-control`, `production-readiness`, `documentation-handover`, dan `vercel-deployment`.
