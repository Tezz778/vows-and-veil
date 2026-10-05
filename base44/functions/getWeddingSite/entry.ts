import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';
import { validateAppOrigin, generateRsvpToken } from '../../shared/security.ts';

export default async function(req) {
  try {
    // Verify the request originates from the app's own frontend
    const appUrl = secrets.get('WIX_CHECKOUT_APP_URL');
    if (!validateAppOrigin(req, appUrl)) {
      return Response.json({ error: 'Invalid request origin' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const slug = String(body.slug || '').trim().toLowerCase();
    if (!slug) return Response.json({ error: 'Missing slug' }, { status: 400 });

    const base44 = createClientFromRequest(req);
    // Use oldest match (created_date ascending) — first-claimed slug wins.
    // This is defense-in-depth against slug hijacking: even if a second
    // wedding somehow gets the same slug, the original owner keeps their page.
    const list = await base44.asServiceRole.entities.Wedding.filter({ site_slug: slug }, 'created_date', 1);
    const w = list && list[0];
    if (!w) return Response.json({ error: 'Wedding not found' }, { status: 404 });

    // Generate a short-lived signed RSVP token (replaces the static site_rsvp_secret).
    // The token is signed with the wedding's site_rsvp_secret — which is NEVER returned
    // to the client — and expires after 2 hours. submitRSVP verifies the token's
    // signature and expiry, so an attacker who calls this endpoint gets only a
    // time-limited token, not the reusable static secret.
    const rsvp_token = w.site_rsvp_secret
      ? await generateRsvpToken(w.id, w.site_rsvp_secret)
      : '';

    return Response.json({
      couple_names: w.couple_names,
      wedding_date: w.wedding_date,
      venue_name: w.venue_name,
      venue_location: w.venue_location,
      style_notes: w.style_notes,
      site_message: w.site_message,
      wedding_type: w.wedding_type,
      site_hero_image: w.site_hero_image,
      site_story: w.site_story,
      site_photos: w.site_photos,
      site_sections: w.site_sections,
      site_registry: w.site_registry,
      site_meal_options: w.site_meal_options,
      rsvp_token,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}