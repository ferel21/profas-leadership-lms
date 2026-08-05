# Implementasi Desain Baru Dashboard Peserta

Saya akan memperbarui desain dashboard peserta agar sesuai dengan mockup yang Anda berikan, serta memperbaiki logika kemunculan program.

## Proposed Changes

### 1. Memperbarui Tampilan Sidebar (Dashboard Chrome)
#### [MODIFY] `components/ui/DashboardChromeClient.tsx`
- Mengubah daftar menu navigasi untuk peserta (`STUDENT`) agar sesuai dengan mockup: `Ringkasan`, `Program saya`, `Kalender`, `Komunitas`.
- Menyesuaikan desain visual item menu (ikon kotak, state aktif dengan warna latar biru muda dan teks biru).

### 2. Memperbarui Tampilan Kartu "Lanjutkan Belajar"
#### [MODIFY] `app/dashboard/page.tsx`
- Mengubah struktur HTML/CSS pada bagian "Lanjutkan Belajar" untuk peserta.
- Menyesuaikan tata letak (layout) menjadi horizontal: teks di sebelah kiri (Kicker, Judul, Subjudul, Progress Bar) dan kotak biru besar dengan ikon Play di sebelah kanan.
- Menghapus elemen yang tidak ada di mockup (seperti teks durasi jam belajar jika tidak diperlukan, atau menyesuaikannya).

### 3. Menampilkan Program di "Ruang Belajar" (Program Lainnya)
#### [MODIFY] `app/dashboard/page.tsx`
- Saat ini, jika hanya ada 1 program, program tersebut dipindah ke "Lanjutkan Belajar" dan bagian "Program lainnya" menjadi kosong.
- Saya akan mengubah logikanya agar **seluruh program** (termasuk program utama) tetap dirender di bagian "Ruang Belajar -> Program lainnya", sehingga meskipun baru 1 program, program tersebut tetap muncul di daftar bawah.

### 4. Penyesuaian CSS
#### [MODIFY] `styles/lms-fresh.css` (atau file CSS terkait)
- Menambahkan gaya (styling) baru untuk sidebar minimalis dan kartu course horizontal agar persis seperti mockup desain terbaru Anda.

## User Review Required
> [!IMPORTANT]
> Apakah struktur menu di sidebar untuk Peserta hanya 4 menu itu saja (`Ringkasan`, `Program saya`, `Kalender`, `Komunitas`) dan menu lainnya dihapus? Atau mockup tersebut hanya contoh sebagian menu saja? Silakan konfirmasi jika Anda setuju dengan rencana ini!
