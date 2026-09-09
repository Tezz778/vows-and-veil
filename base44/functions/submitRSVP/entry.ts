import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const slug = String(body.slug || '').trim().toLowerCase();
    const name = String(body.name || '').trim();
    if (!slug) return Response.json({ error: 'Missing slug' }, { status: 400 });
    if (!name) return Response.json({ error: 'Please enter your name' }, { status: 400 });

    const rsvp_status = ['yes', 'no', 'pending'].includes(body.rsvp_status) ? body.rsvp_status : 'pending';

    const base44 = createClientFromRequest(req);
    const list = await base44.asServiceRole.entities.Wedding.filter({ site_slug: slug }, '-created_date', 1);
    const w = list && list[0];
    if (!w) return Response.json({ error: 'Wedding not found' }, { status: 404 });

    const plus_ones = Math.max(0, Math.min(10, Number(body.plus_ones) || 0));
    const guest = await base44.asServiceRole.entities.Guest.create({
      wedding_id: w.id,
      name: name.slice(0, 120),
      rsvp_status,
      contact: String(body.contact || '').trim().slice(0, 200),
      plus_ones,
      travel_needed: !!body.travel_needed,
      accommodation: String(body.accommodation || '').trim().slice(0, 300),
      arrival_date: body.arrival_date || null,
      meal_choice: String(body.meal_choice || '').trim().slice(0, 80),
      meal_notes: String(body.meal_notes || '').trim().slice(0, 300),
      invitation_status: 'rsvp_received'
    });

    return Response.json({ ok: true, guest_id: guest.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}