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
/**
 * Validate that a request originates from the app's own frontend.
 * Checks the Origin header (set by browsers for cross-origin POSTs) and
 * falls back to Referer. If neither header is present, allows the request
 * (rate limiting handles that case). If a header IS present but doesn't
 * match the app URL, rejects — this blocks cross-site form submissions.
 */
export function validateAppOrigin(req: Request, appUrl: string | undefined | null): boolean {
  if (!appUrl) return true; // No app URL configured — don't block
  let expected: string;
  try {
    expected = new URL(appUrl).origin;
  } catch {
    return true; // Invalid app URL — don't block
  }
  const origin = req.headers.get('origin');
  if (origin) {
    try { return new URL(origin).origin === expected; } catch { return false; }
  }
  const referer = req.headers.get('referer');
  if (referer) {
    try { return new URL(referer).origin === expected; } catch { return false; }
  }
  return true; // No Origin/Referer — allow (rate limits handle this)
}

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