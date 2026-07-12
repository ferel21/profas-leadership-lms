import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, resolve, relative, sep } from "node:path";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Silakan masuk untuk mengakses berkas." }, { status: 401 });

    const { path } = await params;
    if (!path || path.length === 0) {
      return NextResponse.json({ error: "Path tidak ditemukan." }, { status: 404 });
    }

    const relativePath = path.join("/");
    const publicUploadsRoot = resolve(process.cwd(), "public", "uploads");
    const tmpUploadsRoot = resolve("/tmp", "uploads");
    const isInside = (root: string, candidate: string) => {
      const childPath = relative(root, candidate);
      return childPath === "" || (!childPath.startsWith("..") && childPath !== ".." && !childPath.includes(`${sep}..${sep}`));
    };
    const publicCandidate = resolve(publicUploadsRoot, ...path);
    const tmpCandidate = resolve(tmpUploadsRoot, ...path);
    if (!isInside(publicUploadsRoot, publicCandidate) || !isInside(tmpUploadsRoot, tmpCandidate)) {
      return NextResponse.json({ error: "Path berkas tidak valid." }, { status: 400 });
    }

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
      const courseId = path[0];
      const material = await prisma.courseNode.findFirst({
        where: {
          courseId,
          fileUrl: storedUrl,
          course: {
            OR: [
              { mentorId: user.id },
              { published: true, enrollments: { some: { userId: user.id } } },
            ],
          },
        },
        select: { id: true },
      });
      if (!material && user.role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Berkas tidak ditemukan." }, { status: 404 });
      }
    }

    let filePath = publicCandidate;

    // MASTER SKILL: Fallback ke /tmp/uploads untuk Vercel Serverless Read-Only Filesystem!
    if (!existsSync(filePath)) {
      filePath = tmpCandidate;
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
