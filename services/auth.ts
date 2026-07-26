import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { cache } from "react";
import { prisma } from "./prisma";

const configuredSecret = (process.env.JWT_SECRET ?? "").trim().replace(/^["']|["']$/g, "");
const secretString = configuredSecret || (process.env.NODE_ENV === "production" ? "" : "profas-development-only-secret-change-me");

if (secretString.length < 32) {
  throw new Error("JWT_SECRET wajib disetel dan minimal 32 karakter sebelum server dijalankan.");
}

const secret = new TextEncoder().encode(secretString);

export type SessionPayload = {
  userId: string;
  email?: string;
  name?: string;
  avatar?: string;
  authProvider?: string;
  role: "STUDENT" | "MENTOR" | "SUPER_ADMIN";
};

export async function createToken(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export const getSession = cache(async () => {
  const store = await cookies();
  const token = store.get("profas_session")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as SessionPayload;
  } catch {
    return null;
  }
});

export const getCurrentUser = cache(async () => {
  const session = await getSession();
  if (!session) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId }
    });

    // User yang sudah dihapus/nonaktif tidak boleh dibuat kembali hanya karena
    // token lama masih valid. Identitas juga harus tetap cocok berdasarkan ID
    // penerbitan token, bukan email yang mungkin dipakai akun baru.
    // Role selalu diambil dari database, bukan JWT.
    return user;
  } catch (error) {
    // Public routes must remain renderable when the session database is briefly
    // unavailable. Treat the request as a guest instead of failing the tree.
    console.error("[AUTH_USER_LOOKUP_FAILED]", error instanceof Error ? error.message : "unknown error");
    return null;
  }
});
