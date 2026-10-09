import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';
import { getClientIp, validateAppOrigin, verifyTurnstileToken } from '../../shared/security.ts';

// Public endpoint called during the signup flow (before the user has an account).
// Left open intentionally — adding auth would break registration. Protected by
// origin validation (requests must come from the app's own frontend) plus
// per-IP rate limiting that counts THIS function's own activity.
export default async function(req: Request): Promise<Response> {
  try {
    // Verify the request originates from the app's own frontend
    const appUrl = secrets.get('WIX_CHECKOUT_APP_URL');
    if (!validateAppOrigin(req, appUrl)) {
      return Response.json({ error: 'Invalid request origin' }, { status: 403 });
    }

    const body = await req.json();

    // Verify the Cloudflare Turnstile challenge before querying
    if (!await verifyTurnstileToken(req, body?.turnstile_token)) {
      return Response.json({ error: 'Please complete the verification' }, { status: 403 });
    }

    const weddingDate = body?.wedding_date;
    const venueName = body?.venue_name;
    const venueLocation = body?.venue_location;

    if (!weddingDate || !venueName || !venueLocation) {
      return Response.json({ isDuplicate: false });
    }

    const base44 = createClientFromRequest(req);
    const clientIp = getClientIp(req);

    // Per-IP rate limit: max 10 checks per hour, tracked via dedicated rate-limit
    // records (code: 'DUPLICATE_CHECK') written by THIS function — not SmsVerification
    // records from send-sms-verification, which this function never creates.
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentChecks = await base44.asServiceRole.entities.SmsVerification.filter({
      ip_address: clientIp,
      code: 'DUPLICATE_CHECK',
    }, '-created_date', 15);

    const recentCount = (recentChecks || []).filter(
      (r) => new Date(r.created_date) > oneHourAgo
    ).length;

    if (recentCount >= 10) {
      return Response.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    // Record this check so subsequent calls from the same IP are counted.
    await base44.asServiceRole.entities.SmsVerification.create({
      phone_number: '__ratecheck__',
      code: 'DUPLICATE_CHECK',
      verified: false,
      consumed: true,
      ip_address: clientIp,
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });

    // Query free-tier weddings matching date + venue_name + venue_location
    const matches = await base44.asServiceRole.entities.Wedding.filter({
      selected_tier: 'free',
      wedding_date: weddingDate,
      venue_name: venueName.trim(),
      venue_location: venueLocation.trim(),
    }, '-created_date', 1);

    return Response.json({ isDuplicate: !!(matches && matches.length > 0) });
  } catch (error) {
    console.error('check-signup-duplicate error:', error);
    // Fail open — don't block signup on error
    return Response.json({ isDuplicate: false });
  }
}