"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Clipboard,
  KeyRound,
  LoaderCircle,
  Plus,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  UserMinus,
  UsersRound,
  X,
} from "lucide-react";

type CourseOption = { id: string; title: string; published: boolean };
type CohortSummary = {
  id: string;
  name: string;
  organization: string | null;
  capacity: number;
  startsAt: string;
  endsAt: string;
  status: "DRAFT" | "ACTIVE" | "CLOSED";
  joinCodeHint: string | null;
  course: { id: string; title: string; slug: string; published: boolean };
  memberCount: number;
};
type CohortMember = {
  id: string;
  source: "DIRECT" | "COHORT" | "ADMIN";
  status: "ACTIVE" | "COMPLETED";
  progressPercent: number;
  enrolledAt: string;
  accessRevokedAt: string | null;
  user: { id: string; name: string; email: string; avatar: string | null };
};
type CohortDetail = Omit<CohortSummary, "memberCount"> & {
  enrollments: CohortMember[];
};

type Notice = { type: "success" | "error"; text: string } | null;

function localInputValue(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function defaultPeriod() {
  const startsAt = new Date();
  startsAt.setDate(startsAt.getDate() + 1);
  startsAt.setHours(8, 0, 0, 0);
  const endsAt = new Date(startsAt);
  endsAt.setMonth(endsAt.getMonth() + 3);
  return { startsAt: localInputValue(startsAt), endsAt: localInputValue(endsAt) };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

function statusLabel(cohort: Pick<CohortSummary, "status" | "endsAt">) {
  if (cohort.status === "ACTIVE" && new Date(cohort.endsAt) <= new Date()) return "Berakhir";
  return cohort.status === "DRAFT" ? "Draf" : cohort.status === "ACTIVE" ? "Aktif" : "Ditutup";
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || "Permintaan belum dapat diproses.");
  return data as T;
}

export function CohortManager({ courses, initialCohorts }: { courses: CourseOption[]; initialCohorts: CohortSummary[] }) {
  const initialPeriod = useMemo(defaultPeriod, []);
  const [cohorts, setCohorts] = useState(initialCohorts);
  const [selectedId, setSelectedId] = useState(initialCohorts[0]?.id ?? "");
  const [detail, setDetail] = useState<CohortDetail | null>(null);
  const [showCreate, setShowCreate] = useState(initialCohorts.length === 0 && courses.length > 0);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState<Notice>(null);
  const [revealedCode, setRevealedCode] = useState<{ cohortId: string; code: string } | null>(null);
  const [createForm, setCreateForm] = useState({
    courseId: courses[0]?.id ?? "",
    name: "",
    organization: "",
    capacity: "30",
    startsAt: initialPeriod.startsAt,
    endsAt: initialPeriod.endsAt,
  });
  const [memberEmail, setMemberEmail] = useState("");
  const [allowTransfer, setAllowTransfer] = useState(false);

  const loadDetail = useCallback(async (id: string) => {
    if (!id) {
      setDetail(null);
      return;
    }
    setBusy("detail");
    try {
      const data = await requestJson<{ cohort: CohortDetail }>(`/api/cohorts/${id}`);
      setDetail(data.cohort);
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Kohort belum dapat dimuat." });
    } finally {
      setBusy("");
    }
  }, []);

  useEffect(() => {
    void loadDetail(selectedId);
  }, [loadDetail, selectedId]);

  async function refreshCohorts(preferredId = selectedId) {
    const data = await requestJson<{ cohorts: Array<Omit<CohortSummary, "memberCount"> & { _count: { enrollments: number } }> }>("/api/cohorts");
    const next = data.cohorts.map((item) => ({ ...item, memberCount: item._count.enrollments }));
    setCohorts(next);
    const nextId = next.some((item) => item.id === preferredId) ? preferredId : next[0]?.id ?? "";
    setSelectedId(nextId);
    if (nextId === selectedId) await loadDetail(nextId);
  }

  async function createCohort(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("create");
    setNotice(null);
    try {
      const data = await requestJson<{ cohort: CohortSummary; accessCode: string }>("/api/cohorts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...createForm,
          capacity: Number(createForm.capacity),
          startsAt: new Date(createForm.startsAt).toISOString(),
          endsAt: new Date(createForm.endsAt).toISOString(),
        }),
      });
      setRevealedCode({ cohortId: data.cohort.id, code: data.accessCode });
      setNotice({ type: "success", text: "Kohort dibuat sebagai draf. Simpan kode akses sebelum menutup panel ini." });
      setShowCreate(false);
      setCreateForm((current) => ({ ...current, name: "", organization: "" }));
      await refreshCohorts(data.cohort.id);
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Kohort belum dapat dibuat." });
    } finally {
      setBusy("");
    }
  }

  async function updateStatus(status: CohortSummary["status"]) {
    if (!selectedId) return;
    setBusy("status");
    setNotice(null);
    try {
      await requestJson(`/api/cohorts/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setNotice({ type: "success", text: status === "ACTIVE" ? "Kohort sudah aktif dan dapat menerima kode." : "Status kohort diperbarui." });
      await refreshCohorts(selectedId);
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Status belum dapat diperbarui." });
    } finally {
      setBusy("");
    }
  }

  async function regenerateCode() {
    if (!selectedId) return;
    setBusy("code");
    setNotice(null);
    try {
      const data = await requestJson<{ accessCode: string }>(`/api/cohorts/${selectedId}/code`, { method: "POST" });
      setRevealedCode({ cohortId: selectedId, code: data.accessCode });
      setNotice({ type: "success", text: "Kode lama langsung dinonaktifkan. Salin dan bagikan kode baru secara aman." });
      await refreshCohorts(selectedId);
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Kode belum dapat diganti." });
    } finally {
      setBusy("");
    }
  }

  async function addMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedId) return;
    setBusy("member");
    setNotice(null);
    try {
      const data = await requestJson<{ changed: boolean; transferred: boolean }>(`/api/cohorts/${selectedId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: memberEmail, transfer: allowTransfer }),
      });
      setMemberEmail("");
      setAllowTransfer(false);
      setNotice({
        type: "success",
        text: data.transferred ? "Peserta berhasil dipindahkan ke kohort ini." : data.changed ? "Peserta ditambahkan dan sudah menerima notifikasi." : "Peserta sudah menjadi anggota aktif.",
      });
      await refreshCohorts(selectedId);
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Peserta belum dapat ditambahkan." });
    } finally {
      setBusy("");
    }
  }

  async function revokeMember(userId: string, name: string) {
    if (!selectedId || !window.confirm(`Nonaktifkan akses ${name}? Progres dan sertifikat tetap tersimpan.`)) return;
    setBusy(`revoke-${userId}`);
    setNotice(null);
    try {
      await requestJson(`/api/cohorts/${selectedId}/members?userId=${encodeURIComponent(userId)}`, { method: "DELETE" });
      setNotice({ type: "success", text: `Akses ${name} dinonaktifkan tanpa menghapus progres.` });
      await refreshCohorts(selectedId);
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Akses belum dapat dinonaktifkan." });
    } finally {
      setBusy("");
    }
  }

  async function restoreMember(userId: string, name: string) {
    if (!selectedId || !window.confirm(`Pulihkan akses ${name}?`)) return;
    setBusy(`restore-${userId}`);
    setNotice(null);
    try {
      await requestJson(`/api/cohorts/${selectedId}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: "restore" }),
      });
      setNotice({ type: "success", text: `Akses ${name} berhasil dipulihkan.` });
      await refreshCohorts(selectedId);
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Akses belum dapat dipulihkan." });
    } finally {
      setBusy("");
    }
  }

  async function copyCode() {
    if (!revealedCode) return;
    await navigator.clipboard.writeText(revealedCode.code);
    setNotice({ type: "success", text: "Kode akses disalin ke clipboard." });
  }

  const activeMembers = detail?.enrollments.filter((item) => !item.accessRevokedAt) ?? [];
  const rawCode = revealedCode?.cohortId === selectedId ? revealedCode.code : null;

  return (
    <div className="pf-cohort-manager">
      <header className="pf-cohort-page-header">
        <div>
          <span>Distribusi akses terkontrol</span>
          <h1>Kohort & kode akses</h1>
          <p>Kelola periode belajar, kapasitas, dan peserta tanpa menyimpan data pembayaran di LMS.</p>
        </div>
        <button type="button" className="pf-cohort-primary-action" onClick={() => setShowCreate((value) => !value)} disabled={courses.length === 0}>
          {showCreate ? <X aria-hidden="true" /> : <Plus aria-hidden="true" />}
          {showCreate ? "Tutup formulir" : "Buat kohort"}
        </button>
      </header>

      {notice && <div className={`pf-cohort-notice is-${notice.type}`} role={notice.type === "error" ? "alert" : "status"}>{notice.type === "success" && <Check aria-hidden="true" />}<span>{notice.text}</span></div>}

      {showCreate && (
        <form className="pf-cohort-create-panel" onSubmit={createCohort}>
          <div className="pf-cohort-panel-heading"><Plus aria-hidden="true" /><div><h2>Kohort baru</h2><p>Kode dibuat otomatis dan hanya ditampilkan satu kali.</p></div></div>
          <div className="pf-cohort-form-grid">
            <label>
              <span>Jenis peruntukan</span>
              <select
                value={createForm.capacity === "1" ? "INDIVIDUAL" : "BATCH"}
                onChange={(event) => {
                  const isIndividual = event.target.value === "INDIVIDUAL";
                  setCreateForm((prev) => ({
                    ...prev,
                    capacity: isIndividual ? "1" : "30",
                    name: isIndividual ? (prev.name || "Akses Mandiri Perorangan") : (prev.name === "Akses Mandiri Perorangan" ? "" : prev.name),
                    organization: isIndividual ? (prev.organization || "Peserta Individual") : (prev.organization === "Peserta Individual" ? "" : prev.organization),
                  }));
                }}
              >
                <option value="BATCH">👥 Batch / Kelompok (Banyak Peserta)</option>
                <option value="INDIVIDUAL">👤 Perorangan / Individual (1 Peserta)</option>
              </select>
            </label>
            <label><span>Program</span><select required value={createForm.courseId} onChange={(event) => setCreateForm({ ...createForm, courseId: event.target.value })}>{courses.map((course) => <option value={course.id} key={course.id}>{course.title}{course.published ? "" : " (Draf)"}</option>)}</select></label>
            <label><span>Nama kohort</span><input required minLength={3} maxLength={120} value={createForm.name} onChange={(event) => setCreateForm({ ...createForm, name: event.target.value })} placeholder={createForm.capacity === "1" ? "Akses Mandiri (Nama Peserta)" : "Leadership Batch 01"} /></label>
            <label><span>Organisasi <small>opsional</small></span><input maxLength={120} value={createForm.organization} onChange={(event) => setCreateForm({ ...createForm, organization: event.target.value })} placeholder="Nama organisasi" /></label>
            <label><span>Kapasitas</span><input required type="number" min={1} max={10000} value={createForm.capacity} onChange={(event) => setCreateForm({ ...createForm, capacity: event.target.value })} readOnly={createForm.capacity === "1"} /></label>
            <label><span>Mulai akses</span><input required type="datetime-local" value={createForm.startsAt} onChange={(event) => setCreateForm({ ...createForm, startsAt: event.target.value })} /></label>
            <label><span>Akhir akses</span><input required type="datetime-local" value={createForm.endsAt} onChange={(event) => setCreateForm({ ...createForm, endsAt: event.target.value })} /></label>
          </div>
          <div className="pf-cohort-form-actions"><button type="button" onClick={() => setShowCreate(false)}>Batal</button><button type="submit" disabled={busy === "create"}>{busy === "create" ? <LoaderCircle className="spin" aria-hidden="true" /> : <ArrowRight aria-hidden="true" />}Simpan kohort</button></div>
        </form>
      )}

      {courses.length === 0 ? (
        <div className="pf-cohort-empty"><UsersRound aria-hidden="true" /><h2>Belum ada program</h2><p>Buat program terlebih dahulu sebelum menyiapkan kohort.</p></div>
      ) : cohorts.length === 0 && !showCreate ? (
        <div className="pf-cohort-empty"><KeyRound aria-hidden="true" /><h2>Belum ada kohort</h2><p>Mulai dengan satu kohort untuk mengatur akses peserta secara rapi.</p><button type="button" onClick={() => setShowCreate(true)}>Buat kohort pertama</button></div>
      ) : cohorts.length > 0 ? (
        <div className="pf-cohort-workspace">
          <aside className="pf-cohort-list" aria-label="Daftar kohort">
            <div className="pf-cohort-list-heading"><div><span>Kohort</span><strong>{cohorts.length} kelompok</strong></div><button type="button" onClick={() => void refreshCohorts()} aria-label="Muat ulang daftar kohort"><RefreshCw aria-hidden="true" /></button></div>
            {cohorts.map((cohort) => (
              <button type="button" key={cohort.id} className={selectedId === cohort.id ? "is-selected" : ""} onClick={() => { setSelectedId(cohort.id); setRevealedCode(null); setNotice(null); }}>
                <span className={`pf-cohort-status is-${cohort.status.toLowerCase()}`}>{statusLabel(cohort)}</span>
                <strong>{cohort.name}</strong>
                <small>{cohort.course.title}</small>
                <span className="pf-cohort-list-meta"><UsersRound aria-hidden="true" />{cohort.memberCount}/{cohort.capacity}<CalendarDays aria-hidden="true" />{formatDate(cohort.startsAt)}</span>
              </button>
            ))}
          </aside>

          <section className="pf-cohort-detail" aria-live="polite">
            {busy === "detail" && !detail ? <div className="pf-cohort-detail-loading"><LoaderCircle className="spin" aria-hidden="true" />Memuat kohort…</div> : detail ? (
              <>
                <header className="pf-cohort-detail-header">
                  <div><span>{detail.organization || "Kohort umum"}</span><h2>{detail.name}</h2><p>{detail.course.title}</p></div>
                  <span className={`pf-cohort-status is-${detail.status.toLowerCase()}`}>{statusLabel(detail)}</span>
                </header>

                <dl className="pf-cohort-metrics">
                  <div><dt>Anggota aktif</dt><dd>{activeMembers.length}<small> / {detail.capacity}</small></dd></div>
                  <div><dt>Periode</dt><dd>{formatDate(detail.startsAt)}<small>s.d. {formatDate(detail.endsAt)}</small></dd></div>
                  <div><dt>Kode tersimpan</dt><dd className="is-code">{detail.joinCodeHint || "Belum dibuat"}</dd></div>
                </dl>

                <div className="pf-cohort-access-panel">
                  <div><ShieldCheck aria-hidden="true" /><span><strong>Kode akses aman</strong><small>Kode asli tidak disimpan dan hanya muncul saat dibuat atau diganti.</small></span></div>
                  {rawCode && <div className="pf-cohort-code-reveal"><code>{rawCode}</code><button type="button" onClick={copyCode}><Clipboard aria-hidden="true" />Salin</button></div>}
                  <div className="pf-cohort-access-actions">
                    {detail.status !== "ACTIVE" && <button type="button" onClick={() => void updateStatus("ACTIVE")} disabled={busy === "status"}><Check aria-hidden="true" />Aktifkan</button>}
                    {detail.status === "ACTIVE" && <button type="button" onClick={() => void updateStatus("CLOSED")} disabled={busy === "status"}><X aria-hidden="true" />Tutup kohort</button>}
                    {detail.status === "CLOSED" && <button type="button" onClick={() => void updateStatus("ACTIVE")} disabled={busy === "status"}><RefreshCw aria-hidden="true" />Buka kembali</button>}
                    <button type="button" onClick={() => void regenerateCode()} disabled={busy === "code" || detail.status === "CLOSED"}><KeyRound aria-hidden="true" />Ganti kode</button>
                  </div>
                </div>

                <section className="pf-cohort-members" aria-labelledby="cohort-members-title">
                  <header><div><span>Roster peserta</span><h3 id="cohort-members-title">Anggota kohort</h3></div><small>{activeMembers.length} kursi terpakai</small></header>
                  <form onSubmit={addMember} className="pf-cohort-member-form">
                    <label htmlFor="cohort-member-email" className="sr-only">Email peserta</label>
                    <input id="cohort-member-email" type="email" required value={memberEmail} onChange={(event) => setMemberEmail(event.target.value)} placeholder="email.peserta@contoh.com" />
                    <button type="submit" disabled={busy === "member"}>{busy === "member" ? <LoaderCircle className="spin" aria-hidden="true" /> : <Plus aria-hidden="true" />}Tambah</button>
                    <label className="pf-cohort-transfer-check"><input type="checkbox" checked={allowTransfer} onChange={(event) => setAllowTransfer(event.target.checked)} /><span>Pindahkan bila sudah ada di kohort lain</span></label>
                  </form>
                  <div className="pf-cohort-member-list">
                    {detail.enrollments.length === 0 ? <div className="pf-cohort-member-empty">Belum ada peserta. Bagikan kode atau tambahkan akun melalui email.</div> : detail.enrollments.map((member) => (
                      <article key={member.id} className={member.accessRevokedAt ? "is-revoked" : ""}>
                        <span className="pf-cohort-member-avatar">{member.user.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span>
                        <div><strong>{member.user.name}</strong><small>{member.user.email}</small></div>
                        <span className="pf-cohort-member-progress"><i><em style={{ width: `${member.progressPercent}%` }} /></i><b>{member.progressPercent}%</b></span>
                        <span className="pf-cohort-member-source">{member.accessRevokedAt ? "Dicabut" : member.source === "ADMIN" ? "Ditambahkan admin" : "Kode akses"}</span>
                        {!member.accessRevokedAt && <button type="button" onClick={() => void revokeMember(member.user.id, member.user.name)} disabled={busy === `revoke-${member.user.id}`} aria-label={`Nonaktifkan akses ${member.user.name}`}><UserMinus aria-hidden="true" />Cabut</button>}
                        {member.accessRevokedAt && <button type="button" onClick={() => void restoreMember(member.user.id, member.user.name)} disabled={busy === `restore-${member.user.id}`} aria-label={`Pulihkan akses ${member.user.name}`}><UserCheck aria-hidden="true" />Pulihkan</button>}
                      </article>
                    ))}
                  </div>
                </section>
              </>
            ) : <div className="pf-cohort-detail-loading">Pilih kohort untuk melihat detail.</div>}
          </section>
        </div>
      ) : null}
    </div>
  );
}
