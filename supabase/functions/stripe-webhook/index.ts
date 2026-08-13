import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendOrderConfirmation, sendInternalOrderNotification } from "../_shared/email.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

// Book the shipment with Bring after successful payment.
// Returns the consignment number and label URL, or null if booking fails.
async function bookBringShipment(order: any): Promise<{ consignmentNumber: string; labelUrl: string } | null> {
  try {
    const isTest = Deno.env.get("BRING_TEST_MODE") === "true";

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "X-Mybring-API-Uid": Deno.env.get("BRING_API_UID") ?? "",
      "X-Mybring-API-Key": Deno.env.get("BRING_API_KEY") ?? "",
    };
    if (isTest) headers["X-Bring-Test-Indicator"] = "true";

    const shippingDateTime = new Date().toISOString();

    const payload = {
      schemaVersion: 1,
      consignments: [{
        shippingDateTime,
        parties: {
          sender: {
            name: Deno.env.get("BRING_SENDER_NAME") ?? "",
            addressLine: Deno.env.get("BRING_SENDER_ADDRESS") ?? "",
            city: Deno.env.get("BRING_SENDER_CITY") ?? "",
            postalCode: Deno.env.get("BRING_SENDER_POSTAL_CODE") ?? "",
            countryCode: "NO",
            contact: {
              name: Deno.env.get("BRING_SENDER_NAME") ?? "",
              phoneNumber: Deno.env.get("BRING_SENDER_PHONE") ?? "",
            },
          },
          recipient: {
            name: order.shipping_name,
            addressLine: order.shipping_address_line,
            city: order.shipping_city,
            postalCode: order.shipping_postal_code,
            countryCode: order.shipping_country ?? "NO",
            contact: {
              name: order.shipping_name,
              phoneNumber: order.shipping_phone,
            },
          },
        },
        packages: [{
          weightInKg: 0.5,
          dimensions: { lengthInCm: 20, widthInCm: 15, heightInCm: 5 },
        }],
        product: {
          id: order.bring_product_id ?? "5800",
          customerNumber: Deno.env.get("BRING_CUSTOMER_NUMBER") ?? "5",
        },
      }],
    };

    const res = await fetch("https://api.bring.com/booking/api/create", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Bring booking failed:", res.status, text);
      return null;
    }

    const data = await res.json() as any;
    const confirmation = data.consignments?.[0]?.confirmation;
    const consignmentNumber = confirmation?.consignmentNumber ?? null;
    const labelUrl = data.consignments?.[0]?.links?.labels ?? null;

    if (!consignmentNumber) {
      console.error("Bring booking: no consignment number in response");
      return null;
    }

    return { consignmentNumber, labelUrl };
  } catch (err: any) {
    console.error("Bring booking exception:", err.message);
    return null;
  }
}

Deno.serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;

  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured");
    return new Response("Webhook not configured", { status: 500 });
  }

  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
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
      .select(
        "order_id, profile_id, total_price, shipping_cost, created_at, " +
        "bring_product_id, shipping_name, shipping_address_line, " +
        "shipping_postal_code, shipping_city, shipping_country, shipping_phone"
      )
      .single();

    if (order) {
      // Fetch order items for stock decrement and confirmation email
      const { data: orderItems } = await admin
        .from("order_items")
        .select("item_id, item_name, quantity, price_per_item, selected_size")
        .eq("order_id", (order as any).order_id);

      // Decrement stock for each item
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

      // Book shipment with Bring — best-effort, don't fail webhook on Bring errors
      if ((order as any).bring_product_id) {
        const booking = await bookBringShipment(order);
        if (booking) {
          await admin
            .from("orders")
            .update({
              bring_consignment_number: booking.consignmentNumber,
              bring_label_url: booking.labelUrl,
            })
            .eq("order_id", (order as any).order_id);
        }
      }

      // Send emails — best-effort, never fail the webhook
      try {
        // Fetch Stripe receipt URL from the charge
        let receiptUrl: string | null = null;
        if (pi.latest_charge && typeof pi.latest_charge === "string") {
          try {
            const charge = await stripe.charges.retrieve(pi.latest_charge);
            receiptUrl = charge.receipt_url ?? null;
          } catch { /* best-effort */ }
        }

        const { data: authData } = await admin.auth.admin.getUserById((order as any).profile_id);
        const customerEmail = authData?.user?.email;

        if (customerEmail && (orderItems ?? []).length > 0) {
          const totalPrice = (order as any).total_price ?? 0;
          const shippingCost = (order as any).shipping_cost ?? 0;

          const emailData = {
            customerEmail,
            customerName: (order as any).shipping_name ?? "Kjære kunde",
            customerPhone: (order as any).shipping_phone ?? undefined,
            orderId: (order as any).order_id,
            orderDate: (order as any).created_at ?? new Date().toISOString(),
            items: (orderItems as any[]).map((i) => ({
              name: i.item_name ?? "Vare",
              quantity: i.quantity,
              pricePerItem: i.price_per_item,
              selectedSize: i.selected_size ?? undefined,
            })),
            subtotal: totalPrice - shippingCost,
            shippingCost,
            total: totalPrice,
            shippingAddress: {
              name: (order as any).shipping_name ?? "",
              addressLine: (order as any).shipping_address_line ?? "",
              postalCode: (order as any).shipping_postal_code ?? "",
              city: (order as any).shipping_city ?? "",
            },
            receiptUrl: receiptUrl ?? undefined,
          };

          // Confirmation to customer
          await sendOrderConfirmation(emailData);
          console.log(`Ordrebekreftelse sendt til ${customerEmail} (ordre #${(order as any).order_id})`);

          // Internal notification to shop inbox
          await sendInternalOrderNotification(emailData);
          console.log(`Intern varsling sendt (ordre #${(order as any).order_id})`);
        }
      } catch (emailErr: any) {
        console.error("Feil ved sending av e-post:", emailErr.message);
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
