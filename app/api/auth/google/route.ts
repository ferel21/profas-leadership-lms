import { NextResponse } from "next/server";

export async function GET() {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const redirectUri = "https://profas-leadership-lms.vercel.app/api/auth/callback/google";
  console.log("=== GOOGLE AUTH START ===", { redirectUri });

  if (!GOOGLE_CLIENT_ID) {
    return NextResponse.json({ 
      error: "Google Client ID is missing",
      message: "Google Client ID is missing from environment variables.",
      hint: "Pastikan GOOGLE_CLIENT_ID atau NEXT_PUBLIC_GOOGLE_CLIENT_ID sudah ditambahkan di Vercel Settings -> Environment Variables dan centang Production, lalu Redeploy."
    }, { status: 500 });
  }

  const searchParams = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    prompt: "consent",
  });

  const url = `https://accounts.google.com/o/oauth2/v2/auth?${searchParams.toString()}`;
  return NextResponse.redirect(url);
}
