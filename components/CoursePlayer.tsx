"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, Award, BookOpen, Check, CheckCircle2, ChevronDown, ChevronRight, ChevronLeft, Clock3, Download, FileText, Film, Image as ImageIcon, Link2, LoaderCircle, Menu, MessageSquare, Play, Send, X, Folder, FileCheck, FileCode, RefreshCw } from "lucide-react";
import { initials } from "@/lib/utils";
import { CompletionCelebration } from "./CompletionCelebration";
import { AILeadershipTutor } from "./AILeadershipTutor";

export type NodeType = "FOLDER" | "VIDEO" | "PDF" | "DOCUMENT" | "IMAGE" | "LINK" | "QUIZ" | "ASSIGNMENT" | "TEXT";

export type DiscussionPost = { id: string; content: string; createdAt: Date | string; user: { id: string; name: string } };
export type CourseNode = {
  id: string;
  parentId: string | null;
  title: string;
  description: string | null;
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
type AssessmentFeedback = {
  score: number;
  passed: boolean;
  status: string;
  feedback: string | null;
  submittedAt: string;
};
type PlayerProps = {
  course: { id: string; slug: string; title: string; assessments: CourseAssessment[]; nodes: CourseNode[] };
  initialLessonId: string;
  currentUser: { id: string; name: string };
};

function typeIcon(type: NodeType) {
  switch (type) {
    case "FOLDER": return <Folder aria-hidden="true" />;
    case "PDF": case "DOCUMENT": case "TEXT": return <FileText aria-hidden="true" />;
    case "VIDEO": return <Film aria-hidden="true" />;
    case "IMAGE": return <ImageIcon aria-hidden="true" />;
    case "LINK": return <Link2 aria-hidden="true" />;
    case "QUIZ": return <Award aria-hidden="true" />;
    case "ASSIGNMENT": return <CheckCircle2 aria-hidden="true" />;
    default: return <FileText aria-hidden="true" />;
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
  const [resumeReady, setResumeReady] = useState(false);
  const [resumeLessonId, setResumeLessonId] = useState<string | null>(null);
  const [assessmentFeedback, setAssessmentFeedback] = useState<AssessmentFeedback | null>(null);
  const [assessmentLoading, setAssessmentLoading] = useState(false);
  const [assessmentLoadError, setAssessmentLoadError] = useState("");
  const [assessmentRefreshToken, setAssessmentRefreshToken] = useState(0);
  const [mediaError, setMediaError] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && currentId) {
      const saved = localStorage.getItem(`profas_notes_${currentId}_${currentUser.id}`);
      setNoteText(saved || "");
    }
  }, [currentId, currentUser.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = `profas_resume_${course.id}_${currentUser.id}`;
    const saved = localStorage.getItem(key);
    if (saved && flatLessons.some(lesson => lesson.id === saved)) {
      setCurrentId(saved);
      setResumeLessonId(saved === initialLessonId ? null : saved);
    }
    setResumeReady(true);
  }, [course.id, currentUser.id, flatLessons, initialLessonId]);

  useEffect(() => {
    if (typeof window !== "undefined" && resumeReady && currentId) {
      localStorage.setItem(`profas_resume_${course.id}_${currentUser.id}`, currentId);
    }
  }, [course.id, currentId, currentUser.id, resumeReady]);

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
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import("docx");
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

  async function downloadNotePdf() {
    if (!noteText.trim() || !current) return;
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF();
    pdf.setFontSize(18);
    pdf.setTextColor(42, 107, 167); // Royal Blue #2a6ba7
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
  const index = current ? flatLessons.findIndex(n => n.id === current.id) : -1;
  const currentPosts = posts[current?.id] ?? [];
  const currentLinkHref = current?.fileUrl || (current?.content && /^https?:\/\//i.test(current.content) ? current.content : null);

  useEffect(() => {
    let cancelled = false;
    const assessmentId = current?.type === "QUIZ" || current?.type === "ASSIGNMENT"
      ? current.assessmentId || current.id
      : null;
    setAssessmentFeedback(null);
    setAssessmentLoadError("");
    if (!assessmentId) {
      setAssessmentLoading(false);
      return;
    }
    setAssessmentLoading(true);
    fetch(`/api/assessments/${assessmentId}/result`, { cache: "no-store" })
      .then(async response => {
        const data = await response.json().catch(() => null) as { result?: AssessmentFeedback | null; message?: string } | null;
        if (!response.ok) throw new Error(data?.message || "Riwayat evaluasi belum dapat dimuat.");
        if (!cancelled) setAssessmentFeedback(data?.result ?? null);
      })
      .catch(error => {
        if (!cancelled) setAssessmentLoadError(error instanceof Error ? error.message : "Riwayat evaluasi belum dapat dimuat.");
      })
      .finally(() => {
        if (!cancelled) setAssessmentLoading(false);
      });
    return () => { cancelled = true; };
  }, [assessmentRefreshToken, current?.assessmentId, current?.id, current?.type]);

  function selectLesson(id: string) {
    setCurrentId(id);
    setSidebar(false);
    setMessage("");
    setDiscussion("");
    setNoteSaved(false);
    setMediaError(false);
  }

  function goPrevious() {
    if (index > 0) selectLesson(flatLessons[index - 1].id);
  }

  function goNext() {
    if (index < flatLessons.length - 1) selectLesson(flatLessons[index + 1].id);
  }

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
  const remainingCount = Math.max(flatLessons.length - done.size, 0);
  const nextIncomplete = flatLessons.find(lesson => !done.has(lesson.id));

  function getModuleLessons(nodes: CourseNode[]): CourseNode[] {
    return nodes.flatMap(node => node.type === "FOLDER" ? getModuleLessons(node.children) : [node]);
  }

  function moduleSummary(node: CourseNode) {
    const lessons = getModuleLessons(node.children);
    const completed = lessons.filter(lesson => done.has(lesson.id)).length;
    return { completed, total: lessons.length, percent: lessons.length ? Math.round(completed / lessons.length * 100) : 0 };
  }

  const renderTree = (nodes: CourseNode[]) => {
    return nodes.map(node => {
      if (node.type === "FOLDER") {
        const summary = moduleSummary(node);
        return (
          <details key={node.id} open>
            <summary>
              <div className="player-tree-folder">
                <Folder size={16} aria-hidden="true" /> <b>{node.title}</b>
                <small>{summary.completed}/{summary.total} selesai</small>
                <i className="player-module-meter" aria-hidden="true"><em style={{ width: `${summary.percent}%` }} /></i>
              </div>
              <ChevronDown aria-hidden="true" />
            </summary>
            <div className="player-tree-children">
              {renderTree(node.children)}
            </div>
          </details>
        );
      }
      const badgeText = node.type === "QUIZ" ? "Kuis • " : node.type === "ASSIGNMENT" ? "Tugas • " : "";
      return (
        <button type="button" key={node.id} onClick={() => selectLesson(node.id)} className={node.id === current?.id ? "active" : ""} aria-current={node.id === current?.id ? "page" : undefined} aria-label={`${node.title}${done.has(node.id) ? ", selesai" : ", belum selesai"}`}>
          {done.has(node.id) ? <CheckCircle2 aria-hidden="true" /> : typeIcon(node.type)}
          <span>{node.title} <small>{badgeText}{node.durationMin} menit</small></span>
        </button>
      );
    });
  };

  if (!current) return (
    <main className="player-empty-state" aria-live="polite">
      <BookOpen size={42} aria-hidden="true" />
      <h1>Belum ada materi</h1>
      <p>Mentor belum menambahkan materi untuk program ini.</p>
      <Link href="/dashboard" className="btn btn-primary">Kembali ke dashboard</Link>
    </main>
  );

  return (
    <div className="player-layout">
      {lessonCelebrated && <CompletionCelebration mode="lesson" lessonTitle={lessonCelebrated} onDismiss={() => setLessonCelebrated(null)} />}
      {courseCelebration && <CompletionCelebration mode="course" courseTitle={course.title} userName={currentUser.name} certificateNumber={courseCelebration.certNum} />}

      <aside className={`player-sidebar ${sidebar ? "open" : ""}`} aria-label="Daftar materi program">
        <div className="player-course">
          <Link href="/dashboard" aria-label="Kembali ke dashboard"><ChevronLeft /></Link>
          <div><small>PROGRAM</small><b>{course.title}</b></div>
          <button type="button" onClick={() => setSidebar(false)} aria-label="Tutup daftar materi"><X /></button>
        </div>
        <div className="overall-progress">
          <span><b>Progres Anda</b><strong>{percent}%</strong></span>
          <i role="progressbar" aria-label="Progres program" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}><em style={{ width: `${percent}%` }} /></i>
          <small>{done.size} dari {flatLessons.length} materi selesai</small>
        </div>
        <div className="module-list">{course.nodes.length ? renderTree(course.nodes) : <div className="player-sidebar-empty"><Folder size={22} aria-hidden="true" /><span>Belum ada modul.</span></div>}</div>
      </aside>
      {sidebar && <button type="button" className="player-backdrop" onClick={() => setSidebar(false)} aria-label="Tutup daftar materi" />}
      <main className="player-main">
        <header>
          <button type="button" onClick={() => setSidebar(true)} aria-label="Buka daftar materi"><Menu /></button>
          <div><span>Materi {index + 1} dari {flatLessons.length}</span><b>{current.title}</b></div>
          <Link href="/dashboard">Keluar Kelas</Link>
        </header>
        <section className="player-resume-summary" aria-labelledby="resume-summary-title">
          <div className="player-resume-icon" aria-hidden="true"><BookOpen size={20} /></div>
          <div className="player-resume-copy">
            <span className="player-resume-kicker">{resumeLessonId === current.id ? "LANJUTKAN BELAJAR" : "RINGKASAN BELAJAR"}</span>
            <h1 id="resume-summary-title">{current.title}</h1>
            <p>{remainingCount > 0 ? `Masih ada ${remainingCount} materi yang belum selesai.` : "Semua materi program sudah selesai."} {current.durationMin ? `Durasi sesi ini sekitar ${current.durationMin} menit.` : ""}</p>
          </div>
          <div className="player-resume-stats" aria-label="Ringkasan progres">
            <strong>{percent}%</strong>
            <span>{done.size}/{flatLessons.length} materi</span>
          </div>
          {nextIncomplete && nextIncomplete.id !== current.id && <button type="button" className="player-resume-next" onClick={() => selectLesson(nextIncomplete.id)}>Materi belum selesai <ChevronRight size={16} /></button>}
        </section>
        <section className="lesson-stage">
          {current.type === "VIDEO" || (current.fileUrl && (current.fileUrl.endsWith(".mp4") || current.fileUrl.endsWith(".webm") || current.fileUrl.includes("/video/"))) ? (
            <div className="player-video-shell hover-lift glass">
              <div className="player-video-frame">
                {(current.fileUrl && (current.fileUrl.endsWith(".mp4") || current.fileUrl.endsWith(".webm") || current.fileUrl.startsWith("/api/uploads/"))) || (current.content && (current.content.endsWith(".mp4") || current.content.endsWith(".webm"))) ? (
                  mediaError ? (
                    <div className="player-media-error" role="alert">
                      <AlertCircle size={34} aria-hidden="true" />
                      <strong>Video belum dapat diputar</strong>
                      <span>Periksa koneksi atau buka materi lagi.</span>
                      <button type="button" onClick={() => setMediaError(false)}><RefreshCw size={15} /> Coba lagi</button>
                    </div>
                  ) : <video
                    controls
                    controlsList="nodownload"
                    src={current.fileUrl || current.content || ""}
                    className="player-video-inner"
                    onError={() => setMediaError(true)}
                  />
                ) : (
                  <>
                    <iframe src={current.fileUrl || current.content || undefined} title={current.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="player-video-inner" />
                    <div className="player-video-fallback"><Play fill="currentColor" size={60} /></div>
                  </>
                )}
              </div>
            </div>
          ) : (current.type === "QUIZ" || current.type === "ASSIGNMENT") ? (
            <article className="player-card-center hover-lift">
              <div className="player-pulse-circle">
                {current.type === "QUIZ" ? <Award size={44} /> : <FileCheck size={44} />}
              </div>
              <span className="eyebrow-teal">
                {current.type === "QUIZ" ? "EVALUASI & KUIS PEMAHAMAN" : "TUGAS EKSEKUTIF & STUDI KASUS"}
              </span>
              <h1 className="player-title-xl">
                {current.title}
              </h1>
              <p className="player-desc-lead">
                {current.content || (current.type === "QUIZ" 
                  ? "Uji tingkat pemahaman strategi dan konsep kepemimpinan Anda pada modul ini. Klik tombol di bawah untuk memulai kuis interaktif." 
                  : "Selesaikan instruksi tugas eksekutif ini untuk memvalidasi penerapan kepemimpinan Anda di lapangan nyata.")}
              </p>
              <div className="player-actions-row">
                <Link 
                  href={`/evaluasi/${current.assessmentId || current.id}`} 
                  className="player-btn-quiz"
                >
                  <Play fill="currentColor" size={22} /> Mulai {current.type === "QUIZ" ? "Mengerjakan Kuis" : "Mengerjakan Tugas"}
                </Link>
              </div>
              <div className="player-meta-badges">
                <span className="player-badge-duration"><Clock3 size={18} /> Durasi: {current.durationMin || 30} Menit</span>
                <span className="player-badge-score"><CheckCircle2 size={18} /> Bobot Nilai: 100 Poin</span>
              </div>
              <div className="player-assessment-feedback" aria-live="polite">
                {assessmentLoading && <p className="player-feedback-loading"><LoaderCircle className="spin" size={16} /> Memuat hasil evaluasi terakhir…</p>}
                {assessmentLoadError && <p className="player-feedback-error" role="alert">{assessmentLoadError} <button type="button" onClick={() => setAssessmentRefreshToken(value => value + 1)}>Coba lagi</button></p>}
                {assessmentFeedback && <div className={`player-feedback-card ${assessmentFeedback.passed ? "passed" : assessmentFeedback.status === "PENDING_GRADE" ? "pending" : "failed"}`}>
                  <div><strong>{assessmentFeedback.status === "PENDING_GRADE" ? "Menunggu penilaian mentor" : `Hasil terakhir: ${assessmentFeedback.score}%`}</strong><span>{new Date(assessmentFeedback.submittedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span></div>
                  <p>{assessmentFeedback.feedback || (assessmentFeedback.passed ? "Evaluasi berhasil dan Anda dapat melanjutkan." : "Tinjau kembali materi inti sebelum mencoba lagi.")}</p>
                </div>}
              </div>
            </article>
          ) : (current.type === "PDF" || (current.fileUrl && current.fileUrl.endsWith(".pdf"))) ? (
            <article className="player-card-center hover-lift">
              <div className="player-pdf-top">
                <div className="player-pdf-left">
                  <span className="player-eyebrow-pdf"><FileText size={18} /> DOKUMEN MODUL PEMBELAJARAN (PDF)</span>
                  <h1 className="player-title-xl" style={{ margin: "6px 0 0" }}>{current.title}</h1>
                </div>
                {current.fileUrl && (
                  <a className="player-btn-download-sm hover-lift" href={current.fileUrl} target="_blank" rel="noreferrer">
                    <Download size={18} style={{ marginRight: "8px" }} /> Unduh Modul PDF ({current.fileSize ? `${Math.round(current.fileSize / 1024)} KB` : "Dokumen Resmi"})
                  </a>
                )}
              </div>
              {(current.description || current.content) && <p className="player-desc-lead player-desc-left">{current.description || current.content}</p>}
              {current.fileUrl ? (
                <div className="player-pdf-viewer">
                  <iframe src={`${current.fileUrl}#toolbar=1&navpanes=0&scrollbar=1`} className="player-pdf-iframe" title={current.title} />
                </div>
              ) : (
                <div className="player-pdf-missing">
                  <FileText size={48} className="player-empty-icon" />
                  <p className="player-empty-text">Berkas PDF belum diunggah untuk modul ini.</p>
                </div>
              )}
            </article>
          ) : current.type === "IMAGE" ? (
            <article className="player-card-center hover-lift">
              <span className="eyebrow-teal">INFOGRAFIS & VISUAL PEMBELAJARAN</span>
              <h1 className="player-title-xl">{current.title}</h1>
              {(current.description || current.content) && <p className="player-desc-lead">{current.description || current.content}</p>}
              {current.fileUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={current.fileUrl} alt={current.title} className="player-img-view" />
              ) : <div className="player-empty-glass" role="status"><ImageIcon size={40} aria-hidden="true" /><p className="player-empty-text">Gambar belum tersedia untuk materi ini.</p></div>}
            </article>
          ) : current.type === "LINK" ? (
            <article className="player-card-compact hover-lift">
              <div className="player-link-circle">
                <Link2 size={40} />
              </div>
              <span className="eyebrow-teal player-eyebrow-purple">TAUTAN SUMBER DAYA EKSTERNAL</span>
              <h1 className="player-title-xl">{current.title}</h1>
              <p className="player-desc-lead">
                {current.description || current.content || "Modul ini merujuk pada tautan sumber eksternal yang disiapkan oleh mentor Anda."}
              </p>
              {currentLinkHref && (
                <a 
                  href={currentLinkHref}
                  target="_blank" 
                  rel="noreferrer"
                  className="player-btn-external hover-lift"
                >
                  <Link2 size={22} /> Buka Tautan Eksternal
                </a>
              )}
            </article>
          ) : (
            <article className="player-card-read hover-lift">
              <span className="eyebrow-teal">MATERI BACAAN EKSKLUSIF</span>
              <h1 className="player-title-read">{current.title}</h1>
              {current.description || current.content ? <div className="player-desc-read">{current.content || current.description}</div> : <div className="player-empty-glass" role="status"><FileText size={40} aria-hidden="true" /><p className="player-empty-text">Konten bacaan belum tersedia untuk materi ini.</p></div>}
              {current.fileUrl && (
                <a className="player-btn-quiz hover-lift player-btn-dl-mat" href={current.fileUrl} target="_blank" rel="noreferrer"><Download size={18} style={{ marginRight: "10px" }} /> Unduh Berkas Materi</a>
              )}
            </article>
          )}
        </section>
        <nav className="lesson-tabs" aria-label="Informasi materi" role="tablist">
          <button type="button" role="tab" id="lesson-tab-materi" aria-controls="lesson-panel" aria-selected={tab === "materi"} onClick={() => setTab("materi")} className={tab === "materi" ? "active" : ""}><BookOpen aria-hidden="true" /> Materi</button>
          <button type="button" role="tab" id="lesson-tab-diskusi" aria-controls="lesson-panel" aria-selected={tab === "diskusi"} onClick={() => setTab("diskusi")} className={tab === "diskusi" ? "active" : ""}><MessageSquare aria-hidden="true" /> Diskusi <span>{currentPosts.length}</span></button>
          <button type="button" role="tab" id="lesson-tab-lampiran" aria-controls="lesson-panel" aria-selected={tab === "lampiran"} onClick={() => setTab("lampiran")} className={tab === "lampiran" ? "active" : ""}><Download aria-hidden="true" /> Lampiran</button>
          <button type="button" role="tab" id="lesson-tab-catatan" aria-controls="lesson-panel" aria-selected={tab === "catatan"} onClick={() => setTab("catatan")} className={tab === "catatan" ? "active" : ""}><FileText aria-hidden="true" /> Catatan Saya</button>
        </nav>
        <section className="player-notes-section" id="lesson-panel" role="tabpanel" tabIndex={0} aria-labelledby={`lesson-tab-${tab}`}>
          {tab === "materi" && <>
            <h2>Deskripsi</h2>
            <p>{current.description || current.content || "Belum ada deskripsi tambahan untuk materi ini."}</p>
          </>}
          {tab === "diskusi" && <><h2>Diskusi bersama</h2>{currentPosts.length === 0 ? <p>Belum ada diskusi. Jadilah yang pertama membagikan refleksi.</p> : <div className="discussion-list">{currentPosts.map(post => <div className="discussion" key={post.id}><b aria-hidden="true">{initials(post.user.name)}</b><p><strong>{post.user.id === currentUser.id ? "Anda" : post.user.name}</strong>{post.content}</p></div>)}</div>}<form className="discussion-form" onSubmit={submitDiscussion}><label className="sr-only" htmlFor="discussion-message">Pesan diskusi</label><textarea id="discussion-message" value={discussion} onChange={event => setDiscussion(event.target.value)} placeholder="Bagikan pemikiran atau pertanyaan Anda..." maxLength={1000} aria-describedby="discussion-help" /><small id="discussion-help">Minimal 3 karakter, maksimal 1.000 karakter.</small><button type="submit" className="btn btn-primary btn-small" aria-label={busy ? "Mengirim pesan diskusi" : "Kirim pesan diskusi"} disabled={busy || discussion.trim().length < 3}>{busy ? <LoaderCircle className="spin" aria-hidden="true" /> : <><Send aria-hidden="true" /> Kirim</>}</button></form></>}
          {tab === "lampiran" && (
            <div className="materials-container">
              <h2 className="player-tab-header">Lampiran & Berkas Pendukung</h2>
              <p className="player-tab-desc">Unduh berkas materi, lembar kerja eksekutif, dan panduan belajar untuk modul ini.</p>
              {current.fileUrl ? (
                <div className="player-materials-grid">
                  <a href={current.fileUrl} target="_blank" rel="noreferrer" className="player-mat-card hover-lift">
                    <div className="player-mat-icon">
                      <Download size={24} />
                    </div>
                    <div className="player-mat-info">
                      <h3>{current.fileName || "Berkas Materi Pembelajaran"}</h3>
                      <small>{current.fileSize ? `${Math.round(current.fileSize / 1024)} KB` : "Dokumen Resmi PROFAS"}</small>
                    </div>
                    <span className="player-mat-badge">Unduh</span>
                  </a>
                </div>
              ) : (
                <div className="player-empty-glass">
                  <Folder size={40} className="player-folder-icon" />
                  <p className="player-folder-text">Tidak ada berkas lampiran khusus untuk sesi ini.</p>
                  <small>Seluruh intisari pembelajaran telah tertuang pada teks materi dan video di atas.</small>
                </div>
              )}
            </div>
          )}
          {tab === "catatan" && (
            <div className="notes-container">
              <div className="player-notes-top">
                <div>
                  <h2 className="player-tab-title">Catatan & Jurnal Refleksi Eksekutif</h2>
                  <small className="player-tab-sub">Catatan ini tersimpan secara lokal dan dapat diunduh ke berbagai format dokumen resmi.</small>
                </div>
                <div className="player-notes-btns">
                <button type="button" onClick={downloadNote} disabled={!noteText.trim()} className="btn btn-outline btn-small player-btn-txt">
                    <Download size={14} /> Txt
                  </button>
                  <button type="button" onClick={downloadNoteDocx} disabled={!noteText.trim()} className="btn btn-outline btn-small player-btn-docx">
                    <FileCheck size={14} /> Word (.docx)
                  </button>
                  <button type="button" onClick={downloadNotePdf} disabled={!noteText.trim()} className="btn btn-outline btn-small player-btn-pdf">
                    <FileCode size={14} /> PDF (.pdf)
                  </button>
                  <button type="button" onClick={saveNote} className="btn btn-primary btn-small player-btn-save">
                    <CheckCircle2 size={14} /> {noteSaved ? "Tersimpan!" : "Simpan"}
                  </button>
                </div>
              </div>
              <label className="sr-only" htmlFor="lesson-note">Catatan pembelajaran</label>
              <textarea
                id="lesson-note"
                value={noteText}
                onChange={e => { setNoteText(e.target.value); setNoteSaved(false); }}
                placeholder="Tulis poin-poin penting, kepanjangan akronim, strategi eksekusi, atau ide kepemimpinan yang Anda dapatkan dari modul ini..."
                className="player-textarea"
              />
              {noteSaved && <p className="player-note-saved"><CheckCircle2 size={14} /> Catatan berhasil disimpan ke perangkat Anda.</p>}
            </div>
          )}
          {message && <p className="player-message" role="alert">{message}</p>}

          {/* AI Leadership Tutor Widget */}
          <AILeadershipTutor lessonTitle={current.title} />
        </section>
        <footer className="player-footer" aria-label="Navigasi materi">
          <button type="button" disabled={index === 0 || busy} aria-disabled={index === 0 || busy} onClick={goPrevious} aria-label="Materi sebelumnya"><ChevronLeft aria-hidden="true" /> <span>Sebelumnya</span></button>
          <span aria-label={`Durasi ${current.durationMin} menit`}><Clock3 aria-hidden="true" /> {current.durationMin} menit</span>
          <button type="button" className="player-next-btn" disabled={index === flatLessons.length - 1 || busy} aria-disabled={index === flatLessons.length - 1 || busy} onClick={goNext} aria-label="Materi berikutnya">Berikutnya <ChevronRight aria-hidden="true" /></button>
          <button type="button" className="complete-btn" onClick={complete} disabled={busy} aria-busy={busy} aria-pressed={done.has(current.id)}>{busy ? <><LoaderCircle className="spin" aria-hidden="true" /> <span>Menyimpan...</span></> : done.has(current.id) ? <><Check aria-hidden="true" /> {index < flatLessons.length - 1 ? "Lanjut Materi Berikutnya" : "Sudah selesai"}</> : <>Tandai Selesai <ChevronRight aria-hidden="true" /></>}</button>
        </footer>
      </main>
    </div>
  );
}
