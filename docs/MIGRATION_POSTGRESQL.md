# PostgreSQL Production Baseline

PROFAS Leadership LMS sudah memakai PostgreSQL sebagai satu-satunya provider Prisma. Berkas `prisma/schema.prisma` membaca dua koneksi:

- `DATABASE_URL` untuk query aplikasi; gunakan pooled/transaction connection pada runtime serverless.
- `DIRECT_URL` untuk Prisma CLI dan operasi migrasi; gunakan direct/session connection.

SQLite dan `prisma/dev.db` tidak lagi menjadi bagian dari arsitektur aplikasi.

## Konfigurasi environment

Contoh untuk PostgreSQL managed:

```env
DATABASE_URL="postgresql://user:password@pooler.example.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://user:password@db.example.com:5432/postgres"
```

Gunakan database development/staging yang terpisah untuk pekerjaan lokal dan CI. Jangan menaruh connection string atau dump data production di repository.

## Menyiapkan database development

Setelah `.env` menunjuk ke database development kosong:

```bash
npm ci
npx prisma generate
npm run db:push
npm run db:seed
```

`db:push` dan seed bukan bagian dari build/deploy aplikasi. Seed akan menolak eksekusi ketika `NODE_ENV=production` atau `VERCEL=1`, kecuali operator secara eksplisit memberi `ALLOW_PRODUCTION_SEED=true`. Override tersebut hanya boleh dipakai setelah backup dan persetujuan perubahan data.

## Perubahan skema production

Untuk production, gunakan migration yang ditinjau dan backup terverifikasi:

```bash
npx prisma migrate deploy
```

Jangan menjalankan `prisma db push --accept-data-loss`, menghapus folder migration, atau menjalankan seed demo dalam pipeline deployment. Proses perubahan skema harus memiliki:

1. migration yang direview;
2. backup dan rencana rollback;
3. uji pada staging dengan versi skema yang sama;
4. jendela perubahan dan owner yang jelas.

## Vercel

Vercel hanya menjalankan aplikasi; data relasional persisten tetap berada di PostgreSQL eksternal. Filesystem function Vercel bersifat sementara dan tidak dipakai untuk upload permanen. Upload Vercel memakai bucket private Supabase Storage dan mewajibkan `SUPABASE_URL` serta `SUPABASE_SERVICE_ROLE_KEY`; tanpa konfigurasi itu endpoint upload mengembalikan 503. Deployment local/VPS tetap memakai `PRIVATE_UPLOAD_DIR` pada volume persistent secara default.

## Verifikasi

Sebelum rilis:

```bash
npm run validate:env -- --production
npm run typecheck
npm run lint
npm run build
```

Jalankan `npm run smoke` hanya terhadap database test/staging yang terisolasi karena suite memverifikasi akun dan data seed.
