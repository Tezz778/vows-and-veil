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

    const answersText = Object.entries(answers)
      .map(([q, a]) => `Q: ${q}\nA: ${a}`)
      .join('\n\n');

    const prompt = `You are a thoughtful vow-writing companion. You do NOT write finished vows.
Using the couple's reflective answers below, organize them into a STRUCTURED DRAFT OUTLINE
that the couple will personalize themselves. Group related memories and feelings into sections
(e.g., "How we began", "What I admire", "A promise for the future"). For each section, include
the relevant raw material from their answers in their own words, plus a gentle prompt reminding
them to shape it into their voice. Keep it as an outline/scaffold, not polished prose.

Partner 1: ${partner1}
Partner 2: ${partner2}

Answers:
${answersText || '(no answers yet — provide a gentle starting scaffold with the section headers and prompts to reflect)'}

Return the structured draft as plain text with clear section headers.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt
    });

    return Response.json({ draft_text: typeof result === 'string' ? result : JSON.stringify(result) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}