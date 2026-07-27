"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bot,
  ChevronDown,
  Lightbulb,
  Loader2,
  Send,
  Sparkles,
  User,
  Volume2,
  VolumeX,
} from "lucide-react";

type Message = { role: "user" | "ai"; text: string; time: string };

const SUGGESTED_PROMPTS = [
  "Bagaimana menangani krisis kepercayaan tim di masa transisi?",
  "Apa gaya kepemimpinan dominan saya dan bagaimana mengoptimalkannya?",
  "Bagaimana mendelegasikan tugas strategis tanpa kehilangan kendali mutu?",
  "Apa langkah konkret menyelesaikan konflik antar manajer senior?",
];

export function AILeadershipTutor({ lessonTitle }: { lessonTitle?: string }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      text: `Halo. Saya adalah Asisten AI PROFAS Leadership.\n\nSaya siap membantu Anda mendalami konsep pada modul "${lessonTitle || "Kepemimpinan Strategis"}". Tantangan kepemimpinan apa yang ingin Anda diskusikan?`,
      time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, loading]);

  function speakText(text: string, idx: number) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (speakingIdx === idx) {
      window.speechSynthesis.cancel();
      setSpeakingIdx(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/[*#_`~]/g, ""));
    utterance.lang = "id-ID";
    utterance.rate = 1;
    utterance.onend = () => setSpeakingIdx(null);
    utterance.onerror = () => setSpeakingIdx(null);
    setSpeakingIdx(idx);
    window.speechSynthesis.speak(utterance);
  }

  async function handleSend(questionText?: string) {
    const question = questionText || input;
    if (!question.trim() || loading) return;

    const userMessage: Message = {
      role: "user",
      text: question,
      time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages(previous => [...previous, userMessage]);
    if (!questionText) setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/ai/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          lessonTitle,
          history: messages.slice(-8).map(({ role, text }) => ({ role, text })),
        }),
      });
      const data = await response.json();
      const aiMessage: Message = {
        role: "ai",
        text: response.ok
          ? data.reply
          : "Respons belum dapat dimuat. Silakan coba lagi beberapa saat.",
        time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages(previous => [...previous, aiMessage]);
    } catch {
      setMessages(previous => [
        ...previous,
        {
          role: "ai",
          text: "Koneksi ke Asisten AI terputus. Periksa jaringan lalu coba lagi.",
          time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <details className="pf-ai-tutor">
      <summary>
        <span className="pf-ai-tutor__icon" aria-hidden="true"><Bot /></span>
        <span className="pf-ai-tutor__heading">
          <small>Teman refleksi</small>
          <strong>Diskusikan materi dengan Asisten AI</strong>
        </span>
        <span className="pf-ai-tutor__badge"><Sparkles aria-hidden="true" /> Opsional</span>
        <ChevronDown className="pf-ai-tutor__chevron" aria-hidden="true" />
      </summary>

      <div className="pf-ai-tutor__body">
        <div className="pf-ai-tutor__intro">
          Gunakan asisten untuk menguji cara pikir atau membahas studi kasus. Jawaban AI
          sebaiknya tetap ditimbang bersama konteks kerja dan arahan mentor.
        </div>

        <div
          className="pf-ai-tutor__messages"
          aria-live="polite"
          aria-busy={loading}
          aria-label="Percakapan dengan Asisten AI"
        >
          {messages.map((message, index) => (
            <article
              key={`${message.time}-${index}`}
              className={`pf-ai-message is-${message.role}`}
            >
              <span className="pf-ai-message__avatar" aria-hidden="true">
                {message.role === "ai" ? <Bot /> : <User />}
              </span>
              <div className="pf-ai-message__content">
                <p>{message.text}</p>
                <footer>
                  <time>{message.time}</time>
                  {message.role === "ai" && (
                    <button
                      type="button"
                      onClick={() => speakText(message.text, index)}
                      aria-label={speakingIdx === index ? "Hentikan pembacaan" : "Dengarkan jawaban"}
                    >
                      {speakingIdx === index
                        ? <VolumeX aria-hidden="true" />
                        : <Volume2 aria-hidden="true" />}
                      {speakingIdx === index ? "Hentikan" : "Dengarkan"}
                    </button>
                  )}
                </footer>
              </div>
            </article>
          ))}
          {loading && (
            <div className="pf-ai-tutor__loading" role="status">
              <Loader2 className="spin" aria-hidden="true" />
              <span>Menyusun panduan refleksi…</span>
            </div>
          )}
          <div ref={messagesEndRef} aria-hidden="true" />
        </div>

        <section className="pf-ai-tutor__prompts" aria-labelledby="ai-prompt-title">
          <h3 id="ai-prompt-title"><Lightbulb aria-hidden="true" /> Mulai dari pertanyaan ini</h3>
          <div>
            {SUGGESTED_PROMPTS.map(prompt => (
              <button
                type="button"
                key={prompt}
                onClick={() => handleSend(prompt)}
                disabled={loading}
              >
                {prompt}
              </button>
            ))}
          </div>
        </section>

        <form
          className="pf-ai-tutor__form"
          onSubmit={event => {
            event.preventDefault();
            handleSend();
          }}
        >
          <label htmlFor="leadership-tutor-input">Pertanyaan Anda</label>
          <div>
            <input
              id="leadership-tutor-input"
              type="text"
              placeholder="Tulis tantangan atau pertanyaan kepemimpinan…"
              value={input}
              onChange={event => setInput(event.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              aria-label={loading ? "Asisten AI sedang memproses" : "Kirim pertanyaan"}
              disabled={loading || !input.trim()}
            >
              {loading
                ? <Loader2 className="spin" aria-hidden="true" />
                : <Send aria-hidden="true" />}
            </button>
          </div>
        </form>
      </div>
    </details>
  );
}
