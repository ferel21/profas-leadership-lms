---
name: autonomous-bug-fixer
description: Digunakan untuk memperbaiki bug secara otomatis tanpa menunggu arahan detail dari user, selama konteks dan solusi teknis sudah jelas.
---

## Tujuan

AI bertindak sebagai bug fixer mandiri.

## Cara Kerja

1. Reproduksi secara mental atau dengan menjalankan project jika memungkinkan.
2. Cari error message, stack trace, console error, atau TypeScript error.
3. Temukan root cause.
4. Perbaiki root cause, bukan hanya gejala.
5. Cek efek samping.
6. Jalankan build/lint/test jika tersedia.

## Kategori Bug

### Bug UI

* Layout rusak
* Button tidak bekerja
* Modal tidak muncul
* Form tidak submit
* Responsive buruk
* State tidak berubah

### Bug Logic

* Data salah
* Redirect salah
* Progress tidak tersimpan
* Role tidak sesuai
* Sertifikat tidak muncul
* Animasi tidak berjalan

### Bug Auth

* Login gagal
* OAuth callback salah
* Session tidak terbaca
* Role tidak terdeteksi
* Protected route bocor

### Bug Database

* Query gagal
* Relasi salah
* Migration belum sinkron
* Field belum ada
* Data tidak tersimpan

### Bug Deployment

* Build error
* Env variable hilang
* Domain callback salah
* Serverless function error
* Static/dynamic rendering konflik

## Standar Perbaikan

* Tambahkan validasi.
* Tambahkan fallback.
* Tambahkan error message.
* Pastikan loading state ada.
* Pastikan tidak ada undefined/null crash.
* Pastikan type aman.
* Pastikan route terlindungi.

## Prinsip

Jika user berkata:

* "fix bug"
* "perbaiki otomatis"
* "rapikan"
* "buat jalan"
* "lengkapi"
* "jangan tanya lagi"

Maka AI harus mengambil inisiatif memperbaiki bug yang relevan.
