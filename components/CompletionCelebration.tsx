"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Award, CheckCircle2, Home, Sparkles } from "lucide-react";

type LessonCompleteProps = {
  mode: "lesson";
  lessonTitle: string;
  onDismiss: () => void;
};

type CourseCompleteProps = {
  mode: "course";
  courseTitle: string;
  userName: string;
  certificateNumber: string;
};

type Props = LessonCompleteProps | CourseCompleteProps;

export function CompletionCelebration(props: Props) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(6);
  const [visible, setVisible] = useState(false);

  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

  useEffect(() => {
    if (props.mode !== "course") return;
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timer); router.push(`/sertifikat/${props.certificateNumber}`); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [props, router]);

  if (props.mode === "lesson") {
    return (
      <div className={`lesson-complete-toast ${visible ? "show" : ""}`}>
        <CheckCircle2 />
        <div>
          <b>Materi selesai!</b>
          <span>{props.lessonTitle}</span>
        </div>
        <button onClick={props.onDismiss} aria-label="Tutup">✕</button>
      </div>
    );
  }

  const confettiColors = ["#f59e0b", "#ef4444", "#3b82f6", "#10b981", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];

  return (
    <div className={`completion-overlay ${visible ? "show" : ""}`}>
      <div className="completion-confetti" aria-hidden="true">
        {Array.from({ length: 40 }, (_, i) => (
          <span
            key={i}
            style={{
              left: `${Math.random() * 100}%`,
              backgroundColor: confettiColors[i % confettiColors.length],
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
              width: `${6 + Math.random() * 8}px`,
              height: `${6 + Math.random() * 8}px`,
              borderRadius: Math.random() > 0.5 ? "50%" : "2px",
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          />
        ))}
      </div>
      <div className="completion-content">
        <div className="completion-checkmark">
          <Sparkles />
          <Award />
        </div>
        <h1 className="completion-title">Selamat!</h1>
        <p className="completion-subtitle">
          <b>{props.userName}</b>, Anda telah menyelesaikan seluruh rangkaian pembelajaran
        </p>
        <h2 className="completion-program">{props.courseTitle}</h2>
        <p className="completion-cert-info">Sertifikat Anda telah diterbitkan dan siap diunduh.</p>
        <div className="completion-actions">
          <button
            className="btn btn-primary"
            onClick={() => router.push(`/sertifikat/${props.certificateNumber}`)}
          >
            <Award /> Lihat Sertifikat
          </button>
          <button
            className="btn btn-outline"
            onClick={() => router.push("/dashboard")}
          >
            <Home /> Kembali ke Dashboard
          </button>
        </div>
        <p className="countdown-text">
          Menuju halaman sertifikat dalam {countdown} detik...
        </p>
      </div>
    </div>
  );
}
