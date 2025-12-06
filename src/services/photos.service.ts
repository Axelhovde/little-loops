import { supabase } from "@/helper/supabaseClient";

export const uploadItemPhoto = async (
  itemId: number,
  itemColorId: number,
  file: File
) => {
  const fileExt = file.name.split(".").pop();
  const filePath = `items/${itemId}/${Date.now()}.${fileExt}`;

  // ---- Upload to Supabase storage ----
  const { error: uploadError } = await supabase.storage
    .from("items")
    .upload(filePath, file);

  if (uploadError) {
    console.error("Upload error:", uploadError);
    throw new Error("Failed to upload photo");
  }

  // ---- Get public URL ----
  const { data } = supabase.storage.from("items").getPublicUrl(filePath);
  const url = data.publicUrl;

  // ---- Get current max display_order for this item_color ----
  const { data: existingPhotos, error: fetchError } = await supabase
    .from("item_photos")
    .select("display_order")
    .eq("item_color_id", itemColorId);

  if (fetchError) {
    console.error("Fetch existing photos error:", fetchError);
    throw new Error("Failed to fetch existing photos");
  }

  const maxDisplayOrder = existingPhotos?.length
    ? Math.max(...existingPhotos.map((p) => p.display_order || 0))
    : 0;

  const newDisplayOrder = maxDisplayOrder + 1;

  // ---- Insert into item_photos table ----
  const { data: photoRow, error: insertError } = await supabase
    .from("item_photos")
    .insert({
      item_id: itemId,
      item_color_id: itemColorId,
      photo_url: url,
      display_order: newDisplayOrder,
    })
    .select()
    .single();

  if (insertError) {
    console.error("Insert error:", insertError);
    throw new Error("Failed to save photo record");
  }

  return photoRow; // return the inserted row so frontend can update state
};


export const deleteItemPhoto = async (photoId: number) => {
  const { error } = await supabase
    .from("item_photos")
    .delete()
    .eq("photo_id", photoId);
  if (error) throw new Error("Failed to delete photo");
};

export const getItemPhotos = async (itemId: number) => {
  const { data, error } = await supabase
    .from("item_photos")
    .select("*")
    .eq("item_id", itemId);

  if (error) {
    console.error("Failed fetching photos:", error);
    return [];
  }
  return data;
};
