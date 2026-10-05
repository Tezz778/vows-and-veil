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
  // Collect all valid expected origins:
  // 1. The platform-injected X-Base44-App-Url header (current environment's URL)
  // 2. The configured appUrl (WIX_CHECKOUT_APP_URL — production URL)
  const headerAppUrl = req.headers.get('x-base44-app-url');
  const candidates = [headerAppUrl, appUrl].filter(Boolean) as string[];
  if (candidates.length === 0) return true; // No app URL configured — don't block

  const expectedOrigins = candidates
    .map((u) => { try { return new URL(u).origin; } catch { return null; } })
    .filter((o): o is string => o !== null);
  if (expectedOrigins.length === 0) return true; // All URLs invalid — don't block

  const isAllowedOrigin = (originStr: string): boolean => {
    try {
      const parsed = new URL(originStr);
      // Accept if it matches a configured expected origin
      if (expectedOrigins.includes(parsed.origin)) return true;
      // Accept any *.base44.app origin — the preview sandbox, production, and
      // other Base44 environments all run on this domain. These functions are
      // already public (callable by anyone); origin validation is defense-in-depth
      // against CSRF from non-Base44 sites, and rate limiting handles the rest.
      if (parsed.hostname.endsWith('.base44.app')) return true;
      return false;
    } catch { return false; }
  };

  const origin = req.headers.get('origin');
  if (origin) return isAllowedOrigin(origin);
  const referer = req.headers.get('referer');
  if (referer) return isAllowedOrigin(referer);
  return false; // No Origin/Referer — reject (direct API calls bypass origin checks)
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

/**
 * Generate a short-lived signed RSVP token for a wedding.
 * The token is signed with the wedding's site_rsvp_secret (never returned to
 * the client) and expires after 2 hours. submitRSVP verifies the signature
 * and expiry, proving the submission originated from getWeddingSite — not a
 * direct API call with a stolen static secret.
 */
export async function generateRsvpToken(weddingId: string, secret: string): Promise<string> {
  if (!secret) return '';
  const expiry = Date.now() + 2 * 60 * 60 * 1000; // 2 hours
  const payload = `${weddingId}:${expiry}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const sigHex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${btoa(payload)}.${sigHex}`;
}

/**
 * Verify a short-lived signed RSVP token.
 * Returns true only if the token is validly signed with the given secret and
 * has not expired.
 */
export async function verifyRsvpToken(token: string, secret: string): Promise<boolean> {
  if (!token || !secret) return false;
  try {
    const [payloadB64, sigHex] = token.split('.');
    if (!payloadB64 || !sigHex) return false;
    const payload = atob(payloadB64);
    const [, expiryStr] = payload.split(':');
    const expiry = parseInt(expiryStr, 10);
    if (isNaN(expiry) || Date.now() > expiry) return false;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const expectedSig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    const expectedHex = Array.from(new Uint8Array(expectedSig)).map(b => b.toString(16).padStart(2, '0')).join('');
    return expectedHex === sigHex;
  } catch { return false; }
}