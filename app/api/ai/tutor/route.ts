import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const ipTutorLimiter = rateLimit({ limit: 30, windowMs: 60 * 1000 });
const userTutorLimiter = rateLimit({ limit: 15, windowMs: 60 * 1000 });

// Basis pengetahuan kepemimpinan PROFAS untuk panduan kontekstual
const LEADERSHIP_KNOWLEDGE_BASE: Record<string, string> = {
  "delegasi": "Dalam kepemimpinan PROFAS, delegasi bukan sekadar membagi tugas, melainkan mentransfer tanggung jawab sekaligus memberikan wewenang dan dukungan yang tepat sesuai tingkat kematangan tim (Situational Leadership).",
  "konflik": "Manajemen konflik kepemimpinan membutuhkan komunikasi asertif, mendengarkan aktif secara empati, dan fokus pada masalah (akar penyebab) bukan penyerangan pribadi.",
  "komunikasi": "Komunikasi pemimpin efektif adalah komunikasi yang jelas, konsisten, dua arah, dan mampu menginspirasi serta menyelaraskan visi tim dengan tindakan nyata.",
  "motivasi": "Memotivasi tim dilakukan dengan memahami intrinsic dan extrinsic drivers masing-masing anggota, memberikan pengakuan (recognition), dan memberikan otonomi yang bertanggung jawab.",
  "default": "Sebagai Asisten AI PROFAS Leadership, saya sarankan Anda merefleksikan bagaimana prinsip kepemimpinan adaptif dan empati dapat diterapkan pada situasi ini. Cobalah pecahkan masalah menjadi langkah-langkah kecil yang terukur dan libatkan tim dalam pengambilan keputusan."
};

const tutorRequestSchema = z.object({
  question: z.string().trim().min(1, "Pertanyaan tidak boleh kosong.").max(1_500, "Pertanyaan terlalu panjang (maksimal 1500 karakter)."),
  lessonTitle: z.string().trim().max(150).optional(),
  history: z.array(z.object({
    role: z.enum(["user", "ai"]),
    text: z.string().trim().min(1).max(1_000),
  })).max(8).optional(),
});

function isPromptInjection(text: string): boolean {
  const lower = text.toLowerCase();
  const suspiciousPatterns = [
    "abaikan instruksi",
    "ignore previous instructions",
    "ignore all previous",
    "act as system",
    "system prompt override",
    "jailbreak",
    "berpura-puralah menjadi",
    "pretend you are not an ai",
    "bypass restrictions"
  ];
  return suspiciousPatterns.some(pattern => lower.includes(pattern));
}

function sanitizeText(text: string): string {
  return text.replace(/<[^>]*>?/gm, "").trim();
}

function getLocalReply(question: string, lessonTitle?: string) {
  const qLower = question.toLowerCase();
  let advice = LEADERSHIP_KNOWLEDGE_BASE.default;

  if (qLower.includes("delegas") || qLower.includes("tugas")) {
    advice = LEADERSHIP_KNOWLEDGE_BASE.delegasi;
  } else if (qLower.includes("konflik") || qLower.includes("masalah") || qLower.includes("debat")) {
    advice = LEADERSHIP_KNOWLEDGE_BASE.konflik;
  } else if (qLower.includes("komunikas") || qLower.includes("bicara") || qLower.includes("presentas")) {
    advice = LEADERSHIP_KNOWLEDGE_BASE.komunikasi;
  } else if (qLower.includes("motivasi") || qLower.includes("semangat") || qLower.includes("malas")) {
    advice = LEADERSHIP_KNOWLEDGE_BASE.motivasi;
  }

  return `**Panduan Kepemimpinan (Konteks: ${lessonTitle || "PROFAS Leadership"})**\n\n${advice}\n\n*Tips Refleksi:* Bagaimana Anda akan menerapkan konsep ini dalam memimpin tim Anda minggu ini? Tuliskan langkah konkret Anda pada jurnal refleksi modul ini.`;
}

function buildClaudeMessages(question: string, history: z.infer<typeof tutorRequestSchema>["history"]): Anthropic.MessageParam[] {
  const cleanQuestion = sanitizeText(question);
  const source = [...(history ?? []).map(h => ({ ...h, text: sanitizeText(h.text) })), { role: "user" as const, text: cleanQuestion }];
  const messages: Anthropic.MessageParam[] = [];

  for (const item of source.slice(-8)) {
    const role = item.role === "ai" ? "assistant" : "user";
    if (messages.length === 0 && role !== "user") continue;

    const previous = messages.at(-1);
    if (previous?.role === role && typeof previous.content === "string") {
      previous.content = `${previous.content}\n\n${item.text}`;
    } else {
      messages.push({ role, content: item.text });
    }
  }

  return messages;
}

function getTextReply(response: Anthropic.Message) {
  return response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map(block => block.text.trim())
    .filter(Boolean)
    .join("\n\n");
}

export async function POST(request: Request) {
  const ipCheck = ipTutorLimiter.check(request);
  if (!ipCheck.success) {
    return NextResponse.json({ message: "Terlalu banyak permintaan ke Asisten AI dari IP ini. Silakan tunggu sebentar." }, { status: 429 });
  }

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Anda harus login untuk menggunakan Asisten AI." }, { status: 401 });
    }

    // Per-user rate limit check (mencegah eksploitasi token LLM dari banyak IP dengan 1 akun)
    const userCheck = userTutorLimiter.check(request, user.id);
    if (!userCheck.success) {
      return NextResponse.json({ message: "Batas penggunaan Asisten AI per akun tercapai. Silakan tunggu 1 menit." }, { status: 429 });
    }

    const parsed = tutorRequestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Data pertanyaan tidak valid." }, { status: 400 });
    }

    const { question, lessonTitle, history } = parsed.data;
    const cleanQuestion = sanitizeText(question);
    const cleanTitle = lessonTitle ? sanitizeText(lessonTitle).slice(0, 150) : undefined;

    // Proteksi Prompt Injection / Jailbreak
    if (isPromptInjection(cleanQuestion)) {
      return NextResponse.json({
        reply: "Maaf, Asisten AI PROFAS hanya dapat berdiskusi mengenai topik kepemimpinan, pengembangan diri, dan materi modul pembelajaran. Silakan ajukan pertanyaan terkait materi program Anda.",
        source: "profas-local-ai"
      });
    }

    const fallbackReply = getLocalReply(cleanQuestion, cleanTitle);
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;

    if (apiKey) {
      try {
        const client = new Anthropic({ apiKey, maxRetries: 2 });
        const modelId = process.env.ANTHROPIC_MODEL || "claude-3-7-sonnet-20250219";
        const response = await client.messages.create({
          model: modelId,
          max_tokens: 700,
          system: "Anda adalah Asisten AI Pedagogis untuk PROFAS Leadership LMS. Jawablah dalam Bahasa Indonesia yang profesional, hangat, konseptual, dan aplikatif. Kaitkan jawaban dengan konteks modul bila tersedia. Berikan langkah praktis yang dapat dicoba peserta, jangan mengarang data pribadi, dan arahkan pertanyaan berisiko tinggi kepada mentor manusia.",
          messages: [
            { role: "user", content: `Konteks modul: ${cleanTitle || "Kepemimpinan umum"}` },
            { role: "assistant", content: "Baik, saya akan menjaga jawaban tetap kontekstual, praktis, dan aman untuk pembelajaran kepemimpinan." },
            ...buildClaudeMessages(cleanQuestion, history),
          ],
        });
        const reply = getTextReply(response);
        if (reply) {
          return NextResponse.json({ reply, source: "claude-api", model: modelId });
        }
      } catch (error) {
        if (error instanceof Anthropic.AuthenticationError) {
          console.error("Claude authentication failed. Check ANTHROPIC_API_KEY.");
        } else if (error instanceof Anthropic.RateLimitError) {
          console.warn("Claude rate limit reached; using local tutor fallback.");
        } else if (error instanceof Anthropic.APIConnectionError) {
          console.warn("Claude connection failed; using local tutor fallback.");
        } else if (error instanceof Anthropic.APIError) {
          console.error(`Claude API error ${error.status}:`, error.message);
        } else {
          console.error("Unexpected Claude tutor error:", error);
        }
      }
    }

    return NextResponse.json({ reply: fallbackReply, source: "profas-local-ai" });
  } catch (error) {
    console.error("AI Tutor Error:", error);
    return NextResponse.json({ message: "Gagal memproses respons AI." }, { status: 500 });
  }
}
