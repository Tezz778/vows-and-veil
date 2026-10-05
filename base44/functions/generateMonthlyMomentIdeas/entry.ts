import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    // Guard: block non-admin authenticated users; rate-limit anonymous/scheduler calls
    let isAnonymous = false;
    try {
      const user = await base44.auth.me();
      if (user) {
        if (user.role !== 'admin') {
          return Response.json({ error: 'Forbidden' }, { status: 403 });
        }
        // Admin — allowed without rate limit
      } else {
        isAnonymous = true;
      }
    } catch {
      isAnonymous = true;
    }

    // Rate limit: min 6 hours between runs for anonymous/scheduler calls
    if (isAnonymous) {
      const recentIdeas = await base44.asServiceRole.entities.MomentIdea.list('-created_date', 1);
      if (recentIdeas && recentIdeas.length > 0) {
        const lastRun = new Date(recentIdeas[0].created_date);
        if (Date.now() - lastRun.getTime() < 6 * 60 * 60 * 1000) {
          return Response.json({ error: 'Rate limited — already run recently' }, { status: 429 });
        }
      }
    }

    // List all weddings (service role — workflow context has no user session)
    const weddings = await base44.asServiceRole.entities.Wedding.list('-created_date', 200);

    const today = new Date().toISOString().slice(0, 10);
    let weddingsProcessed = 0;
    let totalIdeas = 0;
    const errors = [];

    for (const wedding of weddings) {
      // Skip weddings that have already happened
      if (wedding.wedding_date && wedding.wedding_date < today) continue;

      const context = String(wedding.style_notes || '').slice(0, 1200);
      const weddingType = wedding.wedding_type || 'single_day';

      const prompt = `You are a creative, tasteful wedding moment advisor for engaged couples.
Generate 6 unique, non-generic wedding moment ideas (send-offs, surprise dances, ceremony traditions, reception surprises).
Tailor them to this couple's style and wedding type. Avoid clichés; favor meaningful, memorable, personal touches.

Couple context / style notes: ${context || 'no specific notes — suggest broadly appealing but distinctive ideas'}
Wedding type: ${weddingType}

Return JSON with an array of ideas, each with a short "title", a 1-2 sentence "description", and a "category"
(one of: send_off, dance, ceremony, reception, other).`;

      try {
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

        const ideas = result.ideas || [];
        if (ideas.length === 0) continue;

        // Save ideas as MomentIdea entities
        const records = ideas.map((idea) => ({
          wedding_id: wedding.id,
          title: String(idea.title).slice(0, 200),
          description: String(idea.description).slice(0, 1000),
          category: ['send_off', 'dance', 'ceremony', 'reception', 'other'].includes(idea.category) ? idea.category : 'other'
        }));

        await base44.asServiceRole.entities.MomentIdea.bulkCreate(records);
        totalIdeas += ideas.length;
        weddingsProcessed++;

        // Notify the wedding owner by email
        try {
          const owner = await base44.asServiceRole.entities.User.get(wedding.created_by_id);
          if (owner && owner.email) {
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: owner.email,
              subject: `Fresh moment ideas for your wedding 💍`,
              body: `Hi ${owner.full_name || 'there'},\n\nWe've generated ${ideas.length} new wedding moment ideas for you based on your current style and wedding type. From send-offs to ceremony traditions, there's something new to inspire you.\n\nLog in to your Everbind dashboard and visit the Moment Ideas page to review them.\n\nHappy planning,\nThe Everbind Team`
            });
          }
        } catch (emailErr) {
          // Email failure shouldn't stop the whole run
          errors.push(`Email failed for wedding ${wedding.id}: ${emailErr.message}`);
        }
      } catch (weddingErr) {
        errors.push(`Wedding ${wedding.id} failed: ${weddingErr.message}`);
      }
    }

    return Response.json({
      status: 'success',
      weddingsProcessed,
      totalIdeasGenerated: totalIdeas,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}