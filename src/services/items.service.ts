import { supabase } from "@/helper/supabaseClient";
import type { Item, ItemColor, ItemPhoto } from "@/interfaces/types";

/* ---------------- DB TYPES (SERVICE ONLY) ---------------- */
type DbItemPhoto = {
  photo_id: number;
  item_color_id: number;
  photo_url: string;
  display_order: number;
};

type DbItemColor = {
  item_color_id: number;
  color_id: number;
  colors: {
    color_name: string;
    color_hex: string;
  } | null;
};

/* ---------------- GET FULL ITEM (ADMIN / RAW) ---------------- */
export async function getItemFull(itemId: number) {
  const { data: item, error: itemErr } = await supabase
    .from("items")
    .select("*")
    .eq("item_id", itemId)
    .single();

  if (itemErr) throw itemErr;

  const { data: itemColors, error: colorErr } = await supabase
    .from("item_colors")
    .select(`
      item_color_id,
      color_id,
      colors:color_id(color_name, color_hex)
    `)
    .eq("item_id", itemId);

  if (colorErr) throw colorErr;

  const { data: photos, error: photoErr } = await supabase
    .from("item_photos")
    .select("*")
    .eq("item_id", itemId)
    .order("display_order", { ascending: true });

  if (photoErr) throw photoErr;

  return {
    item,
    itemColors: itemColors as DbItemColor[],
    photos: photos as DbItemPhoto[],
  };
}

/* ---------------- GET ITEM (UI / DOMAIN) ---------------- */
export async function getItem(itemId: number): Promise<Item> {
  const { item, itemColors, photos } = await getItemFull(itemId);

  const mappedPhotos: ItemPhoto[] = photos.map((p) => ({
    photo_id: p.photo_id,
    photo_url: p.photo_url,
    display_order: p.display_order,
  }));

  const mappedColors: ItemColor[] = itemColors.map((ic) => ({
    id: ic.item_color_id,
    name: ic.colors?.color_name ?? "",
    hex: ic.colors?.color_hex ?? undefined,
    photos: photos
      .filter((p) => p.item_color_id === ic.item_color_id)
      .map((p) => ({
        photo_id: p.photo_id,
        photo_url: p.photo_url,
        display_order: p.display_order,
      })),
  }));

  const createdAt: string | undefined = item.created_at ?? undefined;

  const isNew =
    !!createdAt &&
    (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24) <= 30;

  return {
    id: item.item_id,
    title: item.item_name,
    description: item.description,
    price: item.price,
    quantity: item.quantity ?? 0,
    sizes: item.sizes ?? [],
    item_type: item.item_type ?? "necklace",
    rating: item.rating ?? 0,
    reviews: item.reviews ?? 0,
    photos: mappedPhotos,
    colors: mappedColors,
    createdAt,
    isNew,
    material_care_id: item.material_care_id ?? undefined,
    material_care: await fetchMaterialCareGuide(item.material_care_id),
    sizeQuantities: item.sizes?.length > 0 ? await getSizeQuantities(item.item_id) : undefined,
  };
}

async function fetchMaterialCareGuide(guideId: number | null | undefined) {
  if (!guideId) return undefined;
  try {
    const { data } = await supabase
      .from("material_care_guides")
      .select("*")
      .eq("guide_id", guideId)
      .single();
    return data ?? undefined;
  } catch {
    return undefined;
  }
}

/* ---------------- GET SIMILAR ITEMS ---------------- */
export async function getSimilarItems(
  currentItemId: number,
  itemType: string,
  limit = 4
): Promise<Item[]> {
  const { data: itemsData } = await supabase
    .from("items")
    .select("*")
    .eq("item_type", itemType)
    .neq("item_id", currentItemId)
    .limit(limit);

  if (!itemsData?.length) return [];

  const itemIds = itemsData.map((i: any) => i.item_id);

  const [{ data: photosData }, { data: colorsData }, { data: itemColorsData }] =
    await Promise.all([
      supabase.from("item_photos").select("*").in("item_id", itemIds),
      supabase.from("colors").select("*"),
      supabase.from("item_colors").select("*").in("item_id", itemIds),
    ]);

  return itemsData.map((item: any) => {
    const relatedItemColors = (itemColorsData ?? []).filter(
      (ic: any) => ic.item_id === item.item_id
    );

    const colors: ItemColor[] = relatedItemColors.map((ic: any) => {
      const color = (colorsData ?? []).find(
        (c: any) => c.color_id === ic.color_id
      );
      const photos: ItemPhoto[] = (photosData ?? [])
        .filter(
          (p: any) =>
            p.item_id === item.item_id && p.item_color_id === ic.item_color_id
        )
        .map((p: any) => ({
          photo_id: p.photo_id,
          photo_url: p.photo_url,
          display_order: p.display_order,
        }))
        .sort((a, b) => a.display_order - b.display_order);

      return {
        id: ic.item_color_id,
        name: color?.color_name ?? "",
        hex: color?.color_hex ?? undefined,
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
      quantity: item.quantity ?? 0,
      item_type: item.item_type ?? "necklace",
      sizes: item.sizes ?? [],
      colors,
      photos: colors.flatMap((c) => c.photos),
      isNew,
    };
  });
}

/* ---------------- DELETE ITEM ---------------- */
export async function deleteItem(itemId: number): Promise<void> {
  const { error } = await supabase
    .from("items")
    .delete()
    .eq("item_id", itemId);
  if (error) throw error;
}

/* ---------------- SIZE QUANTITIES ---------------- */
export async function getSizeQuantities(itemId: number): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from("item_size_quantities")
    .select("size, quantity")
    .eq("item_id", itemId);
  if (error) return {};
  const result: Record<string, number> = {};
  (data ?? []).forEach((row: any) => { result[row.size] = row.quantity; });
  return result;
}

export async function updateSizeQuantities(
  itemId: number,
  sizeQty: Record<string, number>
): Promise<void> {
  for (const [size, quantity] of Object.entries(sizeQty)) {
    const { error } = await supabase
      .from("item_size_quantities")
      .upsert({ item_id: itemId, size, quantity }, { onConflict: "item_id,size" });
    if (error) throw error;
  }
  // Keep items.quantity in sync with sum
  const total = Object.values(sizeQty).reduce((s, q) => s + q, 0);
  await supabase.from("items").update({ quantity: total }).eq("item_id", itemId);
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
export async function addPhoto(
  itemId: number,
  itemColorId: number,
  photoUrl: string
) {
  const { error } = await supabase.from("item_photos").insert({
    item_id: itemId,
    item_color_id: itemColorId,
    photo_url: photoUrl,
    display_order: 0,
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
