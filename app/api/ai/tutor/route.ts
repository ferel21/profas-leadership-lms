/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

// Basis pengetahuan kepemimpinan PROFAS untuk panduan kontekstual
const LEADERSHIP_KNOWLEDGE_BASE: Record<string, string> = {
  "delegasi": "Dalam kepemimpinan PROFAS, delegasi bukan sekadar membagi tugas, melainkan mentransfer tanggung jawab sekaligus memberikan wewenang dan dukungan yang tepat sesuai tingkat kematangan tim (Situational Leadership).",
  "konflik": "Manajemen konflik kepemimpinan membutuhkan komunikasi asertif, mendengarkan aktif secara empati, dan fokus pada masalah (akar penyebab) bukan penyerangan pribadi.",
  "komunikasi": "Komunikasi pemimpin efektif adalah komunikasi yang jelas, konsisten, dua arah, dan mampu menginspirasi serta menyelaraskan visi tim dengan tindakan nyata.",
  "motivasi": "Memotivasi tim dilakukan dengan memahami intrinsic dan extrinsic drivers masing-masing anggota, memberikan pengakuan (recognition), dan memberikan otonomi yang bertanggung jawab.",
  "default": "Sebagai Asisten AI PROFAS Leadership, saya sarankan Anda merefleksikan bagaimana prinsip kepemimpinan adaptif dan empati dapat diterapkan pada situasi ini. Cobalah pecahkan masalah menjadi langkah-langkah kecil yang terukur dan libatkan tim dalam pengambilan keputusan."
};

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Anda harus login untuk menggunakan Asisten AI." }, { status: 401 });
    }

    const body = await request.json();
    const { question, lessonTitle } = body;

    if (!question || !question.trim()) {
      return NextResponse.json({ message: "Pertanyaan tidak boleh kosong." }, { status: 400 });
    }

    const qLower = question.toLowerCase();
    let advice = LEADERSHIP_KNOWLEDGE_BASE["default"];

    if (qLower.includes("delegas") || qLower.includes("tugas")) {
      advice = LEADERSHIP_KNOWLEDGE_BASE["delegasi"];
    } else if (qLower.includes("konflik") || qLower.includes("masalah") || qLower.includes("debat")) {
      advice = LEADERSHIP_KNOWLEDGE_BASE["konflik"];
    } else if (qLower.includes("komunikas") || qLower.includes("bicara") || qLower.includes("presentas")) {
      advice = LEADERSHIP_KNOWLEDGE_BASE["komunikasi"];
    } else if (qLower.includes("motivasi") || qLower.includes("semangat") || qLower.includes("malas")) {
      advice = LEADERSHIP_KNOWLEDGE_BASE["motivasi"];
    }

    // Jika di produksi terdapat CLAUDE_API_KEY, kita bisa melakukan panggilan HTTP langsung ke API Anthropic Claude
    const apiKey = process.env.CLAUDE_API_KEY;
    if (apiKey && apiKey.startsWith("sk-")) {
      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
          },
          body: JSON.stringify({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 500,
            system: "Anda adalah Asisten AI Pedagogis untuk PROFAS Leadership LMS. Jawablah pertanyaan kepemimpinan peserta dengan Bahasa Indonesia yang profesional, hangat, konseptual, dan aplikatif.",
            messages: [{ role: "user", content: `Konteks Modul: ${lessonTitle || "Kepemimpinan Umum"}.\nPertanyaan Peserta: ${question}` }]
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.content && data.content[0]?.text) {
            return NextResponse.json({ reply: data.content[0].text, source: "claude-api" });
          }
        }
      } catch (err) {
        console.warn("Claude API fallback triggered:", err);
      }
    }

    // Fallback ke sistem cerdas kontekstual lokal
    const formattedReply = `**💡 Panduan Kepemimpinan (Konteks: ${lessonTitle || "PROFAS Leadership"})**\n\n${advice}\n\n*Tips Refleksi:* Bagaimana Anda akan menerapkan konsep ini dalam memimpin tim Anda minggu ini? Tuliskan langkah konkret Anda pada jurnal refleksi modul ini.`;

    return NextResponse.json({ reply: formattedReply, source: "profas-local-ai" });
  } catch (error: any) {
    console.error("AI Tutor Error:", error);
    return NextResponse.json({ message: "Gagal memproses respons AI." }, { status: 500 });
  }
}
