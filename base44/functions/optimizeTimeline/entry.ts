import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const guestCount = Number(body.guest_count) || 100;
    const ceremonyTime = String(body.ceremony_time || '16:00');
    const venue = String(body.venue || '').slice(0, 200);
    const weddingType = String(body.wedding_type || 'single_day').replace(/_/g, ' ');
    const photographer = String(body.photographer_status || 'photographer');

    const prompt = `You are an expert wedding day timeline planner. Design a complete, realistic run-of-show for a ${weddingType} wedding.

Guest count: ${guestCount}
Ceremony start time: ${ceremonyTime}
Venue: ${venue || 'a single venue hosting both ceremony and reception'}
Photo / video coverage: ${photographer}

Produce a chronological day-of timeline from getting ready through the send-off. For each item provide:
- title (short, e.g. "First Look", "Ceremony", "Cocktail Hour", "Golden Hour Portraits", "Reception Start", "Toasts", "First Dance", "Send-Off")
- start_time in 24-hour HH:MM
- duration_minutes (realistic, with buffers for transitions and group photos)
- notes (one line: who/where/why)

Account for the guest count (larger groups need more buffer for transitions and group photos), the ceremony start time, and the photo coverage. Include golden-hour portraits at an appropriate time. Return JSON only.`;

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
                notes: { type: 'string' }
              },
              required: ['title', 'start_time', 'duration_minutes', 'notes']
            }
          }
        },
        required: ['events']
      }
    });

    return Response.json({ events: result?.events || [] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}