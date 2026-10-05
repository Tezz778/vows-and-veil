import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';
import Stripe from 'npm:stripe@17.7.0';
import { getClientIp } from '../../shared/security.ts';

// Server-side price map — never trust the client. Amounts in cents (Stripe's unit).
const PRODUCTS = {
  single_day: { name: "Everbind — Single Day Tier", amount: 9900 },
  multiday: { name: "Everbind — Multiday Tier", amount: 29900 },
  destination: { name: "Everbind — Destination Tier", amount: 39900 },
  budget_upgrade: { name: "Everbind — Budget Boost Add-on", amount: 1900 },
};

export default async function(req: Request): Promise<Response> {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const stripeKey = secrets.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.error("create-stripe-checkout: STRIPE_SECRET_KEY not set");
      return Response.json({ error: "Payments not configured" }, { status: 500 });
    }

    // App URL for return links — server-owned sources only, never the caller's Origin.
    const appUrl = req.headers.get("x-base44-app-url") || secrets.get("WIX_CHECKOUT_APP_URL") || "";
    if (!appUrl) {
      console.error("create-stripe-checkout: no app URL configured");
      return Response.json({ error: "Payments not configured" }, { status: 500 });
    }

    const base44 = createClientFromRequest(req);

    // This function is only called from the authenticated Pricing and Budget pages
    // (both behind ProtectedRoute). Require a logged-in user — anonymous callers get 401.
    let appUser;
    try {
      appUser = await base44.auth.me();
    } catch (_) {
      appUser = null;
    }
    if (!appUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Per-IP rate limit: max 10 checkout sessions per hour
    const clientIp = getClientIp(req);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCheckoutRecords = await base44.asServiceRole.entities.SmsVerification.filter({
      ip_address: clientIp,
      code: 'STRIPE_CHECKOUT',
    }, '-created_date', 12);
    const recentCheckoutCount = (recentCheckoutRecords || []).filter(
      (r) => new Date(r.created_date) > oneHourAgo
    ).length;
    if (recentCheckoutCount >= 10) {
      return Response.json({ error: "Too many checkout requests. Please try again later." }, { status: 429 });
    }
    await base44.asServiceRole.entities.SmsVerification.create({
      phone_number: '__ratelimit__',
      code: 'STRIPE_CHECKOUT',
      verified: false,
      consumed: true,
      ip_address: clientIp,
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });

    const body = await req.json().catch(() => ({}));
    const productId = String(body.productId ?? "");
    const product = PRODUCTS[productId];
    if (!product) {
      return Response.json({ error: "Unknown product" }, { status: 400 });
    }

    const stripe = new Stripe(stripeKey);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{
        price_data: {
          currency: "usd",
          unit_amount: product.amount,
          product_data: { name: product.name },
        },
        quantity: 1,
      }],
      success_url: `${appUrl}/ThankYou`,
      cancel_url: `${appUrl}/budget`,
      client_reference_id: productId,
      ...(appUser?.email ? { customer_email: appUser.email } : {}),
    });

    // Persist the join key — Stripe session.id ties this payment back to the purchase.
    // The webhook resolves the purchase by this same id.
    await base44.asServiceRole.entities.Base44Purchase.create({
      checkoutSessionId: session.id,
      status: "pending",
      appUserId: appUser?.id ?? null,
      buyerEmail: appUser?.email ?? null,
      productId,
      productName: product.name,
      quantity: 1,
      amount: (product.amount / 100).toFixed(2),
      currency: "USD",
    });

    return Response.json({ redirectUrl: session.url });
  } catch (err) {
    console.error("create-stripe-checkout: unhandled error", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}