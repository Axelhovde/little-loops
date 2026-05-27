import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    // Verify the Supabase user JWT
    const userSupabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: userError,
    } = await userSupabase.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    const body = await req.json() as {
      items: Array<{
        itemId: number;
        quantity: number;
        selectedSize?: string;
        photo?: string;
      }>;
    };

    if (!body.items || body.items.length === 0) throw new Error("Cart is empty");

    // Use service role to read authoritative prices from DB
    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const itemIds = [...new Set(body.items.map((i) => i.itemId))];
    const { data: dbItems, error: dbError } = await admin
      .from("items")
      .select("item_id, item_name, price")
      .in("item_id", itemIds);

    if (dbError || !dbItems) throw new Error("Failed to fetch item data");

    const priceMap = new Map(
      (dbItems as any[]).map((r) => [r.item_id, { price: r.price as number, name: r.item_name as string }])
    );

    // Stock check before accepting the order
    for (const cartItem of body.items) {
      const itemName = priceMap.get(cartItem.itemId)?.name ?? String(cartItem.itemId);
      if (cartItem.selectedSize) {
        const { data: sizeStock } = await admin
          .from("item_size_quantities")
          .select("quantity")
          .eq("item_id", cartItem.itemId)
          .eq("size", cartItem.selectedSize)
          .single();
        if (!sizeStock || (sizeStock as any).quantity < cartItem.quantity) {
          throw new Error(`Insufficient stock for ${itemName} (size ${cartItem.selectedSize})`);
        }
      } else {
        const { data: itemStock } = await admin
          .from("items")
          .select("quantity")
          .eq("item_id", cartItem.itemId)
          .single();
        if (!itemStock || (itemStock as any).quantity < cartItem.quantity) {
          throw new Error(`Insufficient stock for ${itemName}`);
        }
      }
    }

    let totalNOK = 0;
    const orderLineItems = body.items.map((cartItem) => {
      const db = priceMap.get(cartItem.itemId);
      if (!db) throw new Error(`Item ${cartItem.itemId} not found`);
      totalNOK += db.price * cartItem.quantity;
      return {
        item_id: cartItem.itemId,
        quantity: cartItem.quantity,
        price_per_item: db.price,
        item_name: db.name,
        selected_size: cartItem.selectedSize ?? null,
        item_photo: cartItem.photo ?? null,
      };
    });

    // Create order row with pending_payment status
    const { data: order, error: orderError } = await admin
      .from("orders")
      .insert({
        profile_id: user.id,
        user_email: user.email ?? "",
        status: "pending_payment",
        total_price: totalNOK,
      })
      .select()
      .single();

    if (orderError || !order) throw new Error("Failed to create order");

    const { error: itemsError } = await admin
      .from("order_items")
      .insert(orderLineItems.map((i) => ({ ...i, order_id: (order as any).order_id })));

    if (itemsError) throw new Error("Failed to create order items");

    // Create Stripe PaymentIntent — amount in øre (NOK × 100)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalNOK * 100),
      currency: "nok",
      metadata: {
        order_id: String((order as any).order_id),
        user_id: user.id,
      },
    });

    // Store PaymentIntent ID on the order
    await admin
      .from("orders")
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq("order_id", (order as any).order_id);

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        orderId: (order as any).order_id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("create-payment-intent error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
