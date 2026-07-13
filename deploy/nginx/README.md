# Nginx dan HTTPS

1. Arahkan DNS `A` record domain ke IP VPS dan pastikan port `80`/`443` terbuka.
2. Install Nginx dan Certbot:

   ```bash
   sudo apt update
   sudo apt install -y nginx certbot python3-certbot-nginx
   sudo mkdir -p /var/www/certbot
   ```

3. Salin `profas-lms.http.conf` ke `/etc/nginx/sites-available/profas-lms`, ganti `lms.example.com`, aktifkan, lalu uji:

   ```bash
   sudo ln -s /etc/nginx/sites-available/profas-lms /etc/nginx/sites-enabled/profas-lms
   sudo nginx -t && sudo systemctl reload nginx
   ```

4. Terbitkan sertifikat tanpa menyentuh database:

   ```bash
   sudo certbot certonly --webroot -w /var/www/certbot -d lms.example.com
   ```

5. Ganti isi site dengan `profas-lms.https.conf`, ubah hostname dan path sertifikat jika domain berbeda, lalu:

   ```bash
   sudo nginx -t && sudo systemctl reload nginx
   sudo certbot renew --dry-run
   ```

Port aplikasi hanya terbuka di `127.0.0.1:3000`; akses publik wajib melalui Nginx HTTPS.
