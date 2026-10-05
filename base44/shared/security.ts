// Shared security helpers for backend functions.

/**
 * Extract the client IP address from a request, checking standard proxy headers.
 */
export function getClientIp(req: Request): string {
  // Trust only the platform-set Cloudflare header. X-Forwarded-For is
  // attacker-controlled and must not be used for rate-limit keys.
  const connecting = req.headers.get("cf-connecting-ip");
  if (connecting) return connecting.trim();
  return "unknown";
}

export const TIER_FEATURES: Record<string, string[]> = {
  free: ['timeline', 'vows'],
  single_day: ['timeline', 'ideas', 'budget', 'reminders', 'vendors', 'moodboard', 'optimizer'],
  multiday: ['timeline', 'vows', 'ideas', 'budget', 'shotlist', 'guests', 'reminders', 'vendors', 'moodboard', 'speeches', 'optimizer', 'rehearsal'],
  destination: ['timeline', 'vows', 'ideas', 'budget', 'shotlist', 'guests', 'reminders', 'travel', 'vendors', 'moodboard', 'speeches', 'optimizer', 'rehearsal']
};

export function hasFeature(tier: string, feature: string): boolean {
  return (TIER_FEATURES[tier] || []).includes(feature);
}

/**
 * Validate an email recipient to prevent header injection.
 * Strips CR/LF and verifies basic email format. Returns the cleaned
 * address string, or null if invalid.
 */
export function validateEmailRecipient(to: string): string | null {
  if (!to || typeof to !== 'string') return null;
  const cleaned = to.replace(/[\r\n]/g, '').trim();
  if (!cleaned) return null;
  const addrs = cleaned.split(',').map(a => a.trim()).filter(Boolean);
  for (const a of addrs) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a)) return null;
  }
  return cleaned;
}

/**
 * Return a safe http(s) URL, or null if the URL uses a dangerous scheme
 * (javascript:, data:, etc.) or is unparseable.
 */
export function safeUrl(url: string | undefined | null): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") return trimmed;
    return null;
  } catch {
    return null;
  }
}