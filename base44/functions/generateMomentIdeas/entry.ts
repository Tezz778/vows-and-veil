import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const context = String(body.context || '').slice(0, 1200);
    const weddingType = String(body.wedding_type || 'single_day');

    const prompt = `You are a creative, tasteful wedding moment advisor for engaged couples.
Generate 6 unique, non-generic wedding moment ideas (send-offs, surprise dances, ceremony traditions, reception surprises).
Tailor them to this couple's style and wedding type. Avoid clichés; favor meaningful, memorable, personal touches.

Couple context / style notes: ${context || 'no specific notes — suggest broadly appealing but distinctive ideas'}
Wedding type: ${weddingType}

Return JSON with an array of ideas, each with a short "title", a 1-2 sentence "description", and a "category"
(one of: send_off, dance, ceremony, reception, other).`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          ideas: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                category: { type: 'string' }
              },
              required: ['title', 'description', 'category']
            }
          }
        },
        required: ['ideas']
      }
    });

    return Response.json({ ideas: result.ideas || [] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}