"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function registrarPeso(
  rutinaId: string,
  ejercicioId: string,
  ejercicioNombre: string,
  pesoKg: number,
  reps: number | null
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("registros_ejercicio").insert({
    user_id: user!.id,
    ejercicio_id: ejercicioId,
    ejercicio_nombre: ejercicioNombre,
    peso_kg: pesoKg,
    reps,
  });

  revalidatePath(`/rutinas/${rutinaId}`);
}
