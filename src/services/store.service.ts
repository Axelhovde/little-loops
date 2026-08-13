import { supabase } from "@/helper/supabaseClient";

export const getStoreItems = async () => {
  const { data: itemsData, error: itemsError } = await supabase
    .from("items")
    .select("*");
  if (itemsError) throw itemsError;

  const itemIds = (itemsData ?? []).map((i: any) => i.item_id);

  const [
    { data: photosData },
    { data: colorsData },
    { data: itemColorsData },
    { data: sizeQtyData },
  ] = await Promise.all([
    supabase.from("item_photos").select("*"),
    supabase.from("colors").select("*"),
    supabase.from("item_colors").select("*"),
    itemIds.length > 0
      ? supabase.from("item_size_quantities").select("item_id, size, quantity").in("item_id", itemIds)
      : Promise.resolve({ data: [] }),
  ]);

  // Build sizeQuantities map: { item_id → { size → quantity } }
  const sizeQtyMap: Record<number, Record<string, number>> = {};
  (sizeQtyData ?? []).forEach((sq: any) => {
    if (!sizeQtyMap[sq.item_id]) sizeQtyMap[sq.item_id] = {};
    sizeQtyMap[sq.item_id][sq.size] = sq.quantity;
  });

  const formatted = (itemsData ?? []).map((item: any) => {
    const relatedItemColors =
      (itemColorsData ?? []).filter((ic: any) => ic.item_id === item.item_id);

    const colors = relatedItemColors.map((ic: any) => {
      const color = (colorsData ?? []).find((c: any) => c.color_id === ic.color_id);
      const photos = (photosData ?? [])
        .filter(
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
      (Date.now() - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24) <= 30;

    const hasSizes = Array.isArray(item.sizes) && item.sizes.length > 0;

    return {
      id: item.item_id,
      title: item.item_name,
      description: item.description,
      price: item.price,
      rating: item.rating ?? 0,
      reviews: item.reviews ?? 0,
      quantity: item.quantity ?? 0,
      ishidden: item.ishidden ?? null,
      item_type: item.item_type ?? "necklace",
      sizes: item.sizes ?? [],
      sizeQuantities: hasSizes ? (sizeQtyMap[item.item_id] ?? {}) : undefined,
      colors,
      photos: colors.flatMap((c: any) => c.photos ?? []),
      isNew,
    };
  });

  return formatted;
};
