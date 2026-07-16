"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type OnboardingState = { error?: string };

export async function completarOnboarding(
  _prev: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const peso_kg = Number(formData.get("peso_kg"));
  const estatura_cm = Number(formData.get("estatura_cm"));

  if (!peso_kg || !estatura_cm) return { error: "Ingresa peso y estatura válidos." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("profiles")
    .update({ peso_kg, estatura_cm, onboarding_completo: true })
    .eq("id", user!.id);

  if (error) return { error: "No se pudo guardar. Intenta de nuevo." };

  redirect("/home");
}
