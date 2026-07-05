import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DashboardChrome } from "@/components/DashboardChrome";
import { FileCheck2, Search, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { initials } from "@/lib/utils";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Makassar" }).format(date);
}

export default async function MentorEvaluasiPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "MENTOR") redirect("/masuk");

  const attempts = await prisma.assessmentAttempt.findMany({
    where: { assessment: { course: { mentorId: user.id } } },
    orderBy: { submittedAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      assessment: {
        select: {
          title: true,
          type: true,
          course: { select: { title: true } }
        }
      }
    }
  });

  return (
    <DashboardChrome user={user}>
      <div className="dash-title">
        <div>
          <p>Evaluasi Peserta</p>
          <h1>Riwayat Evaluasi</h1>
          <small>Daftar seluruh kiriman evaluasi dan kuis dari peserta program Anda.</small>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ position: "relative", display: "flex" }}>
            <Search size={16} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
            <input type="text" placeholder="Cari nama atau email..." style={{ padding: "0.5rem 1rem 0.5rem 2.25rem", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "0.875rem", width: "250px", background: "white" }} />
          </div>
        </div>
      </div>

      <div className="glass hover-lift" style={{ borderRadius: '15px', overflow: 'hidden', border: '1px solid var(--line)' }}>
        {attempts.length ? (
          <div className="member-table" style={{ fontSize: '13px' }}>
            <div className="table-row table-head" style={{ gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr 1fr', padding: '16px', background: '#f8fafc', borderBottom: '1px solid var(--line)', color: 'var(--muted)', fontSize: '11px', fontWeight: 'bold' }}>
              <span>Peserta</span>
              <span>Program</span>
              <span>Evaluasi</span>
              <span>Waktu</span>
              <span>Skor / Status</span>
            </div>
            {attempts.map(attempt => (
              <div className="table-row hover-lift" key={attempt.id} style={{ gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr 1fr', padding: '16px', borderBottom: '1px solid var(--line)', background: 'white' }}>
                <span className="member-name" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <i style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e4f3f2', color: '#2e6c68', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontStyle: 'normal' }}>
                    {initials(attempt.user.name)}
                  </i>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: '600', color: 'var(--ink)' }}>{attempt.user.name}</span>
                    <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{attempt.user.email}</span>
                  </div>
                </span>
                <span style={{ color: 'var(--ink)' }}>{attempt.assessment.course.title}</span>
                <span style={{ color: 'var(--ink)' }}>
                  {attempt.assessment.title}
                  <small style={{ display: 'block', fontSize: '10px', color: 'var(--teal-dark)', fontWeight: 'bold' }}>{attempt.assessment.type}</small>
                </span>
                <span style={{ color: 'var(--muted)', fontSize: '12px' }}>{formatDate(attempt.submittedAt)}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                  {attempt.status === 'PENDING_GRADE' ? (
                    <Link href={`/mentor/evaluasi/${attempt.id}`} className="btn btn-primary btn-small" style={{ fontSize: '11px', padding: '4px 8px' }}>
                      Beri Nilai
                    </Link>
                  ) : (
                    <div style={{ color: attempt.passed ? 'var(--teal-dark)' : '#e11d48', display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {attempt.score}
                      {attempt.passed ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                      <Link href={`/mentor/evaluasi/${attempt.id}`} style={{ color: 'var(--muted)', marginLeft: '8px' }} title="Lihat Detail">
                        <FileCheck2 size={14} />
                      </Link>
                    </div>
                  )}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>
            <FileCheck2 size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p>Belum ada evaluasi yang dikirim peserta.</p>
          </div>
        )}
      </div>
    </DashboardChrome>
  );
}
