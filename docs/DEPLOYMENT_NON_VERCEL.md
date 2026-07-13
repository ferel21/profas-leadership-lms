# 🚀 Panduan Deployment PROFAS Leadership LMS Tanpa Vercel (100% Permanen & Stabil)

Memahami kekesalan Anda terhadap arsitektur **Serverless Vercel**! Arsitektur serverless memang memiliki kelemahan besar untuk aplikasi LMS yang intensif berkas seperti PROFAS Leadership LMS, antara lain:
1. **Sistem File Read-Only & Ephemeral**: Kontainer Vercel mereset direktori lokal setiap beberapa menit. Akibatnya, berkas video MP4, PDF materi, atau foto profil yang diunggah secara lokal bisa hilang saat kontainer direstart (*cold start*).
2. **Aggressive Router Caching**: Next.js App Router di Vercel sering menahan cache statis yang membuat sinkronisasi materi terasa lambat.

Dengan memindahkan LMS ini dari Vercel ke **VPS Linux** atau **Cloud Container (Railway / Render / Coolify / Docker)**, Anda mendapatkan:
- 💾 **Penyimpanan Berkas 100% Permanen** (Video MP4 & PDF tidak akan pernah hilang dari hard disk / volume).
- ⚡ **Kinerja CPU & RAM Tanpa Batas** (Tidak ada jeda *cold start* atau batas waktu eksekusi fungsi).
- 🛡️ **Kendali Penuh 100%** atas server, database, dan lalu lintas jaringan.

---

## 🌟 Opsi 1: Paling Mudah & Modern (Railway / Render / Fly.io / Coolify)

Platform seperti **Railway.app**, **Render.com**, dan **Coolify** menjalankan aplikasi Anda dalam **Docker Container fisik yang permanen**.

### Langkah-langkah di Railway.app atau Render.com:
1. Buat akun di **[Railway.app](https://railway.app)** atau **[Render.com](https://render.com)**.
2. Klik **New Project** -> **Deploy from GitHub repo**, lalu pilih repositori `ferel21/profas-leadership-lms`.
3. Platform akan otomatis mendeteksi **`Dockerfile`** yang sudah saya siapkan di dalam proyek ini!
4. Masukkan **Environment Variables** (sama seperti di file `.env` Anda):
   ```env
   DATABASE_URL="postgresql://postgres:[PASSWORD]@db.nvbtuncksyxguwsreeov.supabase.co:5432/postgres"
   DIRECT_URL="postgresql://postgres:[PASSWORD]@db.nvbtuncksyxguwsreeov.supabase.co:5432/postgres"
   NEXTAUTH_SECRET="rahasia_anda_disini"
   NEXTAUTH_URL="https://domain-anda.app"
   GOOGLE_CLIENT_ID="..."
   GOOGLE_CLIENT_SECRET="..."
   ```
5. **Tambahkan Persistent Volume** (Khusus untuk menyimpan video & PDF selamanya):
   - Di pengaturan Railway / Render / Coolify, tambahkan **Volume / Persistent Storage** dan arahkan *mount path* ke:
     `/app/.data/uploads`
   - Set `PRIVATE_UPLOAD_DIR=/app/.data/uploads`. Berkas tidak boleh ditempatkan di `/app/public/uploads`, karena folder `public` dapat dilayani langsung tanpa pemeriksaan hak akses.
6. Klik **Deploy**! Aplikasi LMS Anda kini berjalan 100% permanen dan super cepat tanpa batas Vercel!

---

## 🖥️ Opsi 2: VPS Linux Sendiri (Ubuntu / Debian / CentOS / IDCloudHost / Hostinger / DigitalOcean)

Jika Anda memiliki server VPS sendiri (mulai dari Rp 50.000/bulan di IDCloudHost, Hostinger, atau DigitalOcean), Anda memiliki kendali mutlak 100%.

### Cara 1: Menggunakan PM2 (Node.js Langsung di VPS)
Saya telah menyiapkan berkas konfigurasi **`ecosystem.config.js`** di dalam proyek Anda.

1. **Masuk ke VPS via SSH**:
   ```bash
   ssh root@ip-vps-anda
   ```
2. **Install Node.js 20 & PM2**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs git
   sudo npm install -g pm2
   ```
3. **Clone Repositori & Install Dependencies**:
   ```bash
   git clone https://github.com/ferel21/profas-leadership-lms.git
   cd profas-leadership-lms
   npm ci
   ```
4. **Buat file `.env`** dan isi dengan kredensial Supabase & OAuth Anda:
   ```bash
   nano .env
   ```
5. **Build & Jalankan Aplikasi dengan PM2 Cluster Mode**:
   ```bash
   npx prisma generate
   npm run build
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```
   *Aplikasi Anda kini berjalan 24/7 di port 3000 VPS Anda, dan PM2 akan otomatis menjalankan ulang aplikasi jika VPS direboot!*

---

### Cara 2: Menggunakan Docker & Docker Compose (Paling Praktis di VPS)
Saya juga telah menyiapkan **`Dockerfile`** dan **`docker-compose.yml`** dengan konfigurasi *Persistent Volume*.

1. **Install Docker & Docker Compose di VPS**:
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   ```
2. **Clone Repositori & Buat file `.env`**:
   ```bash
   git clone https://github.com/ferel21/profas-leadership-lms.git
   cd profas-leadership-lms
   # Buat file .env dan isi dengan kredensial Supabase Anda
   ```
3. **Jalankan Docker Compose**:
   ```bash
   docker compose up -d --build
   ```
   *Selesai! Seluruh berkas video MP4, PDF, dan foto yang diunggah mentor akan tersimpan di volume Docker private (`lms-uploads`) dan hanya dilayani melalui endpoint berotorisasi.*

---

## 🌐 Konfigurasi Domain & SSL Gratis (Nginx / Cloudflare)

Untuk mengarahkan domain Anda (misal: `lms.perusahaan.com`) ke VPS port 3000 dengan HTTPS/SSL gratis:
1. Install Nginx dan Certbot:
   ```bash
   sudo apt install -y nginx certbot python3-certbot-nginx
   ```
2. Konfigurasi Reverse Proxy Nginx untuk mengarahkan ke `http://localhost:3000`.
3. Jalankan `sudo certbot --nginx -d lms.perusahaan.com` untuk mendapatkan sertifikat SSL gratis dari Let's Encrypt!

---
*Siap meninggalkan Vercel kapan saja! Seluruh skrip, konfigurasi PM2, Dockerfile, dan Docker Compose sudah tersedia dan teruji di repositori Anda.*
