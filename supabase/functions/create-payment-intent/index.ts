import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

// Flat domestic shipping rates (Norway only).
// Brev:        ≤ 2 items, ≤ 2 kg, fits 35.3 × 25 × 2 cm  → 28 NOK
// Liten pakke: > 2 items, ≤ 5 kg, fits 35 × 25 × 12 cm   → 76 NOK
const FREE_SHIPPING_THRESHOLD = 1000;
const BREV_MAX_QTY = 2;
const BREV_PRICE_NOK = 28;
const LITEN_PAKKE_PRICE_NOK = 76;
const LITEN_PAKKE_BRING_PRODUCT = "5000"; // Pakke i postkassen — used for webhook booking

function calculateShipping(totalQty: number, itemsTotalNOK: number) {
  if (itemsTotalNOK >= FREE_SHIPPING_THRESHOLD) {
    return { costNOK: 0, bringProductId: null };
  }
  if (totalQty <= BREV_MAX_QTY) {
    return { costNOK: BREV_PRICE_NOK, bringProductId: null };
  }
  return { costNOK: LITEN_PAKKE_PRICE_NOK, bringProductId: LITEN_PAKKE_BRING_PRODUCT };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const userSupabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: userError } = await userSupabase.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    const body = await req.json() as {
      items: Array<{
        itemId: number;
        quantity: number;
        selectedSize?: string;
        photo?: string;
      }>;
      shippingAddress: {
        fullName: string;
        addressLine: string;
        postalCode: string;
        city: string;
        phone: string;
      };
    };

    if (!body.items || body.items.length === 0) throw new Error("Cart is empty");
    if (!body.shippingAddress?.fullName || !body.shippingAddress?.addressLine ||
        !body.shippingAddress?.postalCode || !body.shippingAddress?.city ||
        !body.shippingAddress?.phone) {
      throw new Error("Incomplete shipping address");
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch authoritative prices from DB — never trust frontend amounts
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

    // Build order line items and total from DB prices
    let itemsTotalNOK = 0;
    let totalQty = 0;
    const orderLineItems = body.items.map((cartItem) => {
      const db = priceMap.get(cartItem.itemId);
      if (!db) throw new Error(`Item ${cartItem.itemId} not found`);
      itemsTotalNOK += db.price * cartItem.quantity;
      totalQty += cartItem.quantity;
      return {
        item_id: cartItem.itemId,
        quantity: cartItem.quantity,
        price_per_item: db.price,
        item_name: db.name,
        selected_size: cartItem.selectedSize ?? null,
        item_photo: cartItem.photo ?? null,
      };
    });

    // Calculate shipping server-side — client never controls this
    const { costNOK: shippingCostNOK, bringProductId } = calculateShipping(totalQty, itemsTotalNOK);
    const grandTotalNOK = itemsTotalNOK + shippingCostNOK;

    const postalCode = body.shippingAddress.postalCode.replace(/\D/g, "").slice(0, 4);

    // Create order
    const { data: order, error: orderError } = await admin
      .from("orders")
      .insert({
        profile_id: user.id,
        user_email: user.email ?? "",
        status: "pending_payment",
        total_price: grandTotalNOK,
        shipping_cost: shippingCostNOK,
        shipping_name: body.shippingAddress.fullName,
        shipping_address_line: body.shippingAddress.addressLine,
        shipping_postal_code: postalCode,
        shipping_city: body.shippingAddress.city,
        shipping_country: "NO",
        shipping_phone: body.shippingAddress.phone,
        bring_product_id: bringProductId,
      })
      .select()
      .single();

    if (orderError || !order) throw new Error("Failed to create order");

    const { error: itemsError } = await admin
      .from("order_items")
      .insert(orderLineItems.map((i) => ({ ...i, order_id: (order as any).order_id })));

    if (itemsError) throw new Error("Failed to create order items");

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(grandTotalNOK * 100), // øre
      currency: "nok",
      metadata: {
        order_id: String((order as any).order_id),
        user_id: user.id,
      },
    });

    await admin
      .from("orders")
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq("order_id", (order as any).order_id);

    return new Response(
      JSON.stringify({ clientSecret: paymentIntent.client_secret, orderId: (order as any).order_id }),
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
