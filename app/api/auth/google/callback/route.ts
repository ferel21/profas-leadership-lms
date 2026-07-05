import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createToken } from "@/lib/auth";

export async function GET(request: Request) {
  const urlObj = new URL(request.url);
  const code = urlObj.searchParams.get("code");
  const error = urlObj.searchParams.get("error");

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const redirectUri = `${baseUrl}${urlObj.pathname}`;
  console.log("=== GOOGLE AUTH CALLBACK ===", { baseUrl, redirectUri, code: !!code, error });

  if (error) {
    return NextResponse.redirect(`${baseUrl}/masuk?error=google_auth_failed`);
  }

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/masuk?error=missing_code`);
  }

  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return NextResponse.json({ message: "Google OAuth credentials missing" }, { status: 500 });
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
      return NextResponse.redirect(`${baseUrl}/masuk?error=token_exchange_failed`);
    }

    // Get user info
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const userData = await userRes.json();
    if (!userRes.ok) {
      console.error("Failed to fetch user info:", userData);
      return NextResponse.redirect(`${baseUrl}/masuk?error=fetch_user_failed`);
    }

    const { email, name, picture } = userData;

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (user) {
      // Ensure authProvider is updated if needed (optional)
      if (user.authProvider !== "GOOGLE") {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { authProvider: "GOOGLE", avatar: user.avatar || picture },
        });
      }
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          name: name,
          avatar: picture,
          authProvider: "GOOGLE",
          role: "STUDENT",
        },
      });
    }

    // Generate JWT token
    const token = await createToken({ userId: user.id, role: user.role });

    // Set cookie and redirect to dashboard
    const response = NextResponse.redirect(`${baseUrl}/dashboard`);
    response.cookies.set("profas_session", token, { 
      httpOnly: true, 
      sameSite: "lax", 
      secure: process.env.NODE_ENV === "production", 
      maxAge: 60 * 60 * 24 * 7, // 7 days 
      path: "/" 
    });

    return response;
  } catch (err) {
    console.error("Google Auth Error:", err);
    return NextResponse.redirect(`${baseUrl}/masuk?error=server_error`);
  }
}
