import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createToken } from "@/lib/auth";

export async function GET(request: Request) {
  const urlObj = new URL(request.url);
  const code = urlObj.searchParams.get("code");
  const error = urlObj.searchParams.get("error");

  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || urlObj.host;
  const protocol = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https";
  const origin = process.env.NEXT_PUBLIC_APP_URL ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "") : `${protocol}://${host}`;
  const redirectUri = `${origin}/api/auth/callback/google`;
  console.log("=== GOOGLE AUTH CALLBACK ===", { origin, redirectUri, code: !!code, error });

  if (error) {
    return NextResponse.redirect(`${origin}/masuk?error=google_auth_failed&reason=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/masuk?error=missing_code&reason=${encodeURIComponent("Kode otorisasi dari Google tidak ditemukan.")}`);
  }

  const GOOGLE_CLIENT_ID = (
    process.env.GOOGLE_CLIENT_ID || 
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 
    process.env.GOOGLE_ID || 
    process.env.GOOGLE_CLIENTID || 
    process.env.GOOGLE_OAUTH_CLIENT_ID || 
    process.env.CLIENT_ID || ""
  ).trim().replace(/^["']|["']$/g, "");

  const GOOGLE_CLIENT_SECRET = (
    process.env.GOOGLE_CLIENT_SECRET || 
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET || 
    process.env.GOOGLE_SECRET || 
    process.env.GOOGLE_CLIENTSECRET || 
    process.env.GOOGLE_OAUTH_CLIENT_SECRET || 
    process.env.CLIENT_SECRET || ""
  ).trim().replace(/^["']|["']$/g, "");

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    const foundRelatedKeys = Object.keys(process.env).filter(k => /google|client|oauth|auth|secret|id/i.test(k));
    return NextResponse.json({ 
      error: "Google OAuth credentials missing in Vercel Server Memory",
      message: "Server Vercel mendeteksi bahwa variabel lingkungan untuk Google OAuth masih kosong/tidak lengkap.",
      missing: {
        clientId: !GOOGLE_CLIENT_ID,
        clientSecret: !GOOGLE_CLIENT_SECRET
      },
      foundRelatedKeysInVercel: foundRelatedKeys,
      hint: "PENTING: Membuat Client ID di Google Cloud Console TIDAK otomatis mengirimkannya ke Vercel. Anda WAJIB menyalin Client ID & Secret dan menambahkannya di Dasbor Vercel -> Project profas-leadership-lms -> Settings -> Environment Variables -> Nama: GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET, lalu klik Save dan Redeploy."
    }, { status: 500 });
  }

  try {
    // Exchange code for token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error("Token exchange failed:", tokenData);
      const errDetail = tokenData.error_description || tokenData.error || "Gagal menukar token dengan server Google.";
      return NextResponse.redirect(`${origin}/masuk?error=token_exchange_failed&reason=${encodeURIComponent(errDetail)}`);
    }

    // Get user info
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const userData = await userRes.json();
    if (!userRes.ok) {
      console.error("Failed to fetch user info:", userData);
      return NextResponse.redirect(`${origin}/masuk?error=fetch_user_failed&reason=${encodeURIComponent("Gagal mengambil profil akun Google Anda.")}`);
    }

    const { email, name, picture } = userData;

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (user) {
      if (user.authProvider !== "GOOGLE") {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { authProvider: "GOOGLE", avatar: user.avatar || picture },
        });
      }
    } else {
      user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          name: name || "Peserta PROFAS",
          avatar: picture,
          authProvider: "GOOGLE",
          role: "STUDENT",
        },
      });
    }

    // Auto-enrollment: Pastikan peserta baru yang login via Google langsung terdaftar di kelas-kelas aktif
    if (user.role === "STUDENT") {
      const enrCount = await prisma.enrollment.count({ where: { userId: user.id } });
      if (enrCount === 0) {
        const publishedCourses = await prisma.course.findMany({ where: { published: true } });
        for (const course of publishedCourses) {
          await prisma.enrollment.upsert({
            where: { userId_courseId: { userId: user.id, courseId: course.id } },
            update: {},
            create: { userId: user.id, courseId: course.id, status: "ACTIVE", progressPercent: 0 }
          });
        }
      }
    }

    // Generate JWT token with full info for self-healing in serverless Vercel
    const token = await createToken({ 
      userId: user.id, 
      role: user.role, 
      email: user.email, 
      name: user.name, 
      avatar: user.avatar || undefined, 
      authProvider: "GOOGLE" 
    });

    // Set cookie on server store AND redirect response for 100% Next.js 15 App Router compatibility
    const cookieStore = await cookies();
    cookieStore.set("profas_session", token, { 
      httpOnly: true, 
      sameSite: "lax", 
      secure: process.env.NODE_ENV === "production", 
      maxAge: 60 * 60 * 24 * 7, // 7 days 
      path: "/" 
    });

    const response = NextResponse.redirect(`${origin}/dashboard`);
    response.cookies.set("profas_session", token, { 
      httpOnly: true, 
      sameSite: "lax", 
      secure: process.env.NODE_ENV === "production", 
      maxAge: 60 * 60 * 24 * 7, // 7 days 
      path: "/" 
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Google Auth Error:", err);
    return NextResponse.redirect(`${origin}/masuk?error=server_error&reason=${encodeURIComponent(message || "Terjadi gangguan sistem internal.")}`);
  }
}
