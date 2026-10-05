import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Authenticated endpoint: only the wedding owner can set their slug.
// Validates slug uniqueness server-side to prevent slug hijacking.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const slug = String(body.slug || '').trim().toLowerCase();

    if (!slug || slug.length < 3) {
      return Response.json({ error: 'Slug must be at least 3 characters' }, { status: 400 });
    }
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return Response.json({ error: 'Slug can only contain lowercase letters, numbers, and hyphens' }, { status: 400 });
    }
    if (slug.length > 80) {
      return Response.json({ error: 'Slug is too long' }, { status: 400 });
    }

    // Get the user's wedding (user-scoped — RLS ensures ownership)
    const myWeddings = await base44.entities.Wedding.filter({}, '-created_date', 1);
    const myWedding = myWeddings && myWeddings[0];
    if (!myWedding) {
      return Response.json({ error: 'No wedding found for your account' }, { status: 404 });
    }

    // Check uniqueness: search all weddings for this slug (service role)
    const existing = await base44.asServiceRole.entities.Wedding.filter({ site_slug: slug }, 'created_date', 5);
    const conflict = (existing || []).find((w) => w.id !== myWedding.id && w.site_slug === slug);
    if (conflict) {
      return Response.json({ error: 'This link is already taken. Please try another.' }, { status: 409 });
    }

    // Generate a per-wedding RSVP secret for the public RSVP form
    const rsvpSecret = crypto.randomUUID();

    // Update the user's wedding (user-scoped — RLS enforces ownership)
    await base44.entities.Wedding.update(myWedding.id, {
      site_slug: slug,
      site_rsvp_secret: rsvpSecret,
    });

    return Response.json({ ok: true, slug, rsvp_secret: rsvpSecret });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}