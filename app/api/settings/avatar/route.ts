import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";


const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES: Record<string, { extension: string; signatures: number[][] }> = {
  "image/jpeg": { extension: ".jpg", signatures: [[0xff, 0xd8, 0xff]] },
  "image/png": { extension: ".png", signatures: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]] },
  "image/webp": { extension: ".webp", signatures: [[0x52, 0x49, 0x46, 0x46]] },
};

function hasValidSignature(buffer: Buffer, type: string) {
  const signatures = ALLOWED_TYPES[type]?.signatures ?? [];
  if (type === "image/webp") {
    return signatures.some(sig => sig.every((byte, index) => buffer[index] === byte)) && buffer.subarray(8, 12).toString() === "WEBP";
  }
  return signatures.some(sig => sig.every((byte, index) => buffer[index] === byte));
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get("avatar") as File | null;

    if (!file) {
      return NextResponse.json({ error: "File avatar diperlukan." }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Ukuran file maksimal 5MB." }, { status: 400 });
    }
    if (!ALLOWED_TYPES[file.type]) {
      return NextResponse.json({ error: "Format foto harus JPG, PNG, atau WebP." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!hasValidSignature(buffer, file.type)) {
      return NextResponse.json({ error: "Isi file tidak sesuai dengan format gambar yang dipilih." }, { status: 400 });
    }

    // MASTER SKILL: Simpan foto profil langsung sebagai Base64 Data URI di database!
    // 100% bebas error EROFS Read-Only Filesystem Vercel Serverless & kebal reset kontainer!
    const base64String = buffer.toString("base64");
    const avatarUrl = `data:${file.type};base64,${base64String}`;

    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { avatar: avatarUrl } }),
      prisma.activityLog.create({ data: { userId: user.id, action: "UPDATE_AVATAR" } }),
    ]);

    return NextResponse.json({
      avatar: avatarUrl,
      message: "Foto profil berhasil diperbarui.",
    });
  } catch (error) {
    console.error("[AVATAR_UPLOAD_ERROR]", error);
    return NextResponse.json({ error: "Gagal mengunggah avatar" }, { status: 500 });
  }
}
