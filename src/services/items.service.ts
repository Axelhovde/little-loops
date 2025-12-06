import { supabase } from "@/helper/supabaseClient";

/* ---------------- GET FULL ITEM ---------------- */
export async function getItemFull(itemId: number) {
  // 1. Get item
  const { data: item, error: itemErr } = await supabase
    .from("items")
    .select("*")
    .eq("item_id", itemId)
    .single();

  if (itemErr) throw itemErr;

  // 2. Get colors
  const { data: itemColors, error: colorErr } = await supabase
    .from("item_colors")
    .select(`
      item_color_id,
      color_id,
      colors:color_id(color_name, color_hex)
    `)
    .eq("item_id", itemId);

  if (colorErr) throw colorErr;

  // 3. Get photos
  const { data: photos, error: photoErr } = await supabase
    .from("item_photos")
    .select("*")
    .eq("item_id", itemId)
    .order("display_order", { ascending: true });

  if (photoErr) throw photoErr;

  return { item, itemColors, photos };
}

/* ---------------- UPDATE ITEM ---------------- */
export async function updateItem(itemId: number, updates: any) {
  const { error } = await supabase
    .from("items")
    .update(updates)
    .eq("item_id", itemId);

  if (error) throw error;
}

/* ---------------- UPDATE ITEM COLOR ---------------- */
export async function updateItemColor(item_color_id: number, updates: any) {
  const { error } = await supabase
    .from("item_colors")
    .update(updates)
    .eq("item_color_id", item_color_id);

  if (error) throw error;
}

/* ---------------- ADD PHOTO ---------------- */
export async function addPhoto(itemId: number, itemColorId: number, photoUrl: string) {
  const { error } = await supabase
    .from("item_photos")
    .insert({
      item_id: itemId,
      item_color_id: itemColorId,
      photo_url: photoUrl,
      display_order: 0
    });

  if (error) throw error;
}

/* ---------------- DELETE PHOTO ---------------- */
export async function deletePhoto(photoId: number) {
  const { error } = await supabase
    .from("item_photos")
    .delete()
    .eq("photo_id", photoId);

  if (error) throw error;
}


