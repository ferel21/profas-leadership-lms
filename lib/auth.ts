import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { cache } from "react";
import { prisma } from "./prisma";

const secretString = (process.env.JWT_SECRET ?? "profas-development-secret").trim().replace(/^["']|["']$/g, "");
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
  
  let user = await prisma.user.findUnique({
    where: { id: session.userId }
  });
  
  if (!user && session.email) {
    user = await prisma.user.findUnique({
      where: { email: session.email.toLowerCase() }
    });
  }
  
  // Auto-sync / self-heal di lingkungan serverless Vercel (/tmp/dev.db sementara)
  if (!user && session.email) {
    try {
      const validRole = session.role === "MENTOR" ? "MENTOR" : session.role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "STUDENT";
      user = await prisma.user.upsert({
        where: { email: session.email.toLowerCase() },
        update: {
          name: session.name || "Peserta PROFAS",
          avatar: session.avatar,
          role: validRole,
          authProvider: session.authProvider || "GOOGLE",
        },
        create: {
          id: session.userId,
          email: session.email.toLowerCase(),
          name: session.name || "Peserta PROFAS",
          avatar: session.avatar,
          role: validRole,
          authProvider: session.authProvider || "GOOGLE",
          passwordHash: "",
        }
      });
    } catch (e) {
      console.error("Auto-sync user in serverless failed:", e);
    }
  }
  
  return user;
});
