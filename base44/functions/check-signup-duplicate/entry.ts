import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { getClientIp } from '../../shared/security.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const weddingDate = body?.wedding_date;
    const venueName = body?.venue_name;
    const venueLocation = body?.venue_location;

    if (!weddingDate || !venueName || !venueLocation) {
      return Response.json({ isDuplicate: false });
    }

    const base44 = createClientFromRequest(req);
    const clientIp = getClientIp(req);

    // Per-IP rate limit: max 10 checks per hour (tracked via SmsVerification records from this IP)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentIpRecords = await base44.asServiceRole.entities.SmsVerification.filter({
      ip_address: clientIp,
    }, '-created_date', 15);

    const recentIpCount = (recentIpRecords || []).filter(
      (r) => new Date(r.created_date) > oneHourAgo
    ).length;

    if (recentIpCount >= 10) {
      return Response.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    // Query all free-tier weddings matching date + venue_name + venue_location
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