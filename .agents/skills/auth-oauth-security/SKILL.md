---
name: auth-oauth-security
description: Digunakan untuk memperbaiki dan mengembangkan sistem login, register, Google OAuth, role access, session, dan keamanan route.
---

## Tujuan

AI memastikan auth aman dan benar.

## Checklist Auth

1. Login berjalan.
2. Register berjalan.
3. Logout berjalan.
4. Session terbaca.
5. Role tersimpan.
6. Protected route aktif.
7. Redirect sesuai role.
8. OAuth callback URL benar.
9. Env variable benar.
10. Error auth ditampilkan dengan jelas.

## Google OAuth

Saat menggunakan Google OAuth:

* Pastikan Client ID tersedia.
* Pastikan Client Secret tersedia.
* Pastikan redirect URI sesuai domain aktif.
* Untuk localhost gunakan callback localhost.
* Untuk production gunakan domain production.
* Jika domain berubah, callback OAuth harus diperbarui.
* Jangan commit secret ke repository.
* Gunakan .env.local untuk development.
* Gunakan environment variable Vercel untuk production.

## Role Guard

Aturan akses:

* Admin boleh akses semua dashboard admin.
* Mentor hanya boleh akses dashboard mentor dan materi miliknya.
* Peserta hanya boleh akses dashboard peserta, materi yang tersedia, progress, dan sertifikatnya.
* User yang belum login diarahkan ke login.
* User yang login tapi role salah diarahkan ke dashboard sesuai role atau halaman unauthorized.

## Keamanan

* Jangan expose token.
* Jangan expose client secret.
* Jangan simpan password plain text.
* Jangan percaya input dari client.
* Validasi role di server, bukan hanya UI.
* Cek ownership data sebelum update/delete.
* Gunakan middleware jika framework mendukung.
