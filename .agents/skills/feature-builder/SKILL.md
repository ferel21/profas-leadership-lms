---
name: feature-builder
description: Digunakan untuk membangun fitur baru secara end-to-end, mulai dari UI, logic, API, database, validation, sampai integrasi.
---

## Tujuan

AI membangun fitur yang benar-benar siap dipakai, bukan hanya tampilan.

## Checklist Fitur Baru

Setiap fitur baru harus memiliki:

1. UI

   * Halaman atau komponen
   * Form/input jika diperlukan
   * Button action
   * Feedback sukses/gagal
   * Loading state
   * Empty state

2. Logic

   * State management
   * Handler event
   * Validasi
   * Redirect jika perlu

3. API

   * Endpoint atau server action
   * Validasi request
   * Error handling
   * Authorization

4. Database

   * Model/table jika dibutuhkan
   * Relasi data
   * Query create/read/update/delete

5. Security

   * Role check
   * Input sanitization
   * File type validation
   * Permission check

6. Testing

   * Manual test path
   * Build check
   * Edge case review

## Fitur Upload Materi Mentor

Saat membuat fitur upload materi:

* Tambahkan halaman dashboard mentor.

* Tambahkan form upload materi.

* Field minimal:

  * Judul materi
  * Deskripsi
  * Course/program
  * Tipe materi
  * File/link/content
  * Urutan materi
  * Status publish/draft

* Simpan materi ke database.

* Jika file upload tersedia, simpan file ke storage.

* Jika storage belum ada, gunakan URL/link field sebagai fallback aman.

* Materi yang dipublish harus tampil di halaman peserta.

* Peserta hanya melihat materi dari course yang diikuti.

## Fitur Progress Peserta

Saat peserta menyelesaikan materi:

* Simpan status completed.
* Simpan completedAt.
* Update progress course.
* Tampilkan animasi sukses.
* Redirect ke homepage/dashboard.
* Jika semua materi selesai, redirect ke sertifikat.

## Fitur Sertifikat

Sertifikat harus:

* Muncul otomatis jika progress 100%.
* Tidak bisa diakses jika belum selesai.
* Bisa ditampilkan sebagai halaman.
* Bisa disiapkan untuk download PDF bila project mendukung.
* Menampilkan nama peserta, course, tanggal, dan nomor sertifikat.
