import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { validateEmailRecipient } from '../../shared/security.ts';

const CONNECTOR_ID = '6aac3e7dda961b837ebe5200';

function base64urlEncode(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function buildRawEmail(to, subject, body) {
  const encodedSubject = `=?utf-8?B?${base64urlEncode(subject)}?=`;
  return [
    `To: ${to}`,
    `Subject: ${encodedSubject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    '',
    body,
  ].join('\r\n');
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'status';

    let connection;
    try {
      connection = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID);
    } catch {
      return Response.json({ error: 'Not connected', notConnected: true }, { status: 403 });
    }

    const accessToken = connection.accessToken;

    // Connection check — return the user's Gmail profile
    if (action === 'status') {
      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        const err = await res.text();
        return Response.json({ error: `Gmail error: ${err}` }, { status: res.status });
      }
      const profile = await res.json();
      return Response.json({ connected: true, emailAddress: profile.emailAddress });
    }

    // Send email
    if (action === 'send') {
      const to = validateEmailRecipient(String(body.to || ''));
      const subject = String(body.subject || '').trim();
      const emailBody = String(body.body || '');
      if (!to) return Response.json({ error: 'A valid recipient email is required' }, { status: 400 });
      if (!subject) return Response.json({ error: 'Subject is required' }, { status: 400 });

      const rawEmail = buildRawEmail(to, subject, emailBody);
      const encoded = base64urlEncode(rawEmail);

      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw: encoded }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error('Gmail send error:', err);
        return Response.json({ error: `Gmail API error: ${err}` }, { status: res.status });
      }

      const data = await res.json();
      return Response.json({ ok: true, messageId: data.id });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('send-gmail error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}