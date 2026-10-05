import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const phoneNumber = body?.phone_number;
    const code = body?.code;

    if (!phoneNumber || !code) {
      return Response.json({ error: 'Phone number and code are required' }, { status: 400 });
    }

    const normalized = phoneNumber.replace(/[^\d+]/g, '');

    const base44 = createClientFromRequest(req);

    // Find the most recent non-consumed, non-verified code for this phone number
    const records = await base44.asServiceRole.entities.SmsVerification.filter({
      phone_number: normalized,
      verified: false,
      consumed: false,
    }, '-created_date', 1);

    if (!records || records.length === 0) {
      return Response.json({ verified: false, error: 'No pending verification found. Please request a new code.' });
    }

    const record = records[0];
    const now = Date.now();
    const expires = new Date(record.expires_at || record.created_date).getTime();

    // Check if expired
    if (expires <= now) {
      await base44.asServiceRole.entities.SmsVerification.update(record.id, { consumed: true });
      return Response.json({ verified: false, error: 'Code expired. Please request a new one.' });
    }

    // Check if locked out due to too many attempts
    if ((record.attempts || 0) >= 5) {
      await base44.asServiceRole.entities.SmsVerification.update(record.id, { consumed: true });
      return Response.json({ verified: false, error: 'Too many failed attempts. Please request a new code.' });
    }

    // Check if code matches
    if (record.code !== code) {
      const newAttempts = (record.attempts || 0) + 1;
      const shouldLockout = newAttempts >= 5;
      await base44.asServiceRole.entities.SmsVerification.update(record.id, {
        attempts: newAttempts,
        consumed: shouldLockout,
      });
      return Response.json({
        verified: false,
        error: shouldLockout
          ? 'Too many failed attempts. Please request a new code.'
          : 'Invalid code',
      });
    }

    // Code matches — mark as verified and consumed (prevents replay)
    await base44.asServiceRole.entities.SmsVerification.update(record.id, {
      verified: true,
      consumed: true,
    });

    return Response.json({ verified: true });
  } catch (error) {
    console.error('verify-sms-code error:', error);
    return Response.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}