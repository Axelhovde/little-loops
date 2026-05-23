import { supabase } from "@/helper/supabaseClient";
import type { CartItemDB } from "@/interfaces/types";

/* ---------------- GET CART ITEMS ---------------- */
export async function getCartItems(cartId: string) {
  const { data, error } = await supabase
    .from("shopping_cart_items")
    .select(`
      item_id,
      quantity,
      items (
        item_id,
        item_name,
        price,
        item_photos (
          photo_url,
          display_order
        )
      )
    `)
    .eq("cart_id", cartId);

  if (error) throw error;

  return data;
}

/* ---------------- ADD / UPDATE ITEM ---------------- */
export async function upsertCartItem(
  cartId: string,
  itemId: number,
  quantity: number
) {
  const { error } = await supabase
    .from("shopping_cart_items")
    .upsert({
      cart_id: cartId,
      item_id: itemId,
      quantity,
    });

  if (error) throw error;
}

/* ---------------- REMOVE ITEM ---------------- */
export async function removeCartItem(cartId: string, itemId: number) {
  const { error } = await supabase
    .from("shopping_cart_items")
    .delete()
    .eq("cart_id", cartId)
    .eq("item_id", itemId);

  if (error) throw error;
}
