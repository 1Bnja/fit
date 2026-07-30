"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { exerciseById } from "@/lib/exercises";

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

  // El músculo se congela en el registro en vez de resolverse al leer: es lo que
  // deja rankear en SQL (el catálogo es un JSON, Postgres no lo puede joinear) y
  // hace que reclasificar un ejercicio no reescriba el historial ya cargado.
  // Queda null si el id no está en el catálogo (filas viejas), y esas se excluyen.
  const musculo = exerciseById(ejercicioId)?.musculo ?? null;

  await supabase.from("registros_ejercicio").insert({
    user_id: user!.id,
    ejercicio_id: ejercicioId,
    ejercicio_nombre: ejercicioNombre,
    musculo,
    peso_kg: pesoKg,
    reps,
  });

  revalidatePath(`/rutinas/${rutinaId}`);
}
