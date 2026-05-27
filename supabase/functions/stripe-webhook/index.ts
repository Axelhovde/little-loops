import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

Deno.serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? ""
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object as Stripe.PaymentIntent;

    const { data: order } = await admin
      .from("orders")
      .update({ status: "pending", payment_status: "paid" })
      .eq("stripe_payment_intent_id", pi.id)
      .select("order_id")
      .single();

    if (order) {
      const { data: orderItems } = await admin
        .from("order_items")
        .select("item_id, quantity, selected_size")
        .eq("order_id", (order as any).order_id);

      for (const item of (orderItems ?? []) as any[]) {
        try {
          await admin.rpc("decrement_stock", {
            p_item_id: item.item_id,
            p_size: item.selected_size ?? "",
            p_quantity: item.quantity,
          });
        } catch (err: any) {
          console.error(`decrement_stock failed for item ${item.item_id}:`, err.message);
        }
      }
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const pi = event.data.object as Stripe.PaymentIntent;
    await admin
      .from("orders")
      .update({ status: "cancelled", payment_status: "failed" })
      .eq("stripe_payment_intent_id", pi.id);
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
