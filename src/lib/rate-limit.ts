const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  key: string,
  limit = 30,
  windowMs = 60_000,
): { success: boolean; remaining: number } {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0 };
  }

  entry.count += 1;
  return { success: true, remaining: limit - entry.count };
}

/** Rate limit por canal del agente IA: agent:{venueId}:{channel} */
export function agentRateLimit(
  venueId: string,
  channel: string,
  limit = 60,
  windowMs = 60_000,
) {
  return rateLimit(`agent:${venueId}:${channel}`, limit, windowMs);
}
