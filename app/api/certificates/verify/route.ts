import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

const certificatesLimiter = rateLimit({ limit: 60, windowMs: 60 * 1000 });

export async function GET(request: Request) {
  const ipCheck = certificatesLimiter.check(request);
  if (!ipCheck.success) {
    return NextResponse.json({ valid: false, message: "Terlalu banyak permintaan verifikasi sertifikat. Silakan tunggu 1 menit." }, { status: 429 });
  }

  const number = new URL(request.url).searchParams.get("number")?.trim();
  if (!number) {
    return NextResponse.json({ valid: false, message: "Nomor sertifikat wajib diisi." }, { status: 400 });
  }

  const certificate = await prisma.certificate.findUnique({
    where: { uniqueNumber: number },
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
