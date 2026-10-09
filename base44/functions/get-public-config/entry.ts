import { secrets } from 'base44:runtime';

// Public endpoint: returns the Cloudflare Turnstile site key for the
// frontend widget. The site key is public by design (it is embedded in
// the page HTML), so no auth or origin check is needed here.
export default async function(req: Request): Promise<Response> {
  try {
    return Response.json({ turnstileSiteKey: secrets.get('TURNSTILE_SITE_KEY') || '' });
  } catch (error) {
    return Response.json({ turnstileSiteKey: '' }, { status: 500 });
  }
}