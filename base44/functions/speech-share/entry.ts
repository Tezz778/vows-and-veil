import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

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
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || '');
    const token = String(body.token || '');

    if (!token) return Response.json({ error: 'Token required' }, { status: 400 });

    // Public access — find speech by share token using service role (bypasses RLS)
    const speeches = await base44.asServiceRole.entities.Speech.filter({ share_token: token }, '-created_date', 1);
    if (!speeches || !speeches.length) return Response.json({ error: 'Speech not found' }, { status: 404 });

    const speech = speeches[0];
    if (!speech.share_enabled) return Response.json({ error: 'This link has been revoked by the couple.' }, { status: 403 });

    if (action === 'get') {
      const wedding = await base44.asServiceRole.entities.Wedding.get(speech.wedding_id);
      return Response.json({
        speaker_name: speech.speaker_name,
        role: speech.role,
        relationship: speech.relationship || '',
        prompts: speech.prompts || {},
        draft_text: speech.draft_text || '',
        couple_names: wedding?.couple_names || 'the couple',
        share_status: speech.share_status || 'not_started',
      });
    }

    if (action === 'save') {
      const draftText = body.draft_text != null ? String(body.draft_text) : (speech.draft_text || '');
      const prompts = body.prompts || speech.prompts || {};
      const status = body.share_status || (draftText.trim() ? 'in_progress' : 'not_started');

      await base44.asServiceRole.entities.Speech.update(speech.id, {
        draft_text: draftText,
        prompts,
        share_status: status,
      });

      return Response.json({ ok: true, share_status: status });
    }

    if (action === 'generate') {
      // Rate limit: min 60 seconds between generations per speech token
      const lastGen = speech.last_generated_date ? new Date(speech.last_generated_date) : null;
      if (lastGen && Date.now() - lastGen.getTime() < 60000) {
        return Response.json({ error: 'Please wait a moment before generating again.' }, { status: 429 });
      }

      const prompts = body.prompts || speech.prompts || {};
      const speaker = speech.speaker_name;
      const role = speech.role;
      const relationship = speech.relationship || '';

      const wedding = await base44.asServiceRole.entities.Wedding.get(speech.wedding_id);
      const couple = wedding?.couple_names || 'the couple';

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
      const draftText = typeof result === 'string' ? result : JSON.stringify(result);

      await base44.asServiceRole.entities.Speech.update(speech.id, {
        draft_text: draftText,
        prompts,
        share_status: 'in_progress',
        last_generated_date: new Date().toISOString(),
      });

      return Response.json({ draft_text: draftText, share_status: 'in_progress' });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}