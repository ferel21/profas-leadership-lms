import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

const certificatesLimiter = rateLimit({ limit: 30, windowMs: 60 * 1000 });

export async function GET(request: Request) {
  const ipCheck = certificatesLimiter.check(request);
  if (!ipCheck.success) {
    return NextResponse.json({ valid: false, message: "Terlalu banyak permintaan verifikasi sertifikat. Silakan tunggu 1 menit." }, { status: 429 });
  }

  const rawNumber = new URL(request.url).searchParams.get("number")?.trim();
  if (!rawNumber || rawNumber.length > 80) {
    return NextResponse.json({ valid: false, message: "Nomor sertifikat wajib diisi atau terlalu panjang." }, { status: 400 });
  }

  const cleanNumber = rawNumber.replace(/<[^>]*>?/gm, "").replace(/[\x00-\x1F\x7F]/g, "").trim().toUpperCase();
  if (!cleanNumber) {
    return NextResponse.json({ valid: false, message: "Format nomor sertifikat tidak valid." }, { status: 400 });
  }

  const certificate = await prisma.certificate.findUnique({
    where: { uniqueNumber: cleanNumber },
    select: {
      uniqueNumber: true,
      issuedAt: true,
      user: { select: { name: true } },
      course: { select: { title: true } },
    },
  });

  // Nomor yang hanya mengikuti pola PROFAS bukan bukti sertifikat.
  // Keabsahan harus selalu berasal dari record yang benar-benar diterbitkan.
  return NextResponse.json(
    { valid: Boolean(certificate), certificate },
    {
      headers: {
        "Cache-Control": certificate ? "public, max-age=60, s-maxage=60" : "private, no-cache, no-store, must-revalidate"
      }
    }
  );
}
