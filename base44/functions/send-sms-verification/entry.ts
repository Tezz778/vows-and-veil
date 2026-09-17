import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';

export default async function(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const phoneNumber = body?.phone_number;

    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return Response.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // Normalize phone number (strip non-digits, ensure + prefix)
    const normalized = phoneNumber.replace(/[^\d+]/g, '');
    if (normalized.length < 10) {
      return Response.json({ error: 'Invalid phone number' }, { status: 400 });
    }

    const accountSid = secrets.get('TWILIO_ACCOUNT_SID');
    const authToken = secrets.get('TWILIO_AUTH_TOKEN');
    const fromNumber = secrets.get('TWILIO_PHONE_NUMBER');

    if (!accountSid || !authToken || !fromNumber) {
      console.error('Missing Twilio secrets');
      return Response.json({ error: 'SMS service not configured' }, { status: 500 });
    }

    const base44 = createClientFromRequest(req);

    // Rate limit: check if a code was sent in the last 60 seconds
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const recent = await base44.asServiceRole.entities.SmsVerification.filter({
      phone_number: normalized,
    }, '-created_date', 1);

    if (recent && recent.length > 0) {
      const lastSent = new Date(recent[0].created_date);
      if (Date.now() - lastSent.getTime() < 60000) {
        return Response.json({ error: 'Please wait a minute before requesting another code' }, { status: 429 });
      }
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Store the code
    await base44.asServiceRole.entities.SmsVerification.create({
      phone_number: normalized,
      code,
      verified: false,
      expires_at: expiresAt,
    });

    // Send via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const auth = btoa(`${accountSid}:${authToken}`);
    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: fromNumber,
        To: normalized,
        Body: `Your Vows & Veil verification code is: ${code}`,
      }),
    });

    if (!twilioResponse.ok) {
      const errText = await twilioResponse.text();
      console.error('Twilio error:', errText);
      return Response.json({ error: 'Could not send SMS' }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('send-sms-verification error:', error);
    return Response.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}