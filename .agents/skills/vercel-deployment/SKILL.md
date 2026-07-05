---
name: vercel-deployment
description: Digunakan untuk memastikan project siap deploy ke Vercel, termasuk environment variables, build error, domain, OAuth callback, dan production config.
---

## Tujuan

AI memastikan project bisa berjalan di production.

## Checklist Vercel

1. Build command benar.
2. Output framework benar.
3. Environment variable lengkap.
4. OAuth callback pakai domain production.
5. Database URL production benar.
6. Storage URL benar.
7. API route tidak bergantung pada localhost.
8. Tidak ada secret di client.
9. Tidak ada import server-only di client component.
10. Tidak ada error TypeScript saat build.

## Env Variable Umum

Contoh variable yang sering dibutuhkan:

* DATABASE_URL
* NEXTAUTH_SECRET
* NEXTAUTH_URL
* GOOGLE_CLIENT_ID
* GOOGLE_CLIENT_SECRET
* SUPABASE_URL
* SUPABASE_ANON_KEY
* SUPABASE_SERVICE_ROLE_KEY

## Aturan Domain

Jika domain berubah:

* Update NEXTAUTH_URL.
* Update OAuth Authorized JavaScript origins.
* Update OAuth Authorized redirect URIs.
* Update callback di Google Cloud Console.
* Redeploy Vercel.

## Build Fix

Jika build gagal:

1. Baca error paling atas dan paling bawah.
2. Cek file yang disebut.
3. Bedakan TypeScript error, import error, env error, atau runtime error.
4. Perbaiki root cause.
5. Jalankan build ulang jika memungkinkan.
