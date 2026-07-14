# PROFAS LMS — Risk Register

Versi: 1.0

Tanggal dibuat: 13 Juli 2026

Pemilik register: Product Owner + Security Lead
Frekuensi review: bulanan dan setiap ada perubahan besar, insiden, atau vendor baru

Dokumen ini adalah register risiko operasional awal untuk mendukung ISO/IEC 27001, ISO/IEC 27701, ISO/IEC 25010, dan ISO 21001. Nilai risiko tidak menggantikan risk acceptance yang harus disetujui organisasi.

## Metode penilaian

Likelihood dan impact dinilai 1–5. Skor = likelihood × impact.

- 1–4: rendah — monitor.
- 5–9: sedang — kontrol dan owner wajib ada.
- 10–15: tinggi — tidak boleh dibiarkan tanpa treatment atau risk acceptance tertulis.
- 16–25: kritis — release/operasi harus dihentikan sampai ada containment.

## Register

| ID | Aset/proses | Risiko | L | I | Skor | Kontrol/evidence saat ini | Treatment berikutnya | Owner | Status |
| --- | --- | --- | ---: | ---: | ---: | --- | --- | --- | --- |
| R-001 | JWT/session | Token dicuri atau secret lemah memungkinkan impersonation | 3 | 5 | 15 | JWT production fail-closed, secret min. 32 karakter, HttpOnly/SameSite/Secure | Rotasi secret terjadwal, revoke-session strategy, secret manager | Security Lead | Open |
| R-002 | API authorization | Peserta mengakses nilai, course, file, atau aksi role lain | 3 | 5 | 15 | Role + ownership checks pada API, smoke test, security baseline runner | Tambah negative test lintas tenant untuk setiap route write | Backend Lead | Mitigated |
| R-003 | Upload materi/tugas | File berbahaya, path traversal, atau public exposure | 3 | 4 | 12 | Private storage, path validation, authorization, no-store cache | Magic-byte scanning, antivirus/object-storage policy, migrasi legacy public files | Platform Lead | Open |
| R-004 | Dependency supply chain | Dependency vulnerable dieksploitasi | 3 | 4 | 12 | `xlsx` high severity dihapus; `npm audit` menjadi release gate | Patch transitive moderate, Dependabot/SBOM, SLA patching | Engineering Lead | Open |
| R-005 | Data pribadi/nilai | Data disimpan terlalu lama atau diakses tanpa kebutuhan | 3 | 4 | 12 | Response minimization, private uploads, privacy page | Setujui retention schedule, deletion/DSAR workflow, ROPA owner | Privacy Lead | Open |
| R-006 | Database/availability | DB down, pool habis, atau server overload menghentikan pembelajaran | 3 | 5 | 15 | Health check, smoke test, load-test harness | RTO/RPO, backup restore drill, pool/alert tuning, distributed rate limit | SRE/Platform | Open |
| R-007 | Google OAuth | Redirect/origin salah atau callback disalahgunakan | 2 | 5 | 10 | Canonical server env, state anti-CSRF, constant-time comparison, production origin required | Review Google Cloud redirect URI setiap perubahan domain | Security Lead | Mitigated |
| R-008 | Accessibility | Learner disabilitas tidak dapat login, belajar, atau mengerjakan assessment | 3 | 3 | 9 | Axe audit route utama bersih, semantic/focus fixes | Manual NVDA/VoiceOver/TalkBack sign-off dan regression matrix | QA + Accessibility Owner | Open |
| R-009 | Incident response | Insiden terlambat ditangani atau evidence hilang | 3 | 4 | 12 | Runbook incident response dan severity matrix | Tetapkan kontak on-call, tabletop exercise, log retention | Security Lead | Open |
| R-010 | Backup/recovery | Data progres, nilai, atau sertifikat hilang setelah failure | 3 | 5 | 15 | Prisma/Postgres deployment docs | Backup terjadwal, immutable copy, restore test dan RPO/RTO evidence | Data Owner | Open |
| R-011 | Learning quality | Materi/assessment tidak konsisten atau metrik layanan tidak dipantau | 3 | 3 | 9 | Course/module/assessment flow, smoke test | Curriculum review, learner feedback, quality objectives/KPI | Education Owner | Open |
| R-012 | Terminology/metadata | Data course sulit dipertukarkan atau istilah tidak konsisten | 2 | 3 | 6 | Struktur Prisma dan istilah UI/API utama | Controlled glossary dan learning metadata dictionary | Product + Education | Open |

## Release rule

1. Risiko tinggi/kritis wajib memiliki treatment, owner, due date, dan acceptance tertulis.
2. Tidak ada secret, credential, atau data siswa nyata yang boleh masuk ke repository atau fixture test.
3. Setiap perubahan auth, payment, upload, assessment, atau personal data harus memperbarui risk register dan ROPA.
4. Evidence minimum release: `npm run typecheck`, `npm run lint`, `npm run build`, `npm run smoke`, `npm run security:baseline`, dan hasil load test sesuai threshold environment.

## Review log

| Tanggal | Reviewer | Perubahan | Keputusan |
| --- | --- | --- | --- |
| 13 Juli 2026 | Engineering baseline | Register awal dibuat setelah security/privacy audit | Open items diterima untuk treatment lanjutan |
| 14 Juli 2026 | Autonomous Maintainer | Audit log ISO 27001 pada seluruh event autentikasi (`USER_REGISTER`, `USER_LOGIN`, `USER_LOGOUT`) & ekspor data (`EXPORT_DATA`), serta pembersihan risiko `Transaction already aborted` (`findUnique` vs `upsert`) pada kurikulum, asesmen, & penilaian evaluasi | Risiko R-002, R-005, R-006, & R-009 diperkuat dengan jejak audit P0 utuh dan integritas transaksi atomik |
