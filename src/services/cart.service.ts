import { supabase } from "@/helper/supabaseClient";

export async function getCartItems(cartId: string) {
  const { data, error } = await supabase
    .from("shopping_cart_items")
    .select(`
      item_id,
      quantity,
      selected_size,
      items (
        item_id,
        item_name,
        price,
        quantity,
        sizes,
        item_size_quantities (
          size,
          quantity
        ),
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

// selectedSize: pass '' for items with no size
export async function upsertCartItem(
  cartId: string,
  itemId: number,
  quantity: number,
  selectedSize: string
) {
  const { error } = await supabase
    .from("shopping_cart_items")
    .upsert(
      { cart_id: cartId, item_id: itemId, quantity, selected_size: selectedSize },
      { onConflict: "cart_id,item_id,selected_size" }
    );

  if (error) throw error;
}

// selectedSize: pass '' for items with no size
export async function removeCartItem(
  cartId: string,
  itemId: number,
  selectedSize: string
) {
  const { error } = await supabase
    .from("shopping_cart_items")
    .delete()
    .eq("cart_id", cartId)
    .eq("item_id", itemId)
    .eq("selected_size", selectedSize);

  if (error) throw error;
}
