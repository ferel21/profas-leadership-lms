"use client";

import { CalendarPlus, Loader2, Pencil, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type CourseOption = { id: string; title: string };
type EditableCalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  location: string | null;
  courseId: string | null;
};

function toLocalInput(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function CalendarEventManager({
  courses,
  role,
  event,
}: {
  courses: CourseOption[];
  role: string;
  event?: EditableCalendarEvent;
}) {
  const router = useRouter();
  const editing = Boolean(event);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [startTime, setStartTime] = useState(toLocalInput(event?.startTime));
  const [endTime, setEndTime] = useState(toLocalInput(event?.endTime));
  const [location, setLocation] = useState(event?.location ?? "");
  const [courseId, setCourseId] = useState(event?.courseId ?? (role === "SUPER_ADMIN" ? "" : courses[0]?.id ?? ""));

  async function save(calendarEvent: React.FormEvent<HTMLFormElement>) {
    calendarEvent.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");

    try {
      const response = await fetch("/api/calendar", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(event ? { id: event.id } : {}),
          title,
          description,
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
          location,
          courseId,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error ?? "Jadwal belum dapat disimpan.");
      setOpen(false);
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Jadwal belum dapat disimpan.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!event || busy || !window.confirm(`Hapus jadwal “${event.title}”?`)) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/calendar?id=${encodeURIComponent(event.id)}`, { method: "DELETE" });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error ?? "Jadwal belum dapat dihapus.");
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Jadwal belum dapat dihapus.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {editing ? (
        <div className="pf-calendar-row-actions">
          <button type="button" onClick={() => setOpen(true)} aria-label={`Ubah jadwal ${event?.title}`} disabled={busy}>
            <Pencil aria-hidden="true" /> Ubah
          </button>
          <button type="button" className="danger" onClick={remove} aria-label={`Hapus jadwal ${event?.title}`} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Trash2 aria-hidden="true" />} Hapus
          </button>
          {error && <span className="pf-calendar-row-error" role="alert">{error}</span>}
        </div>
      ) : (
        <button type="button" className="btn btn-primary" onClick={() => setOpen(true)} disabled={courses.length === 0 && role !== "SUPER_ADMIN"}>
          <CalendarPlus aria-hidden="true" /> Tambah jadwal
        </button>
      )}

      {open && (
        <div className="pf-modal-backdrop" role="presentation" onKeyDown={keyEvent => keyEvent.key === "Escape" && !busy && setOpen(false)}>
          <section className="pf-modal-card" role="dialog" aria-modal="true" aria-labelledby={`calendar-modal-title-${event?.id ?? "new"}`}>
            <header className="pf-modal-header">
              <div>
                <span>Kalender akademik</span>
                <h2 id={`calendar-modal-title-${event?.id ?? "new"}`}>{editing ? "Ubah jadwal" : "Tambah jadwal"}</h2>
              </div>
              <button type="button" onClick={() => setOpen(false)} disabled={busy} aria-label="Tutup dialog"><X aria-hidden="true" /></button>
            </header>

            <form className="pf-calendar-form" onSubmit={save}>
              <div className="pf-form-field">
                <label htmlFor={`calendar-title-${event?.id ?? "new"}`}>Judul agenda</label>
                <input id={`calendar-title-${event?.id ?? "new"}`} value={title} onChange={input => setTitle(input.target.value)} maxLength={150} required autoFocus />
              </div>

              <div className="pf-form-field">
                <label htmlFor={`calendar-course-${event?.id ?? "new"}`}>Program</label>
                <select id={`calendar-course-${event?.id ?? "new"}`} value={courseId} onChange={input => setCourseId(input.target.value)} required={role !== "SUPER_ADMIN"}>
                  {role === "SUPER_ADMIN" && <option value="">Agenda global PROFAS</option>}
                  {courses.map(course => <option value={course.id} key={course.id}>{course.title}</option>)}
                </select>
              </div>

              <div className="pf-calendar-time-grid">
                <div className="pf-form-field">
                  <label htmlFor={`calendar-start-${event?.id ?? "new"}`}>Mulai</label>
                  <input id={`calendar-start-${event?.id ?? "new"}`} type="datetime-local" value={startTime} onChange={input => setStartTime(input.target.value)} required />
                </div>
                <div className="pf-form-field">
                  <label htmlFor={`calendar-end-${event?.id ?? "new"}`}>Selesai</label>
                  <input id={`calendar-end-${event?.id ?? "new"}`} type="datetime-local" value={endTime} onChange={input => setEndTime(input.target.value)} required />
                </div>
              </div>

              <div className="pf-form-field">
                <label htmlFor={`calendar-location-${event?.id ?? "new"}`}>Lokasi atau tautan pertemuan</label>
                <input id={`calendar-location-${event?.id ?? "new"}`} value={location} onChange={input => setLocation(input.target.value)} maxLength={150} placeholder="Ruang kelas atau https://..." />
              </div>

              <div className="pf-form-field">
                <label htmlFor={`calendar-description-${event?.id ?? "new"}`}>Catatan</label>
                <textarea id={`calendar-description-${event?.id ?? "new"}`} value={description} onChange={input => setDescription(input.target.value)} maxLength={500} rows={4} />
              </div>

              {error && <p className="pf-form-error" role="alert">{error}</p>}

              <div className="pf-form-actions">
                <button type="button" className="btn btn-outline" onClick={() => setOpen(false)} disabled={busy}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={busy}>
                  {busy && <Loader2 className="animate-spin" aria-hidden="true" />}
                  {busy ? "Menyimpan..." : "Simpan jadwal"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
