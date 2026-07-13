import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";

export async function GET(request: Request) {
  const GOOGLE_CLIENT_ID = (process.env.GOOGLE_CLIENT_ID || "").trim().replace(/^["']|["']$/g, "");

  const urlObj = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || urlObj.host;
  const protocol = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https";
  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "");
  if (process.env.NODE_ENV === "production" && !configuredOrigin) {
    return NextResponse.json({ error: "OAuth belum dikonfigurasi." }, { status: 503 });
  }
  const origin = configuredOrigin || `${protocol}://${host}`;
    
  const redirectUri = `${origin}/api/auth/callback/google`;

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
  });

  const url = `https://accounts.google.com/o/oauth2/v2/auth?${searchParams.toString()}`;
  const response = NextResponse.redirect(url);
  response.cookies.set("profas_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/api/auth/callback/google",
  });
  return response;
}
