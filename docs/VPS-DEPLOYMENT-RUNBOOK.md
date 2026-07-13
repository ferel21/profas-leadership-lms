# PROFAS LMS — VPS Deployment Runbook

Runbook ini menyiapkan aplikasi di VPS tanpa memindahkan database yang sedang digunakan. Container hanya menjalankan Next.js dan menyediakan volume persistent untuk file upload; `DATABASE_URL` dan `DIRECT_URL` tetap menunjuk ke database existing.

## Arsitektur target

```text
Internet :443
    |
Nginx + Let's Encrypt
    | 127.0.0.1:3000
Docker Compose: profas-lms
    |-- /app/.data/uploads -> volume lms-uploads
    `-- DATABASE_URL / DIRECT_URL -> database existing
```

Tidak ada service PostgreSQL di `docker-compose.yml`. Deploy tidak menjalankan `prisma db push`, `prisma migrate`, `npm run setup`, atau `npm run db:seed`.

## 1. Persiapan VPS

Contoh di Ubuntu/Debian:

```bash
sudo apt update
sudo apt install -y git curl ca-certificates nginx certbot python3-certbot-nginx
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker "$USER"
```

Logout/login kembali setelah menambahkan user ke group Docker. Buka hanya port `22`, `80`, dan `443` pada firewall. Port aplikasi `3000` harus tetap private karena Compose mengikatnya ke `127.0.0.1`.

## 2. Checkout dan environment

```bash
sudo mkdir -p /srv/profas-lms
sudo chown -R "$USER":"$USER" /srv/profas-lms
git clone https://github.com/ferel21/profas-leadership-lms.git /srv/profas-lms
cd /srv/profas-lms
cp .env.example .env
chmod 600 .env
nano .env
```

Nilai production minimum:

```env
NODE_ENV=production
DATABASE_URL="postgresql://...existing-database..."
DIRECT_URL="postgresql://...existing-database..."
JWT_SECRET="hasil-openssl-rand-minimal-32-karakter"
NEXTAUTH_URL="https://lms.example.com"
NEXT_PUBLIC_APP_URL="https://lms.example.com"
PRIVATE_UPLOAD_DIR="/app/.data/uploads"
HEALTHCHECK_TOKEN="hasil-openssl-rand-minimal-32-karakter"
REQUIRE_HEALTHCHECK_TOKEN="true"
```

Generate secret tanpa menuliskannya ke shell history:

```bash
openssl rand -base64 48
```

`GOOGLE_CLIENT_ID` dan `GOOGLE_CLIENT_SECRET` harus diisi berpasangan jika Google OAuth dipakai. `ANTHROPIC_API_KEY` tetap opsional karena aplikasi memiliki fallback tutor lokal.

## 3. Deploy pertama atau deploy manual

```bash
cd /srv/profas-lms
./deploy/vps/deploy.sh
```

Script akan memastikan working tree server bersih, mengambil `origin/main` dengan fast-forward only, build image Docker, memvalidasi environment di dalam image, menjalankan container, menunggu `/api/health` HTTP 200, lalu menyimpan commit baik sebelumnya untuk rollback.

Jika readiness release baru gagal, script otomatis menghidupkan kembali commit sebelumnya. Proses ini tidak menyentuh tabel database.

Periksa status:

```bash
docker compose ps
docker compose logs --tail=100 -f profas-lms
curl -i http://127.0.0.1:3000/api/health
curl -i -H "x-health-token: $HEALTHCHECK_TOKEN" http://127.0.0.1:3000/api/health
```

## 4. Nginx dan HTTPS

Detail template tersedia di [`deploy/nginx/README.md`](../deploy/nginx/README.md). Alur ringkasnya:

1. Arahkan DNS `A` record ke IP VPS.
2. Aktifkan `deploy/nginx/profas-lms.http.conf` dengan hostname sebenarnya.
3. Jalankan `sudo nginx -t && sudo systemctl reload nginx`.
4. Terbitkan sertifikat menggunakan Certbot webroot.
5. Aktifkan `deploy/nginx/profas-lms.https.conf`, ubah hostname dan path sertifikat.
6. Uji `sudo nginx -t`, reload, lalu `sudo certbot renew --dry-run`.

HTTPS termination berada di Nginx. Header `X-Forwarded-Proto: https` diteruskan ke Next.js sehingga cookie production tetap aman.

## 5. CI/CD GitHub Actions

Template workflow [`vps-deploy.workflow.yml`](../deploy/vps/vps-deploy.workflow.yml) menjalankan `validate:env`, typecheck, lint, build, dan performance budget sebelum SSH deploy. Salin template ini ke `.github/workflows/vps-deploy.yml` setelah GitHub token/repository memiliki permission `workflow`.

Buat GitHub Environment bernama `production`, lalu tambahkan secrets:

| Secret | Isi |
| --- | --- |
| `VPS_HOST` | hostname/IP VPS |
| `VPS_USER` | user deploy non-root |
| `VPS_SSH_PORT` | opsional, default `22` |
| `VPS_SSH_PRIVATE_KEY` | private key khusus deploy |
| `VPS_KNOWN_HOSTS` | output `ssh-keyscan -H host` yang diverifikasi |
| `VPS_APP_DIR` | contoh `/srv/profas-lms` |

Workflow sengaja tidak mengirim `.env` dari GitHub. Secrets runtime tetap berada di VPS.

## 6. Rollback manual

Rollback ke release sehat sebelumnya:

```bash
cd /srv/profas-lms
./deploy/vps/rollback.sh
```

Rollback ke commit tertentu:

```bash
./deploy/vps/rollback.sh <commit-sha>
```

Setelah rollback, repository berada pada detached commit secara sengaja. Deploy berikutnya akan mengaktifkan branch `main` kembali, mengambil commit terbaru, dan melakukan fast-forward only.

Rollback aplikasi tidak membatalkan perubahan database. Karena deployment ini tidak melakukan migrasi schema, perubahan database harus dikelola dan direstore melalui prosedur backup database existing secara terpisah.

## 7. Backup dan batas scope

- Backup database tetap mengikuti provider database existing; jangan menghapus atau mengganti database saat menjalankan runbook ini.
- Backup volume `lms-uploads` secara berkala ke lokasi terpisah dan uji restore.
- Jangan memasukkan `.env`, private key, token health, atau file upload ke Git.
- Sebelum cutover domain dari Vercel, uji domain sementara/staging dan verifikasi OAuth redirect URI.
- Setelah cutover, jalankan `npm run smoke` dari environment yang memiliki akses database dan `npm run test:e2e` dengan akun test yang aman.
