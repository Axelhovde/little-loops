import { supabase } from "@/helper/supabaseClient";
import type { CartItem, ShippingAddress } from "@/interfaces/types";

export async function createPaymentIntent(
  items: CartItem[],
  shippingAddress: ShippingAddress
): Promise<{ clientSecret: string; orderId: number }> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;

  const response = await fetch(`${supabaseUrl}/functions/v1/create-payment-intent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
    },
    body: JSON.stringify({
      items: items.map((i) => ({
        itemId: i.itemId,
        quantity: i.quantity,
        selectedSize: i.selectedSize,
        photo: i.photo,
      })),
      shippingAddress,
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Payment initialization failed");
  return data as { clientSecret: string; orderId: number };
}

export async function clearCartFromDB(userId: string): Promise<void> {
  await supabase.from("shopping_cart_items").delete().eq("cart_id", userId);
}
