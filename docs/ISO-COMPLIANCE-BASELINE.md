# ISO-aligned quality, security, privacy, and LMS baseline

Tanggal baseline: 13 Juli 2026

Ruang lingkup: aplikasi web PROFAS Leadership LMS, API Next.js, autentikasi, data PostgreSQL/Prisma, upload materi, dan antarmuka landing page/dashboard.

## Batasan penting

Dokumen ini adalah **baseline teknis dan evidence awal**, bukan pernyataan bahwa organisasi telah tersertifikasi atau sepenuhnya conform terhadap ISO. ISO/IEC 27001, ISO/IEC 27701, ISO 21001, dan standar tata kelola lain memerlukan bukti proses organisasi, keputusan risiko, pengelolaan personel, serta audit yang tidak dapat dibuktikan oleh source code saja.

Beberapa edisi pada permintaan awal sudah berstatus withdrawn: ISO/IEC 25010:2011 digantikan model 2023, ISO 21001:2018 digantikan edisi 2025, dan ISO/IEC 19788-1:2011 digantikan edisi 2024. Edisi yang diminta tetap dicatat sebagai baseline kompatibilitas, tetapi evaluasi formal sebaiknya menggunakan edisi yang berlaku.

## Kontrol dan evidence yang sudah diterapkan

| Area | Kontrol di repository | Evidence/verifikasi | Status |
| --- | --- | --- | --- |
| ISO/IEC 25010 | TypeScript strict check, ESLint, production build, smoke flow, dan perbaikan animasi/reveal agar konten tidak tersembunyi saat observer gagal | `npm run typecheck`, `npm run lint`, `npm run build`, `npm run smoke` | Baseline teknis |
| ISO/IEC 25051 | Alur validasi pre-release dipusatkan pada typecheck, lint, build, smoke test, dependency audit, dan axe audit | Perintah pada bagian Evidence | Sebagian diterapkan; acceptance record/CI artifact masih perlu dibuat |
| ISO/IEC 27001 | JWT production fail-closed dan minimal 32 karakter; bcrypt; role/ownership authorization di API; OAuth state anti-CSRF; cookie HttpOnly/SameSite/Secure; upload private; security headers; error response generik | Review `lib/auth.ts`, middleware, route auth, route upload, route admin/mentor | Kontrol aplikasi diterapkan; ISMS belum dibuktikan |
| ISO/IEC 27701 | Data response badges dibatasi; akses berkas dan nilai berbasis ownership; tidak ada self-healing user dari klaim JWT; upload tidak lagi public-cache; export tidak menambahkan demo rows kosong | Review route badges, auth, uploads, export | Privacy-by-design baseline; ROPA/retensi/DSAR belum lengkap |
| ISO/IEC 40500 / WCAG | Semantic heading order, labelled navigation/progress/dialog, keyboard notification control, form autocomplete/status, dan live axe check pada landing/login/dashboard | `axe-core` audit pada route utama | Baseline route utama; audit manual seluruh route masih perlu |
| ISO 9241-151 | Struktur navigasi semantic, heading hierarchy, focus state, responsive CSS, dan reusable UI components | Review komponen layout + manual usability test | Sebagian diterapkan |
| ISO 21001 | Role learner/mentor/admin, course enrollment entitlement, assessment, feedback, progress, dan certificate flow | Smoke test + review API authorization | Fitur LMS ada; EOMS, KPI layanan, feedback formal, dan governance belum terdokumentasi |
| ISO/IEC 19788 | Struktur course/module/node/assessment sudah terpisah di Prisma dan label UI konsisten | Review `prisma/schema.prisma` dan course builder | Model teknis ada; metadata LOM/METADATA formal belum lengkap |
| ISO/IEC 2382-36 | Istilah role, course, module, assessment, enrollment, progress, dan certificate dipakai konsisten di API/UI | Review glossary dan route names | Baseline terminologi; controlled glossary multi-bahasa masih perlu |

## Perubahan keamanan utama

- Token JWT tidak lagi dapat menghidupkan kembali user yang sudah dihapus dari database. User harus tetap ada dan aktif di database.
- OAuth Google sekarang memakai secret server-only, state cookie yang diverifikasi secara constant-time, validasi token, dan pesan error generik.
- Endpoint pertanyaan assessment mentor, badges, broadcast, analytics, dan upload diberi validasi input serta pengecekan role/ownership yang eksplisit.
- File baru disimpan di `.data/uploads` atau `PRIVATE_UPLOAD_DIR`, bukan di `public/uploads`. Endpoint file memakai `private, no-store`, validasi path traversal, dan authorization sebelum membaca file.
- Header security diperketat: HSTS production, `X-Frame-Options`, `X-Content-Type-Options`, Referrer-Policy, Permissions-Policy, COOP/CORP, dan X-Permitted-Cross-Domain-Policies.
- Library `xlsx` yang memiliki advisory high severity dihapus dan diganti dengan `exceljs`. Audit terakhir harus tetap dijalankan karena dependency transitive dapat berubah.

## Evidence release gate

Jalankan pada environment CI/release dengan database test yang terisolasi:

```bash
npm ci
npm run typecheck
npm run lint
npm audit --omit=dev
npm run build
npm run smoke
```

Untuk accessibility route utama, jalankan audit axe live setelah server development aktif. Acceptance minimum: tidak ada violation `serious` atau `critical`, keyboard focus tidak terperangkap, dan konten tetap tampil ketika `prefers-reduced-motion` aktif atau `IntersectionObserver` tidak tersedia.

## Risiko dan pekerjaan lanjutan

1. `npm audit --omit=dev` masih dapat melaporkan vulnerability moderate pada dependency transitive Next/PostCSS/ExcelJS. Tidak boleh menganggap audit bersih sebelum hasil audit release terbaru direview.
2. File lama di `public/uploads` masih dibaca sebagai compatibility fallback. Migrasikan file lama ke storage private, verifikasi URL, lalu hapus fallback tersebut.
3. Tambahkan magic-byte/content sniffing untuk file PDF, gambar, dan dokumen; validasi MIME saja belum cukup untuk semua threat model.
4. Tambahkan rate limiting terdistribusi pada login, register, OAuth initiation/callback, upload, analytics, dan broadcast menggunakan edge/WAF atau store bersama.
5. Lengkapi risk register ISO/IEC 27001, asset inventory, access review, key rotation, backup/restore test, incident response, vulnerability SLA, dan bukti CI release.
6. Lengkapi privacy inventory/ROPA, legal basis/consent, retention and deletion workflow, DSAR, processor/subprocessor register, dan konfigurasi encryption-at-rest database/object storage.
7. Bentuk data dictionary pembelajaran yang memuat minimal language, keywords, learning objectives, audience, duration, version, license, accessibility, dan resource type sesuai kebutuhan LMS.
8. Lakukan usability test dengan learner/mentor nyata, screen reader test, keyboard-only test, mobile test, load test, serta performance budget berbasis Core Web Vitals.

## Referensi resmi

- [ISO/IEC 25010:2011](https://www.iso.org/standard/35733.html) dan [ISO/IEC 25010:2023](https://www.iso.org/standard/78176.html)
- [ISO/IEC 25051:2014](https://www.iso.org/standard/61579.html)
- [ISO/IEC 27001:2022](https://www.iso.org/standard/27001)
- [ISO/IEC 27701:2019](https://www.iso.org/standard/71670.html?browse=ics)
- [ISO/IEC 40500:2012](https://www.iso.org/standard/58625.html)
- [ISO 9241-151:2008](https://www.iso.org/standard/37031.html)
- [ISO 21001:2018](https://www.iso.org/standard/66266.html) dan [ISO 21001:2025](https://www.iso.org/standard/21001)
- [ISO/IEC 19788-1:2011](https://www.iso.org/standard/50772.html) dan [ISO/IEC 19788-1:2024](https://www.iso.org/standard/81950.html?browse=tc)
- [ISO/IEC 2382-36:2019](https://www.iso.org/fr/standard/66692.html)
