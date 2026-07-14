import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const user = await getCurrentUser().catch(() => null);
  if (user) {
    await prisma.activityLog.create({
      data: { userId: user.id, action: "USER_LOGOUT" }
    }).catch(() => {});
  }
  const response = NextResponse.json({ ok: true }); 
  response.cookies.delete("profas_session"); 
  return response; 
}
