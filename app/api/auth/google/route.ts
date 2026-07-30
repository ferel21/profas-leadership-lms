import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { rateLimit } from "@/services/rate-limit";
import { googleCallbackUrl } from "@/services/app-origin";

const googleLimiter = rateLimit({ limit: 15, windowMs: 60 * 1000 });

export async function GET(request: Request) {
  const ipCheck = googleLimiter.check(request);
  if (!ipCheck.success) {
    return NextResponse.json({ error: "Terlalu banyak permintaan OAuth dari IP Anda. Silakan tunggu 1 menit." }, { status: 429 });
  }
  const GOOGLE_CLIENT_ID = (process.env.GOOGLE_CLIENT_ID || "").trim().replace(/^["']|["']$/g, "");

  const redirectUri = googleCallbackUrl(request);

  if (!GOOGLE_CLIENT_ID) {
    return NextResponse.json({ error: "Google OAuth belum dikonfigurasi." }, { status: 503 });
  }

  const state = randomBytes(32).toString("hex");

  const searchParams = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    prompt: "consent",
    state,
  });

  const url = `https://accounts.google.com/o/oauth2/v2/auth?${searchParams.toString()}`;
  const response = NextResponse.redirect(url);
  response.cookies.set("profas_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/api/auth",
  });
  return response;
}
