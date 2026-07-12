# Project Rules & Customizations

## 1. Automatic Vercel Deployment Sync (`git push origin main`)
- **CRITICAL RULE**: Setiap kali agen selesai melakukan modifikasi, penambahan fitur, atau perbaikan bug yang telah diverifikasi dengan `npm run build` / `npm run typecheck`, agen **WAJIB langsung melakukan git add, commit, dan push ke remote repository GitHub (`git push origin main`)**.
- Langkah auto-push:
  1. Verifikasi build/typecheck jika relevan.
  2. Jalankan `git add .` dan commit dengan pesan deskriptif: `git commit -m "feat/fix: deskripsi perubahan"`.
  3. Jalankan `git push origin main` agar sistem Vercel langsung memulai proses *auto-deploy* secara real-time.
- **Tujuan**: Memastikan semua pekerjaan dan penyempurnaan di local workspace langsung ter-publish dan dapat diakses oleh user di Vercel secara seketika (*sekarang dan nanti*).
