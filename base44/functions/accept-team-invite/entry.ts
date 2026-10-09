import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const pending = await base44.asServiceRole.entities.TeamMember.filter(
      { email: user.email, status: 'pending' },
      '-created_date',
      50
    );

    const invites = pending || [];
    if (invites.length === 0) {
      return Response.json({ accepted: [], team_wedding_ids: user.data?.team_wedding_ids || [] });
    }

    const teamWeddingIds = [...(user.data?.team_wedding_ids || [])];
    const accepted: string[] = [];

    for (const invite of invites) {
      await base44.asServiceRole.entities.TeamMember.update(invite.id, {
        status: 'accepted',
        user_id: user.id,
      });
      if (!teamWeddingIds.includes(invite.wedding_id)) {
        teamWeddingIds.push(invite.wedding_id);
      }
      accepted.push(invite.wedding_id);
    }

    await base44.auth.updateMe({ team_wedding_ids: teamWeddingIds });

    return Response.json({ accepted, team_wedding_ids: teamWeddingIds });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}