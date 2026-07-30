import { prisma } from "./prisma";

const DAY_MS = 24 * 60 * 60 * 1000;
const dayKey = (date: Date) => date.toISOString().slice(0, 10);

// Sidebar chrome is rendered for every protected page. Keep this small,
// short-lived cache in the process so a sidebar navigation does not acquire a
// new database connection for the same user on every request.
const STREAK_CACHE_TTL_MS = 60 * 1000;
const STREAK_QUERY_TIMEOUT_MS = 750;
const MAX_STREAK_CACHE_ENTRIES = 1000;
const streakCache = new Map<string, { value: number; expiresAt: number }>();
const streakInFlight = new Map<string, Promise<number>>();

function cacheStreak(userId: string, value: number, now: number) {
  if (streakCache.size >= MAX_STREAK_CACHE_ENTRIES && !streakCache.has(userId)) {
    const oldestKey = streakCache.keys().next().value;
    if (oldestKey) streakCache.delete(oldestKey);
  }
  streakCache.set(userId, { value, expiresAt: now + STREAK_CACHE_TTL_MS });
}

/**
 * Counts consecutive calendar days (ending today or yesterday) a user has
 * logged in, based on ActivityLog USER_LOGIN entries. Returns 0 once the
 * streak is broken (no login today or yesterday) rather than showing a
 * stale count.
 */
export async function getLoginStreak(userId: string): Promise<number> {
  if (!userId) return 0;

  const now = Date.now();
  const cached = streakCache.get(userId);
  if (cached && cached.expiresAt > now) return cached.value;
  if (cached) streakCache.delete(userId);
  const inFlight = streakInFlight.get(userId);
  if (inFlight) return inFlight;

  const query = (async () => {
    try {
      const logins = await prisma.activityLog.findMany({
        where: { userId, action: "USER_LOGIN" },
        select: { createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 400
      });
      if (logins.length === 0) {
        cacheStreak(userId, 0, now);
        return 0;
      }

      const distinctDays = [...new Set(logins.map(l => dayKey(l.createdAt)))].sort().reverse();

      const today = dayKey(new Date());
      const gapFromToday = Math.round((Date.parse(today) - Date.parse(distinctDays[0])) / DAY_MS);
      if (gapFromToday > 1) {
        cacheStreak(userId, 0, now);
        return 0;
      }

      let streak = 1;
      for (let i = 1; i < distinctDays.length; i++) {
        const gap = Math.round((Date.parse(distinctDays[i - 1]) - Date.parse(distinctDays[i])) / DAY_MS);
        if (gap !== 1) break;
        streak++;
      }

      cacheStreak(userId, streak, now);
      return streak;
    } catch (error) {
      // A decorative sidebar metric must never take down the page. Connection
      // pool pressure, a temporary database outage, or a missing log table all
      // degrade to the neutral value while the rest of the workspace renders.
      if (process.env.NODE_ENV === "development") {
        console.warn("Unable to load login streak", error);
      }
      return 0;
    }
  })();

  // Keep the underlying query in the in-flight map until it genuinely
  // settles. A UI timeout must not make the next navigation start another
  // database query while the first one is still waiting for a pooled
  // connection.
  streakInFlight.set(userId, query);
  void query.finally(() => {
    if (streakInFlight.get(userId) === query) streakInFlight.delete(userId);
  });

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const request = Promise.race([
    query,
    new Promise<number>(resolve => {
      timeoutId = setTimeout(() => {
        cacheStreak(userId, 0, now);
        resolve(0);
      }, STREAK_QUERY_TIMEOUT_MS);
    })
  ]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });

  try {
    return await request;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
