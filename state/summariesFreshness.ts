/**
 * When the Summaries screen is allowed to hit the network.
 *
 * The screen already cached sessions and journey, but revalidated in the
 * background on every single visit, so the cache only ever saved a spinner — never
 * a request. This decides when a refetch is actually warranted.
 *
 * Summaries change in exactly three ways:
 *   1. The user ends a conversation ("New chat") and the reaper writes a summary.
 *   2. A conversation goes idle for 30 minutes and the reaper closes it server-side.
 *   3. The user clears their history.
 *
 * (1) and (3) happen in this app, so they mark the cache stale directly. (2) can
 * happen while the app is backgrounded, which is the only reason a TTL exists at
 * all — it is a backstop for a change we cannot observe, not a polling interval.
 * Pull-to-refresh remains the manual override.
 */

const TTL_MS = 10 * 60 * 1000;

/** Users whose summaries changed since the last successful fetch. */
const stale = new Set<string>();

/** Call when a session ends or history is cleared. */
export function markSummariesStale(userId: string | null | undefined) {
  if (userId) stale.add(userId);
}

/** Call after a successful fetch. */
export function markSummariesFresh(userId: string | null | undefined) {
  if (userId) stale.delete(userId);
}

/**
 * Whether to revalidate behind an already-rendered cache.
 *
 * `fetchedAt` comes from the persisted cache, so a cold start with a day-old copy
 * still refetches once — the in-memory stale set alone would not survive a restart.
 */
export function shouldRevalidate(
  userId: string | null | undefined,
  fetchedAt: number | undefined,
): boolean {
  if (!userId) return false;
  if (stale.has(userId)) return true;
  if (!fetchedAt) return true;
  return Date.now() - fetchedAt > TTL_MS;
}
