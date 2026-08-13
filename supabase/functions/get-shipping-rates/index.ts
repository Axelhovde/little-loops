import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const BRING_PRODUCTS = ["5800", "5000"]; // Pakke til hentested, Pakke i postkassen
const FREE_SHIPPING_THRESHOLD = 750;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");

    const userSupabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error } = await userSupabase.auth.getUser();
    if (error || !user) throw new Error("Unauthorized");

    const body = await req.json() as {
      toPostalCode: string;
      estimatedWeightGrams?: number;
      cartTotalNOK?: number;
    };

    // Strip non-digits and validate Norwegian postal code (4 digits)
    const postalCode = (body.toPostalCode ?? "").replace(/\D/g, "").slice(0, 4);
    if (postalCode.length !== 4) throw new Error("Invalid postal code — must be 4 digits");

    // If cart qualifies for free shipping, no need to call Bring
    if ((body.cartTotalNOK ?? 0) >= FREE_SHIPPING_THRESHOLD) {
      return new Response(JSON.stringify({ rates: [], freeShipping: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const senderPostalCode = Deno.env.get("BRING_SENDER_POSTAL_CODE") ?? "";
    const apiUid = Deno.env.get("BRING_API_UID") ?? "";
    const apiKey = Deno.env.get("BRING_API_KEY") ?? "";
    const isTest = Deno.env.get("BRING_TEST_MODE") === "true";

    const bringHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "X-Mybring-API-Uid": apiUid,
      "X-Mybring-API-Key": apiKey,
    };
    if (isTest) bringHeaders["X-Bring-Test-Indicator"] = "true";

    const weightGrams = Math.max(body.estimatedWeightGrams ?? 250, 100);

    const bringRes = await fetch("https://api.bring.com/shippingguide/api/v2/products", {
      method: "POST",
      headers: bringHeaders,
      body: JSON.stringify({
        consignments: [{
          id: "1",
          fromCountryCode: "NO",
          fromPostalCode: senderPostalCode,
          toCountryCode: "NO",
          toPostalCode: postalCode,
          packages: [{ id: "1", grossWeight: weightGrams }],
          products: BRING_PRODUCTS.map((id) => ({ id })),
        }],
        withPrice: true,
        withExpectedDelivery: true,
        withGuiInformation: true,
      }),
    });

    if (!bringRes.ok) {
      console.error("Bring Shipping Guide error:", bringRes.status);
      throw new Error("Could not fetch shipping rates from Bring");
    }

    const bringData = await bringRes.json() as any;
    const products: any[] = bringData.consignments?.[0]?.products ?? [];

    const rates = products
      .filter((p) => !p.errors || p.errors.length === 0)
      .map((p) => ({
        productId: p.id as string,
        productName: (p.guiInformation?.displayName ?? p.id) as string,
        priceNOK: Math.round(
          parseFloat(p.price?.listPrice?.priceWithoutAdditionalServices?.amountWithVAT ?? "0")
        ),
        deliveryDays: (p.expectedDelivery?.workingDays ?? "2-5") as string,
      }))
      .filter((r) => r.priceNOK > 0);

    return new Response(JSON.stringify({ rates, freeShipping: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("get-shipping-rates:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
