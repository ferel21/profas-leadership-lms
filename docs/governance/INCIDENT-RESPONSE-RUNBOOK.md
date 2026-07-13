# PROFAS LMS — Incident Response Runbook

Versi: 1.0

Tanggal dibuat: 13 Juli 2026

Owner: Security Lead
Nomor kontak/on-call: **wajib diisi oleh organisasi**

Runbook ini berlaku untuk suspected credential compromise, unauthorized access, data disclosure, malicious upload, dependency exploit, database failure, dan availability incident.

## Severity

| Level | Contoh | Target acknowledgement | Keputusan awal |
| --- | --- | --- | --- |
| P0 Critical | Auth bypass massal, secret exposure, ransomware, data breach besar, service down total | Segera/on-call | Contain/restrict traffic; incident commander aktif |
| P1 High | Cross-user data access, compromised admin, DB corruption, upload exploit | ≤ 1 jam | Freeze risky change dan mulai evidence capture |
| P2 Medium | Single-user privacy issue, repeated auth abuse, degraded service | ≤ 1 business day | Ticket owner, containment terukur |
| P3 Low | Misconfiguration tanpa evidence exploit, minor UX/accessibility issue | ≤ 3 business days | Normal remediation backlog |

Target waktu di atas adalah target operasional internal; kewajiban pelaporan eksternal mengikuti hukum, kontrak, dan keputusan legal counsel.

## Roles

- Incident Commander: mengambil keputusan scope, containment, dan sign-off recovery.
- Technical Lead: logs, code, infrastructure, database, credential rotation.
- Privacy Lead/DPO: data scope, processor coordination, subject/regulator assessment.
- Communications Owner: internal/user/vendor communication yang disetujui.
- Scribe: timeline, evidence index, actions, decisions, dan timestamps.

## Lifecycle

### 1. Detect and declare

Catat reporter, waktu UTC, service/tenant terdampak, indikator awal, dan alasan severity. Jangan menghapus log atau mengubah database sebelum evidence minimum dicatat.

### 2. Triage and scope

Jawab:

- Apakah credential, session, personal data, nilai, upload, atau availability terdampak?
- Apakah incident masih aktif? Apakah ada attacker persistence?
- Tenant/user/course mana yang mungkin terdampak?
- Processor/hosting/database mana yang perlu dihubungi?

### 3. Contain

- Revoke/rotate `JWT_SECRET`, OAuth secret, API keys, database credentials sesuai blast radius.
- Nonaktifkan route/feature yang dieksploitasi melalui deployment/config/WAF.
- Block abusive IP/account/token hanya dengan evidence dan approval.
- Preserve affected files/logs sebelum cleanup.
- Jika data disclosure, batasi akses, jangan menyebarkan ulang data dalam chat/ticket.

### 4. Eradicate and recover

- Patch root cause, dependency, config, query authorization, atau storage policy.
- Rebuild dari source yang tervalidasi; jangan menjalankan binary/artifact tidak dikenal.
- Restore database hanya setelah integrity check dan backup point disetujui.
- Jalankan `npm run typecheck`, `npm run lint`, `npm run build`, `npm run smoke`, `npm run security:baseline`.
- Monitor error rate, auth failures, DB latency, upload access, dan user reports.

### 5. Notify and close

Privacy Lead menentukan apakah ada personal-data breach dan kewajiban notifikasi. Communications hanya mengirim pesan setelah fakta, scope, mitigation, dan approval tersedia. Close hanya setelah owner, residual risk, corrective action, dan due date tercatat.

## Playbook cepat

### Credential/session compromise

1. Preserve auth/error/access logs.
2. Rotate secret yang terkena dan invalidate session sesuai strategi deployment.
3. Review login/OAuth/admin activity sejak last known good.
4. Force password reset bila password credential terindikasi.
5. Verify OAuth redirect URI, env scope, dan cookie flags.

### Unauthorized data/file access

1. Identify route, user/course/file IDs, timestamps, and authorization decision.
2. Disable affected endpoint or storage path if needed.
3. Verify DB ownership query, public/static exposure, cache behavior, and access logs.
4. Preserve affected records and produce minimal disclosure assessment.
5. Add regression test before re-enable.

### Database loss/corruption

1. Stop destructive writes and capture health/latency evidence.
2. Determine last valid backup and RPO impact.
3. Restore to isolated staging first; run integrity and smoke checks.
4. Approve production recovery and record RTO/RPO result.

## Evidence index template

| Evidence ID | Source | UTC time range | Custodian | Hash/link | Retention |
| --- | --- | --- | --- | --- | --- |
| E-001 | Hosting/access logs |  |  |  |  |
| E-002 | Database audit/backup |  |  |  |  |
| E-003 | Git commit/deployment |  |  |  |  |
| E-004 | User/processor report |  |  |  |  |

## Post-incident review

Within the organization-approved review window, record timeline, root cause, control failure, data/availability impact, what worked, what failed, corrective action, risk-register update, ROPA update, and owner/due date. Jalankan tabletop exercise minimal setiap semester dan setelah P0/P1.
