import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const slug = String(body.slug || '').trim().toLowerCase();
    if (!slug) return Response.json({ error: 'Missing slug' }, { status: 400 });

    const base44 = createClientFromRequest(req);
    const list = await base44.asServiceRole.entities.Wedding.filter({ site_slug: slug }, '-created_date', 1);
    const w = list && list[0];
    if (!w) return Response.json({ error: 'Wedding not found' }, { status: 404 });

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
      site_meal_options: w.site_meal_options
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}