---
name: lms-product-architect
description: Digunakan untuk mengembangkan website menjadi LMS sungguhan dengan role admin, mentor, peserta, materi, progress, sertifikat, dashboard, dan alur pembelajaran lengkap.
---

## Tujuan

Membantu AI membangun LMS yang siap pakai, bukan sekadar website statis.

## Fitur Inti LMS

AI harus memastikan LMS memiliki minimal:

1. Role pengguna

   * Admin
   * Mentor
   * Peserta

2. Auth

   * Login
   * Register
   * Logout
   * OAuth Google jika tersedia
   * Proteksi route berdasarkan role

3. Dashboard

   * Dashboard admin
   * Dashboard mentor
   * Dashboard peserta

4. Manajemen materi

   * Mentor bisa upload materi
   * Materi bisa berupa teks, PDF, video link, file, atau modul
   * Materi terhubung ke course/program
   * Peserta bisa mengakses materi sesuai enrollment

5. Progress belajar

   * Peserta bisa menandai materi selesai
   * Sistem menyimpan progress
   * Progress tampil di dashboard
   * Jika semua materi selesai, peserta diarahkan ke sertifikat

6. Sertifikat

   * Sertifikat otomatis muncul setelah semua materi selesai
   * Ada nama peserta
   * Ada nama program
   * Ada tanggal selesai
   * Ada nomor sertifikat jika memungkinkan

7. UI LMS

   * Sidebar dashboard
   * Card course
   * Halaman detail course
   * Halaman materi
   * Progress bar
   * Empty state
   * Loading state
   * Error state

## Alur Peserta

Alur peserta wajib:

1. Login.
2. Masuk homepage atau dashboard.
3. Pilih course/program.
4. Buka materi.
5. Selesaikan materi.
6. Tampilkan animasi penyelesaian.
7. Arahkan kembali ke homepage/dashboard.
8. Jika semua materi selesai, arahkan ke halaman sertifikat.

## Alur Mentor

Alur mentor wajib:

1. Login sebagai mentor.
2. Masuk dashboard mentor.
3. Upload materi.
4. Pilih course/program tujuan.
5. Tambahkan judul, deskripsi, urutan materi, tipe materi, dan file/link.
6. Materi otomatis tersedia untuk peserta yang terdaftar.

## Alur Admin

Alur admin wajib:

1. Mengelola user.
2. Mengelola role.
3. Mengelola course/program.
4. Melihat statistik peserta.
5. Melihat materi dan sertifikat.

## Standar Implementasi

* Jangan membuat fitur dummy jika bisa dihubungkan ke database.
* Jangan hardcode data penting kecuali untuk seed/demo.
* Pastikan semua role memiliki akses yang sesuai.
* Pastikan peserta tidak bisa membuka halaman mentor/admin.
* Pastikan mentor tidak bisa mengakses fitur admin kecuali diberi izin.
* Gunakan validasi form.
* Gunakan toast atau notifikasi untuk feedback.
