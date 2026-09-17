import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const name = String(body.name || '').trim().slice(0, 120);
    const email = String(body.email || '').trim().slice(0, 200);
    const message = String(body.message || '').trim().slice(0, 5000);

    if (!name) return Response.json({ error: 'Please enter your name' }, { status: 400 });
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return Response.json({ error: 'Please enter a valid email address' }, { status: 400 });
    if (!message || message.length < 10)
      return Response.json({ error: 'Please enter a message (at least 10 characters)' }, { status: 400 });

    const base44 = createClientFromRequest(req);

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