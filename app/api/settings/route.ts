import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Persona, Prisma } from "@prisma/client";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";

const settingsLimiter = rateLimit({ limit: 20, windowMs: 60 * 1000 });

const settingsSchema = z.object({
  name: z.string().trim().min(2, "Nama lengkap minimal 2 karakter.").max(80, "Nama lengkap maksimal 80 karakter.").transform(val => val.replace(/<[^>]*>?/gm, "").trim()),
  username: z.string().trim().toLowerCase().min(3, "Nama akun minimal 3 karakter.").max(30, "Nama akun maksimal 30 karakter.").regex(/^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/, "Nama akun hanya boleh berisi huruf kecil, angka, titik, garis bawah, atau tanda hubung."),
  email: z.string().trim().toLowerCase().email("Format email tidak valid.").max(120, "Email maksimal 120 karakter."),
  phone: z.string().trim().max(16, "Nomor telepon maksimal 16 digit.").refine(value => value === "" || /^\+?[0-9]{8,15}$/.test(value), "Gunakan 8–15 digit, dengan awalan + bila diperlukan."),
  headline: z.string().trim().max(100, "Jabatan maksimal 100 karakter.").transform(val => val.replace(/<[^>]*>?/gm, "").trim()),
  bio: z.string().trim().max(300, "Bio maksimal 300 karakter.").transform(val => val.replace(/<[^>]*>?/gm, "").trim()),
  organization: z.string().trim().max(100, "Nama organisasi maksimal 100 karakter.").transform(val => val.replace(/<[^>]*>?/gm, "").trim()),
  location: z.string().trim().max(100, "Lokasi maksimal 100 karakter.").transform(val => val.replace(/<[^>]*>?/gm, "").trim()),
  persona: z.nativeEnum(Persona).nullable(),
});

export async function PATCH(request: Request) {
  const ipCheck = settingsLimiter.check(request);
  if (!ipCheck.success) {
    return NextResponse.json({ error: "Terlalu banyak permintaan pembaruan profil. Silakan tunggu sebentar." }, { status: 429 });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sesi Anda telah berakhir. Silakan masuk kembali." }, { status: 401 });

  try {
    const json = await request.json().catch(() => null);
    if (!json || typeof json !== "object") {
      return NextResponse.json({ error: "Data profil tidak valid." }, { status: 400 });
    }

    const result = settingsSchema.safeParse(json);
    
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      return NextResponse.json({ error: Object.values(fieldErrors).flat()[0] ?? "Data profil belum valid.", fieldErrors }, { status: 400 });
    }

    const { name, username, email, phone, headline, bio, organization, location, persona } = result.data;

    const updatedUser = await prisma.$transaction(async tx => {
      const updated = await tx.user.update({
        where: { id: user.id },
        data: {
          name,
          username,
          email,
          phone: phone || null,
          headline: headline || null,
          bio: bio || null,
          organization: organization || null,
          location: location || null,
          persona: user.role === "STUDENT" ? persona : user.persona,
        },
        select: {
          id: true, name: true, username: true, email: true, role: true,
          persona: true, avatar: true, headline: true, phone: true, bio: true,
          organization: true, location: true, updatedAt: true,
        },
      });
      await tx.activityLog.create({
        data: {
          userId: user.id,
          action: "UPDATE_PROFILE_SETTINGS",
          metadata: JSON.stringify({ changedFields: Object.keys(result.data) }),
        },
      });
      return updated;
    });

    return NextResponse.json({ user: updatedUser, message: "Profil berhasil diperbarui." });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const target = Array.isArray(error.meta?.target) ? error.meta.target.join(",") : String(error.meta?.target ?? "");
      const field = target.includes("email") ? "email" : "username";
      return NextResponse.json({
        error: field === "email" ? "Email sudah digunakan akun lain." : "Nama akun sudah digunakan.",
        fieldErrors: { [field]: [field === "email" ? "Gunakan email lain." : "Pilih nama akun lain."] },
      }, { status: 409 });
    }
    console.error("[SETTINGS_API_ERROR]", error);
    return NextResponse.json({ error: "Profil gagal diperbarui. Silakan coba lagi." }, { status: 500 });
  }
}

// Kept for compatibility with older clients.
export const POST = PATCH;
