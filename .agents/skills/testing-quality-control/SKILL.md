---
name: testing-quality-control
description: Digunakan untuk mengecek kualitas project setelah perubahan kode, termasuk lint, typecheck, build, test manual, dan edge case.
---

## Tujuan

AI tidak boleh berhenti setelah menulis kode. AI harus memastikan perubahan aman.

## Checklist Setelah Coding

1. Jalankan lint jika tersedia.
2. Jalankan typecheck jika tersedia.
3. Jalankan test jika tersedia.
4. Jalankan build jika tersedia.
5. Jika command tidak tersedia, lakukan review manual.
6. Cek file import/export.
7. Cek route.
8. Cek env variable.
9. Cek role access.
10. Cek responsive UI.

## Manual Test LMS

Test minimal:

1. User login sebagai peserta.
2. Peserta membuka course.
3. Peserta membuka materi.
4. Peserta menyelesaikan materi.
5. Animasi muncul.
6. Peserta diarahkan ke homepage/dashboard.
7. Progress bertambah.
8. Jika semua materi selesai, sertifikat muncul.

Test mentor:

1. Mentor login.
2. Mentor buka dashboard.
3. Mentor upload materi.
4. Materi tersimpan.
5. Materi muncul ke peserta.

Test admin:

1. Admin login.
2. Admin melihat user.
3. Admin melihat course.
4. Admin melihat progress.

## Edge Case

* Belum login.
* Role salah.
* Course kosong.
* Materi kosong.
* File upload gagal.
* Database error.
* Internet lambat.
* Session expired.
* Sertifikat sudah pernah dibuat.
