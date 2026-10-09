import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';
import { getClientIp, validateAppOrigin, verifyTurnstileToken } from '../../shared/security.ts';

// Public endpoint: the Contact page is reachable by signed-out visitors, so
// auth is not required. Protected by origin validation (requests must come
// from the app's own frontend) plus per-IP and global rate limiting.
export default async function(req) {
  try {
    // Verify the request originates from the app's own frontend
    const appUrl = secrets.get('WIX_CHECKOUT_APP_URL');
    if (!validateAppOrigin(req, appUrl)) {
      return Response.json({ error: 'Invalid request origin' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));

    // Verify the Cloudflare Turnstile challenge before sending
    if (!await verifyTurnstileToken(req, body.turnstile_token)) {
      return Response.json({ error: 'Please complete the verification' }, { status: 403 });
    }

    const name = String(body.name || '').trim().slice(0, 120);
    const email = String(body.email || '').trim().slice(0, 200);
    const message = String(body.message || '').trim().slice(0, 5000);

    if (!name) return Response.json({ error: 'Please enter your name' }, { status: 400 });
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return Response.json({ error: 'Please enter a valid email address' }, { status: 400 });
    if (!message || message.length < 10)
      return Response.json({ error: 'Please enter a message (at least 10 characters)' }, { status: 400 });

    const base44 = createClientFromRequest(req);
    const clientIp = getClientIp(req);

    // Per-IP rate limit: max 5 contact emails per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentChecks = await base44.asServiceRole.entities.SmsVerification.filter({
      ip_address: clientIp,
      code: 'CONTACT_EMAIL',
    }, '-created_date', 10);

    const recentCount = (recentChecks || []).filter(
      (r) => new Date(r.created_date) > oneHourAgo
    ).length;

    if (recentCount >= 5) {
      return Response.json({ error: 'Too many messages. Please try again later.' }, { status: 429 });
    }

    // Global rate limit: max 20 contact emails per hour across ALL IPs
    // (prevents distributed IP rotation flooding the admin inbox)
    const allContactRecords = await base44.asServiceRole.entities.SmsVerification.filter({
      code: 'CONTACT_EMAIL',
    }, '-created_date', 25);
    const globalCount = (allContactRecords || []).filter(
      (r) => new Date(r.created_date) > oneHourAgo
    ).length;
    if (globalCount >= 20) {
      return Response.json({ error: 'Too many messages. Please try again later.' }, { status: 429 });
    }

    // Record this send for rate limiting
    await base44.asServiceRole.entities.SmsVerification.create({
      phone_number: '__ratelimit__',
      code: 'CONTACT_EMAIL',
      verified: false,
      consumed: true,
      ip_address: clientIp,
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });

    // Resolve the app owner / first admin to receive the message
    const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' }, '-created_date', 1);
    const admin = admins && admins[0];
    if (!admin || !admin.email) {
      return Response.json({ error: 'No contact recipient configured' }, { status: 500 });
    }

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: admin.email,
      subject: `New contact form message from ${name}`,
      body: [
        `You received a new message from the Vows & Veil contact form.`,
        ``,
        `Name: ${name}`,
        `Email: ${email}`,
        ``,
        `Message:`,
        message
      ].join('\n')
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}