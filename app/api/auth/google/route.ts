import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const GOOGLE_CLIENT_ID = (
    process.env.GOOGLE_CLIENT_ID || 
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 
    process.env.GOOGLE_ID || 
    process.env.GOOGLE_CLIENTID || 
    process.env.GOOGLE_OAUTH_CLIENT_ID || 
    process.env.CLIENT_ID || ""
  ).trim().replace(/^["']|["']$/g, "");

  const urlObj = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || urlObj.host;
  const protocol = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https";
  const origin = process.env.NEXT_PUBLIC_APP_URL ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "") : `${protocol}://${host}`;
    
  const redirectUri = `${origin}/api/auth/callback/google`;
  console.log("=== GOOGLE AUTH START ===", { origin, redirectUri });

  if (!GOOGLE_CLIENT_ID) {
    const foundRelatedKeys = Object.keys(process.env).filter(k => /google|client|oauth|auth|id/i.test(k));
    return NextResponse.json({ 
      error: "Google Client ID is missing in Vercel Server Memory",
      message: "Server Vercel mendeteksi bahwa variabel lingkungan untuk Google Client ID masih kosong/tidak ada.",
      foundRelatedKeysInVercel: foundRelatedKeys,
      hint: "PENTING: Membuat Client ID di Google Cloud Console TIDAK otomatis mengirimkannya ke Vercel. Anda WAJIB menyalin Client ID tersebut dan menambahkannya di Dasbor Vercel -> Project profas-leadership-lms -> Settings -> Environment Variables -> Nama: GOOGLE_CLIENT_ID, lalu klik Save dan Redeploy."
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
