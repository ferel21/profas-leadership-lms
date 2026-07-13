# PROFAS LMS — Manual Screen Reader and Keyboard Audit

Versi: 1.0

Tanggal evidence otomatis: 13 Juli 2026
Target: WCAG 2.2 AA sebagai target praktik; ISO/IEC 40500:2012 memetakan WCAG 2.0.

## Status saat ini

- Automated axe audit terakhir untuk landing (`/`), login (`/masuk`), dan dashboard (`/dashboard`): **0 violation** setelah elemen reveal selesai.
- Typecheck, lint, build, dan smoke test lulus.
- Manual screen reader oleh pengguna AT nyata: **belum sign-off**. Automated axe tidak menggantikan NVDA/VoiceOver/TalkBack.

## Environment yang harus digunakan

Uji minimal satu desktop dan satu mobile:

- Windows 11 + NVDA + Chrome/Edge.
- macOS/iOS + VoiceOver + Safari.
- Android + TalkBack + Chrome bila learner memakai Android.
- Keyboard-only tanpa mouse; zoom 200%; `prefers-reduced-motion: reduce`.

## Journeys dan checklist

| Journey | Halaman/komponen | Pass criteria | WCAG mapping | Hasil |
| --- | --- | --- | --- | --- |
| Landing discovery | `/` | Landmark/banner/main/footer terbaca; heading H1 → H2; CTA punya nama; image punya alt; marquee tidak memblokir | 1.1.1, 1.3.1, 2.4.6, 4.1.2 | Pending human |
| Login/register | `/masuk`, `/daftar` | Label/error/status terbaca; persona button mengumumkan selected; password toggle punya label; submit/loading jelas | 1.3.1, 3.3.1, 3.3.2, 4.1.2 | Pending human |
| Dashboard | `/dashboard` | Sidebar/nav/heading dapat dilompati; progress punya role/value; notification dialog fokus dan escape; reveal tidak menghilangkan konten | 1.3.1, 2.1.1, 2.4.1, 4.1.2 | Pending human |
| Course player | `/belajar/[slug]` | Video fallback/controls terbaca; material/tab/attachment punya name; complete action dan progress update diumumkan | 1.2.x, 2.1.1, 4.1.3 | Pending human |
| Assessment | `/kuis/[id]`, `/evaluasi/[id]` | Question/options/score/error terbaca; keyboard dapat memilih dan submit; focus berpindah ke result | 1.3.1, 2.1.1, 3.3.1, 4.1.3 | Pending human |
| Mentor/admin | `/mentor`, `/dashboard/analitik` | Table headers, filters, dialogs, upload errors, ownership messages, and chart alternatives accessible | 1.3.1, 1.3.2, 2.1.1, 4.1.2 | Pending human |

## Test procedure

1. Reload page, use screen-reader browse/virtual cursor, and list landmarks/headings.
2. Set focus at address bar, press Tab repeatedly; record every interactive control and confirm visible focus.
3. Activate every control with Enter/Space only. Confirm no keyboard trap and Escape closes dialogs.
4. Trigger validation error, empty state, loading, success, and server error. Confirm announcement and focus target.
5. Scroll through reveal sections. Toggle reduced motion and confirm all content remains visible.
6. At 200% zoom and narrow viewport, confirm no clipped controls, horizontal-only access, or hidden text.
7. Repeat with screen reader speech viewer/rotor and record exact announcement when a criterion fails.

## Evidence record

| Date | Tester/device/AT | Route/journey | Result | Finding ID | Evidence link |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

## Finding template

```text
ID:
Route/component:
Assistive technology + browser:
Steps to reproduce:
Expected announcement/focus:
Actual result:
WCAG criterion/impact:
Screenshot or speech-viewer evidence:
Owner/due date:
Retest result:
```

Release rule: critical/serious keyboard or screen-reader blockers must be fixed or explicitly risk-accepted by the product/accessibility owner before release.
