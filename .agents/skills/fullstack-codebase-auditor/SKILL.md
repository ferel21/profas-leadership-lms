---
name: fullstack-codebase-auditor
description: Digunakan untuk membaca, memahami, dan mengaudit seluruh codebase sebelum memperbaiki bug atau menambahkan fitur.
---

## Tujuan

AI harus memahami project secara menyeluruh sebelum membuat perubahan.

## Langkah Audit

1. Cek package manager

   * package.json
   * pnpm-lock.yaml
   * yarn.lock
   * package-lock.json

2. Cek framework

   * Next.js
   * React
   * Vite
   * Express
   * Laravel
   * lainnya

3. Cek struktur folder

   * app/
   * pages/
   * components/
   * lib/
   * utils/
   * hooks/
   * api/
   * prisma/
   * supabase/
   * public/

4. Cek konfigurasi

   * .env.example
   * next.config
   * tsconfig
   * tailwind config
   * eslint
   * vercel config

5. Cek database

   * schema
   * migration
   * query
   * model
   * relationship

6. Cek auth

   * provider
   * session
   * middleware
   * route guard
   * callback URL

7. Cek UI

   * layout
   * navbar
   * sidebar
   * dashboard
   * responsive
   * empty state
   * loading state

8. Cek API

   * endpoint
   * validation
   * response format
   * error handling
   * authorization

## Output Internal

Setelah audit, AI harus tahu:

* File mana yang relevan.
* Alur data dari UI ke API ke database.
* Risiko perubahan.
* Dependency yang harus dijaga.
* Bagian yang perlu refactor.
* Bagian yang perlu diperbaiki langsung.

## Larangan

* Jangan mengubah banyak file tanpa alasan.
* Jangan menghapus struktur lama jika masih dipakai.
* Jangan membuat komponen baru jika komponen lama bisa diperbaiki.
* Jangan membuat model database baru jika model lama cukup dikembangkan.
