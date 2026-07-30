# Performance & Quality Gates

Dokumen ini mencatat quality gate prioritas 1 untuk landing page, dashboard LMS, dan Course Player.

## Yang sudah diterapkan

- Gambar hero dan logo dikonversi ke WebP untuk mengurangi payload gambar awal.
- Komponen dashboard khusus role dimuat secara lazy sehingga jalur peserta tidak membawa seluruh fitur admin/mentor.
- Animasi scroll reveal memakai Web Animations API bawaan browser; tidak lagi membutuhkan runtime motion tambahan.
- Tersedia budget aset build melalui `npm run perf:budget`.
- Tersedia regression test Playwright dengan audit axe-core untuk landing page, katalog, dashboard, Course Player, dan kontrol keyboard mobile.
- Tombol ikon, status progres, metadata materi, dan input Asisten AI diberi label/kontras yang dapat dibaca screen reader.

## Perintah verifikasi

```bash
npm run typecheck
npm run lint
npm run dup:check
npm run build
npm run perf:budget
npm run test:e2e
npm run smoke
```

## Auto-fix & duplicate-code gate (CI)

- `npm run lint:fix` menjalankan ESLint dengan `--fix` untuk memperbaiki isu mekanis (formatting, unused import, dll) tanpa mengubah logika.
- `npm run dup:check` menjalankan [jscpd](https://github.com/kucherenko/jscpd) (konfigurasi di `.jscpd.json`) terhadap `app/`, `components/`, `services/`, `utils/`, `hooks/`, `context/`, `types/`, dan `constants/`, dengan ambang batas duplikasi 3%.
- Workflow canonical [`.github/workflows/quality.yml`](../.github/workflows/quality.yml) menjalankan typecheck → autofix (di-commit balik ke branch PR) → lint → duplicate-code check pada setiap PR ke `main`. Error nyata (type error, lint error, duplikasi di atas ambang batas) tetap memblokir merge — pipeline ini tidak pernah mengubah logika program secara otomatis. Deployment VPS terpisah dan hanya dapat dijalankan manual melalui `workflow_dispatch`.

Budget saat baseline ini dibuat:

| Rute build | Budget aset rute | Hasil |
| --- | ---: | ---: |
| Landing page | 1.200 KB | 761 KB |
| Course Player | 1.300 KB | 786 KB |
| Dashboard | 1.800 KB | 1.757 KB |

Budget memakai ukuran aset JavaScript/CSS build yang belum dikompresi untuk route terkait. Jika budget terlampaui, `perf:budget` gagal agar perubahan dapat ditinjau sebelum rilis.

## E2E dan aksesibilitas

Test memakai akun peserta seed default `peserta@profas.id` / `profas123`. Untuk environment lain, gunakan:

```bash
E2E_TEST_EMAIL="..." E2E_TEST_PASSWORD="..." npm run test:e2e
```

Konfigurasi Playwright menggunakan Chromium yang tersedia di host atau path dari `PLAYWRIGHT_EXECUTABLE_PATH`. Di CI yang belum memiliki browser, instal dengan `npx playwright install --with-deps chromium`.

Audit axe-core bersifat otomatis dan mencakup pelanggaran WCAG yang dapat dideteksi pada DOM. Audit manual keyboard lintas halaman, screen reader, zoom 200%, dan perangkat nyata tetap diperlukan sebelum klaim kesesuaian aksesibilitas penuh.

## Catatan operasional

Dashboard menggunakan render dinamis karena data autentikasi dan progres harus selalu terbaru. Pengukuran Core Web Vitals produksi sebaiknya dilengkapi data pengguna nyata setelah deployment VPS/Vercel, bukan hanya hasil build lokal.
