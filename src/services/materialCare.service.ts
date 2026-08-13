import { supabase } from "@/helper/supabaseClient";
import type { MaterialCareGuide } from "@/interfaces/types";

export async function getMaterialCareGuides(): Promise<MaterialCareGuide[]> {
  const { data, error } = await supabase
    .from("material_care_guides")
    .select("*")
    .order("title");
  if (error) throw error;
  return data ?? [];
}

export async function createMaterialCareGuide(
  title: string,
  description: string
): Promise<MaterialCareGuide> {
  const { data, error } = await supabase
    .from("material_care_guides")
    .insert({ title, description })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateMaterialCareGuide(
  guideId: number,
  title: string,
  description: string
): Promise<void> {
  const { error } = await supabase
    .from("material_care_guides")
    .update({ title, description })
    .eq("guide_id", guideId);
  if (error) throw error;
}

export async function deleteMaterialCareGuide(guideId: number): Promise<void> {
  const { error } = await supabase
    .from("material_care_guides")
    .delete()
    .eq("guide_id", guideId);
  if (error) throw error;
}
