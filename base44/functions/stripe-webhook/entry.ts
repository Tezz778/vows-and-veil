import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';
import Stripe from 'npm:stripe@17.7.0';

export default async function(req: Request): Promise<Response> {
  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const stripeKey = secrets.get("STRIPE_SECRET_KEY");
    const webhookSecret = secrets.get("STRIPE_WEBHOOK_SECRET");
    if (!stripeKey || !webhookSecret) {
      console.error("stripe-webhook: Stripe config not set");
      return new Response("Webhook not configured", { status: 500 });
    }

    const stripe = new Stripe(stripeKey);
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      console.error("stripe-webhook: missing stripe-signature header");
      return new Response("Missing signature", { status: 400 });
    }

    // Async verification — SubtleCrypto requires async in Deno.
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      console.error("stripe-webhook: signature verification failed", err);
      return new Response("Invalid signature", { status: 401 });
    }

    const base44 = createClientFromRequest(req);
    const db = base44.asServiceRole;

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const checkoutId = session.id;
      const buyerEmail = session.customer_details?.email ?? session.customer_email ?? null;

      // Resolve the pending purchase created by create-stripe-checkout.
      const matches = await db.entities.Base44Purchase.filter({ checkoutSessionId: checkoutId });
      const purchase = matches?.[0];

      if (!purchase) {
        console.warn("stripe-webhook: no Base44Purchase for checkoutId, asking Stripe to retry", { checkoutId });
        return new Response("Purchase not found yet", { status: 500 });
      }

      // Idempotency — skip if already terminal.
      if (purchase.status === "paid" || purchase.status === "canceled") {
        console.log("stripe-webhook: purchase already terminal, skipping", { checkoutId, status: purchase.status });
        return new Response("OK", { status: 200 });
      }

      // Grant: unlock the paid tier on the buyer's Wedding.
      let grantUserId = purchase.appUserId;
      if (!grantUserId && buyerEmail) {
        const users = await db.entities.User.filter({ email: buyerEmail }, '-created_date', 1);
        grantUserId = users?.[0]?.id ?? null;
      }
      if (grantUserId) {
        const weddings = await db.entities.Wedding.filter({ created_by_id: grantUserId }, '-created_date', 1);
        const wedding = weddings?.[0];
        if (wedding) {
          if (purchase.productId === "budget_upgrade") {
            await db.entities.Wedding.update(wedding.id, { budget_upgraded: true });
            console.log("stripe-webhook: granted budget upgrade", { weddingId: wedding.id });
          } else {
            await db.entities.Wedding.update(wedding.id, { selected_tier: purchase.productId, has_paid: true });
            // Set plan_tier on the User so RLS tier-gating rules enforce paid features.
            try {
              await db.entities.User.update(grantUserId, { plan_tier: purchase.productId });
            } catch (e) {
              console.error("stripe-webhook: could not set plan_tier on user", { grantUserId, e });
            }
            console.log("stripe-webhook: granted tier", { weddingId: wedding.id, tier: purchase.productId });
          }
        } else {
          console.warn("stripe-webhook: no wedding for user", { grantUserId });
        }
      } else {
        console.warn("stripe-webhook: no grant target", { checkoutId });
      }

      // Mark paid LAST — "paid" always implies the grant completed.
      await db.entities.Base44Purchase.update(purchase.id, {
        status: "paid",
        orderId: session.payment_intent ?? purchase.orderId ?? null,
        buyerEmail: buyerEmail ?? purchase.buyerEmail ?? null,
        paidAt: new Date().toISOString(),
      });

      console.log("stripe-webhook: fulfilled purchase", { purchaseId: purchase.id, checkoutId });
    } else if (event.type === "charge.refunded") {
      const charge = event.data.object;
      const paymentIntent = charge.payment_intent;

      // Find the purchase by the payment intent we stored on fulfillment.
      const purchases = await db.entities.Base44Purchase.filter({ orderId: paymentIntent });
      const purchase = purchases?.[0];

      if (!purchase) {
        console.warn("stripe-webhook: no purchase for refunded charge", { paymentIntent });
        return new Response("OK", { status: 200 });
      }

      // Revoke paid access on the buyer's Wedding.
      const grantUserId = purchase.appUserId;
      if (grantUserId) {
        const weddings = await db.entities.Wedding.filter({ created_by_id: grantUserId }, '-created_date', 1);
        const wedding = weddings?.[0];
        if (wedding) {
          await db.entities.Wedding.update(wedding.id, { has_paid: false });
          // Reset plan_tier to free so RLS tier-gating revokes paid entity access.
          try {
            await db.entities.User.update(grantUserId, { plan_tier: "free" });
          } catch (e) {
            console.error("stripe-webhook: could not reset plan_tier on user", { grantUserId, e });
          }
          console.log("stripe-webhook: revoked access after refund", { weddingId: wedding.id });
        } else {
          console.warn("stripe-webhook: no wedding to revoke", { grantUserId });
        }
      }

      await db.entities.Base44Purchase.update(purchase.id, { status: "refunded" });
      console.log("stripe-webhook: marked purchase refunded", { purchaseId: purchase.id });
    } else {
      console.log("stripe-webhook: ignoring event", event.type);
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("stripe-webhook: unhandled error", err);
    return new Response("Internal error", { status: 500 });
  }
}