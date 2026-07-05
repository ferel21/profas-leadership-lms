"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Award, BookOpen, Check, CheckCircle2, ChevronDown, ChevronRight, ChevronLeft, Clock3, Download, FileText, Film, Image as ImageIcon, Link2, LoaderCircle, Menu, MessageSquare, Play, Send, X, Folder, FileCheck, FileCode } from "lucide-react";
import { initials } from "@/lib/utils";
import { CompletionCelebration } from "./CompletionCelebration";
import { AILeadershipTutor } from "./AILeadershipTutor";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { jsPDF } from "jspdf";

export type NodeType = "FOLDER" | "VIDEO" | "PDF" | "DOCUMENT" | "IMAGE" | "LINK" | "QUIZ" | "ASSIGNMENT" | "TEXT";

export type DiscussionPost = { id: string; content: string; createdAt: Date | string; user: { id: string; name: string } };
export type CourseNode = {
  id: string;
  parentId: string | null;
  title: string;
  type: NodeType;
  order: number;
  durationMin: number;
  content: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  assessmentId: string | null;
  children: CourseNode[];
  completed: boolean;
  discussionPosts: DiscussionPost[];
};
type CourseAssessment = { id: string; title: string; type: string };
type PlayerProps = {
  course: { id: string; slug: string; title: string; assessments: CourseAssessment[]; nodes: CourseNode[] };
  initialLessonId: string;
  currentUser: { id: string; name: string };
};

function typeIcon(type: NodeType) {
  switch (type) {
    case "FOLDER": return <Folder />;
    case "PDF": case "DOCUMENT": case "TEXT": return <FileText />;
    case "VIDEO": return <Film />;
    case "IMAGE": return <ImageIcon />;
    case "LINK": return <Link2 />;
    default: return <Download />;
  }
}

export function CoursePlayer({ course, initialLessonId, currentUser }: PlayerProps) {
  // Flatten tree to get ordered lessons for previous/next navigation
  const flatLessons = useMemo(() => {
    const list: CourseNode[] = [];
    const traverse = (nodes: CourseNode[]) => {
      for (const node of nodes) {
        if (node.type !== "FOLDER") {
          list.push(node);
        }
        traverse(node.children);
      }
    };
    traverse(course.nodes);
    return list;
  }, [course.nodes]);

  const [currentId, setCurrentId] = useState(initialLessonId);
  const [done, setDone] = useState(new Set(flatLessons.filter(n => n.completed).map(n => n.id)));
  const [posts, setPosts] = useState<Record<string, DiscussionPost[]>>(() => {
    const p: Record<string, DiscussionPost[]> = {};
    flatLessons.forEach(n => p[n.id] = n.discussionPosts);
    return p;
  });
  const [sidebar, setSidebar] = useState(false);
  const [tab, setTab] = useState("materi");
  const [busy, setBusy] = useState(false);
  const [discussion, setDiscussion] = useState("");
  const [message, setMessage] = useState("");
  const [lessonCelebrated, setLessonCelebrated] = useState<string | null>(null);
  const [courseCelebration, setCourseCelebration] = useState<{ certNum: string } | null>(null);
  const [noteText, setNoteText] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && currentId) {
      const saved = localStorage.getItem(`profas_notes_${currentId}_${currentUser.id}`);
      setNoteText(saved || "");
    }
  }, [currentId, currentUser.id]);

  function saveNote() {
    if (typeof window !== "undefined" && currentId) {
      localStorage.setItem(`profas_notes_${currentId}_${currentUser.id}`, noteText);
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 2500);
    }
  }

  function downloadNote() {
    if (!noteText.trim() || !current) return;
    const blob = new Blob([`Catatan Pembelajaran PROFAS Leadership\nModul: ${current.title}\nPeserta: ${currentUser.name}\nTanggal: ${new Date().toLocaleDateString("id-ID")}\n\n--- CATATAN ---\n\n${noteText}`], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Catatan-PROFAS-${current.title.replace(/[^a-zA-Z0-9]/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function downloadNoteDocx() {
    if (!noteText.trim() || !current) return;
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({ text: "Jurnal & Catatan Pembelajaran PROFAS Leadership", heading: HeadingLevel.TITLE }),
          new Paragraph({ text: `Modul: ${current.title}`, heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: `Peserta: ${currentUser.name} | Tanggal: ${new Date().toLocaleDateString("id-ID")}` }),
          new Paragraph({ text: "" }),
          ...noteText.split("\n").map(line => new Paragraph({ children: [new TextRun(line)] }))
        ]
      }]
    });
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Catatan-PROFAS-${current.title.replace(/[^a-zA-Z0-9]/g, "-")}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadNotePdf() {
    if (!noteText.trim() || !current) return;
    const pdf = new jsPDF();
    pdf.setFontSize(18);
    pdf.setTextColor(13, 148, 136); // Teal #0d9488
    pdf.text("Catatan Pembelajaran PROFAS Leadership", 15, 20);
    pdf.setFontSize(12);
    pdf.setTextColor(50, 50, 50);
    pdf.text(`Modul: ${current.title}`, 15, 30);
    pdf.text(`Peserta: ${currentUser.name} | Tanggal: ${new Date().toLocaleDateString("id-ID")}`, 15, 38);
    pdf.setLineWidth(0.5);
    pdf.line(15, 42, 195, 42);
    pdf.setFontSize(11);
    const lines = pdf.splitTextToSize(noteText, 180);
    pdf.text(lines, 15, 50);
    pdf.save(`Catatan-PROFAS-${current.title.replace(/[^a-zA-Z0-9]/g, "-")}.pdf`);
  }

  const current = flatLessons.find(n => n.id === currentId) ?? flatLessons[0];
  const index = flatLessons.findIndex(n => n.id === current.id);
  const currentPosts = posts[current?.id] ?? [];

  function selectLesson(id: string) { setCurrentId(id); setSidebar(false); setMessage(""); setDiscussion(""); setNoteSaved(false); }

  async function complete() {
    if (!current) return;
    if (done.has(current.id)) { if (index < flatLessons.length - 1) selectLesson(flatLessons[index + 1].id); return }
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/progress", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "complete", courseId: course.id, lessonId: current.id }) });
      if (!response.ok) { setMessage("Progres belum dapat disimpan. Coba lagi."); setBusy(false); return }
      
      const resData = await response.json() as { eligible?: boolean; certificateNumber?: string | null };
      const next = new Set(done); next.add(current.id); setDone(next); setBusy(false);

      if (resData.eligible && resData.certificateNumber) {
        setCourseCelebration({ certNum: resData.certificateNumber });
      } else {
        setLessonCelebrated(current.title);
        setTimeout(() => {
          setLessonCelebrated(null);
          if (index < flatLessons.length - 1) selectLesson(flatLessons[index + 1].id);
        }, 1800);
      }
    } catch { setMessage("Koneksi bermasalah. Progres belum disimpan."); setBusy(false) }
  }

  async function submitDiscussion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!current) return;
    const value = discussion.trim();
    if (value.length < 3) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/discussions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lessonId: current.id, content: value }) });
      if (!response.ok) { setMessage("Diskusi belum dapat dikirim. Coba lagi."); setBusy(false); return }
      const post = await response.json() as DiscussionPost;
      setPosts(previous => ({ ...previous, [current.id]: [...(previous[current.id] ?? []), post] }));
      setDiscussion(""); setBusy(false);
    } catch { setMessage("Koneksi bermasalah. Diskusi belum dikirim."); setBusy(false) }
  }

  const percent = Math.round(done.size / Math.max(flatLessons.length, 1) * 100);

  const renderTree = (nodes: CourseNode[]) => {
    return nodes.map(node => {
      if (node.type === "FOLDER") {

        return (
          <details key={node.id} open>
            <summary>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Folder size={16} /> <b>{node.title}</b>
              </div>
              <ChevronDown />
            </summary>
            <div style={{ marginLeft: '12px', paddingLeft: '8px', borderLeft: '1px solid var(--line)' }}>
              {renderTree(node.children)}
            </div>
          </details>
        );
      }
      return (
        <button key={node.id} onClick={() => selectLesson(node.id)} className={node.id === current?.id ? "active" : ""}>
          {done.has(node.id) ? <CheckCircle2 /> : typeIcon(node.type)}
          <span>{node.title} <small>{node.durationMin} menit</small></span>
        </button>
      );
    });
  };

  if (!current) return <div className="player-layout">Belum ada materi.</div>;

  return (
    <div className="player-layout">
      {lessonCelebrated && <CompletionCelebration mode="lesson" lessonTitle={lessonCelebrated} onDismiss={() => setLessonCelebrated(null)} />}
      {courseCelebration && <CompletionCelebration mode="course" courseTitle={course.title} userName={currentUser.name} certificateNumber={courseCelebration.certNum} />}

      <aside className={`player-sidebar ${sidebar ? "open" : ""}`}>
        <div className="player-course">
          <Link href="/dashboard" aria-label="Kembali ke dashboard"><ChevronLeft /></Link>
          <div><small>PROGRAM</small><b>{course.title}</b></div>
          <button onClick={() => setSidebar(false)} aria-label="Tutup daftar materi"><X /></button>
        </div>
        <div className="overall-progress"><span><b>Progres Anda</b><strong>{percent}%</strong></span><i><em style={{ width: `${percent}%` }} /></i></div>
        {course.assessments.length > 0 && <div className="course-assessments">{course.assessments.map(assessment => <Link href={`/evaluasi/${assessment.id}`} key={assessment.id}><Award /><span><b>{assessment.title}</b><small>{assessment.type === "PRETEST" ? "Pemetaan awal" : "Evaluasi akhir"}</small></span><ChevronRight /></Link>)}</div>}
        <div className="module-list">{renderTree(course.nodes)}</div>
      </aside>
      {sidebar && <button className="player-backdrop" onClick={() => setSidebar(false)} aria-label="Tutup daftar materi" />}
      <main className="player-main">
        <header><button onClick={() => setSidebar(true)} aria-label="Buka daftar materi"><Menu /></button><div><span>{current.title}</span><b>{current.title}</b></div><Link href="/dashboard">Keluar Kelas</Link></header>
        <section className="lesson-stage" style={{ marginBottom: "2rem" }}>
          {current.type === "VIDEO" ? (
            <div className="video-shell hover-lift glass" style={{ borderRadius: "24px", padding: "12px", background: "rgba(255,255,255,0.4)" }}>
              <div style={{ position: "relative", width: "100%", paddingTop: "56.25%", borderRadius: "16px", overflow: "hidden", background: "#0b2229", zIndex: 1 }}>
                <iframe src={current.content || undefined} title={current.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0, zIndex: 2 }} />
                <div className="video-fallback" style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}><Play fill="currentColor" style={{ width: "60px", color: "white" }} /></div>
              </div>
            </div>
          ) : (current.type === "QUIZ" || current.type === "ASSIGNMENT") ? (
            <article className="pro-quiz-launch-card pro-glass-card hover-lift" style={{ maxWidth: '1080px', margin: '2rem auto', textAlign: 'center' }}>
              <div className="pro-pulse-badge" style={{ width: '88px', height: '88px', background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'white', boxShadow: '0 8px 25px rgba(13, 148, 136, 0.4)' }}>
                {current.type === "QUIZ" ? <Award size={44} /> : <FileCheck size={44} />}
              </div>
              <span className="eyebrow" style={{ color: 'var(--color-primary)', fontWeight: 'bold', fontSize: '14px', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                {current.type === "QUIZ" ? "⚡ EVALUASI & KUIS PEMAHAMAN PRO" : "💼 TUGAS EKSEKUTIF & STUDI KASUS"}
              </span>
              <h1 style={{ marginTop: '0.75rem', marginBottom: '1.25rem', fontSize: '38px', color: 'var(--ink)', fontWeight: 800, letterSpacing: '-0.5px' }}>
                {current.title}
              </h1>
              <p style={{ maxWidth: '640px', margin: '0 auto 2.5rem', fontSize: '1.2rem', color: '#475569', lineHeight: 1.7 }}>
                {current.content || (current.type === "QUIZ" 
                  ? "Uji tingkat pemahaman strategi dan konsep kepemimpinan Anda pada modul ini. Klik tombol di bawah untuk memulai kuis interaktif." 
                  : "Selesaikan instruksi tugas eksekutif ini untuk memvalidasi penerapan kepemimpinan Anda di lapangan nyata.")}
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link 
                  href={`/evaluasi/${current.assessmentId || current.id}`} 
                  className="pro-btn-glow hover-lift" 
                  style={{ padding: '18px 42px', fontSize: '18px', borderRadius: '16px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}
                >
                  <Play fill="currentColor" size={22} /> Mulai {current.type === "QUIZ" ? "Mengerjakan Kuis" : "Mengerjakan Tugas"} Sekarang 🚀
                </Link>
              </div>
              <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'center', gap: '2.5rem', color: '#64748b', fontSize: '15px', fontWeight: 600 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f0fdfa', padding: '6px 14px', borderRadius: '20px', color: 'var(--color-primary-dark)' }}><Clock3 size={18} /> Durasi: {current.durationMin || 30} Menit</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fef3c7', padding: '6px 14px', borderRadius: '20px', color: '#b45309' }}><CheckCircle2 size={18} /> Bobot Nilai: 100 Poin</span>
              </div>
            </article>
          ) : (
            <article className="pro-glass-card hover-lift" style={{ maxWidth: '1080px', margin: '2rem auto', padding: '3.5rem', borderRadius: '24px' }}>
              <span className="eyebrow" style={{ color: 'var(--color-primary)', fontWeight: 'bold', letterSpacing: '1px' }}>📖 MATERI BACAAN EKSKLUSIF</span>
              <h1 style={{ marginTop: '0.75rem', marginBottom: '1.75rem', fontSize: '40px', color: 'var(--ink)', fontWeight: 800, letterSpacing: '-0.5px' }}>{current.title}</h1>
              <div style={{ lineHeight: 1.9, fontSize: '1.18rem', color: '#334155' }}>{current.content}</div>
              {current.fileUrl && (
                <a className="pro-btn-glow hover-lift" href={current.fileUrl} target="_blank" rel="noreferrer" style={{ marginTop: '2rem', display: 'inline-flex', alignItems: 'center', padding: '14px 28px', borderRadius: '12px', textDecoration: 'none', fontSize: '16px' }}><Download size={18} style={{ marginRight: '10px' }} /> Unduh Berkas Materi</a>
              )}
            </article>
          )}
        </section>
        <nav className="lesson-tabs" aria-label="Informasi materi">
          <button onClick={() => setTab("materi")} className={tab === "materi" ? "active" : ""}><BookOpen /> Materi</button>
          <button onClick={() => setTab("diskusi")} className={tab === "diskusi" ? "active" : ""}><MessageSquare /> Diskusi <span>{currentPosts.length}</span></button>
          <button onClick={() => setTab("lampiran")} className={tab === "lampiran" ? "active" : ""}><Download /> Lampiran</button>
          <button onClick={() => setTab("catatan")} className={tab === "catatan" ? "active" : ""}><FileText /> Catatan Saya</button>
        </nav>
        <section className="lesson-notes glass" style={{ maxWidth: '1080px', margin: '0 auto 4rem', width: '100%', padding: '2.5rem', borderRadius: '0 0 24px 24px', background: 'rgba(255,255,255,0.7)', border: '1px solid var(--line)', borderTop: 'none' }}>
          {tab === "materi" && <>
            <h2>Deskripsi</h2>
            <p>{current.content}</p>
          </>}
          {tab === "diskusi" && <><h2>Diskusi bersama</h2>{currentPosts.length === 0 ? <p>Belum ada diskusi. Jadilah yang pertama membagikan refleksi.</p> : <div className="discussion-list">{currentPosts.map(post => <div className="discussion" key={post.id}><b>{initials(post.user.name)}</b><p><strong>{post.user.id === currentUser.id ? "Anda" : post.user.name}</strong>{post.content}</p></div>)}</div>}<form className="discussion-form" onSubmit={submitDiscussion}><textarea value={discussion} onChange={event => setDiscussion(event.target.value)} placeholder="Bagikan pemikiran atau pertanyaan Anda..." maxLength={1000} aria-label="Pesan diskusi" /><button type="submit" className="btn btn-primary btn-small" disabled={busy || discussion.trim().length < 3}>{busy ? <LoaderCircle className="spin" /> : <><Send /> Kirim</>}</button></form></>}
          {tab === "lampiran" && (
            <div className="materials-container">
              <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem", color: "var(--ink)" }}>Lampiran & Berkas Pendukung</h2>
              <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>Unduh berkas materi, lembar kerja eksekutif, dan panduan belajar untuk modul ini.</p>
              {current.fileUrl ? (
                <div className="materials-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
                  <a href={current.fileUrl} target="_blank" rel="noreferrer" className="material-download-card glass hover-lift" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1.25rem", borderRadius: "16px", textDecoration: "none", color: "var(--ink)" }}>
                    <div style={{ background: "#f0fdfa", color: "var(--color-primary)", padding: "12px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Download size={24} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{current.fileName || "Berkas Materi Pembelajaran"}</h3>
                      <small style={{ color: "#64748b" }}>{current.fileSize ? `${Math.round(current.fileSize / 1024)} KB` : "Dokumen Resmi PROFAS"}</small>
                    </div>
                    <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-primary)", background: "#e0f2fe", padding: "4px 10px", borderRadius: "20px" }}>Unduh</span>
                  </a>
                </div>
              ) : (
                <div className="glass" style={{ padding: "2.5rem", textAlign: "center", borderRadius: "16px", color: "#64748b" }}>
                  <Folder size={40} style={{ margin: "0 auto 1rem", opacity: 0.5 }} />
                  <p style={{ margin: 0, fontWeight: 500 }}>Tidak ada berkas lampiran khusus untuk sesi ini.</p>
                  <small>Seluruh intisari pembelajaran telah tertuang pada teks materi dan video di atas.</small>
                </div>
              )}
            </div>
          )}
          {tab === "catatan" && (
            <div className="notes-container">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <h2 style={{ fontSize: "1.5rem", margin: 0, color: "var(--ink)" }}>Catatan & Jurnal Refleksi Eksekutif</h2>
                  <small style={{ color: "#64748b" }}>Catatan ini tersimpan secara lokal dan dapat diunduh ke berbagai format dokumen resmi.</small>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <button type="button" onClick={downloadNote} disabled={!noteText.trim()} className="btn btn-outline btn-small" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <Download size={14} /> Txt
                  </button>
                  <button type="button" onClick={downloadNoteDocx} disabled={!noteText.trim()} className="btn btn-outline btn-small" style={{ display: "inline-flex", alignItems: "center", gap: "6px", borderColor: "#2563eb", color: "#2563eb", fontWeight: 600 }}>
                    <FileCheck size={14} /> Word (.docx)
                  </button>
                  <button type="button" onClick={downloadNotePdf} disabled={!noteText.trim()} className="btn btn-outline btn-small" style={{ display: "inline-flex", alignItems: "center", gap: "6px", borderColor: "#dc2626", color: "#dc2626", fontWeight: 600 }}>
                    <FileCode size={14} /> PDF (.pdf)
                  </button>
                  <button type="button" onClick={saveNote} className="btn btn-primary btn-small" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <CheckCircle2 size={14} /> {noteSaved ? "Tersimpan!" : "Simpan"}
                  </button>
                </div>
              </div>
              <textarea
                value={noteText}
                onChange={e => { setNoteText(e.target.value); setNoteSaved(false); }}
                placeholder="Tulis poin-poin penting, kepanjangan akronim, strategi eksekusi, atau ide kepemimpinan yang Anda dapatkan dari modul ini..."
                style={{ width: "100%", minHeight: "220px", padding: "1.25rem", borderRadius: "16px", border: "1px solid var(--line)", background: "rgba(255,255,255,0.8)", fontSize: "1rem", lineHeight: 1.6, color: "var(--ink)", fontFamily: "inherit", resize: "vertical", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)" }}
              />
              {noteSaved && <p style={{ color: "#10b981", fontSize: "0.875rem", marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "4px" }}><CheckCircle2 size={14} /> Catatan berhasil disimpan ke perangkat Anda.</p>}
            </div>
          )}
          {message && <p className="player-message" role="alert">{message}</p>}

          {/* AI Leadership Tutor Widget */}
          <AILeadershipTutor lessonTitle={current.title} />
        </section>
        <footer className="player-footer">
          <button disabled={index === 0} onClick={() => selectLesson(flatLessons[index - 1].id)}><ChevronLeft /> Sebelumnya</button>
          <span><Clock3 /> {current.durationMin} menit</span>
          <button className="complete-btn" onClick={complete} disabled={busy}>{busy ? <LoaderCircle className="spin" /> : done.has(current.id) ? <><Check /> {index < flatLessons.length - 1 ? "Materi berikutnya" : "Sudah selesai"}</> : <>Tandai selesai <ChevronRight /></>}</button>
        </footer>
      </main>
    </div>
  );
}
