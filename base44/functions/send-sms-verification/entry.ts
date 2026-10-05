import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';
import { getClientIp } from '../../shared/security.ts';

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
    const clientIp = getClientIp(req);

    // Per-IP rate limit: max 5 sends per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentIpRecords = await base44.asServiceRole.entities.SmsVerification.filter({
      ip_address: clientIp,
    }, '-created_date', 10);

    const recentIpCount = (recentIpRecords || []).filter(
      (r) => new Date(r.created_date) > oneHourAgo
    ).length;

    if (recentIpCount >= 5) {
      return Response.json({ error: 'Too many verification requests from your address. Please try again later.' }, { status: 429 });
    }

    // Global rate limit: max 30 SMS sends per hour across ALL IPs/numbers
    // (prevents distributed abuse that runs up Twilio SMS costs)
    const allRecentSends = await base44.asServiceRole.entities.SmsVerification.list('-created_date', 50);
    const globalSmsCount = (allRecentSends || []).filter(
      (r) => new Date(r.created_date) > oneHourAgo && r.phone_number && r.phone_number !== '__ratelimit__'
    ).length;
    if (globalSmsCount >= 30) {
      return Response.json({ error: 'Too many verification requests. Please try again later.' }, { status: 429 });
    }

    // Per-number cooldown: 60 seconds between sends to the same number
    const recent = await base44.asServiceRole.entities.SmsVerification.filter({
      phone_number: normalized,
    }, '-created_date', 1);

    if (recent && recent.length > 0) {
      const lastSent = new Date(recent[0].created_date);
      if (Date.now() - lastSent.getTime() < 60000) {
        return Response.json({ error: 'Please wait a minute before requesting another code' }, { status: 429 });
      }
    }

    // Invalidate all previous unverified codes for this phone number
    await base44.asServiceRole.entities.SmsVerification.updateMany(
      { phone_number: normalized, verified: false },
      { $set: { consumed: true } }
    );

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Store the code
    await base44.asServiceRole.entities.SmsVerification.create({
      phone_number: normalized,
      code,
      verified: false,
      consumed: false,
      attempts: 0,
      expires_at: expiresAt,
      ip_address: clientIp,
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
      // Mark the code as consumed since we couldn't send it
      await base44.asServiceRole.entities.SmsVerification.updateMany(
        { phone_number: normalized, code },
        { $set: { consumed: true } }
      );
      return Response.json({ error: 'Could not send SMS' }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('send-sms-verification error:', error);
    return Response.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}