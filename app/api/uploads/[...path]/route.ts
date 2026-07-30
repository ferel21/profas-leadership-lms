import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname } from "node:path";
import { getCurrentUser } from "@/services/auth";
import { prisma } from "@/services/prisma";
import { getReadableUploadRoots, resolveUploadPath } from "@/services/upload-storage";
import { createSignedObjectDownload, getObjectStorageMode } from "@/services/object-storage";
import { rateLimit } from "@/services/rate-limit";

const uploadsLimiter = rateLimit({ limit: 120, windowMs: 60 * 1000 });

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
  const ipCheck = uploadsLimiter.check(request);
  if (!ipCheck.success) {
    return NextResponse.json({ error: "Terlalu banyak permintaan akses berkas. Silakan tunggu 1 menit." }, { status: 429 });
  }
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Silakan masuk untuk mengakses berkas." }, { status: 401 });

    const { path } = await params;
    if (!path || path.length === 0 || path.some(segment => segment === ".." || segment === "." || segment.includes("/") || segment.includes("\\") || segment.includes("\0"))) {
      return NextResponse.json({ error: "Path tidak valid." }, { status: 400 });
    }

    const relativePath = path.join("/");
    const storedUrl = `/api/uploads/${relativePath}`;
    if (path[0] === "assignments") {
      const answer = await prisma.attemptAnswer.findFirst({
        where: { fileUrl: storedUrl },
        select: {
          attempt: {
            select: {
              userId: true,
              assessment: { select: { course: { select: { mentorId: true } } } },
            },
          },
        },
      });
      const canAccess = answer && (
        answer.attempt.userId === user.id ||
        user.role === "SUPER_ADMIN" ||
        (user.role === "MENTOR" && answer.attempt.assessment.course.mentorId === user.id)
      );
      if (!canAccess) return NextResponse.json({ error: "Berkas tidak ditemukan." }, { status: 404 });
    } else {
      const courseId = path[0] === "materials" ? path[1] : path[0];
      if (!courseId) return NextResponse.json({ error: "Path berkas tidak valid." }, { status: 400 });
      const material = await prisma.courseNode.findFirst({
        where: {
          courseId,
          fileUrl: storedUrl,
          ...(user.role === "SUPER_ADMIN"
            ? {}
            : {
                course: {
                  OR: [
                    { mentorId: user.id },
                    {
                      published: true,
                      enrollments: {
                        some: {
                          userId: user.id,
                          status: { in: ["ACTIVE", "COMPLETED"] },
                        },
                      },
                    },
                  ],
                },
              }),
        },
        select: { id: true },
      });
      if (!material) {
        return NextResponse.json({ error: "Berkas tidak ditemukan." }, { status: 404 });
      }
    }

    const isDurableObjectPath = path[0] === "materials" || (path[0] === "assignments" && path.length >= 4);
    if (isDurableObjectPath) {
      const storage = getObjectStorageMode();
      if (storage.mode === "supabase") {
        const signedUrl = await createSignedObjectDownload(relativePath, 60);
        const response = NextResponse.redirect(signedUrl, 307);
        response.headers.set("Cache-Control", "private, no-store, max-age=0, must-revalidate");
        response.headers.set("Referrer-Policy", "no-referrer");
        return response;
      }
      if (storage.mode === "unavailable") {
        return NextResponse.json({ error: storage.message }, { status: 503 });
      }
    }

    const candidates = getReadableUploadRoots().map(root => {
      try { return resolveUploadPath(root, path); } catch { return null; }
    });
    if (candidates.some(candidate => candidate === null)) {
      return NextResponse.json({ error: "Path berkas tidak valid." }, { status: 400 });
    }
    const filePath = candidates.find((candidate): candidate is string => Boolean(candidate && existsSync(candidate)));
    if (!filePath) {
      return NextResponse.json({ error: "Berkas tidak ditemukan." }, { status: 404 });
    }

    const buffer = await readFile(filePath);
    const ext = extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="resource${ext}"`,
        "Cache-Control": "private, no-store, max-age=0, must-revalidate",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("[UPLOADS_SERVE_ERROR]", error);
    return NextResponse.json({ error: "Gagal memuat berkas." }, { status: 500 });
  }
}
