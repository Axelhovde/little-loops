import { supabase } from "@/helper/supabaseClient";

export const getStoreItems = async () => {
  const { data: itemsData, error: itemsError } = await supabase
    .from("items")
    .select("*");
  if (itemsError) throw itemsError;

  const { data: photosData, error: photosError } = await supabase
    .from("item_photos")
    .select("*");
  if (photosError) throw photosError;

  const { data: colorsData, error: colorsError } = await supabase
    .from("colors")
    .select("*");
  if (colorsError) throw colorsError;

  const { data: itemColorsData, error: itemColorsError } = await supabase
    .from("item_colors")
    .select("*");
  if (itemColorsError) throw itemColorsError;

  const formatted = itemsData?.map((item: any) => {
    const relatedItemColors =
      itemColorsData?.filter((ic: any) => ic.item_id === item.item_id) || [];

    const colors = relatedItemColors.map((ic: any) => {
      const color = colorsData?.find((c: any) => c.color_id === ic.color_id);

      const photos = photosData
        ?.filter(
          (p: any) =>
            Number(p.item_id) === item.item_id &&
            Number(p.item_color_id) === ic.item_color_id
        )
        .map((p: any) => ({
          photo_id: p.photo_id,
          photo_url: p.photo_url,
          display_order: p.display_order,
        }))
        .sort((a: any, b: any) => a.display_order - b.display_order);

      return {
        id: ic.item_color_id,
        name: color?.color_name || "Unknown",
        hex: color?.color_hex || "#ccc",
        photos,
      };
    });

    const isNew =
      !!item.created_at &&
      (Date.now() - new Date(item.created_at).getTime()) /
        (1000 * 60 * 60 * 24) <=
        30;

    return {
      id: item.item_id,
      title: item.item_name,
      description: item.description,
      price: item.price,
      rating: item.rating ?? 0,
      reviews: item.reviews ?? 0,
      ishidden: item.ishidden ?? null,
      item_type: item.item_type ?? "necklace",
      sizes: item.sizes ?? [],
      colors,
      photos: colors.flatMap((c: any) => c.photos ?? []),
      isNew,
    };
  });

  return formatted || [];
};
