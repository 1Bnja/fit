"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { exerciseById } from "@/lib/exercises";

async function registrarSerie({
  rutinaId,
  misionId,
  ejercicioId,
  ejercicioNombre,
  pesoKg,
  reps,
}: {
  rutinaId?: string;
  misionId?: string;
  ejercicioId: string;
  ejercicioNombre: string;
  pesoKg: number;
  reps: number | null;
}): Promise<{ error?: string }> {
  if (reps === null || !Number.isFinite(pesoKg) || pesoKg <= 0 || !Number.isInteger(reps) || reps < 1 || reps > 30) {
    return { error: "Ingresa un peso y entre 1 y 30 repeticiones." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.rpc("registrar_serie_y_progreso", {
    p_ejercicio_id: ejercicioId,
    p_ejercicio_nombre: ejercicioNombre,
    p_peso_kg: pesoKg,
    p_reps: reps,
    p_rutina_id: rutinaId ?? null,
    p_usuario_mision_id: misionId ?? null,
   });
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
  if (error) return { error: "No se pudo guardar la serie. Intenta otra vez." };

  revalidatePath("/home");
  if (rutinaId) revalidatePath(`/rutinas/${rutinaId}`);
  return {};
}

export async function registrarPeso(
  rutinaId: string,
  ejercicioId: string,
  ejercicioNombre: string,
  pesoKg: number,
  reps: number | null
) {
  return registrarSerie({ rutinaId, ejercicioId, ejercicioNombre, pesoKg, reps });
}

export async function registrarMision(
  misionId: string,
  ejercicioId: string,
  ejercicioNombre: string,
  pesoKg: number,
  reps: number
) {
  return registrarSerie({ misionId, ejercicioId, ejercicioNombre, pesoKg, reps });
}
