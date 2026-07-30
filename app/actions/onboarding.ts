"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type OnboardingState = { error?: string };

export async function completarOnboarding(
  _prev: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const peso_kg = Number(formData.get("peso_kg"));
  const estatura_cm = Number(formData.get("estatura_cm"));
  const mascota_clave = String(formData.get("mascota_clave") ?? "").trim();

  if (
    !Number.isFinite(peso_kg) ||
    peso_kg < 20 ||
    peso_kg > 500 ||
    !Number.isFinite(estatura_cm) ||
    estatura_cm < 50 ||
    estatura_cm > 300
  ) {
    return { error: "Ingresa peso y estatura válidos." };
  }

  if (!/^[a-z0-9][a-z0-9_-]{0,49}$/.test(mascota_clave)) {
    return { error: "Elige una mascota inicial." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.rpc("completar_onboarding_y_elegir_mascota", {
    p_peso_kg: peso_kg,
    p_estatura_cm: estatura_cm,
    p_clave: mascota_clave,
  });

  if (error) return { error: "No se pudo guardar el perfil y la mascota. Intenta de nuevo." };

  // Mirrors profiles.onboarding_completo onto the JWT so the middleware can
  // gate routes without an extra DB round trip on every navigation.
  const { error: authError } = await supabase.auth.updateUser({
    data: { onboarding_completo: true },
  });
  if (authError) return { error: "El perfil se guardó, pero no se pudo actualizar la sesión." };

  revalidatePath("/home");
  redirect("/home");
}
