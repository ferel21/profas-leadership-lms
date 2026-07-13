# PROFAS LMS — Release Evidence

Tanggal: 13 Juli 2026

Environment: local production build (`next start`) dengan database test yang tersedia
Commit baseline: lihat `git log -1`

Dokumen ini merekam hasil eksekusi aktual. Angka ini bukan SLA production; ulangi pada environment production-like dengan data volume, provider, dan observability yang sama sebelum menetapkan target layanan.

## Automated gates

| Gate | Command | Result |
| --- | --- | --- |
| Type safety | `npm run typecheck` | PASS |
| Lint | `npm run lint` | PASS |
| Production build | `npm run build` | PASS; 53 route dibuat |
| End-to-end smoke | `npm run smoke` | PASS; public route, auth, role dashboard, authorization, discussion, assessment, certificate |
| Security baseline | `npm run security:baseline` | PASS; 13 checks, 1 optional cookie check skipped karena credential test tidak diberikan |
| Synthetic load | `npm run load:test` | PASS; 60 GET request, concurrency 8, 0 error, p95 98.77 ms, max 185.69 ms |
| Automated accessibility | axe pada `/`, `/masuk`, `/dashboard` | PASS; 0 violation pada ketiga route |

## Findings closed during this run

- Public `/api/health` tidak lagi mengembalikan jumlah user/course, memory, topology, atau feature flags. Detail opsional membutuhkan `HEALTHCHECK_TOKEN`.
- Health check memakai one-query readiness, TTL cache, dan request coalescing agar tidak memenuhi connection pool saat monitoring/load burst.
- Public course catalog dan program catalog memakai cache server-side untuk mengurangi query berulang.
- Security runner menguji header, protected redirects, anonymous mutation/file access, malformed auth input, dan public health minimization.

## Evidence still requiring organizational/human action

| Evidence | Status | Next action |
| --- | --- | --- |
| NVDA/VoiceOver/TalkBack manual screen-reader session | Pending human | Isi [manual audit record](./MANUAL-SCREEN-READER-AUDIT.md) dengan device, announcement, focus, dan retest evidence |
| ROPA approval/legal basis/retention | Pending owner | Tetapkan controller/DPO, lawful basis, retention, processor/DPA, DSAR SLA |
| Risk acceptance | Pending owner | Review high risks R-001/R-003/R-004/R-006/R-010 dan beri owner/due date |
| Penetration test eksternal | Pending qualified tester | Jalankan scope-approved test terhadap staging dengan authorization tertulis; simpan report dan remediation |
| Backup/restore drill | Pending platform/data owner | Jalankan restore isolated, ukur RTO/RPO, dan attach evidence |
| Incident tabletop | Pending security owner | Simulasikan P0/P1 dan lengkapi timeline/evidence/communication decision |

## Reproduction

Build and start the production artifact, then run:

```bash
npm run typecheck
npm run lint
npm run build
npm run smoke
npm run security:baseline
npm run load:test
```

For external/staging targets, explicitly set `BASE_URL` and the matching confirmation variable. The runners refuse non-local targets by default to prevent accidental traffic against production.
