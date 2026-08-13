import { supabase } from "@/helper/supabaseClient";

export async function validatePostalCode(
  postalCode: string
): Promise<{ valid: boolean | null; city: string | null }> {
  try {
    const { data, error } = await supabase.functions.invoke("validate-postal-code", {
      body: { postalCode },
    });
    if (error || !data) return { valid: null, city: null };
    return { valid: data.valid, city: data.city };
  } catch {
    return { valid: null, city: null };
  }
}
