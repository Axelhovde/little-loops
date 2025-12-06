import { supabase } from "@/helper/supabaseClient";

export const getStoreItems = async () => {
  // Fetch items
  const { data: itemsData, error: itemsError } = await supabase
    .from("items")
    .select("*");
  if (itemsError) throw itemsError;

  // Fetch photos
  const { data: photosData, error: photosError } = await supabase
    .from("item_photos")
    .select("*");
  if (photosError) throw photosError;

  // Fetch colors
  const { data: colorsData, error: colorsError } = await supabase
    .from("colors")
    .select("*");
  if (colorsError) throw colorsError;

  // Fetch item_colors (relation table)
  const { data: itemColorsData, error: itemColorsError } = await supabase
    .from("item_colors")
    .select("*");
  if (itemColorsError) throw itemColorsError;

  // Build final merged items list
  const formatted = itemsData?.map((item: any) => {
    const relatedItemColors =
      itemColorsData?.filter((ic: any) => ic.item_id === item.item_id) || [];

    const colors = relatedItemColors.map((ic: any) => {
      const color = colorsData?.find((c: any) => c.color_id === ic.color_id);

      const photos =
        photosData
          ?.filter(
            (p: any) =>
              Number(p.item_id) === item.item_id &&
              Number(p.item_color_id) === ic.item_color_id
          )
          .map((p: any) => ({
            photo_url: p.photo_url,
            display_order: p.display_order,
            id: p.photo_id,
          }));

      return {
        id: ic.color_id,
        name: color?.color_name || "Unknown",
        hex: color?.color_hex || "#ccc",
        photos,
      };
    });

    return {
      id: item.item_id,
      title: item.item_name,
      description: item.description,
      price: item.price,
      rating: item.rating ?? 0,
      reviews: item.reviews ?? 0,
      ishidden: item.ishidden ?? null, 
      colors,
    };  
  });

  return formatted || [];
};
