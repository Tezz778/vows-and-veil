import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Server-side wedding creation after email OTP verification.
// Moves the phone_verified decision server-side: looks up the SmsVerification
// record for the submitted phone number instead of trusting a client-supplied flag.
// Also stamps plan_tier on the User so RLS tier-gating can enforce paid features.
export default async function(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const coupleNames = String(body.couple_names || '').trim();
    const weddingDate = String(body.wedding_date || '').trim();
    const venueName = String(body.venue_name || '').trim();
    const venueLocation = String(body.venue_location || '').trim();
    const phoneNumber = String(body.phone_number || '').replace(/[^\d+]/g, '');
    const fingerprintHash = body.fingerprint_hash ? String(body.fingerprint_hash) : null;

    if (!coupleNames || !weddingDate || !venueName || !venueLocation) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Server-side phone verification: look up the SmsVerification record.
    // Never trust a client-supplied phone_verified value.
    let phoneVerified = false;
    if (phoneNumber) {
      const verifiedRecords = await base44.asServiceRole.entities.SmsVerification.filter({
        phone_number: phoneNumber,
        verified: true,
      }, '-created_date', 1);
      phoneVerified = !!(verifiedRecords && verifiedRecords.length > 0);
    }

    // Create the Wedding record with phone_verified from the server-side lookup.
    const wedding = await base44.entities.Wedding.create({
      couple_names: coupleNames,
      wedding_date: weddingDate,
      venue_name: venueName,
      venue_location: venueLocation,
      wedding_type: 'single_day',
      selected_tier: 'free',
      phone_number: phoneNumber || null,
      phone_verified: phoneVerified,
    });

    // Set plan_tier on the User so RLS tier-gating rules can enforce paid features.
    // This is server-side only — the client cannot set plan_tier directly.
    try {
      await base44.asServiceRole.entities.User.update(user.id, { plan_tier: 'free' });
    } catch (e) {
      console.error('complete-signup: could not set plan_tier on user', e);
    }

    // Track device fingerprint as an advisory signal (server-side, not client-trusted).
    if (fingerprintHash) {
      try {
        await base44.asServiceRole.entities.DeviceFingerprint.create({
          fingerprint_hash: fingerprintHash,
          user_id: user.id,
          wedding_id: wedding.id,
          flagged: false,
        });
      } catch (e) {
        console.error('complete-signup: fingerprint tracking failed', e);
      }
    }

    return Response.json({ ok: true, wedding_id: wedding.id, phone_verified: phoneVerified });
  } catch (error) {
    console.error('complete-signup error:', error);
    return Response.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}