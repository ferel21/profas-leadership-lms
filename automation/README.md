# PROFAS Autopilot

Autopilot adalah watchdog pemeliharaan lokal, bukan sistem deployment. Service berjalan dengan hak akses user, memiliki `Restart=on-failure`, melanjutkan deadline yang tersimpan setelah reboot, dan berhenti serta menonaktifkan dirinya otomatis setelah durasi yang ditentukan.

## Jadwal bawaan

- Setiap 15 menit: TypeScript typecheck dan ESLint.
- Siklus pertama dan setiap empat siklus: production build serta smoke test route runtime non-destruktif.
- Saat gagal: ESLint autofix dan Prisma Client generation, lalu verifikasi ulang.
- Jika masih gagal dan Codex CLI terautentikasi: satu sesi repair terbatas.
- Setiap delapan siklus dalam kondisi sehat: satu audit peningkatan terbatas.

## Kontrol

```bash
bash scripts/autopilot-control.sh start 24
bash scripts/autopilot-control.sh status
bash scripts/autopilot-control.sh stop
bash scripts/autopilot-control.sh once
```

Durasi pada perintah `start` menggunakan satuan jam. Konfigurasi lanjutan tersedia melalui environment variable `AUTOPILOT_INTERVAL_SECONDS`, `AUTOPILOT_BUILD_EVERY`, dan `AUTOPILOT_IMPROVE_EVERY` bila skrip utama dijalankan langsung.

## Pemulihan

Sebelum Codex mengubah source, snapshot dibuat di `.autopilot/snapshots/`. Snapshot sengaja tidak dipulihkan otomatis karena pengguna mungkin sedang mengedit workspace yang sama. Jika status menjadi `degraded`, baca `.autopilot/autopilot.log`, hentikan service, lalu bandingkan snapshot terbaru sebelum melakukan pemulihan.
