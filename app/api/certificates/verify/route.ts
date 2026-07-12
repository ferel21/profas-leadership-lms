import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
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
  return NextResponse.json({ valid: Boolean(certificate), certificate });
}
