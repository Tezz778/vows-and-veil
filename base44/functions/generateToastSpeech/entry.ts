import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { userHasFeature } from '../../shared/security.ts';

const ROLE_LABELS = {
  best_man: 'best man',
  maid_of_honor: 'maid of honor',
  father_of_bride: "father of the bride",
  mother_of_bride: "mother of the bride",
  father_of_groom: "father of the groom",
  mother_of_groom: "mother of the groom",
  bride: 'bride',
  groom: 'groom',
  other: 'wedding party member'
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
    const role = String(body.role || 'other');
    const speakerName = String(body.speaker_name || '').slice(0, 120);
    const coupleNames = String(body.couple_names || '').slice(0, 120);
    const relationship = String(body.relationship || '').slice(0, 300);
    const tone = String(body.tone || 'heartfelt');
    const anecdotes = String(body.anecdotes || '').slice(0, 1500);

    const roleLabel = ROLE_LABELS[role] || role;

    const prompt = `You are a thoughtful, tasteful wedding speechwriter. Write a complete, ready-to-deliver wedding toast.

Speaker role: ${roleLabel}
Speaker name: ${speakerName || '(unspecified — write in first person without naming the speaker)'}
Couple's names: ${coupleNames || '(unspecified — use "you both" where needed)'}
Speaker's relationship to the couple: ${relationship || '(unspecified)'}
Desired tone: ${tone}
Memories / anecdotes to weave in: ${anecdotes || '(none provided — invent warm, genuine-sounding moments that fit the relationship)'}

Write 250-400 words. Open naturally, share one or two personal stories, reflect on the couple together, and close with a heartfelt toast. Address the couple by name. Avoid clichés and overused quotes. Sound like a real person speaking aloud — conversational, not stiff.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt });
    const draft = typeof result === 'string' ? result : (result?.text || result?.draft || '');
    return Response.json({ draft_text: draft });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}