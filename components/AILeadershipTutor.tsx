"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Send, Sparkles, User, Loader2, Lightbulb, Volume2, VolumeX } from "lucide-react";

type Message = { role: "user" | "ai"; text: string; time: string };

const SUGGESTED_PROMPTS = [
  "💡 Simulasi Studi Kasus: Bagaimana menangani krisis kepercayaan tim di masa transisi?",
  "🎯 Refleksi Eksekutif: Apa gaya kepemimpinan dominan saya dan bagaimana mengoptimalkannya?",
  "Bagaimana cara mendelegasikan tugas strategis tanpa kehilangan kendali mutu?",
  "Apa langkah konkret menyelesaikan konflik antar manajer senior di divisi?"
];

export function AILeadershipTutor({ lessonTitle }: { lessonTitle?: string }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      text: `Halo! Saya adalah **Asisten AI PROFAS Leadership** 🤖✨\n\nSaya siap membantu Anda mendalami konsep kepemimpinan eksekutif pada modul **"${lessonTitle || "Kepemimpinan Strategis"}"**. Apa studi kasus atau tantangan kepemimpinan yang ingin Anda diskusikan hari ini?`,
      time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, loading]);

  function speakText(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#_`~]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "id-ID";
    utterance.rate = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  async function handleSend(questionText?: string) {
    const q = questionText || input;
    if (!q.trim() || loading) return;

    const userMsg: Message = {
      role: "user",
      text: q,
      time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!questionText) setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          lessonTitle,
          history: messages.slice(-8).map(({ role, text }) => ({ role, text })),
        })
      });

      const data = await res.json();
      const aiMsg: Message = {
        role: "ai",
        text: res.ok ? data.reply : "Maaf, terjadi kendala saat merespons. Silakan coba beberapa saat lagi.",
        time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      setMessages(prev => [
        ...prev,
        { role: "ai", text: "Terjadi kesalahan koneksi saat memanggil Asisten AI.", time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) }
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass-card hover-lift" style={{ borderRadius: "16px", border: "1px solid rgba(13, 148, 136, 0.2)", overflow: "hidden", marginTop: "1.5rem", display: "flex", flexDirection: "column", background: "var(--card-bg, rgba(255, 255, 255, 0.8))" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0f766e, #0d9488)", padding: "16px 20px", color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ background: "rgba(255, 255, 255, 0.2)", padding: "8px", borderRadius: "10px", display: "flex" }}>
            <Bot size={22} color="#fff" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
              Asisten AI Leadership <Sparkles size={16} style={{ color: "#fef08a" }} />
            </h3>
            <p style={{ margin: 0, fontSize: "0.75rem", opacity: 0.9 }}>Tanya Jawab Pedagogis & Refleksi Kepemimpinan PROFAS</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "0.7rem", background: "rgba(255, 255, 255, 0.2)", padding: "4px 10px", borderRadius: "20px", fontWeight: 600 }}>Claude-style AI</span>
        </div>
      </div>

      {/* Chat Messages */}
      <div aria-live="polite" aria-busy={loading} style={{ padding: "16px", maxHeight: "380px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "14px", background: "rgba(241, 245, 249, 0.4)" }}>
        {messages.map((m, idx) => (
          <div key={idx} style={{ display: "flex", gap: "10px", alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "85%" }}>
            {m.role === "ai" && (
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#0d9488", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px" }}>
                <Bot size={18} />
              </div>
            )}
            <div>
              <div style={{
                padding: "12px 16px",
                borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                background: m.role === "user" ? "#0d9488" : "#fff",
                color: m.role === "user" ? "#fff" : "var(--text, #1e293b)",
                boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                fontSize: "0.9rem",
                lineHeight: "1.5",
                whiteSpace: "pre-line",
                position: "relative"
              }}>
                {m.text}
                {m.role === "ai" && (
                  <button
                    onClick={() => speakText(m.text)}
                    style={{
                      marginTop: "10px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      background: "rgba(13, 148, 136, 0.08)",
                      border: "1px solid rgba(13, 148, 136, 0.3)",
                      borderRadius: "8px",
                      padding: "4px 10px",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      color: "#0f766e",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                    title="Dengarkan pembacaan suara AI"
                  >
                    {isSpeaking ? <VolumeX size={14} color="#ef4444" /> : <Volume2 size={14} />}
                    {isSpeaking ? "Hentikan Suara" : "Dengarkan Suara AI"}
                  </button>
                )}
              </div>
              <div style={{ fontSize: "0.7rem", color: "#94a3b8", marginTop: "4px", textAlign: m.role === "user" ? "right" : "left" }}>
                {m.time}
              </div>
            </div>
            {m.role === "user" && (
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#475569", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px" }}>
                <User size={18} />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", gap: "10px", alignSelf: "flex-start", alignItems: "center", color: "#0d9488", fontSize: "0.85rem", fontStyle: "italic" }}>
            <Loader2 size={18} className="spin" />
            <span>Asisten AI sedang menyusun panduan kepemimpinan...</span>
          </div>
        )}
        <div ref={messagesEndRef} aria-hidden="true" />
      </div>

      {/* Suggested Prompts */}
      <div style={{ padding: "10px 16px", background: "var(--card-bg, #fff)", borderTop: "1px solid rgba(0,0,0,0.05)" }}>
        <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600, marginBottom: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
          <Lightbulb size={14} color="#f59e0b" /> Topik & Simulasi Cepat:
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {SUGGESTED_PROMPTS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p)}
              disabled={loading}
              style={{
                fontSize: "0.75rem",
                padding: "6px 10px",
                borderRadius: "12px",
                border: "1px solid rgba(13, 148, 136, 0.3)",
                background: "rgba(13, 148, 136, 0.05)",
                color: "#0f766e",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              className="hover-lift"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={e => { e.preventDefault(); handleSend(); }} style={{ display: "flex", gap: "8px", padding: "12px 16px", background: "var(--card-bg, #fff)", borderTop: "1px solid rgba(0,0,0,0.08)" }}>
        <label htmlFor="leadership-tutor-input" className="sr-only">Pertanyaan untuk Asisten AI Leadership</label>
        <input
          id="leadership-tutor-input"
          type="text"
          placeholder="Tanyakan hal tentang kepemimpinan atau manajemen tim..."
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={loading}
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: "10px",
            border: "1px solid #cbd5e1",
            fontSize: "0.9rem",
            outline: "none"
          }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          style={{
            background: "#0d9488",
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            padding: "0 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            opacity: loading || !input.trim() ? 0.6 : 1
          }}
          className="hover-lift"
        >
          {loading ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
        </button>
      </form>
    </div>
  );
}
