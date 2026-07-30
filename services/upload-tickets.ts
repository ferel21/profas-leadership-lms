import "server-only";

import { randomUUID } from "node:crypto";
import { jwtVerify, SignJWT } from "jose";
import { z } from "zod";

const issuer = "profas-lms";

const materialUploadTicketSchema = z.object({
  ticketType: z.literal("upload"),
  purpose: z.literal("material"),
  userId: z.string().min(1).max(191),
  objectPath: z.string().min(1).max(700),
  courseId: z.string().min(1).max(191),
  lessonId: z.string().min(1).max(191).nullable(),
  fileName: z.string().min(1).max(180),
  fileSize: z.number().int().positive(),
  mimeType: z.string().min(1).max(191),
  description: z.string().max(1000),
  deferNodeCommit: z.boolean(),
});

const assignmentUploadTicketSchema = z.object({
  ticketType: z.literal("upload"),
  purpose: z.literal("assignment"),
  userId: z.string().min(1).max(191),
  objectPath: z.string().min(1).max(700),
  assessmentId: z.string().min(1).max(191),
  attemptId: z.string().min(1).max(191),
  questionId: z.string().min(1).max(191),
  fileName: z.string().min(1).max(180),
  fileSize: z.number().int().positive(),
  mimeType: z.string().min(1).max(191),
});

const uploadTicketSchema = z.discriminatedUnion("purpose", [
  materialUploadTicketSchema,
  assignmentUploadTicketSchema,
]);

const committedAssignmentTicketSchema = z.object({
  ticketType: z.literal("committed-assignment"),
  purpose: z.literal("assignment"),
  userId: z.string().min(1).max(191),
  objectPath: z.string().min(1).max(700),
  assessmentId: z.string().min(1).max(191),
  attemptId: z.string().min(1).max(191),
  questionId: z.string().min(1).max(191),
  fileName: z.string().min(1).max(180),
  fileSize: z.number().int().positive(),
  mimeType: z.string().min(1).max(191),
});

export type UploadTicketPayload = z.infer<typeof uploadTicketSchema>;
export type MaterialUploadTicketPayload = z.infer<typeof materialUploadTicketSchema>;
export type AssignmentUploadTicketPayload = z.infer<typeof assignmentUploadTicketSchema>;
export type CommittedAssignmentTicketPayload = z.infer<typeof committedAssignmentTicketSchema>;

function signingSecret() {
  const configured = (process.env.JWT_SECRET ?? "").trim().replace(/^["']|["']$/g, "");
  const value = configured || (process.env.NODE_ENV === "production" ? "" : "profas-development-only-secret-change-me");
  if (value.length < 32) {
    throw new Error("JWT_SECRET wajib disetel dan minimal 32 karakter untuk membuat tiket unggahan.");
  }
  return new TextEncoder().encode(value);
}

async function signTicket(
  payload: UploadTicketPayload | CommittedAssignmentTicketPayload,
  audience: "upload" | "committed-assignment",
  expiresIn: string,
) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(issuer)
    .setAudience(audience)
    .setSubject(payload.userId)
    .setJti(randomUUID())
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(signingSecret());
}

export function createUploadTicket(payload: UploadTicketPayload) {
  return signTicket(payload, "upload", "20m");
}

export async function verifyUploadTicket(token: string) {
  const verified = await jwtVerify(token, signingSecret(), {
    algorithms: ["HS256"],
    issuer,
    audience: "upload",
  });
  return uploadTicketSchema.parse(verified.payload);
}

export function createCommittedAssignmentTicket(payload: Omit<CommittedAssignmentTicketPayload, "ticketType" | "purpose">) {
  return signTicket({
    ...payload,
    ticketType: "committed-assignment",
    purpose: "assignment",
  }, "committed-assignment", "25h");
}

export async function verifyCommittedAssignmentTicket(token: string) {
  const verified = await jwtVerify(token, signingSecret(), {
    algorithms: ["HS256"],
    issuer,
    audience: "committed-assignment",
  });
  return committedAssignmentTicketSchema.parse(verified.payload);
}
