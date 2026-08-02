import { Prisma } from "@prisma/client";
import { prisma } from "@/services/prisma";

export async function withSerializableRetry<T>(
  operation: (tx: Prisma.TransactionClient) => Promise<T>,
  maxAttempts = 3,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await prisma.$transaction(operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      lastError = error;
      const canRetry =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034" &&
        attempt < maxAttempts;
      if (!canRetry) throw error;
    }
  }

  throw lastError;
}
