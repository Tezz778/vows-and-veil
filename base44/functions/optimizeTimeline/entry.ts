import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const guestCount = Number(body.guest_count) || 100;
    const ceremonyTime = String(body.ceremony_time || '16:00');
    const venueType = String(body.venue_type || 'indoor');
    const weddingType = String(body.wedding_type || 'single_day');
    const photoStatus = String(body.photographer_status || 'neither');

    const prompt = `You are an expert wedding-day timeline planner. Build a realistic, well-paced
run-of-show for a ${weddingType.replace('_', '-')} wedding at an ${venueType} venue with ${guestCount} guests.
The ceremony starts at ${ceremonyTime}. Photo/video coverage: ${photoStatus}.

Produce an ordered list of day-of moments from getting ready through send-off. For each moment
give a start_time (24h HH:MM), a duration in minutes, a short title, and a one-line note with
practical detail (buffer reasoning, who's involved, location). Pace realistically for the guest
count and coverage type — larger guest counts and dual photo+video need more buffer. Keep it to
about 10-14 moments. All on day_number 1.

Return JSON matching the schema.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          events: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                start_time: { type: 'string' },
                duration_minutes: { type: 'number' },
                notes: { type: 'string' },
                day_number: { type: 'number' }
              },
              required: ['title', 'start_time', 'duration_minutes']
            }
          }
        },
        required: ['events']
      }
    });

    return Response.json({ events: (result && result.events) || [] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}