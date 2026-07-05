# PROFAS Leadership LMS

Platform LMS full-stack untuk pelatihan kepemimpinan berbasis cohort, asesmen terukur, gamifikasi, dan sertifikasi. Implementasi ini mengikuti blueprint, sitemap, arsitektur, dan ERD PROFAS Learning.

## Menjalankan aplikasi

```bash
npm install
npm run setup
npm run dev
```

Buka `http://localhost:3000`.

## Akun demo

Semua akun memakai kata sandi `profas123`.

| Peran | Email |
|---|---|
| Peserta | `peserta@profas.id` |
| Mentor | `mentor@profas.id` |
| Admin institusi | `institusi@profas.id` |
| Super admin | `admin@profas.id` |

## Fitur yang tersedia

- Landing page dan katalog/detail program responsif.
- Registrasi berdasarkan persona dan login aman dengan password hash + JWT cookie.
- Dashboard berbeda untuk peserta, mentor, institusi, dan super admin.
- Metrik dashboard dihitung dari database; tidak memakai angka operasional hardcoded.
- Course player video/teks, penyimpanan progres, dan XP otomatis.
- Diskusi per materi dan jurnal refleksi yang dapat diunduh.
- Pretest/evaluasi dengan timer, penilaian otomatis, hasil, dan percobaan ulang.
- Leaderboard lengkap serta riwayat XP.
- Sertifikat otomatis setelah materi dan evaluasi wajib selesai, dengan halaman publik, cetak PDF, berbagi, dan endpoint verifikasi.
- API untuk auth, program, progress, assessment, leaderboard, dan certificate.
- Data demo lengkap untuk program, modul, lesson, asesmen, enrollment, dan pengguna.

## Arsitektur

Implementasi lokal memakai Next.js App Router sebagai modular monolith (UI dan Route Handlers) dengan Prisma. SQLite dipakai agar demo dapat berjalan tanpa layanan eksternal; `prisma/schema.prisma` tetap menjadi sumber skema dan dapat diadaptasi ke PostgreSQL untuk deployment produksi. Modul eksternal pada blueprint—payment gateway, object storage, email OTP, Redis/BullMQ, video transcoding, dan live meeting—disiapkan sebagai batas integrasi fase produksi, bukan kredensial palsu di demo.

## Perintah penting

```bash
npm run typecheck
npm run build
npm start
```

`npm run setup` menginisialisasi ulang database lokal dan mengisi seed demo.

## Autopilot pemeliharaan

Watchdog lokal dapat berjalan sebagai user service selama 24 jam. Secara default ia memeriksa typecheck dan lint setiap 15 menit, menjalankan production build dan smoke test runtime setiap jam, mencoba perbaikan mekanis aman saat gagal, serta menjalankan audit AI terbatas setiap dua jam bila Codex CLI sudah login.

```bash
npm run autopilot:start
npm run autopilot:status
npm run autopilot:stop
```

Gunakan `npm run autopilot:once` untuk menguji satu siklus. Log, status JSON, lock, dan snapshot tersimpan di `.autopilot/` dan diabaikan oleh Git. Autopilot tidak melakukan deployment atau integrasi eksternal. Agar audit/perbaikan AI aktif, jalankan `codex login`; health-check mekanis tetap berjalan tanpa login.

Prinsip produk dan batas implementasi dirangkum dalam [`soul.md`](./soul.md).
