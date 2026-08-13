import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json() as { postalCode?: string };
    const postalCode = (body.postalCode ?? "").replace(/\D/g, "");

    if (postalCode.length !== 4) {
      return new Response(JSON.stringify({ valid: false, city: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiUid = Deno.env.get("BRING_API_UID") ?? "";
    const apiKey = Deno.env.get("BRING_API_KEY") ?? "";

    const bringRes = await fetch(
      `https://api.bring.com/address/api/no/postal-code/${postalCode}`,
      {
        headers: {
          Accept: "application/json",
          "X-Mybring-API-Uid": apiUid,
          "X-Mybring-API-Key": apiKey,
        },
      }
    );

    if (!bringRes.ok) {
      // Bring unreachable — return null so the frontend doesn't block the user
      return new Response(JSON.stringify({ valid: null, city: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await bringRes.json() as { result: string; city?: string };
    const valid = data.result === "OK";
    const rawCity = valid ? (data.city ?? null) : null;

    // Convert "BERGEN SENTRUM" → "Bergen Sentrum"
    const city = rawCity
      ? rawCity.split(" ").map((w: string) => w.charAt(0) + w.slice(1).toLowerCase()).join(" ")
      : null;

    return new Response(JSON.stringify({ valid, city }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("validate-postal-code:", err);
    return new Response(JSON.stringify({ valid: null, city: null }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
