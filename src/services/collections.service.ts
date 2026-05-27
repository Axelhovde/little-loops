import { supabase } from "@/helper/supabaseClient";
import type { Collection } from "@/interfaces/types";

export async function getCollections(): Promise<Collection[]> {
  const { data, error } = await supabase
    .from("collections")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createCollection(name: string, description?: string): Promise<Collection> {
  const { data, error } = await supabase
    .from("collections")
    .insert({ name, description: description || null })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCollection(collectionId: number, name: string, description?: string): Promise<void> {
  const { error } = await supabase
    .from("collections")
    .update({ name, description: description || null })
    .eq("collection_id", collectionId);
  if (error) throw error;
}

export async function deleteCollection(collectionId: number): Promise<void> {
  const { error } = await supabase
    .from("collections")
    .delete()
    .eq("collection_id", collectionId);
  if (error) throw error;
}
