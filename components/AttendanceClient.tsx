"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays, CheckCircle2, ClipboardCheck, Clock3, LoaderCircle,
  LockKeyhole, Play, RefreshCw, UserCheck, UsersRound, XCircle,
} from "lucide-react";
import { initials } from "@/lib/utils";

type AttendanceStatus = "PRESENT" | "LATE" | "EXCUSED" | "ABSENT";
type RecordItem = {
  id: string;
  userId: string;
  userName: string;
  status: AttendanceStatus;
  checkedInAt: string | null;
  source: string;
};
type Participant = { id: string; name: string; email: string };
type AttendanceEvent = {
  id: string;
  title: string;
  courseTitle: string;
  startTime: string;
  endTime: string;
  attendanceEnabled: boolean;
  attendanceOpenAt: string | null;
  attendanceCloseAt: string | null;
  records: RecordItem[];
  participants: Participant[];
};

const statusLabels: Record<AttendanceStatus, string> = {
  PRESENT: "Hadir",
  LATE: "Terlambat",
  EXCUSED: "Izin",
  ABSENT: "Tidak hadir",
};

export function AttendanceClient({ role, events, serverNow }: { role: string; events: AttendanceEvent[]; serverNow: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [currentTime, setCurrentTime] = useState(serverNow);
  const isStudent = role === "STUDENT";
  const attended = events.filter(event => event.records.some(record => record.status === "PRESENT" || record.status === "LATE")).length;
  const presentRecords = events.flatMap(event => event.records).filter(record => record.status === "PRESENT" || record.status === "LATE").length;
  const expectedRecords = events.reduce((sum, event) => sum + event.participants.length, 0);
  const openSessions = events.filter(event => isOpen(event, currentTime)).length;

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date().toISOString()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  async function act(payload: Record<string, unknown>, key: string) {
    setBusy(key);
    setNotice(null);
    try {
      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error ?? "Absensi gagal diproses.");
      setNotice({ type: "success", text: result.message ?? "Absensi berhasil diperbarui." });
      router.refresh();
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Absensi gagal diproses." });
    } finally {
      setBusy("");
    }
  }

  return <>
    <div className="attendance-metrics">
      {isStudent ? <>
        <Metric icon={<UserCheck />} label="Kehadiran" value={attended} detail={`dari ${events.length} agenda`} tone="green" />
        <Metric icon={<Play />} label="Sesi dibuka" value={openSessions} detail="dapat diisi sekarang" tone="blue" />
        <Metric icon={<CalendarDays />} label="Total agenda" value={events.length} detail="30 hari terakhir & berikutnya" tone="orange" />
      </> : <>
        <Metric icon={<ClipboardCheck />} label="Sesi absensi" value={events.filter(event => event.attendanceEnabled).length} detail={`dari ${events.length} agenda`} tone="blue" />
        <Metric icon={<Play />} label="Sedang dibuka" value={openSessions} detail="sesi aktif saat ini" tone="green" />
        <Metric icon={<UsersRound />} label="Tercatat hadir" value={presentRecords} detail={`dari ${expectedRecords} peserta terjadwal`} tone="orange" />
      </>}
    </div>

    {notice && <div className={`attendance-notice ${notice.type}`} role="status">
      {notice.type === "success" ? <CheckCircle2 /> : <XCircle />}<span>{notice.text}</span>
    </div>}

    <div className="attendance-list">
      {events.length === 0 && <div className="attendance-empty data-card"><CalendarDays /><h2>Belum ada agenda</h2><p>Agenda course pada rentang 30 hari akan muncul di sini.</p></div>}
      {events.map(event => {
        const open = isOpen(event, currentTime);
        const myRecord = isStudent ? event.records[0] : undefined;
        return <article className={`attendance-card data-card ${open ? "is-open" : ""}`} key={event.id}>
          <header className="attendance-card-head">
            <div className="attendance-date"><b>{day(event.startTime)}</b><span>{month(event.startTime)}</span></div>
            <div className="attendance-event-title">
              <span>{event.courseTitle}</span>
              <h2>{event.title}</h2>
              <p><Clock3 /> {dateTime(event.startTime)} – {time(event.endTime)}</p>
            </div>
            <span className={`session-state ${open ? "open" : "closed"}`}>{open ? <><i /> Dibuka</> : <><LockKeyhole /> Ditutup</>}</span>
          </header>

          {isStudent ? <div className="student-attendance-action">
            <div>
              <span>Status kehadiran Anda</span>
              {myRecord ? <b className={`attendance-status status-${myRecord.status.toLowerCase()}`}>{statusLabels[myRecord.status]}</b> : <b className="attendance-status status-pending">Belum absen</b>}
              {myRecord?.checkedInAt && <small>Tercatat {dateTime(myRecord.checkedInAt)}</small>}
            </div>
            <button className="btn btn-primary" disabled={!open || !!myRecord || busy === event.id} onClick={() => act({ action: "check_in", eventId: event.id }, event.id)}>
              {busy === event.id ? <><LoaderCircle className="spin" /> Mencatat...</> : myRecord ? <><CheckCircle2 /> Sudah tercatat</> : <><UserCheck /> Absen sekarang</>}
            </button>
          </div> : <>
            <div className="attendance-manager-bar">
              <div><b>{event.records.length}/{event.participants.length}</b><span> status peserta tercatat</span></div>
              <div>
                <button className="btn btn-outline btn-small" disabled={busy === event.id || !open} onClick={() => act({ action: "close", eventId: event.id }, event.id)}><LockKeyhole /> Tutup</button>
                <button className="btn btn-primary btn-small" disabled={busy === event.id || open} onClick={() => act({ action: "open", eventId: event.id, durationMinutes: 60 }, event.id)}>
                  {busy === event.id ? <LoaderCircle className="spin" /> : <RefreshCw />} {event.attendanceEnabled ? "Buka kembali" : "Buka 60 menit"}
                </button>
              </div>
            </div>
            <div className="attendance-table-wrap">
              <table className="attendance-table">
                <thead><tr><th>Peserta</th><th>Waktu</th><th>Sumber</th><th>Status</th></tr></thead>
                <tbody>
                  {event.participants.length === 0 && <tr><td colSpan={4} className="attendance-table-empty">Belum ada peserta pada agenda ini.</td></tr>}
                  {event.participants.map(participant => {
                    const record = event.records.find(item => item.userId === participant.id);
                    const rowKey = `${event.id}:${participant.id}`;
                    return <tr key={participant.id}>
                      <td><div className="attendance-person"><span>{initials(participant.name)}</span><div><b>{participant.name}</b><small>{participant.email}</small></div></div></td>
                      <td>{record?.checkedInAt ? time(record.checkedInAt) : "—"}</td>
                      <td>{record ? sourceLabel(record.source) : "—"}</td>
                      <td><select value={record?.status ?? ""} disabled={busy === rowKey} onChange={eventInput => eventInput.target.value && act({ action: "mark", eventId: event.id, userId: participant.id, status: eventInput.target.value }, rowKey)}>
                        <option value="">Belum tercatat</option>
                        {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select></td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
          </>}
        </article>;
      })}
    </div>
  </>;
}

function Metric({ icon, label, value, detail, tone }: { icon: React.ReactNode; label: string; value: number; detail: string; tone: string }) {
  return <article className="attendance-metric data-card"><span className={tone}>{icon}</span><div><small>{label}</small><b>{value}</b><p>{detail}</p></div></article>;
}

function isOpen(event: AttendanceEvent, nowValue: string) {
  if (!event.attendanceEnabled || !event.attendanceOpenAt || !event.attendanceCloseAt) return false;
  const now = new Date(nowValue).getTime();
  return now >= new Date(event.attendanceOpenAt).getTime() && now <= new Date(event.attendanceCloseAt).getTime();
}

const formatter = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Makassar", ...options });
const day = (value: string) => formatter({ day: "2-digit" }).format(new Date(value));
const month = (value: string) => formatter({ month: "short" }).format(new Date(value));
const time = (value: string) => formatter({ hour: "2-digit", minute: "2-digit" }).format(new Date(value));
const dateTime = (value: string) => formatter({ day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
const sourceLabel = (source: string) => source === "SELF" ? "Mandiri" : source === "SYSTEM" ? "Sistem" : source === "MENTOR" ? "Mentor" : "Admin";
