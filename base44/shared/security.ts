// Shared security helpers for backend functions.

/**
 * Extract the client IP address from a request, checking standard proxy headers.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const ip = forwarded.split(",")[0].trim();
    if (ip) return ip;
  }
  const connecting = req.headers.get("cf-connecting-ip");
  if (connecting) return connecting.trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
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