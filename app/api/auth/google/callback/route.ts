import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { createToken } from "@/lib/auth";

export async function GET(request: Request) {
  const urlObj = new URL(request.url);
  const code = urlObj.searchParams.get("code");
  const error = urlObj.searchParams.get("error");
  const state = urlObj.searchParams.get("state");

  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || urlObj.host;
  const protocol = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https";
  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "");
  if (process.env.NODE_ENV === "production" && !configuredOrigin) {
    return NextResponse.json({ error: "OAuth belum dikonfigurasi." }, { status: 503 });
  }
  const origin = configuredOrigin || `${protocol}://${host}`;
  const redirectUri = `${origin}/api/auth/callback/google`;

  const fail = (reason: string) => {
    const response = NextResponse.redirect(`${origin}/masuk?error=${encodeURIComponent(reason)}`);
    response.cookies.set("profas_oauth_state", "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 0, path: "/api/auth/callback/google" });
    return response;
  };

  const cookieStore = await cookies();
  const expectedState = cookieStore.get("profas_oauth_state")?.value || "";
  const stateMatches = state && expectedState && state.length === expectedState.length
    ? timingSafeEqual(Buffer.from(state), Buffer.from(expectedState))
    : false;

  if (!stateMatches) return fail("oauth_state_invalid");

  if (error) {
    return fail("google_auth_failed");
  }

  if (!code) {
    return fail("missing_code");
  }

  const GOOGLE_CLIENT_ID = (process.env.GOOGLE_CLIENT_ID || "").trim().replace(/^["']|["']$/g, "");

  const GOOGLE_CLIENT_SECRET = (process.env.GOOGLE_CLIENT_SECRET || "").trim().replace(/^["']|["']$/g, "");

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return fail("google_not_configured");
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
      console.error("[GOOGLE_TOKEN_EXCHANGE_FAILED]", tokenRes.status);
      return fail("token_exchange_failed");
    }
    if (typeof tokenData.access_token !== "string" || tokenData.access_token.length < 20) {
      return fail("token_exchange_failed");
    }

    // Get user info
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const userData = await userRes.json();
    if (!userRes.ok) {
      console.error("[GOOGLE_USERINFO_FAILED]", userRes.status);
      return fail("fetch_user_failed");
    }

    const { email, name, picture, verified_email: verifiedEmail } = userData;
    if (typeof email !== "string" || verifiedEmail !== true) return fail("google_email_unverified");

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

    // Generate JWT token only after the Google identity and database record are valid.
    const token = await createToken({ 
      userId: user.id, 
      role: user.role, 
      email: user.email, 
      name: user.name, 
      avatar: user.avatar || undefined, 
      authProvider: "GOOGLE" 
    });

    const response = NextResponse.redirect(`${origin}/dashboard`);
    response.cookies.set("profas_session", token, { 
      httpOnly: true, 
      sameSite: "lax", 
      secure: process.env.NODE_ENV === "production", 
      maxAge: 60 * 60 * 24 * 7, // 7 days 
      path: "/" 
    });
    response.cookies.set("profas_oauth_state", "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 0, path: "/api/auth/callback/google" });

    return response;
  } catch (err: unknown) {
    console.error("[GOOGLE_AUTH_ERROR]", err instanceof Error ? err.message : "unknown error");
    return fail("server_error");
  }
}
