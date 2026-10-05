import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const slug = String(body.slug || '').trim().toLowerCase();
    const name = String(body.name || '').trim();
    const guestToken = String(body.guest_token || '').trim();

    if (!slug) return Response.json({ error: 'Missing slug' }, { status: 400 });
    if (!name) return Response.json({ error: 'Please enter your name' }, { status: 400 });

    const rsvp_status = ['yes', 'no', 'pending'].includes(body.rsvp_status) ? body.rsvp_status : 'pending';

    const base44 = createClientFromRequest(req);

    const list = await base44.asServiceRole.entities.Wedding.filter({ site_slug: slug }, '-created_date', 1);
    const w = list && list[0];
    if (!w) return Response.json({ error: 'Wedding not found' }, { status: 404 });

    // Rate limit: max 20 new RSVP submissions per wedding per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const weddingGuests = await base44.asServiceRole.entities.Guest.filter({ wedding_id: w.id }, '-created_date', 50);
    const recentCount = (weddingGuests || []).filter(
      (g) => new Date(g.created_date) > oneHourAgo
    ).length;

    if (recentCount >= 20) {
      return Response.json({ error: 'Too many RSVP submissions for this wedding. Please try again later.' }, { status: 429 });
    }

    const plus_ones = Math.max(0, Math.min(10, Number(body.plus_ones) || 0));
    const rsvpPayload = {
      rsvp_status,
      contact: String(body.contact || '').trim().slice(0, 200),
      plus_ones,
      travel_needed: !!body.travel_needed,
      accommodation: String(body.accommodation || '').trim().slice(0, 300),
      arrival_date: body.arrival_date || null,
      meal_choice: String(body.meal_choice || '').trim().slice(0, 80),
      meal_notes: String(body.meal_notes || '').trim().slice(0, 300),
    };

    // Token-based update: only update the specific guest identified by the token
    if (guestToken) {
      const guestsByToken = await base44.asServiceRole.entities.Guest.filter({
        wedding_id: w.id,
        rsvp_token: guestToken,
      }, '-created_date', 1);

      if (!guestsByToken || !guestsByToken.length) {
        return Response.json({ error: 'Invalid RSVP link' }, { status: 403 });
      }

      const guest = await base44.asServiceRole.entities.Guest.update(guestsByToken[0].id, {
        ...rsvpPayload,
        invitation_status: 'rsvp_received',
      });

      return Response.json({ ok: true, guest_id: guest.id, synced: true });
    }

    // No token: only create a new guest record — never overwrite an existing guest by name
    const newGuest = await base44.asServiceRole.entities.Guest.create({
      wedding_id: w.id,
      name: name.slice(0, 120),
      ...rsvpPayload,
      invitation_status: 'rsvp_received',
    });

    return Response.json({ ok: true, guest_id: newGuest.id, synced: false });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}