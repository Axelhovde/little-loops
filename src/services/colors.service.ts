import { supabase } from "@/helper/supabaseClient";

/* -------------------- COLORS TABLE -------------------- */


/** Reassign an item_color to a new color and move all photos */
export const reassignColorVariant = async (
  item_color_id: number,
  new_color_id: number
) => {
  try {
    // 1. Fetch all photos for this item_color
    const { data: oldPhotos, error: fetchError } = await supabase
      .from("item_photos")
      .select("*")
      .eq("item_color_id", item_color_id);

    if (fetchError) throw fetchError;

    // 2. Update the item_color row
    const { data: updatedItemColor, error: updateError } = await supabase
      .from("item_colors")
      .update({ color_id: new_color_id })
      .eq("item_color_id", item_color_id)
      .select()
      .single();

    if (updateError) throw updateError;

    // 3. Reassign all photos to the updated item_color (now with new color)
    for (const photo of oldPhotos) {
      const { error: photoError } = await supabase
        .from("item_photos")
        .update({ item_color_id: updatedItemColor.item_color_id })
        .eq("photo_id", photo.photo_id);

      if (photoError) throw photoError;
    }

    return updatedItemColor;
  } catch (err) {
    console.error("Failed reassigning color variant:", err);
    throw new Error("Failed to reassign color variant");
  }
};

/** Get all available colors */
export const getAllColors = async () => {
  const { data, error } = await supabase
    .from("colors")
    .select("*")
    .order("color_name", { ascending: true });

  if (error) throw error;
  return data;
};

/** Add new color (name + hex) */
export const addColor = async (color_name: string, color_hex: string) => {
  const { data, error } = await supabase
    .from("colors")
    .insert([{ color_name, color_hex }])
    .select()
    .single();

  if (error) throw error;
  return data; // returns { color_id, color_name, color_hex }
};

/** Update an existing color */
export const updateColor = async (
  color_id: number,
  fields: Partial<{ color_name: string; color_hex: string }>
) => {
  const { data, error } = await supabase
    .from("colors")
    .update(fields)
    .eq("color_id", color_id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/** Delete a color completely (⚠️ consider cascade rules!) */
export const deleteColor = async (color_id: number) => {
  const { error } = await supabase
    .from("colors")
    .delete()
    .eq("color_id", color_id);

  if (error) throw error;
  return true;
};


/* -------------------- ITEM COLORS TABLE -------------------- */

/** Link a color to an item */
export const assignColorToItem = async (item_id: number, color_id: number) => {
  const { data, error } = await supabase
    .from("item_colors")
    .insert([{ item_id, color_id }])
    .select()
    .single();

  if (error) throw error;
  return data; // returns item_color_id etc.
};

/** Change the color assigned to an item_color row */
export const updateItemColor = async (
  item_color_id: number,
  color_id: number
) => {
  const { data, error } = await supabase
    .from("item_colors")
    .update({ color_id })
    .eq("item_color_id", item_color_id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/** Remove a color from an item */
export const removeColorFromItem = async (item_color_id: number) => {
  const { error } = await supabase
    .from("item_colors")
    .delete()
    .eq("item_color_id", item_color_id);

  if (error) throw error;

  return true;
};
