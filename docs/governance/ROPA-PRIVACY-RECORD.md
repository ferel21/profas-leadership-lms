# PROFAS LMS — ROPA / Privacy Record

Versi: 1.0

Tanggal dibuat: 13 Juli 2026

Data controller: organisasi pengelola PROFAS Leadership
Privacy owner/DPO: **wajib diisi sebelum production sign-off**

ROPA ini adalah inventaris awal pemrosesan data pribadi. Legal basis, retention final, transfer lintas negara, dan kontrak processor harus disahkan oleh pemilik organisasi/legal counsel; tabel ini tidak otomatis menetapkan kepatuhan hukum.

## Sistem dan processor

| Sistem | Fungsi | Data lokasi | Processor/subprocessor yang perlu dicatat |
| --- | --- | --- | --- |
| Next.js LMS | Web UI, API, session, upload authorization | Vercel/Netlify/VPS sesuai deployment | Provider hosting, logging/monitoring |
| PostgreSQL/Prisma | Akun, enrollment, progress, nilai, certificate | Supabase/PostgreSQL atau server yang ditetapkan | Database provider, backup provider |
| Google OAuth | Login federated | Google | Google sebagai identity provider |
| Object/file storage | Materi, submission, avatar | `.data/uploads` atau object storage private | Storage provider, malware scanner bila ditambahkan |
| Anthropic API (opsional) | Tutor AI dengan konteks pembelajaran | Server + processor AI jika key aktif | Anthropic; perlu DPA, transfer, retention review |

## Record of processing activities

| ID | Aktivitas | Data yang diproses | Tujuan | Dasar hukum/approval | Akses/penerima | Retention policy |
| --- | --- | --- | --- | --- | --- | --- |
| P-001 | Registrasi/login/logout lokal | Nama, username, email, password hash, persona, avatar, profile fields | Membuat akun, mengelola sesi, dan audit trail ISO 27001 (`USER_REGISTER`, `USER_LOGIN`, `USER_LOGOUT`) | **Tentukan: kontrak/consent/legal basis** | User, support terbatas, auth service | **Tentukan**; hapus akun + grace period harus tersedia |
| P-002 | Google OAuth | Email, nama, avatar, provider, session identifier internal | Login federated beserta log aktivitas masuk atomik (`USER_LOGIN`) | **Tentukan dan dokumentasikan consent/contract** | Google + LMS auth | Akun aktif; deletion request menghapus record internal |
| P-003 | Enrollment dan progress | User ID, course, node completion, progress percent, timestamps | Menyediakan dan mengukur pembelajaran dengan audit log `ENROLL_COURSE` & `complete` bebas abort | **Tentukan** | User, mentor sesuai course, admin terbatas | Masa program + periode bukti layanan yang disetujui |
| P-004 | Assessment dan nilai | Jawaban, score, feedback, attempt, submission file | Evaluasi kompetensi dan feedback dengan audit log `SUBMIT_ASSESSMENT` & `GRADE_EVALUATION` | **Tentukan; nilai adalah data pendidikan sensitif** | User, mentor course, admin terbatas | **Tentukan**; access log dan deletion exception perlu |
| P-005 | Certificate | Nama, course, completion date, unique number, verification data | Menerbitkan dan memverifikasi sertifikat dengan audit log `ISSUE_CERTIFICATE` | **Tentukan** | User, verifier sesuai disclosure notice | Masa validitas sertifikat + legal record schedule |
| P-006 | Upload materi/tugas/avatar | File, URL internal, metadata, uploader ID | Menyediakan materi dan submission dengan audit log `UPLOAD_MATERIAL`, `ADD_MATERIAL_LINK`, `UPDATE_AVATAR` | **Tentukan** | Owner, enrolled learner, mentor course, admin | Hapus saat course/akun selesai sesuai retention schedule |
| P-007 | Forum/discussion/notifications | Post, reply, notification, user ID, timestamps | Kolaborasi, pengumuman, support dengan audit log `CREATE/DELETE_FORUM_THREAD`, `CREATE/DELETE_DISCUSSION_POST` | **Tentukan** | Peserta sesuai ruang, mentor/admin sesuai scope | Review berkala; deletion/anonymization workflow |
| P-008 | Analytics/reporting & Ekspor Data | Activity metadata, progress aggregates, attendance, XP, email/name pada report & ekspor multi-format | Quality assurance, pemantauan ISO (`EXPORT_DATA`), dan layanan pendidikan | **Tentukan; minimization wajib** | Admin/mentor sesuai scope | Aggregated data lebih lama; raw data dibatasi |
| P-009 | Tutor AI opsional | Pertanyaan dan konteks lesson/history yang dikirim user | Bantuan belajar | Consent/notice + DPA processor wajib | User, LMS, AI processor | Jangan kirim password, token, nilai penuh, atau data yang tidak perlu |

## Data minimization and security controls

- API response harus memilih field yang diperlukan; `passwordHash`, token, secret, dan session cookie tidak boleh keluar.
- Upload baru berada di private storage dan dibaca melalui endpoint berotorisasi.
- Nilai/submission dibatasi oleh ownership/role; cross-user access harus diuji sebagai negative test.
- Cookie session: HttpOnly, SameSite=Lax, Secure pada production.
- Health endpoint publik hanya mengembalikan readiness minimal; detail membutuhkan `HEALTHCHECK_TOKEN`.
- Export laporan harus memiliki purpose, role scope, retention, dan access review.
- Data yang dikirim ke AI pihak ketiga harus melalui redaction/minimization dan persetujuan processor.

## Data subject rights workflow

Sebelum production sign-off, organisasi harus menetapkan owner, SLA, dan bukti untuk:

1. Access/export data pribadi.
2. Correction profile.
3. Deletion/anonymization account dan data pembelajaran.
4. Objection/withdrawal consent jika basisnya consent.
5. Restriction/retention exception untuk certificate, finance, atau legal record.
6. Complaint escalation dan breach notification sesuai hukum/kontrak yang berlaku.

## DPIA triggers

Lakukan DPIA/assessment tambahan bila LMS digunakan oleh anak/minor, memproses nilai dalam skala besar, memakai AI untuk keputusan/feedback, melakukan transfer lintas negara, menambah biometrik/proctoring, atau mengaktifkan public ranking/analytics baru.

## Open approvals

| Item | Owner | Deadline | Status |
| --- | --- | --- | --- |
| Tetapkan controller/DPO/privacy contact | Management | Sebelum production | Open |
| Setujui legal basis per aktivitas | Legal/Management | Sebelum production | Open |
| Setujui retention/deletion schedule | Privacy + Education | Sebelum production | Open |
| Inventory processor/DPA/subprocessor | Privacy + Platform | Sebelum production | Open |
| Uji DSAR/delete/anonymization di staging | Engineering + Privacy | Sebelum production | Open |
