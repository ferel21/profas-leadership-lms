import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "profas-leadership-lms.vercel.app";
  const protocol = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const dynamicBaseUrl = `${protocol}://${host}`;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || dynamicBaseUrl;
  const redirectUri = `${baseUrl}/api/auth/callback/google`;
  console.log("=== GOOGLE AUTH START ===", { baseUrl, redirectUri });

  if (!GOOGLE_CLIENT_ID) {
    return NextResponse.json({ message: "Google Client ID is missing from environment variables." }, { status: 500 });
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
