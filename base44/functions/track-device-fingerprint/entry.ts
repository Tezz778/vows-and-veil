import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const fingerprintHash = body?.fingerprint_hash;

    if (!fingerprintHash || typeof fingerprintHash !== 'string') {
      return Response.json({ error: 'Fingerprint hash is required' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user's wedding
    const weddings = await base44.entities.Wedding.list('-created_date', 1);
    const weddingId = weddings && weddings.length > 0 ? weddings[0].id : null;

    // Create a new fingerprint record
    await base44.asServiceRole.entities.DeviceFingerprint.create({
      fingerprint_hash: fingerprintHash,
      user_id: user.id,
      wedding_id: weddingId,
      flagged: false,
    });

    // Check how many free accounts were created from this device in the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const recentFingerprints = await base44.asServiceRole.entities.DeviceFingerprint.filter({
      fingerprint_hash: fingerprintHash,
    }, '-created_date', 100);

    // Count records created in the last 30 days
    const recentCount = (recentFingerprints || []).filter((r) =>
      new Date(r.created_date) > new Date(thirtyDaysAgo)
    ).length;

    let flagged = false;

    // If 3 or more free accounts from the same device in 30 days, flag for review
    if (recentCount >= 3) {
      flagged = true;
      // Flag all recent records from this device
      const toFlag = (recentFingerprints || []).filter((r) =>
        new Date(r.created_date) > new Date(thirtyDaysAgo)
      );
      for (const r of toFlag) {
        if (!r.flagged) {
          await base44.asServiceRole.entities.DeviceFingerprint.update(r.id, { flagged: true });
        }
      }
    }

    return Response.json({ flagged });
  } catch (error) {
    console.error('track-device-fingerprint error:', error);
    return Response.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}