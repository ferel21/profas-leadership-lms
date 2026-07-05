---
name: documentation-handover
description: Digunakan untuk membuat dokumentasi perubahan, instruksi setup, env variable, cara menjalankan project, dan ringkasan fitur.
---

## Tujuan

AI harus meninggalkan project dalam keadaan mudah dipahami.

## Dokumentasi Minimal

Setelah perubahan besar, buat atau update:

1. README.md
2. .env.example
3. CHANGELOG atau catatan perubahan jika ada
4. Dokumentasi fitur
5. Instruksi deploy
6. Instruksi testing

## Format Ringkasan Perubahan

Gunakan format:

* Fitur yang ditambahkan
* Bug yang diperbaiki
* File penting yang diubah
* Env variable yang dibutuhkan
* Cara menjalankan
* Cara testing
* Catatan deployment

## README Minimal

README harus menjelaskan:

* Nama project
* Deskripsi project
* Tech stack
* Cara install
* Cara setup env
* Cara menjalankan development
* Cara build
* Role user
* Fitur LMS
* Cara deploy ke Vercel

## Larangan

* Jangan membuat dokumentasi palsu.
* Jangan menulis command yang tidak ada di package.json.
* Jangan mengklaim fitur selesai jika belum benar-benar dibuat.
* Jika ada keterbatasan, tulis dengan jelas.
