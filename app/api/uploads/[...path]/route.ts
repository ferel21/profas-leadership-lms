import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, extname } from "node:path";

const MIME_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".txt": "text/plain",
};

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const { path } = await params;
    if (!path || path.length === 0) {
      return NextResponse.json({ error: "Path tidak ditemukan." }, { status: 404 });
    }

    const relativePath = path.join("/");
    let filePath = join(process.cwd(), "public", "uploads", relativePath);

    // MASTER SKILL: Fallback ke /tmp/uploads untuk Vercel Serverless Read-Only Filesystem!
    if (!existsSync(filePath)) {
      filePath = join("/tmp", "uploads", relativePath);
    }

    if (!existsSync(filePath)) {
      return NextResponse.json({ error: "Berkas tidak ditemukan." }, { status: 404 });
    }

    const buffer = await readFile(filePath);
    const ext = extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("[UPLOADS_SERVE_ERROR]", error);
    return NextResponse.json({ error: "Gagal memuat berkas." }, { status: 500 });
  }
}
