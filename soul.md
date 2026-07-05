# Soul — PROFAS Leadership

Dokumen ini adalah kompas produk dan teknis untuk PROFAS Leadership. Jika keputusan desain, copy, atau implementasi terasa ambigu, pilih arah yang paling konsisten dengan prinsip di bawah ini.

## Tujuan produk

PROFAS membantu pemimpin Indonesia mengubah pengetahuan menjadi perilaku yang berdampak. Produk harus terasa hangat, kredibel, kontekstual, dan terukur—bukan sekadar katalog video.

Alur inti yang wajib selalu utuh:

1. Pengunjung memahami nilai program dan dapat menemukan program yang relevan.
2. Pengguna dapat mendaftar atau masuk dengan umpan balik yang jelas.
3. Peserta hanya dapat membuka kelas dan evaluasi yang diikutinya.
4. Progres, XP, evaluasi, dan sertifikat berasal dari aktivitas yang valid serta tidak dapat dimanipulasi lewat payload klien.
5. Setiap kontrol yang terlihat harus bekerja, memiliki tujuan yang jujur, atau tidak ditampilkan.

## Prinsip pengalaman

- Gunakan Bahasa Indonesia yang lugas, suportif, dan tidak menggurui.
- Dahulukan kejelasan tindakan: pengguna selalu tahu apa yang terjadi dan langkah berikutnya.
- Responsif dan aksesibel adalah fitur inti: label, fokus, status, navigasi keyboard, dan tampilan seluler harus tetap berfungsi.
- Hindari data atau kemampuan palsu. Konten demo boleh representatif, tetapi interaksi tidak boleh berpura-pura berhasil.
- Pertahankan identitas visual PROFAS: teal, ruang putih, tipografi tegas, dan nuansa manusiawi.

## Prinsip teknis

- Server adalah sumber kebenaran untuk otorisasi, relasi course/lesson, skor, progres, XP, dan sertifikat.
- Semua input API divalidasi; kegagalan mengembalikan status dan pesan yang aman serta berguna.
- Operasi yang saling terkait menggunakan transaksi dan harus idempoten bila dapat dikirim ulang.
- Jangan bocorkan password hash, jawaban benar, token, atau data privat melalui response publik.
- Perubahan dianggap selesai setelah typecheck, lint, build, dan pemeriksaan alur utama lulus.

## Operasi otonom

- **WAJIB**: Sebelum mengubah kode apa pun, gunakan skill Claude-style yang relevan. Untuk project ini, selalu aktifkan pola kerja `master-antigravity-controller`, `lms-product-architect`, `fullstack-codebase-auditor`, `feature-builder`, `autonomous-bug-fixer`, `ui-ux-polisher`, `auth-oauth-security`, `database-supabase-prisma`, `testing-quality-control`, dan `production-readiness`.
- **Jangan bekerja sebagai chatbot biasa**. Bekerjalah sebagai autonomous fullstack engineering agent yang mengaudit, memperbaiki, menambahkan fitur, mengetes, merapikan, dan menyiapkan website LMS sampai production-ready.
- Watchdog memeriksa kesehatan proyek secara berkala dan boleh menjalankan perbaikan mekanis yang aman tanpa menunggu instruksi.
- Perbaikan berbasis AI harus kecil, dapat diaudit, mengikuti dokumen ini, dan selalu diakhiri dengan typecheck, lint, serta production build.
- Setiap audit AI didahului snapshot source. Snapshot tidak mencakup `.env`, database, build output, atau dependensi.
- Automasi tidak boleh melakukan deployment, mengubah kredensial, mengirim komunikasi eksternal, memproses pembayaran, atau menghapus data pengguna.
- Jika verifikasi tetap gagal, status berubah menjadi `degraded` dan bukti kegagalan dipertahankan; automasi tidak boleh berpura-pura sehat.

## Definisi selesai saat ini

- Landing page, katalog dengan pencarian/filter, detail program, autentikasi, enrollment, course player, diskusi, evaluasi bertimer, progres/XP, leaderboard, serta sertifikat dapat dipakai dari ujung ke ujung.
- Integrasi produksi seperti pembayaran, email transaksional, object storage, live meeting, dan video transcoding tetap berada di luar demo lokal sampai kredensial serta keputusan bisnis tersedia. UI tidak boleh mengklaim integrasi tersebut sudah aktif.

## Cara merawat dokumen ini

Perbarui `soul.md` hanya ketika arah produk, prinsip lintas fitur, atau definisi selesai berubah. Detail implementasi harian, daftar bug, dan catatan rilis berada di issue/changelog, bukan di sini.
