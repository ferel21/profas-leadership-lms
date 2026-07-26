import { prisma } from "./prisma";

const DAY_MS = 24 * 60 * 60 * 1000;
const dayKey = (date: Date) => date.toISOString().slice(0, 10);

/**
 * Counts consecutive calendar days (ending today or yesterday) a user has
 * logged in, based on ActivityLog USER_LOGIN entries. Returns 0 once the
 * streak is broken (no login today or yesterday) rather than showing a
 * stale count.
 */
export async function getLoginStreak(userId: string): Promise<number> {
  const logins = await prisma.activityLog.findMany({
    where: { userId, action: "USER_LOGIN" },
    select: { createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 400
  });
  if (logins.length === 0) return 0;

  const distinctDays = [...new Set(logins.map(l => dayKey(l.createdAt)))].sort().reverse();

  const today = dayKey(new Date());
  const gapFromToday = Math.round((Date.parse(today) - Date.parse(distinctDays[0])) / DAY_MS);
  if (gapFromToday > 1) return 0;

  let streak = 1;
  for (let i = 1; i < distinctDays.length; i++) {
    const gap = Math.round((Date.parse(distinctDays[i - 1]) - Date.parse(distinctDays[i])) / DAY_MS);
    if (gap !== 1) break;
    streak++;
  }
  return streak;
}
