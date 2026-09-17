import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const answers = body.answers || {};
    const partner1 = String(body.partner1_name || 'Partner 1');
    const partner2 = String(body.partner2_name || 'Partner 2');
    const currentDraft = String(body.draft_text || '').trim();

    const answersText = Object.entries(answers)
      .filter(([, a]) => a && String(a).trim())
      .map(([q, a]) => `Q: ${q}\nA: ${a}`)
      .join('\n\n');

    const prompt = `You are a vow-writing coach, not a ghostwriter. The couple has answered
reflection questions and may have started writing their own vows. They are stuck and want
help finding their words — NOT someone to write the vows for them.

Based on their answers and what they've written so far, provide practical writing help:

1. **Angles to try** — 2-3 specific approaches or themes they could explore based on their
   answers (e.g., "Leaning into the humor of that first meeting" or "The quiet way they
   show care"). One line each.

2. **Starting points** — 3-4 sentence beginnings or phrasing fragments they could adapt
   (e.g., "I still remember the way you…" or "You probably don't know this, but…").
   These are fragments to spark their own writing, NOT finished lines.

3. **A prompt to keep going** — One question that helps them dig deeper into a memory or
   feeling they've already touched on.

Rules:
- Do NOT write vows, paragraphs, or full sentences they would say at the altar.
- Do NOT produce a structured draft or outline of their vows.
- Keep every suggestion short — a phrase, not a sentence.
- Speak directly to the writer as "you" and keep the tone warm and encouraging.
- If they haven't written anything yet, focus on helping them begin.

Partner 1: ${partner1}
Partner 2: ${partner2}

Their answers to reflection questions:
${answersText || '(no answers yet)'}

What they've written so far:
${currentDraft || '(nothing yet — they are just starting)'}

Return your response as plain text with the three sections labeled clearly.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt
    });

    return Response.json({ draft_text: typeof result === 'string' ? result : JSON.stringify(result) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}