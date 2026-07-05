"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Award, BookOpen, Check, CheckCircle2, ChevronDown, ChevronRight, ChevronLeft, Clock3, Download, FileText, Film, Image as ImageIcon, Link2, LoaderCircle, Menu, MessageSquare, Play, Send, X, Folder } from "lucide-react";
import { initials } from "@/lib/utils";
import { CompletionCelebration } from "./CompletionCelebration";

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

  const current = flatLessons.find(n => n.id === currentId) ?? flatLessons[0];
  const index = flatLessons.findIndex(n => n.id === current.id);
  const currentPosts = posts[current?.id] ?? [];

  function selectLesson(id: string) { setCurrentId(id); setSidebar(false); setMessage(""); setDiscussion("") }

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
          {current.type === "VIDEO" ?
            <div className="video-shell hover-lift glass" style={{ borderRadius: "24px", padding: "12px", background: "rgba(255,255,255,0.4)" }}>
              <div style={{ position: "relative", width: "100%", paddingTop: "56.25%", borderRadius: "16px", overflow: "hidden", background: "#0b2229", zIndex: 1 }}>
                <iframe src={current.content || undefined} title={current.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0, zIndex: 2 }} />
                <div className="video-fallback" style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}><Play fill="currentColor" style={{ width: "60px", color: "white" }} /></div>
              </div>
            </div>
            :
            <article className="reading-content glass hover-lift" style={{ maxWidth: '1080px', margin: '2rem auto', padding: '3.5rem', borderRadius: '24px', border: '1px solid var(--line)', background: 'rgba(255,255,255,0.7)' }}>
              <span className="eyebrow" style={{ color: 'var(--teal)', fontWeight: 'bold' }}>MATERI BACAAN</span>
              <h1 style={{ marginTop: '0.5rem', marginBottom: '1.5rem', fontSize: '38px', color: 'var(--ink)' }}>{current.title}</h1>
              <div style={{ lineHeight: 1.85, fontSize: '1.15rem', color: '#475569' }}>{current.content}</div>
              {current.fileUrl && (
                <a className="btn btn-primary" href={current.fileUrl} target="_blank" rel="noreferrer" style={{ marginTop: '1rem', display: 'inline-flex' }}><Download size={16} style={{ marginRight: '8px' }} /> Unduh Lampiran</a>
              )}
            </article>
          }
        </section>
        <nav className="lesson-tabs" aria-label="Informasi materi">
          <button onClick={() => setTab("materi")} className={tab === "materi" ? "active" : ""}><BookOpen /> Materi</button>
          <button onClick={() => setTab("diskusi")} className={tab === "diskusi" ? "active" : ""}><MessageSquare /> Diskusi <span>{currentPosts.length}</span></button>
        </nav>
        <section className="lesson-notes glass" style={{ maxWidth: '1080px', margin: '0 auto 4rem', width: '100%', padding: '2.5rem', borderRadius: '0 0 24px 24px', background: 'rgba(255,255,255,0.7)', border: '1px solid var(--line)', borderTop: 'none' }}>
          {tab === "materi" && <>
            <h2>Deskripsi</h2>
            <p>{current.content}</p>
          </>}
          {tab === "diskusi" && <><h2>Diskusi bersama</h2>{currentPosts.length === 0 ? <p>Belum ada diskusi. Jadilah yang pertama membagikan refleksi.</p> : <div className="discussion-list">{currentPosts.map(post => <div className="discussion" key={post.id}><b>{initials(post.user.name)}</b><p><strong>{post.user.id === currentUser.id ? "Anda" : post.user.name}</strong>{post.content}</p></div>)}</div>}<form className="discussion-form" onSubmit={submitDiscussion}><textarea value={discussion} onChange={event => setDiscussion(event.target.value)} placeholder="Bagikan pemikiran atau pertanyaan Anda..." maxLength={1000} aria-label="Pesan diskusi" /><button type="submit" className="btn btn-primary btn-small" disabled={busy || discussion.trim().length < 3}>{busy ? <LoaderCircle className="spin" /> : <><Send /> Kirim</>}</button></form></>}
          {message && <p className="player-message" role="alert">{message}</p>}
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
