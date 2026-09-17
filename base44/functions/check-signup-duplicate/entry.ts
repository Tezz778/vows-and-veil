import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

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

    // Query all free-tier weddings matching date + venue_name + venue_location
    // Service role bypasses RLS so we can see all users' weddings
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