import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { userHasFeature } from '../../shared/security.ts';

const ROLE_LABELS = {
  best_man: 'Best Man',
  maid_of_honor: 'Maid of Honor',
  father_of_bride: "Father of the Bride",
  mother_of_bride: 'Mother of the Bride',
  parent: 'Parent',
  other: 'Speaker',
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));

    // Server-side tier check: read from the User's plan_tier (server-owned),
    // NOT the client-writable Wedding.selected_tier field.
    if (!userHasFeature(user, 'speeches')) {
      return Response.json({ error: 'Upgrade required' }, { status: 403 });
    }
    const speaker = String(body.speaker_name || 'Speaker');
    const role = String(body.role || 'other');
    const relationship = String(body.relationship || '');
    const couple = String(body.couple_names || 'the couple');
    const prompts = body.prompts || {};

    const promptsText = Object.entries(prompts)
      .filter(([, a]) => a && String(a).trim())
      .map(([q, a]) => `Q: ${q}\nA: ${a}`)
      .join('\n\n');

    const roleLabel = ROLE_LABELS[role] || 'Speaker';

    const prompt = `You are a warm, witty wedding speechwriting companion. Write a heartfelt,
natural-sounding toast for ${roleLabel} ${speaker} about ${couple}.
${relationship ? `Speaker's relationship to the couple: ${relationship}.` : ''}

Use the speaker's own answers below as the raw material — memories, feelings, and wishes.
Write in a conversational, genuine voice (not stiff or overly formal), around 250-350 words,
with a clear opening, a couple of vivid anecdotes, and a warm closing toast. Avoid clichés.

${promptsText || '(No answers yet — write a gentle, customizable starter draft with placeholders the speaker can personalize.)'}

Return only the speech text, ready to read aloud.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt });

    return Response.json({ draft_text: typeof result === 'string' ? result : JSON.stringify(result) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}