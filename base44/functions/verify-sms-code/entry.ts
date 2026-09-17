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

    // Find the most recent unverified code for this phone number
    const records = await base44.asServiceRole.entities.SmsVerification.filter({
      phone_number: normalized,
      verified: false,
    }, '-created_date', 5);

    if (!records || records.length === 0) {
      return Response.json({ verified: false, error: 'No pending verification found' });
    }

    // Find a matching, non-expired code
    const now = Date.now();
    const match = records.find((r) => {
      if (r.code !== code) return false;
      const expires = new Date(r.expires_at || r.created_date).getTime();
      return expires > now;
    });

    if (!match) {
      return Response.json({ verified: false, error: 'Invalid or expired code' });
    }

    // Mark as verified
    await base44.asServiceRole.entities.SmsVerification.update(match.id, {
      verified: true,
    });

    return Response.json({ verified: true });
  } catch (error) {
    console.error('verify-sms-code error:', error);
    return Response.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}