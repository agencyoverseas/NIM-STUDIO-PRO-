// ============================================================
// STRIPE WEBHOOK — Supabase Edge Function (Deno)
// Path: supabase/functions/stripe-webhook/index.ts
// ============================================================
// Configure dans Stripe Dashboard → Developers → Webhooks
// URL: https://<ton-projet>.supabase.co/functions/v1/stripe-webhook
// Events à écouter :
//   - checkout.session.completed
//   - customer.subscription.updated
//   - customer.subscription.deleted
//   - invoice.payment_failed
// ============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14?target=deno";

const STRIPE_SECRET = Deno.env.get("STRIPE_SECRET_KEY")!;
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const stripe = new Stripe(STRIPE_SECRET, { apiVersion: "2024-12-18.acacia" });
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

serve(async (req) => {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("No signature", { status: 400 });

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("[stripe] Signature invalide:", err);
    return new Response(`Webhook Error: ${err}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const email = session.customer_email || session.customer_details?.email;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (!email) {
          console.warn("[stripe] checkout sans email:", session.id);
          break;
        }

        // Récupérer expiration depuis la subscription
        let expiresAt: string | null = null;
        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          expiresAt = new Date(sub.current_period_end * 1000).toISOString();
        }

        await sb.from("profiles")
          .update({
            plan: "pro",
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            subscription_status: "active",
            subscription_expires_at: expiresAt,
            updated_at: new Date().toISOString(),
          })
          .eq("email", email.toLowerCase());

        console.log(`[stripe] ✅ Pro activé pour ${email}`);
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const expiresAt = new Date(sub.current_period_end * 1000).toISOString();
        const status = sub.status; // active, past_due, canceled, etc.
        const newPlan = (status === "active" || status === "trialing") ? "pro" : "free";

        await sb.from("profiles")
          .update({
            plan: newPlan,
            subscription_status: status,
            subscription_expires_at: expiresAt,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", sub.id);

        console.log(`[stripe] Subscription ${sub.id} → ${status}`);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await sb.from("profiles")
          .update({
            plan: "free",
            subscription_status: "canceled",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", sub.id);

        console.log(`[stripe] ❌ Subscription ${sub.id} annulée → free`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = invoice.subscription as string;
        if (subId) {
          await sb.from("profiles")
            .update({
              subscription_status: "past_due",
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subId);
        }
        break;
      }

      default:
        console.log(`[stripe] Event ignoré: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("[stripe-webhook]", e);
    return new Response(`Error: ${e}`, { status: 500 });
  }
});
